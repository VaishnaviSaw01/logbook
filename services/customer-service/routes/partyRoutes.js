const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");

const {
  createParty,
  getParties,
  deleteParty,
  getDeletedParties,
  restoreParty,
  permanentDeleteParty
} = require("../controllers/partyController");


router.get(
  "/",
  protect,
  authorize({ permission: "read" }),
  getParties
);


router.post(
  "/",
  protect,
  authorize({ permission: "write" }),
  createParty
);


router.delete(
  "/:id",
  protect,
  authorize({ permission: "delete" }),
  deleteParty
);


router.get(
  "/deleted",
  protect,
  authorize({ permission: "read" }),
  getDeletedParties
);


router.put(
  "/restore/:id",
  protect,
  authorize({ permission: "write" }),
  restoreParty
);


router.delete(
  "/permanent/:id",
  protect,
  authorize({ permission: "delete" }),
  permanentDeleteParty
);

module.exports = router;