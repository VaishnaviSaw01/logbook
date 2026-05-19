const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const Activity = require("../models/Activity");
const logActivity = require("../utils/logActivity");
// Register ADMIN (only once ideally)
const register = async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const user = await User.create({
    name,
    email,
    password,
    role: "ADMIN",
    permissions: {
      read: true,
      write: true,
      delete: true
    }
  });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id)
  });
};

// Login (ADMIN or STAFF)
const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {

    await Activity.create({
      user: user._id,
      action: "Login"
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      token: generateToken(user._id)
    });

  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
};
module.exports = { register, login };