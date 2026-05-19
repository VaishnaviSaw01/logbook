const express = require("express");
const router = express.Router();

const protect = require("../middleware/protect");
const authorize = require("../middleware/authorize");

const {
  createStaff,
  getStaff,
  updateStaff,
  deleteStaff,
  deleteActivity
} = require("../controllers/staffController");

// Only ADMIN can manage staff
router.use(protect, authorize({ roles: ["ADMIN"] }));

router.post("/", createStaff);
router.get("/", getStaff);
router.put("/:id", updateStaff);
router.delete("/:id", protect, deleteStaff);
router.delete("/activity/:id", protect, deleteActivity);
module.exports = router;