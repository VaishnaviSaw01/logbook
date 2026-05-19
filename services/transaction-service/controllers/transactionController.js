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
================================ */
exports.createTransaction = async (req, res) => {
  try {
    const { partyId, amount, type, note, paymentMethod, itemId, quantity } = req.body;

    if (!partyId || !amount || !type) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const ownerId = getOwnerId(req.user);

    const party = await Party.findOne({
      _id: partyId,
      user: ownerId
    });

    if (!party) {
      return res.status(404).json({ message: "Party not found" });
    }

    const numericAmount = Number(amount);

    const transaction = await Transaction.create({
  party: partyId,
  user: req.user._id,
  amount: numericAmount,
  type,
  note,
  paymentMethod,
  item: itemId || null,
  quantity: quantity || 0
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
    await logActivity(req.user._id, "Created Transaction");
    res.status(201).json(transaction);
    if (itemId && quantity > 0) {

  const item = await InventoryItem.findById(itemId);

  if (!item) {
    return res.status(404).json({ message: "Inventory item not found" });
  }

  if (party.type === "SUPPLIER" && type === "CREDIT") {

    item.stock += quantity;

    await InventoryPurchase.create({
      item: itemId,
      supplier: partyId,
      quantity,
      purchasePrice: amount / quantity,
      user: req.user._id
    });

  }

  if (party.type === "CUSTOMER" && type === "DEBIT") {

    if (item.stock < quantity) {
      return res.status(400).json({ message: "Not enough stock" });
    }

    item.stock -= quantity;
  }

  await item.save();
}

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
================================ */
exports.updateTransaction = async (req, res) => {
  try {
    const { partyId, amount, type, note, paymentMethod, itemId, quantity } = req.body;

    if (!amount || !type) {
      return res.status(400).json({ message: "Amount and type are required" });
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

    if (party.type === "CUSTOMER") {
      if (oldType === "DEBIT") party.balance -= oldAmount;
      if (oldType === "CREDIT") party.balance += oldAmount;
    }

    if (party.type === "SUPPLIER") {
      if (oldType === "CREDIT") party.balance -= oldAmount;
      if (oldType === "DEBIT") party.balance += oldAmount;
    }

    const newAmount = Number(amount);

    if (party.type === "CUSTOMER") {
      if (type === "DEBIT") party.balance += newAmount;
      if (type === "CREDIT") party.balance -= newAmount;
    }

    if (party.type === "SUPPLIER") {
      if (type === "CREDIT") party.balance += newAmount;
      if (type === "DEBIT") party.balance -= newAmount;
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
      if (txn.party.type === "CUSTOMER" && txn.type === "CREDIT") return true;
      if (txn.party.type === "SUPPLIER" && txn.type === "DEBIT") return true;
      return false;
    });

    res.json(moneyTransactions);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};