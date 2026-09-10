const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  action: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.models.Activity || mongoose.model("Activity", activitySchema);
