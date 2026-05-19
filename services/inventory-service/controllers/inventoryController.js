const InventoryItem = require("../models/InventoryItem");
const InventoryPurchase = require("../models/InventoryPurchase");

exports.getInventoryItems = async (req, res) => {
  const items = await InventoryItem.find({ user: req.user._id });
  res.json(items);
};

exports.getInventoryDashboard = async (req, res) => {
  const items = await InventoryItem.find({ user: req.user._id });

  const lowStock = items.filter(i => i.stock < 5);

  const totalCost = items.reduce((acc, item) => {
    return acc + (item.stock * item.sellingPrice);
  }, 0);

  res.json({ lowStock, totalCost });
};

exports.getItemDetails = async (req, res) => {
  const item = await InventoryItem.findById(req.params.id);

  const purchases = await InventoryPurchase
    .find({ item: req.params.id })
    .populate("supplier")
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
};

exports.updateSellingPrice = async (req, res) => {
  const item = await InventoryItem.findById(req.params.id);
  item.sellingPrice = req.body.sellingPrice;
  await item.save();
  res.json(item);
};
exports.adjustStock = async (req, res) => {
  const { name, quantity, purchasePrice, sellingPrice } = req.body;

  let item = await InventoryItem.findOne({
    name,
    user: req.user._id
  });

  if (!item) {
    item = await InventoryItem.create({
      name,
      sellingPrice,
      stock: quantity,
      user: req.user._id
    });
  } else {
    item.stock += Number(quantity);
    item.sellingPrice = sellingPrice || item.sellingPrice;
    await item.save();
  }

  await InventoryPurchase.create({
    item: item._id,
    supplier: null,
    quantity,
    purchasePrice,
    user: req.user._id
  });

  res.json(item);
};
