const mongoose = require("mongoose");

// Local read-only mirror of auth-service's User schema (shared database).
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, default: "" },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["ADMIN", "STAFF"],
      default: "ADMIN"
    },
    permissions: {
      read: { type: Boolean, default: true },
      write: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
