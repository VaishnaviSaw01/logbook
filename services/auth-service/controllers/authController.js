const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const Activity = require("../models/Activity");
const logActivity = require("../utils/logActivity");
// Register ADMIN (only once ideally)
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

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
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login (ADMIN or STAFF)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {

      if (!user.isActive) {
        return res.status(403).json({ message: "Account is disabled" });
      }

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
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports = { register, login };