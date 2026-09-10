const Transaction = require("../models/Transaction");
const Party = require("../models/Party");
const logActivity = require("../utils/logActivity");
const InventoryItem = require("../models/InventoryItem");
const InventoryPurchase = require("../models/InventoryPurchase");

const getOwnerId = (user) => {
  return user.role === "ADMIN" ? user._id : user.createdBy;
};

/* ================================
   CREATE TRANSACTION
   Also keeps inventory stock in sync:
     - SUPPLIER + CREDIT  => stock IN  (a purchase from a supplier)
     - CUSTOMER + DEBIT   => stock OUT (a sale to a customer)
================================ */
exports.createTransaction = async (req, res) => {
  try {
    const { partyId, amount, type, note, paymentMethod, itemId, quantity } = req.body;

    if (!partyId || !amount || !type) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: "amount must be a positive number" });
    }

    const numericQuantity = quantity ? Number(quantity) : 0;
    if (quantity && (isNaN(numericQuantity) || numericQuantity < 0)) {
      return res.status(400).json({ message: "quantity must be a non-negative number" });
    }

    const ownerId = getOwnerId(req.user);

    const party = await Party.findOne({
      _id: partyId,
      user: ownerId,
      isDeleted: false
    });

    if (!party) {
      return res.status(404).json({ message: "Party not found" });
    }

    // Resolve and validate the linked inventory item (if any) BEFORE
    // writing anything. This is what actually prevents an oversold /
    // out-of-stock transaction from ever being recorded: previously the
    // stock check ran *after* the transaction was already created and the
    // response already sent, so a rejected sale still landed in the
    // ledger with no way to tell the client it failed.
    let item = null;

    if (itemId && numericQuantity > 0) {
      item = await InventoryItem.findOne({ _id: itemId, user: req.user._id });

      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }

      if (party.type === "CUSTOMER" && type === "DEBIT" && item.stock < numericQuantity) {
        return res.status(400).json({
          message: `Not enough stock for "${item.name}" (available: ${item.stock}, requested: ${numericQuantity})`
        });
      }
    }

    const transaction = await Transaction.create({
      party: partyId,
      user: req.user._id,
      amount: numericAmount,
      type,
      note,
      paymentMethod,
      item: itemId || null,
      quantity: numericQuantity
    });

    if (party.type === "CUSTOMER") {
      if (type === "DEBIT") party.balance += numericAmount;
      if (type === "CREDIT") party.balance -= numericAmount;
    }

    if (party.type === "SUPPLIER") {
      if (type === "CREDIT") party.balance += numericAmount;
      if (type === "DEBIT") party.balance -= numericAmount;
    }

    await party.save();

    if (item) {
      if (party.type === "SUPPLIER" && type === "CREDIT") {
        item.stock += numericQuantity;

        await InventoryPurchase.create({
          item: item._id,
          supplier: partyId,
          quantity: numericQuantity,
          purchasePrice: numericAmount / numericQuantity,
          user: req.user._id
        });
      }

      if (party.type === "CUSTOMER" && type === "DEBIT") {
        item.stock -= numericQuantity;
      }

      await item.save();
    }

    await logActivity(req.user._id, "Created Transaction");

    // Response is sent exactly once, only after every write above has
    // succeeded, so the client can trust a 201 means stock/balance are
    // already consistent.
    res.status(201).json(transaction);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================================
   GET TRANSACTIONS BY PARTY
