const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const insightsController = require("../controllers/insightsController");

router.get("/overview", protect, insightsController.getOverview);
router.get("/ai-summary", protect, insightsController.getAiSummary);

router.get("/reminders", protect, insightsController.getReminders);
router.get("/reminders/due", protect, insightsController.getDueReminders);
router.post("/reminders", protect, insightsController.createReminder);
router.post("/reminders/draft", protect, insightsController.draftMessage);
router.post("/reminders/acknowledge", protect, insightsController.acknowledgeReminders);
router.put("/reminders/:id", protect, insightsController.updateReminder);
router.delete("/reminders/:id", protect, insightsController.deleteReminder);

module.exports = router;
