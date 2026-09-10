const InventoryItem = require("../models/InventoryItem");
const InventoryPurchase = require("../models/InventoryPurchase");
// Registers the local Party mirror so InventoryPurchase.populate("supplier")
// resolves correctly in this service's own mongoose connection.
require("../models/Party");

// Inventory belongs to the business (the ADMIN account), not to whichever
// individual logged in — a STAFF member's ADMIN owns the shared catalog.
// Matches customer-service/transaction-service's ownership model.
const getOwnerId = (user) => {
  return user.role === "ADMIN" ? user._id : user.createdBy;
};

exports.getInventoryItems = async (req, res) => {
  try {
    const ownerId = getOwnerId(req.user);
    const items = await InventoryItem.find({ user: ownerId }).sort({ name: 1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getInventoryDashboard = async (req, res) => {
  try {
    const ownerId = getOwnerId(req.user);
    const items = await InventoryItem.find({ user: ownerId });

    const lowStock = items.filter(i => i.stock < 5);

    const totalCost = items.reduce((acc, item) => {
      return acc + (item.stock * item.sellingPrice);
    }, 0);

    res.json({ lowStock, totalCost });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getItemDetails = async (req, res) => {
  try {
    const ownerId = getOwnerId(req.user);

    const item = await InventoryItem.findOne({
      _id: req.params.id,
      user: ownerId
    });

    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    const purchases = await InventoryPurchase
      .find({ item: req.params.id, user: ownerId })
      .populate("supplier", "name phone")
      .sort({ createdAt: -1 })
      .limit(5);

    const totalPurchaseCost = purchases.reduce((acc, p) => {
      return acc + (p.purchasePrice * p.quantity);
    }, 0);

    const totalQuantity = purchases.reduce((acc, p) => {
      return acc + p.quantity;
    }, 0);

    const avgCost = totalQuantity > 0 ? totalPurchaseCost / totalQuantity : 0;

    const profitPerUnit = item.sellingPrice - avgCost;

    res.json({
      item,
      purchases,
      avgCost,
      profitPerUnit
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSellingPrice = async (req, res) => {
  try {
    const { sellingPrice } = req.body;

    if (sellingPrice === undefined || sellingPrice === null || isNaN(Number(sellingPrice)) || Number(sellingPrice) < 0) {
      return res.status(400).json({ message: "A valid sellingPrice is required" });
    }

    const ownerId = getOwnerId(req.user);

    const item = await InventoryItem.findOne({
      _id: req.params.id,
      user: ownerId
    });

    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    item.sellingPrice = Number(sellingPrice);
    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.adjustStock = async (req, res) => {
  try {
    const { name, quantity, purchasePrice, sellingPrice } = req.body;

    const numericQuantity = Number(quantity);
    const numericPurchasePrice = Number(purchasePrice);

    if (!name || !numericQuantity || numericQuantity <= 0 || isNaN(numericQuantity)) {
      return res.status(400).json({ message: "Item name and a positive quantity are required" });
    }

    if (purchasePrice !== undefined && isNaN(numericPurchasePrice)) {
      return res.status(400).json({ message: "purchasePrice must be a number" });
    }

    const ownerId = getOwnerId(req.user);

    let item = await InventoryItem.findOne({
      name,
      user: ownerId
    });

    if (!item) {
      if (sellingPrice === undefined || sellingPrice === null || isNaN(Number(sellingPrice))) {
        return res.status(400).json({ message: "sellingPrice is required when creating a new item" });
      }

      item = await InventoryItem.create({
        name,
        sellingPrice: Number(sellingPrice),
        stock: numericQuantity,
        user: ownerId
      });
    } else {
      item.stock += numericQuantity;
      item.sellingPrice = sellingPrice !== undefined && sellingPrice !== null && sellingPrice !== ""
        ? Number(sellingPrice)
        : item.sellingPrice;
      await item.save();
    }

    await InventoryPurchase.create({
      item: item._id,
      supplier: null,
      quantity: numericQuantity,
      purchasePrice: numericPurchasePrice || 0,
      user: ownerId
    });

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
