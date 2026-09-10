const Party = require("../models/Party");
const InventoryItem = require("../models/InventoryItem");
const Transaction = require("../models/Transaction");
const Reminder = require("../models/Reminder");
const aiProvider = require("../services/aiProvider");

const getOwnerId = (user) => {
  return user.role === "ADMIN" ? user._id : user.createdBy;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/* ================================================================
   Business-type guessing (rule-based fallback — AI path in getAiSummary)
================================================================= */
const BUSINESS_KEYWORDS = {
  "Grocery / Kirana store": ["rice", "oil", "atta", "flour", "sugar", "salt", "dal", "grocery", "snack", "biscuit", "tea", "coffee", "spice", "masala"],
  "Pharmacy / Medical store": ["tablet", "capsule", "syrup", "medicine", "pharma", "bandage", "syringe", "mask", "sanitizer"],
  "Electronics store": ["mobile", "phone", "charger", "cable", "laptop", "tv", "speaker", "earphone", "battery", "adapter", "electronic"],
  "Apparel / Clothing store": ["shirt", "t-shirt", "pant", "jeans", "saree", "kurta", "dress", "fabric", "cloth", "apparel"],
  "Hardware / Tools store": ["screw", "bolt", "nut", "hammer", "drill", "pipe", "wire", "cement", "paint", "hardware", "tool"],
  "Stationery / Bookstore": ["pen", "pencil", "notebook", "paper", "book", "stationery", "eraser", "file"],
  "Restaurant / Food business": ["plate", "meal", "dish", "food", "beverage", "bottle", "drink"],
  "Automotive / Auto parts": ["tyre", "tire", "engine", "brake", "clutch", "auto part", "vehicle", "oil filter"]
};

function guessBusinessType(itemNames) {
  const text = itemNames.join(" ").toLowerCase();
  let best = null;
  let bestScore = 0;

  for (const [label, keywords] of Object.entries(BUSINESS_KEYWORDS)) {
    const score = keywords.reduce((acc, kw) => acc + (text.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) {
      best = label;
      bestScore = score;
    }
  }

  return best || "General retail / trading business";
}

/* ================================================================
   GET /api/insights/overview
================================================================= */
exports.getOverview = async (req, res) => {
  try {
    const ownerId = getOwnerId(req.user);

    const [items, parties, transactions] = await Promise.all([
      InventoryItem.find({ user: ownerId }).lean(),
      Party.find({ user: ownerId, isDeleted: false }).lean(),
      Transaction.find({ user: ownerId }).sort({ createdAt: -1 }).lean()
    ]);

    const customers = parties.filter(p => p.type === "CUSTOMER");
    const suppliers = parties.filter(p => p.type === "SUPPLIER");

    // ---- Money summary ----
    let totalSalesValue = 0;      // value of goods sold (CUSTOMER + DEBIT)
    let totalCollected = 0;       // cash actually received (CUSTOMER + CREDIT)
    let totalPurchaseSpend = 0;   // value of goods bought (SUPPLIER + CREDIT)
    let totalPaidToSuppliers = 0; // cash actually paid out (SUPPLIER + DEBIT)

    // ---- Per-item sales aggregation ----
    const salesByItem = new Map(); // itemId -> { quantity, revenue }

    // ---- Per-customer activity (for segmentation + priority) ----
    const customerActivity = new Map(); // partyId -> { count, lastDate }

    for (const t of transactions) {
      if (t.party) {
        const partyIdStr = t.party.toString();
        const entry = customerActivity.get(partyIdStr) || { count: 0, lastDate: null };
        entry.count += 1;
        if (!entry.lastDate || new Date(t.createdAt) > new Date(entry.lastDate)) {
          entry.lastDate = t.createdAt;
        }
        customerActivity.set(partyIdStr, entry);
      }

      const party = parties.find(p => p._id.toString() === t.party?.toString());
      if (!party) continue;

      if (party.type === "CUSTOMER" && t.type === "DEBIT") {
        totalSalesValue += t.amount;

        if (t.item && t.quantity > 0) {
          const key = t.item.toString();
          const cur = salesByItem.get(key) || { quantity: 0, revenue: 0 };
          cur.quantity += t.quantity;
          cur.revenue += t.amount;
          salesByItem.set(key, cur);
        }
      }

      if (party.type === "CUSTOMER" && t.type === "CREDIT") {
        totalCollected += t.amount;
      }

      if (party.type === "SUPPLIER" && t.type === "CREDIT") {
        totalPurchaseSpend += t.amount;
      }

      if (party.type === "SUPPLIER" && t.type === "DEBIT") {
        totalPaidToSuppliers += t.amount;
      }
    }

    const itemMap = new Map(items.map(i => [i._id.toString(), i]));
    const topProducts = [...salesByItem.entries()]
      .map(([itemId, stats]) => ({
        itemId,
        name: itemMap.get(itemId)?.name || "(deleted item)",
        quantitySold: stats.quantity,
        revenue: Math.round(stats.revenue * 100) / 100
      }))
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    // ---- Customer segmentation by transaction frequency ----
    const now = Date.now();
    const segments = { frequent: 0, occasional: 0, oneTime: 0, dormant: 0 };

    for (const c of customers) {
      const activity = customerActivity.get(c._id.toString());
      const count = activity?.count || 0;
      const daysSinceLast = activity?.lastDate ? (now - new Date(activity.lastDate).getTime()) / DAY_MS : Infinity;

      if (count === 0) segments.dormant += 1;
      else if (daysSinceLast > 60) segments.dormant += 1;
      else if (count >= 5) segments.frequent += 1;
      else if (count >= 2) segments.occasional += 1;
      else segments.oneTime += 1;
    }

    // ---- Priority customers: owe money, weighted by amount + staleness ----
    const priorityCustomers = customers
      .filter(c => c.balance > 0)
      .map(c => {
        const activity = customerActivity.get(c._id.toString());
        const daysSinceLast = activity?.lastDate
          ? Math.floor((now - new Date(activity.lastDate).getTime()) / DAY_MS)
          : null;
        return {
          _id: c._id,
          name: c.name,
          phone: c.phone,
          balance: c.balance,
          daysSinceLastActivity: daysSinceLast,
          reason: daysSinceLast === null
            ? `Owes ₹${c.balance} with no recorded activity`
            : daysSinceLast > 30
              ? `Owes ₹${c.balance}, no activity in ${daysSinceLast} days`
              : `Owes ₹${c.balance}, last activity ${daysSinceLast} day(s) ago`
        };
      })
      .sort((a, b) => {
        // Highest balance first, then longest-stale first
        if (b.balance !== a.balance) return b.balance - a.balance;
        return (b.daysSinceLastActivity ?? 0) - (a.daysSinceLastActivity ?? 0);
      })
      .slice(0, 10);

    // ---- Suppliers we owe (payback attention) ----
    const supplierPaybacks = suppliers
      .filter(s => s.balance > 0)
      .map(s => ({
        _id: s._id,
        name: s.name,
        phone: s.phone,
        balance: s.balance
      }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 10);

    const lowStockItems = items.filter(i => i.stock < 5).map(i => ({ _id: i._id, name: i.name, stock: i.stock }));

    const businessTypeGuess = guessBusinessType(items.map(i => i.name));

    res.json({
      businessTypeGuess,
      money: {
        totalSalesValue: round2(totalSalesValue),
        totalCollected: round2(totalCollected),
        totalPurchaseSpend: round2(totalPurchaseSpend),
        totalPaidToSuppliers: round2(totalPaidToSuppliers),
        totalReceivable: round2(customers.reduce((a, c) => a + Math.max(c.balance, 0), 0)),
        totalPayable: round2(suppliers.reduce((a, s) => a + Math.max(s.balance, 0), 0))
      },
      topProducts,
      lowStockItems,
      customerSegments: segments,
      priorityCustomers,
      supplierPaybacks,
      counts: {
        customers: customers.length,
        suppliers: suppliers.length,
        items: items.length,
        transactions: transactions.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

function round2(n) {
  return Math.round(n * 100) / 100;
}

/* ================================================================
   GET /api/insights/ai-summary
   Narrative insights: AI-generated when ANTHROPIC_API_KEY is set,
   otherwise a rule-based summary built from the same overview stats.
================================================================= */
exports.getAiSummary = async (req, res) => {
  try {
    const ownerId = getOwnerId(req.user);

    const [items, parties, transactions] = await Promise.all([
      InventoryItem.find({ user: ownerId }).select("name stock sellingPrice").lean(),
      Party.find({ user: ownerId, isDeleted: false }).select("type balance").lean(),
      Transaction.find({ user: ownerId }).select("type amount item quantity party createdAt").lean()
    ]);

    const customers = parties.filter(p => p.type === "CUSTOMER");
    const suppliers = parties.filter(p => p.type === "SUPPLIER");

    const salesByItem = new Map();
    let totalSalesValue = 0;

    for (const t of transactions) {
      const party = parties.find(p => p._id?.toString() === t.party?.toString());
      if (party?.type === "CUSTOMER" && t.type === "DEBIT") {
        totalSalesValue += t.amount;
        if (t.item) {
          const key = t.item.toString();
          salesByItem.set(key, (salesByItem.get(key) || 0) + (t.quantity || 0));
        }
      }
    }

    const itemMap = new Map(items.map(i => [i._id.toString(), i.name]));
    const topProducts = [...salesByItem.entries()]
      .map(([id, qty]) => ({ name: itemMap.get(id) || "unknown", quantitySold: qty }))
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    const stats = {
      itemCatalog: items.map(i => i.name).slice(0, 50),
      topProductsBySalesVolume: topProducts,
      totalSalesValue: round2(totalSalesValue),
      customerCount: customers.length,
      supplierCount: suppliers.length,
      customersWhoOweMoney: customers.filter(c => c.balance > 0).length,
      totalOutstandingReceivable: round2(customers.reduce((a, c) => a + Math.max(c.balance, 0), 0)),
      totalOutstandingPayableToSuppliers: round2(suppliers.reduce((a, s) => a + Math.max(s.balance, 0), 0)),
      lowStockItemCount: items.filter(i => i.stock < 5).length,
      transactionCount: transactions.length
    };

    let summary = await aiProvider.generateBusinessSummary(stats);
    let source = "AI";

    if (!summary) {
      summary = buildTemplatedSummary(stats);
      source = "TEMPLATE";
    }

    res.json({ summary, source, generatedAt: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

function buildTemplatedSummary(stats) {
  const businessType = guessBusinessType(stats.itemCatalog);
  const lines = [];

  lines.push(`This looks like a ${businessType.toLowerCase()}, based on the items in your catalog.`);

  if (stats.topProductsBySalesVolume.length > 0) {
    const top = stats.topProductsBySalesVolume[0];
    lines.push(`Your best-selling item is "${top.name}" with ${top.quantitySold} units sold — it's worth keeping well-stocked.`);
  } else {
    lines.push("No sales recorded yet, so there isn't a best-seller to point to.");
  }

  if (stats.customersWhoOweMoney > 0) {
    lines.push(`${stats.customersWhoOweMoney} customer(s) currently owe you a combined ₹${stats.totalOutstandingReceivable} — following up on the largest balances first will help cash flow.`);
  }

  if (stats.totalOutstandingPayableToSuppliers > 0) {
    lines.push(`You owe suppliers ₹${stats.totalOutstandingPayableToSuppliers} in total — plan payback dates to avoid strained supplier relationships.`);
  }

  if (stats.lowStockItemCount > 0) {
    lines.push(`${stats.lowStockItemCount} item(s) are low on stock (below 5 units) — consider restocking soon to avoid missed sales.`);
  }

  lines.push("Add an AI provider key (see Settings) for deeper, more specific recommendations tailored to your actual data.");

  return lines.join(" ");
}

/* ================================================================
   REMINDERS
================================================================= */
exports.createReminder = async (req, res) => {
  try {
    const { partyId, type, note, message, messageSource, dueDate } = req.body;

    if (!partyId || !type || !dueDate) {
      return res.status(400).json({ message: "partyId, type and dueDate are required" });
    }

    const ownerId = getOwnerId(req.user);

    const party = await Party.findOne({ _id: partyId, user: ownerId, isDeleted: false });
    if (!party) {
      return res.status(404).json({ message: "Party not found" });
    }

    const reminder = await Reminder.create({
      user: ownerId,
      createdBy: req.user._id,
      party: partyId,
      type,
      note: note || "",
      message: message || "",
      messageSource: messageSource || null,
      dueDate: new Date(dueDate)
    });

    res.status(201).json(reminder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getReminders = async (req, res) => {
  try {
    const ownerId = getOwnerId(req.user);
    const { status } = req.query;

    const filter = { user: ownerId };
    if (status) filter.status = status;

    const reminders = await Reminder.find(filter)
      .populate("party", "name phone type")
      .sort({ dueDate: 1 })
      .lean();

    res.json(reminders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reminders due today, tomorrow, or overdue — what the login popup shows.
exports.getDueReminders = async (req, res) => {
  try {
    const ownerId = getOwnerId(req.user);

    const endOfTomorrow = new Date();
    endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
    endOfTomorrow.setHours(23, 59, 59, 999);

    const reminders = await Reminder.find({
      user: ownerId,
      status: "PENDING",
      dueDate: { $lte: endOfTomorrow }
    })
      .populate("party", "name phone type")
      .sort({ dueDate: 1 })
      .lean();

    res.json(reminders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateReminder = async (req, res) => {
  try {
    const ownerId = getOwnerId(req.user);
    const { status, note, dueDate, message } = req.body;

    const reminder = await Reminder.findOne({ _id: req.params.id, user: ownerId });
    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    if (status !== undefined) reminder.status = status;
    if (note !== undefined) reminder.note = note;
    if (message !== undefined) reminder.message = message;
    if (dueDate !== undefined) reminder.dueDate = new Date(dueDate);

    await reminder.save();
    res.json(reminder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark a batch of due reminders as "seen" so the login popup doesn't
// show the exact same ones again this session.
exports.acknowledgeReminders = async (req, res) => {
  try {
    const ownerId = getOwnerId(req.user);
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids must be a non-empty array" });
    }

    await Reminder.updateMany(
      { _id: { $in: ids }, user: ownerId },
      { $set: { lastNotifiedAt: new Date() } }
    );

    res.json({ message: "Acknowledged" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteReminder = async (req, res) => {
  try {
    const ownerId = getOwnerId(req.user);

    const reminder = await Reminder.findOneAndDelete({ _id: req.params.id, user: ownerId });
    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    res.json({ message: "Reminder deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Draft a message for a reminder without saving anything yet — lets the
// user preview/edit before creating the reminder.
exports.draftMessage = async (req, res) => {
  try {
    const { partyId, type, note, dueDate, amount } = req.body;

    if (!partyId || !type) {
      return res.status(400).json({ message: "partyId and type are required" });
    }

    const ownerId = getOwnerId(req.user);
    const party = await Party.findOne({ _id: partyId, user: ownerId, isDeleted: false });
    if (!party) {
      return res.status(404).json({ message: "Party not found" });
    }

    const context = {
      type,
      partyName: party.name,
      partyType: party.type,
      amount: amount || (party.balance > 0 ? party.balance : null),
      note,
      dueDate
    };

    let message = await aiProvider.draftReminderMessage(context);
    let source = "AI";

    if (!message) {
      message = templateReminderMessage(context);
      source = "TEMPLATE";
    }

    res.json({ message, source });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

function templateReminderMessage({ type, partyName, amount, note, dueDate }) {
  const dueStr = dueDate ? new Date(dueDate).toLocaleDateString() : null;

  switch (type) {
    case "PAYMENT_REQUEST":
      return `Hi ${partyName}, this is a friendly reminder about your pending payment${amount ? ` of ₹${amount}` : ""}${dueStr ? ` — due by ${dueStr}` : ""}. Please let us know if you have any questions. Thank you!`;
    case "SUPPLIER_PAYBACK":
      return `Hi ${partyName}, confirming our payment to you${amount ? ` of ₹${amount}` : ""}${dueStr ? ` is scheduled for ${dueStr}` : ""}. Let us know if anything needs adjusting.`;
    case "CALL":
      return `Reminder: call ${partyName}${note ? ` about ${note}` : ""}${dueStr ? ` by ${dueStr}` : ""}.`;
    case "ORDER":
      return `Hi ${partyName}, just checking in to see if you'd like to place a new order${note ? ` — ${note}` : ""}. Let us know!`;
    case "NOTE":
    default:
      return note || `Reminder for ${partyName}${dueStr ? ` by ${dueStr}` : ""}.`;
  }
}
