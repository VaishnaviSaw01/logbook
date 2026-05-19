import "./transactions.css";
import { useEffect, useState } from "react";
import axios from "axios";
import { Banknote, Smartphone, CreditCard, Landmark } from "lucide-react";
import { Trash2 } from "lucide-react";

function Transactions() {

  const [transactions, setTransactions] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
const [selectedParty, setSelectedParty] = useState(null);
const [partyTransactions, setPartyTransactions] = useState([]);
useEffect(() => {
  if (!selectedParty) return;

  const fetchPartyTransactions = async () => {
    const token = localStorage.getItem("token");

    const { data } = await axios.get(
      `http://localhost:5000/api/transactions/${selectedParty._id}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    // Only money transactions
    const moneyOnly = data.filter(t => {
  if (selectedParty.type === "CUSTOMER") {
    return t.type === "CREDIT";   // Money received
  }

  if (selectedParty.type === "SUPPLIER") {
    return t.type === "DEBIT";    // Money paid
  }

  return false;
});

    setPartyTransactions(moneyOnly);
  };

  fetchPartyTransactions();

}, [selectedParty]);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("token");

      const { data } = await axios.get(
        `http://localhost:5000/api/transactions?from=${from}&to=${to}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setTransactions(data);

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);
const handleDownload = () => {
  const csvRows = [];

  const headers = ["Date", "Name", "Type", "Amount", "Transaction"];
  csvRows.push(headers.join(","));

  transactions.forEach(txn => {
    const row = [
      new Date(txn.createdAt).toLocaleDateString(),
      txn.party.name,
      txn.party.type,
      txn.amount,
      txn.type
    ];

    csvRows.push(row.join(","));
  });

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "transactions.csv";
  a.click();
};
const handleDeleteTransaction = async (id) => {
  const confirmDelete = window.confirm("Delete this transaction?");

  if (!confirmDelete) return;

  try {
    const token = localStorage.getItem("token");

    await axios.delete(
      `http://localhost:5000/api/transactions/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    fetchTransactions(); // refresh list

  } catch (err) {
    console.error(err);
  }
};

return (
  <div className="transactions-page">

  {/* LEFT */}
  <div className="transactions-left">
    {/* FILTER BAR */}
<div className="txn-filter-bar">

  <div className="date-group">
    <label>From</label>
    <input
      type="date"
      value={from}
      onChange={(e) => setFrom(e.target.value)}
    />
  </div>

  <div className="date-group">
    <label>To</label>
    <input
      type="date"
      value={to}
      onChange={(e) => setTo(e.target.value)}
    />
  </div>

  <button
    className="filter-btn"
    onClick={fetchTransactions}
  >
    Filter
  </button>

</div>
<div className="txn-scroll">
  {transactions.map(txn => (
    <div
  key={txn._id}
  className="txn-card"
  onClick={() => setSelectedParty(txn.party)}
>
  <div className="txn-top">
  <span className="txn-date">
    {new Date(txn.createdAt).toLocaleDateString()}
  </span>

  <div className="amount-section">
    <span className={txn.type === "CREDIT" ? "money-in" : "money-out"}>
      ₹{txn.amount}
    </span>

    <button
      className="txn-delete-btn"
      onClick={(e) => {
        e.stopPropagation(); // 🔥 VERY IMPORTANT
        handleDeleteTransaction(txn._id);
      }}
    >
      <Trash2 size={16} />
    </button>
  </div>
</div>


  <div className="txn-middle">
    <strong>{txn.party.name}</strong>
  </div>

  <div className="txn-bottom">
    {txn.paymentMethod === "CASH" && <Banknote size={16} />}
    {txn.paymentMethod === "UPI" && <Smartphone size={16} />}
    {txn.paymentMethod === "CARD" && <CreditCard size={16} />}
    {txn.paymentMethod === "BANK" && <Landmark size={16} />}

    <span>
      {txn.type === "CREDIT" ? "Money Received" : "Money Paid"}
    </span>
  </div>
</div>

  ))}
  </div>
<button 
  className="floating-download-btn"
  onClick={handleDownload}
>
  ⬇ Download Transactions
</button>

</div>


  {/* RIGHT */}
 <div className="transactions-right">
  {selectedParty ? (
    <div className="statement-card">
      <h3>{selectedParty.name}</h3>

      {partyTransactions.length === 0 ? (
        <p>No money transactions</p>
      ) : (
        partyTransactions.map(txn => (
          <div key={txn._id} className="statement-row">
            <span>{new Date(txn.createdAt).toLocaleDateString()}</span>
            <span>₹{txn.amount}</span>
            <span>{txn.paymentMethod}</span>
          </div>
        ))
      )}
    </div>
  ) : (
    <div className="empty-state">
      Select a transaction
    </div>
  )}
</div>


</div>

);
}
  export default Transactions;
