import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, X } from "lucide-react";
import "./reminderPopup.css";

const TYPE_LABELS = {
  CALL: "Call",
  ORDER: "Order follow-up",
  PAYMENT_REQUEST: "Payment request",
  SUPPLIER_PAYBACK: "Supplier payback",
  NOTE: "Note"
};

// Shows once per browser tab session (not on every page navigation) —
// a friendly heads-up for any reminder due today, tomorrow, or overdue.
function ReminderPopup() {
  const [dueReminders, setDueReminders] = useState([]);
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem("reminderPopupShown")) return;

    const checkReminders = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch("/api/insights/reminders/due", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) return;

        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setDueReminders(data);
          setShow(true);
        }
      } catch (error) {
        console.error("Failed to check due reminders:", error);
      } finally {
        sessionStorage.setItem("reminderPopupShown", "1");
      }
    };

    checkReminders();
  }, []);

  const acknowledge = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch("/api/insights/reminders/acknowledge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ids: dueReminders.map(r => r._id) })
      });
    } catch (error) {
      console.error("Failed to acknowledge reminders:", error);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    acknowledge();
  };

  const handleViewAll = () => {
    setShow(false);
    acknowledge();
    navigate("/insights");
  };

  if (!show) return null;

  const overdue = dueReminders.filter(r => new Date(r.dueDate) < new Date(new Date().setHours(0, 0, 0, 0)));
  const upcoming = dueReminders.filter(r => !overdue.includes(r));

  return (
    <div className="reminder-popup-overlay">
      <div className="reminder-popup-card">
        <button className="reminder-popup-close" onClick={handleDismiss} aria-label="Dismiss">
          <X size={18} />
        </button>

        <div className="reminder-popup-header">
          <div className="reminder-popup-icon">
            <Bell size={22} />
          </div>
          <div>
            <h3>Hey, don't forget!</h3>
            <p>
              {dueReminders.length} reminder{dueReminders.length > 1 ? "s" : ""} need
              {dueReminders.length > 1 ? "" : "s"} your attention
            </p>
          </div>
        </div>

        <div className="reminder-popup-list">
          {overdue.length > 0 && (
            <>
              <div className="reminder-popup-section-label overdue">Overdue</div>
              {overdue.map(r => (
                <ReminderRow key={r._id} reminder={r} />
              ))}
            </>
          )}

          {upcoming.length > 0 && (
            <>
              <div className="reminder-popup-section-label">Due today / tomorrow</div>
              {upcoming.map(r => (
                <ReminderRow key={r._id} reminder={r} />
              ))}
            </>
          )}
        </div>

        <div className="reminder-popup-actions">
          <button className="reminder-popup-dismiss" onClick={handleDismiss}>
            Got it
          </button>
          <button className="reminder-popup-view" onClick={handleViewAll}>
            View all in AI Insights
          </button>
        </div>
      </div>
    </div>
  );
}

function ReminderRow({ reminder }) {
  return (
    <div className="reminder-popup-item">
      <div className="reminder-popup-item-top">
        <strong>{reminder.party?.name || "Unknown"}</strong>
        <span className="reminder-popup-type">{TYPE_LABELS[reminder.type] || reminder.type}</span>
      </div>
      <div className="reminder-popup-item-date">
        Due {new Date(reminder.dueDate).toLocaleDateString()}
      </div>
      {reminder.note && <p className="reminder-popup-item-note">{reminder.note}</p>}
    </div>
  );
}

export default ReminderPopup;
