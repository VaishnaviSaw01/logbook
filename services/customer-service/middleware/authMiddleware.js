const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token;

    // Check if Authorization header exists
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get fresh user from DB
      const user = await User.findById(decoded.id)
        .select("-password")
        .lean();

      if (!user) {
        return res.status(401).json({
          message: "User not found"
        });
      }

      // Check if account is disabled
      if (!user.isActive) {
        return res.status(403).json({
          message: "Account is disabled"
        });
      }

      // Attach user to request
      req.user = user;

      next();
    } else {
      return res.status(401).json({
        message: "Not authorized, no token"
      });
    }
  } catch (error) {
    return res.status(401).json({
      message: "Token failed"
    });
  }
};

// ===============================
// 🔐 Unified Authorization Middleware
// ===============================
const authorize = ({ roles = [], permission = null }) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    // Role check
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied: role not allowed"
      });
    }

    // Permission check (Admin always allowed)
    if (permission && req.user.role !== "ADMIN") {
      if (!req.user.permissions?.[permission]) {
        return res.status(403).json({
          message: `Access denied: ${permission} permission required`
        });
      }
    }

    next();
  };
};

module.exports = {
  protect,
  authorize
};
