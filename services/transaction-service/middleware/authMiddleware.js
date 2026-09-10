const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id)
        .select("-password")
        .lean();

      if (!user) {
        return res.status(401).json({
          message: "User not found"
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          message: "Account is disabled"
        });
      }

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

const authorize = ({ roles = [], permission = null }) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied: role not allowed"
      });
    }

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
