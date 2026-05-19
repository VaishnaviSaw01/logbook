const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");

const {
  createTransaction,
  getTransactionsByParty,
  getMoneyTransactions,
  updateTransaction,
  deleteTransaction
} = require("../controllers/transactionController");

router.post(
  "/",
  protect,
  authorize({ permission: "write" }),
  createTransaction
);

router.delete(
  "/:id",
  protect,
  authorize({ permission: "delete" }),
  deleteTransaction
);

router.get(
  "/",
  protect,
  authorize({ permission: "read" }),
  getMoneyTransactions
);

router.get(
  "/:partyId",
  protect,
  authorize({ permission: "read" }),
  getTransactionsByParty
);

router.put(
  "/:id",
  protect,
  authorize({ permission: "write" }),
  updateTransaction
);

module.exports = router;