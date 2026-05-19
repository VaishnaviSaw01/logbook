const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const inventoryController = require("../controllers/inventoryController");

router.get("/", protect, inventoryController.getInventoryItems);

router.get("/dashboard", protect, inventoryController.getInventoryDashboard);

router.get("/:id", protect, inventoryController.getItemDetails);

router.put("/:id/price", protect, inventoryController.updateSellingPrice);
router.post("/adjust", protect, inventoryController.adjustStock);
module.exports = router;