import { useState, useEffect } from "react";
import axios from "axios";
import "./insights.css";
import {
  Sparkles,
  TrendingUp,
  Users,
  AlertTriangle,
  Phone,
  RefreshCw,
  Plus,
  Package,
  Wallet
} from "lucide-react";

const TYPE_LABELS = {
  CALL: "Call",
  ORDER: "Order follow-up",
  PAYMENT_REQUEST: "Payment request",
  SUPPLIER_PAYBACK: "Supplier payback",
  NOTE: "Note"
};

const TYPE_OPTIONS = [
  { value: "CALL", label: "Call" },
  { value: "ORDER", label: "Order follow-up" },
  { value: "PAYMENT_REQUEST", label: "Payment request" },
  { value: "SUPPLIER_PAYBACK", label: "Supplier payback" },
  { value: "NOTE", label: "Note" }
];

function authHeaders() {
  return { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };
}

function Insights() {
  const [overview, setOverview] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [parties, setParties] = useState([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderPreset, setReminderPreset] = useState(null);

  async function fetchOverview() {
    const { data } = await axios.get("/api/insights/overview", authHeaders());
    setOverview(data);
  }

  async function fetchAiSummary() {
    setAiLoading(true);
    try {
      const { data } = await axios.get("/api/insights/ai-summary", authHeaders());
      setAiSummary(data);
    } catch (error) {
      console.error(error);
    } finally {
      setAiLoading(false);
    }
  }

  async function fetchReminders() {
    const { data } = await axios.get("/api/insights/reminders", authHeaders());
    setReminders(data);
  }

  async function fetchParties() {
    const { data } = await axios.get("/api/parties", authHeaders());
    setParties(data);
  }

  useEffect(() => {
    fetchOverview();
    fetchAiSummary();
    fetchReminders();
    fetchParties();
  }, []);

  function openReminderModal(preset = null) {
    setReminderPreset(preset);
    setShowReminderModal(true);
  }

  async function markReminderDone(id) {
    await axios.put(`/api/insights/reminders/${id}`, { status: "DONE" }, authHeaders());
    fetchReminders();
  }

  async function deleteReminderById(id) {
    if (!window.confirm("Delete this reminder?")) return;
    await axios.delete(`/api/insights/reminders/${id}`, authHeaders());
    fetchReminders();
  }

  if (!overview) {
    return <div className="insights-loading">Loading insights…</div>;
  }

  const pendingReminders = reminders.filter(r => r.status === "PENDING");
  const doneReminders = reminders.filter(r => r.status !== "PENDING");

  return (
    <div className="insights-container">
      <div className="insights-header">
        <div>
          <h2>
            <Sparkles size={22} /> AI Insights
          </h2>
          <p>
            Guessed business type: <strong>{overview.businessTypeGuess}</strong>
          </p>
        </div>
        <button className="insights-add-reminder-btn" onClick={() => openReminderModal()}>
          <Plus size={16} /> New Reminder
        </button>
      </div>

      {/* AI narrative summary */}
      <div className="insights-ai-card">
        <div className="insights-ai-card-header">
          <h3>
            <Sparkles size={16} /> Business Summary
          </h3>
          {aiSummary && (
            <span className={`insights-ai-badge ${aiSummary.source === "AI" ? "ai" : "template"}`}>
              {aiSummary.source === "AI" ? "AI-generated" : "Rule-based"}
            </span>
          )}
          <button
            className="insights-refresh-btn"
            onClick={fetchAiSummary}
            disabled={aiLoading}
            title="Regenerate"
          >
            <RefreshCw size={14} className={aiLoading ? "insights-spin" : ""} />
          </button>
        </div>
        <p className="insights-ai-text">{aiLoading ? "Thinking…" : aiSummary?.summary}</p>
        {aiSummary?.source === "TEMPLATE" && (
          <p className="insights-ai-hint">
            This is rule-based — add an <code>ANTHROPIC_API_KEY</code> (see .env.example) for deeper, AI-generated insights.
          </p>
        )}
      </div>

      {/* Money overview */}
      <div className="insights-stats-grid">
        <StatCard label="Sales Value" value={`₹${overview.money.totalSalesValue}`} icon={<TrendingUp size={18} />} color="green" />
        <StatCard label="Cash Collected" value={`₹${overview.money.totalCollected}`} icon={<Wallet size={18} />} color="blue" />
        <StatCard label="Receivable" value={`₹${overview.money.totalReceivable}`} icon={<Users size={18} />} color="purple" />
        <StatCard label="Payable to Suppliers" value={`₹${overview.money.totalPayable}`} icon={<AlertTriangle size={18} />} color="red" />
      </div>

      <div className="insights-two-col">
        <div className="insights-card">
          <h3>
            <Package size={16} /> Top-Selling Products
          </h3>
          {overview.topProducts.length === 0 ? (
            <p className="insights-empty">No sales recorded yet.</p>
          ) : (
            <div className="insights-list">
              {overview.topProducts.map((p, i) => (
                <div key={p.itemId} className="insights-list-row">
                  <span className="insights-rank">#{i + 1}</span>
                  <span className="insights-list-name">{p.name}</span>
                  <span className="insights-list-meta">
                    {p.quantitySold} sold · ₹{p.revenue}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="insights-card">
          <h3>
            <Users size={16} /> Customer Activity
          </h3>
          <div className="insights-segments">
            <SegmentBar label="Frequent" count={overview.customerSegments.frequent} total={overview.counts.customers} color="#16a34a" />
            <SegmentBar label="Occasional" count={overview.customerSegments.occasional} total={overview.counts.customers} color="#2563eb" />
            <SegmentBar label="One-time" count={overview.customerSegments.oneTime} total={overview.counts.customers} color="#d97706" />
            <SegmentBar label="Dormant" count={overview.customerSegments.dormant} total={overview.counts.customers} color="#9ca3af" />
          </div>
        </div>
      </div>

      <div className="insights-card">
        <h3>
          <AlertTriangle size={16} /> Priority Customers
        </h3>
        {overview.priorityCustomers.length === 0 ? (
          <p className="insights-empty">No outstanding customer balances 🎉</p>
        ) : (
          <div className="insights-priority-list">
            {overview.priorityCustomers.map(c => (
              <div key={c._id} className="insights-priority-row">
                <div>
                  <strong>{c.name}</strong>
                  <p>{c.reason}</p>
                </div>
                <button onClick={() => openReminderModal({ partyId: c._id, type: "PAYMENT_REQUEST" })}>
                  <Phone size={14} /> Remind
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="insights-card">
        <h3>
          <AlertTriangle size={16} /> Suppliers You Owe
        </h3>
        {overview.supplierPaybacks.length === 0 ? (
          <p className="insights-empty">No pending supplier payments.</p>
        ) : (
          <div className="insights-priority-list">
            {overview.supplierPaybacks.map(s => (
              <div key={s._id} className="insights-priority-row">
                <div>
                  <strong>{s.name}</strong>
                  <p>Owe ₹{s.balance}</p>
                </div>
                <button onClick={() => openReminderModal({ partyId: s._id, type: "SUPPLIER_PAYBACK" })}>
                  <Phone size={14} /> Schedule Payback
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="insights-card">
        <h3>📌 Reminders</h3>
        {reminders.length === 0 ? (
          <p className="insights-empty">No reminders yet — set one from a priority customer above, or add one manually.</p>
        ) : (
          <div className="insights-reminder-list">
            {[...pendingReminders, ...doneReminders].map(r => (
              <div key={r._id} className={`insights-reminder-row ${r.status.toLowerCase()}`}>
                <div>
                  <strong>{r.party?.name || "Unknown"}</strong>
                  <span className="insights-reminder-type">{TYPE_LABELS[r.type] || r.type}</span>
                  {(r.message || r.note) && <p>{r.message || r.note}</p>}
                  <span className="insights-reminder-date">
                    Due {new Date(r.dueDate).toLocaleDateString()} · {r.status}
                  </span>
                </div>
                <div className="insights-reminder-actions">
                  {r.status === "PENDING" && (
                    <button onClick={() => markReminderDone(r._id)}>Mark done</button>
                  )}
                  <button className="danger" onClick={() => deleteReminderById(r._id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showReminderModal && (
        <ReminderModal
          preset={reminderPreset}
          parties={parties}
          onClose={() => setShowReminderModal(false)}
          onSaved={() => {
            setShowReminderModal(false);
            fetchReminders();
          }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className={`insights-stat-card ${color}`}>
      <div className="insights-stat-icon">{icon}</div>
      <div>
        <p>{label}</p>
        <h2>{value}</h2>
      </div>
    </div>
  );
}

function SegmentBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="insights-segment-row">
      <div className="insights-segment-label">
        <span>{label}</span>
        <span>{count}</span>
      </div>
      <div className="insights-segment-track">
        <div className="insights-segment-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function ReminderModal({ preset, parties, onClose, onSaved }) {
  const [partyId, setPartyId] = useState(preset?.partyId || "");
  const [type, setType] = useState(preset?.type || "CALL");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [messageSource, setMessageSource] = useState(null);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [drafting, setDrafting] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedParty = parties.find(p => p._id === partyId);

  async function handleDraft() {
    if (!partyId) {
      alert("Choose a customer or supplier first.");
      return;
    }
    setDrafting(true);
    try {
      const { data } = await axios.post(
        "/api/insights/reminders/draft",
        { partyId, type, note, dueDate, amount: selectedParty?.balance > 0 ? selectedParty.balance : undefined },
        authHeaders()
      );
      setMessage(data.message);
      setMessageSource(data.source);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to draft a message");
    } finally {
      setDrafting(false);
    }
  }

  async function handleSave() {
    if (!partyId || !dueDate) {
      alert("Choose a party and a due date.");
      return;
    }
    setSaving(true);
    try {
      await axios.post(
        "/api/insights/reminders",
        { partyId, type, note, message, messageSource, dueDate },
        authHeaders()
      );
      onSaved();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save reminder");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal insights-reminder-modal">
        <h3>New Reminder</h3>

        <label>Customer / Supplier</label>
        <select value={partyId} onChange={e => setPartyId(e.target.value)}>
          <option value="">Select…</option>
          {parties.map(p => (
            <option key={p._id} value={p._id}>
              {p.name} ({p.type === "CUSTOMER" ? "Customer" : "Supplier"})
            </option>
          ))}
        </select>

        <label>Type</label>
        <select value={type} onChange={e => setType(e.target.value)}>
          {TYPE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <label>Due date</label>
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />

        <label>Note (context — what this is about)</label>
        <textarea
          rows={2}
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="e.g. Follow up about the pending order"
        />

        <div className="insights-draft-row">
          <label>Message to send</label>
          <button type="button" className="insights-draft-btn" onClick={handleDraft} disabled={drafting}>
            <Sparkles size={14} /> {drafting ? "Drafting…" : "Draft with AI"}
          </button>
        </div>
        <textarea
          rows={4}
          value={message}
          onChange={e => {
            setMessage(e.target.value);
            setMessageSource("MANUAL");
          }}
          placeholder="Click “Draft with AI” or write your own message"
        />
        {messageSource === "TEMPLATE" && (
          <p className="insights-ai-hint">
            Rule-based draft — add an <code>ANTHROPIC_API_KEY</code> for AI-personalized messages.
          </p>
        )}

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="save-btn" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Reminder"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Insights;
