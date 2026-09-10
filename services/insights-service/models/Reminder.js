const mongoose = require("mongoose");

// A follow-up task tied to a customer or supplier: "call them", "ask for
// payment", "pay this supplier back by X", or a freeform note — with an
// optional AI-drafted (or templated) message ready to send.
const reminderSchema = new mongoose.Schema(
  {
    user: {
      // The owning business (ADMIN), same convention as every other
      // collection — see getOwnerId() across the other services.
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    createdBy: {
      // Who actually created it (could be a STAFF member).
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    party: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Party",
      required: true
    },
    type: {
      type: String,
      enum: ["CALL", "ORDER", "PAYMENT_REQUEST", "SUPPLIER_PAYBACK", "NOTE"],
      required: true
    },
    note: {
      type: String,
      default: ""
    },
    message: {
      // The drafted note/message text (AI-generated or templated) ready
      // to copy into a call script, SMS, WhatsApp, or email.
      type: String,
      default: ""
    },
    messageSource: {
      type: String,
      enum: ["AI", "TEMPLATE", "MANUAL", null],
      default: null
    },
    dueDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ["PENDING", "DONE", "SNOOZED"],
      default: "PENDING"
    },
    // Set once the "due today/tomorrow" login popup has shown this
    // reminder, so it doesn't nag on every single login.
    lastNotifiedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

reminderSchema.index({ user: 1, status: 1, dueDate: 1 });

module.exports = mongoose.models.Reminder || mongoose.model("Reminder", reminderSchema);
