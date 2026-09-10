const mongoose = require("mongoose");

// Local read-only mirror of inventory-service's InventoryPurchase schema
// (shared database). Used here only to build the full-account backup
// export.
const inventoryPurchaseSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InventoryItem",
    required: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Party",
    default: null
  },
  quantity: Number,
  purchasePrice: Number,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.models.InventoryPurchase || mongoose.model("InventoryPurchase", inventoryPurchaseSchema);
