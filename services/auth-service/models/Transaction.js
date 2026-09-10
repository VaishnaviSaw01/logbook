const mongoose = require("mongoose");

// Local read-only mirror of transaction-service's Transaction schema
// (shared database). Used here only to build the full-account backup
// export.
const transactionSchema = new mongoose.Schema(
  {
    party: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Party",
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ["CASH", "UPI", "BANK", "CARD"],
      default: "CASH"
    },
    proofImage: {
      type: String
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      default: null
    },
    quantity: {
      type: Number,
      default: 0
    },
    date: {
      type: Date,
      default: Date.now
    },
    note: String
  },
  { timestamps: true }
);

module.exports = mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);
