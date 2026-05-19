const authorize = ({ roles = [], permission = null }) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Role check
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Role denied" });
    }

    // Permission check
    if (permission && req.user.role !== "ADMIN") {
      if (!req.user.permissions?.[permission]) {
        return res.status(403).json({
          message: `Permission denied: ${permission}`
        });
      }
    }

    next();
  };
};

module.exports = authorize;