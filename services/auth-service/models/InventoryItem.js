const mongoose = require("mongoose");

// Local read-only mirror of inventory-service's InventoryItem schema
// (shared database). Used here only to build the full-account backup
// export.
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
