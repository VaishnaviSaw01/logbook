const express = require("express");
const router = express.Router();

const { register, login } = require("../controllers/authController");
const { getBackup } = require("../controllers/backupController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);

router.get("/backup", protect, authorize({ roles: ["ADMIN"] }), getBackup);

module.exports = router;
