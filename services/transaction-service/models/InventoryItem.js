const mongoose = require("mongoose");

// Local mirror of inventory-service's InventoryItem schema (shared
// database). transaction-service adjusts item.stock when a transaction
// links to an inventory item (supplier purchase / customer sale).
const inventoryItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sellingPrice: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.models.InventoryItem || mongoose.model("InventoryItem", inventoryItemSchema);