================================ */
exports.getTransactionsByParty = async (req, res) => {
  try {
    const ownerId = getOwnerId(req.user);

    const transactions = await Transaction.find({
      party: req.params.partyId,
      user: ownerId,
    }).sort({ createdAt: -1 });

    res.json(transactions);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================================
   DELETE TRANSACTION
   Reverses both the party balance and (if the transaction was linked to
   an inventory item) the stock change it originally made.
================================ */
exports.deleteTransaction = async (req, res) => {
  try {
    const ownerId = getOwnerId(req.user);

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: ownerId
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const party = await Party.findOne({
      _id: transaction.party,
      user: ownerId
    });

    if (!party) {
      return res.status(404).json({ message: "Party not found" });
    }

    const amount = Number(transaction.amount);
    const type = transaction.type;

    if (party.type === "CUSTOMER") {
      if (type === "DEBIT") party.balance -= amount;
      if (type === "CREDIT") party.balance += amount;
    }

    if (party.type === "SUPPLIER") {
      if (type === "CREDIT") party.balance -= amount;
      if (type === "DEBIT") party.balance += amount;
    }

    if (transaction.item && transaction.quantity > 0) {
      const item = await InventoryItem.findById(transaction.item);

      if (item) {
        if (party.type === "SUPPLIER" && type === "CREDIT") {
          // This transaction had added stock in; deleting it removes that stock again.
          item.stock = Math.max(0, item.stock - transaction.quantity);
        }

        if (party.type === "CUSTOMER" && type === "DEBIT") {
          // This transaction had sold stock out; deleting it returns that stock.
          item.stock += transaction.quantity;
        }

        await item.save();
      }
    }

    await party.save();
    await transaction.deleteOne();
    await logActivity(req.user._id, "Deleted Transaction");
    res.json({ message: "Transaction deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================================
   UPDATE TRANSACTION
   Only amount/type/note/paymentMethod are editable (matches the
   frontend's edit form). If amount or type changes, the party balance
   and any linked inventory stock are reconciled: the transaction's
   original effect is reversed, then the new effect is applied.
================================ */
exports.updateTransaction = async (req, res) => {
  try {
    const { amount, type, note, paymentMethod } = req.body;

    if (!amount || !type) {
      return res.status(400).json({ message: "Amount and type are required" });
    }

    const newAmount = Number(amount);
    if (isNaN(newAmount) || newAmount <= 0) {
      return res.status(400).json({ message: "amount must be a positive number" });
    }

    const ownerId = getOwnerId(req.user);

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: ownerId
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const party = await Party.findOne({
      _id: transaction.party,
      user: ownerId
    });

    if (!party) {
      return res.status(404).json({ message: "Party not found" });
    }

    const oldAmount = Number(transaction.amount);
    const oldType = transaction.type;

    // Reverse the old effect on the party balance
    if (party.type === "CUSTOMER") {
      if (oldType === "DEBIT") party.balance -= oldAmount;
      if (oldType === "CREDIT") party.balance += oldAmount;
    }

    if (party.type === "SUPPLIER") {
      if (oldType === "CREDIT") party.balance -= oldAmount;
      if (oldType === "DEBIT") party.balance += oldAmount;
    }

    // Apply the new effect on the party balance
    if (party.type === "CUSTOMER") {
      if (type === "DEBIT") party.balance += newAmount;
      if (type === "CREDIT") party.balance -= newAmount;
    }

    if (party.type === "SUPPLIER") {
      if (type === "CREDIT") party.balance += newAmount;
      if (type === "DEBIT") party.balance -= newAmount;
    }

    // Reconcile linked inventory stock if the type changed (quantity/item
    // themselves are not editable from the UI)
    if (transaction.item && transaction.quantity > 0 && oldType !== type) {
      const item = await InventoryItem.findById(transaction.item);

      if (item) {
        // Undo the old type's stock effect
        if (party.type === "SUPPLIER" && oldType === "CREDIT") {
          item.stock = Math.max(0, item.stock - transaction.quantity);
        }
        if (party.type === "CUSTOMER" && oldType === "DEBIT") {
          item.stock += transaction.quantity;
        }

        // Apply the new type's stock effect
        if (party.type === "SUPPLIER" && type === "CREDIT") {
          item.stock += transaction.quantity;
        }
        if (party.type === "CUSTOMER" && type === "DEBIT") {
          if (item.stock < transaction.quantity) {
            return res.status(400).json({
              message: `Not enough stock for "${item.name}" to change this transaction to DEBIT (available: ${item.stock}, requested: ${transaction.quantity})`
            });
          }
          item.stock -= transaction.quantity;
        }

        await item.save();
      }
    }

    transaction.amount = newAmount;
    transaction.type = type;
    transaction.note = note || "";
    transaction.paymentMethod = paymentMethod || "";

    await transaction.save();
    await party.save();
    await logActivity(req.user._id, "Updated Transaction");
    res.json({
      message: "Transaction updated successfully",
      transaction,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================================
   GET MONEY TRANSACTIONS
================================ */
exports.getMoneyTransactions = async (req, res) => {
  try {
    const { from, to } = req.query;

    const ownerId = getOwnerId(req.user);

    let filter = { user: ownerId };

    if (from && to) {
      filter.createdAt = {
        $gte: new Date(from),
        $lte: new Date(to)
      };
    }

    const transactions = await Transaction.find(filter)
      .populate("party")
      .sort({ createdAt: -1 });

    const moneyTransactions = transactions.filter(txn => {
      if (!txn.party) return false;
      if (txn.party.type === "CUSTOMER" && txn.type === "CREDIT") return true;
      if (txn.party.type === "SUPPLIER" && txn.type === "DEBIT") return true;
      return false;
    });

    res.json(moneyTransactions);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
