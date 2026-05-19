const User = require("../models/User");
const Activity = require("../models/Activity");
const logActivity = require("../utils/logActivity");
// Create Staff
const createStaff = async (req, res) => {
  const { name, email,phone, password, permissions } = req.body;

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(400).json({ message: "Email already exists" });
  }

  const staff = await User.create({
    name,
    email,
    phone,
    password,
    role: "STAFF",
    createdBy: req.user._id,
    permissions: {
      read: permissions?.read ?? true,
      write: permissions?.write ?? false,
      delete: permissions?.delete ?? false
    }
  });

  res.status(201).json({
    _id: staff._id,
    name: staff.name,
    email: staff.email,
    phone: staff.phone,
    role: staff.role,
    permissions: staff.permissions,
    createdBy: staff.createdBy
  });
};
// Get all staff
const getStaff = async (req, res) => {
  const staff = await User.find({
  role: "STAFF",
  createdBy: req.user._id
})
.select("-password")
.lean();

for (let s of staff) {
  s.activity = await Activity.find({ user: s._id })
    .sort({ createdAt: -1 });
}

res.json(staff);
};

// Update staff permissions
const updateStaff = async (req, res) => {
  const staff = await User.findOne({
    _id: req.params.id,
    role: "STAFF",
    createdBy: req.user._id
  });

  if (!staff) {
    return res.status(404).json({ message: "Staff not found" });
  }

  staff.permissions = req.body.permissions ?? staff.permissions;
  staff.isActive = req.body.isActive ?? staff.isActive;

  await staff.save();

  res.json(staff);
};

const deleteStaff = async (req, res) => {
  const staff = await User.findOne({
    _id: req.params.id,
    role: "STAFF",
    createdBy: req.user._id
  });

  if (!staff) {
    return res.status(404).json({ message: "Staff not found" });
  }

  await staff.deleteOne();

  res.json({ message: "Staff deleted successfully" });
};

const deleteActivity = async (req, res) => {
  await Activity.findByIdAndDelete(req.params.id);
  res.json({ message: "Activity deleted" });
};
module.exports = { createStaff, getStaff, updateStaff, deleteStaff, deleteActivity };