const Activity = require("../models/Activity");

const logActivity = async (userId, action) => {
  await Activity.create({
    user: userId,
    action
  });
};

module.exports = logActivity;
