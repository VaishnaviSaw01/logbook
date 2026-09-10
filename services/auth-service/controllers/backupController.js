const User = require("../models/User");
const Party = require("../models/Party");
const InventoryItem = require("../models/InventoryItem");
const InventoryPurchase = require("../models/InventoryPurchase");
const Transaction = require("../models/Transaction");

// Full export of one business's data across all four services (they
// share a single MongoDB database, so this service can read the others'
// collections directly via the local read-only model mirrors above —
// see e.g. inventory-service/models/Party.js for the same pattern).
//
// Route is ADMIN-only (see routes/authRoutes.js), and "the business" is
// always the calling ADMIN's own account: every record elsewhere in the
// app is scoped by `user: <the owning ADMIN's _id>` (see getOwnerId()
// in each controller), so req.user._id here *is* that scope key.
exports.getBackup = async (req, res) => {
  try {
    const ownerId = req.user._id;

    const [parties, inventoryItems, inventoryPurchases, transactions, staff] = await Promise.all([
      Party.find({ user: ownerId }).lean(),
      InventoryItem.find({ user: ownerId }).lean(),
      InventoryPurchase.find({ user: ownerId }).lean(),
      Transaction.find({ user: ownerId }).lean(),
      User.find({ role: "STAFF", createdBy: ownerId }).select("-password").lean(),
    ]);

    res.json({
      exportedAt: new Date().toISOString(),
      account: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
      },
      counts: {
        parties: parties.length,
        inventoryItems: inventoryItems.length,
        inventoryPurchases: inventoryPurchases.length,
        transactions: transactions.length,
        staff: staff.length,
      },
      parties,
      inventoryItems,
      inventoryPurchases,
      transactions,
      staff,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
