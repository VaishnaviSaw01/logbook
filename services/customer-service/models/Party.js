const mongoose = require("mongoose");

const partySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
   phone: {
  type: String,
  required: true
}
,
    address: String,
    type: {
      type: String,
      enum: ["CUSTOMER", "SUPPLIER"],
      required: true
    },
    balance: {
      type: Number,
      default: 0
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    isDeleted: {
  type: Boolean,
  default: false
},
deletedAt: {
  type: Date,
  default: null
}
  },
  { timestamps: true }
);

partySchema.index({ phone: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("Party", partySchema);
