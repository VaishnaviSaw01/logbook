const mongoose = require("mongoose");

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

module.exports = mongoose.model("InventoryPurchase", inventoryPurchaseSchema);