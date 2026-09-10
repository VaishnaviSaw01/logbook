const mongoose = require("mongoose");

// Local mirror of customer-service's Party schema (shared database).
// transaction-service reads and updates party.balance directly as part
// of recording transactions.
const partySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: String,
    type: {
      type: String,
      enum: ["CUSTOMER", "SUPPLIER"],
      required: true
    },
    balance: { type: Number, default: 0 },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Party || mongoose.model("Party", partySchema);
