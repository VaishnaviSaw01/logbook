import "./customers.css";
import { useState } from "react";
import { Search, Trash2} from "lucide-react";
import axios from "axios";
import { useEffect } from "react";
import { Banknote, Smartphone, CreditCard, Landmark } from "lucide-react";
import { Pencil } from "lucide-react";


function Customers() {
    const [customers, setCustomers] = useState([]);
    const [transactions, setTransactions] = useState([]);
const storedUser = localStorage.getItem("user");
const user = storedUser ? JSON.parse(storedUser) : null;
const [showPurchaseModal, setShowPurchaseModal] = useState(false);
const [showPaymentModal, setShowPaymentModal] = useState(false);
const [purchaseItems, setPurchaseItems] = useState([
  { name: "", quantity: "", price: "" }
]);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
const [toDate, setToDate] = useState("");
const [statusFilter, setStatusFilter] = useState("ALL");
const [addressFilter, setAddressFilter] = useState("ALL");
const [sortOption, setSortOption] = useState("AZ");

const [showModal, setShowModal] = useState(false);
const [formData, setFormData] = useState({
  name: "",
  phone: "",
  address: ""
});
const handleSearch = () => {
  console.log("Search clicked");
};
  const filteredCustomers = customers
  .filter((c) => {

    // Search filter
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.address.toLowerCase().includes(search.toLowerCase());

    // Status filter
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PENDING" && c.balance > 0) ||
      (statusFilter === "SETTLED" && c.balance === 0);

    // Address filter
    const matchesAddress =
      addressFilter === "ALL" || c.address === addressFilter;

    return matchesSearch && matchesStatus && matchesAddress;
  })
  .sort((a, b) => {
    if (sortOption === "AZ") {
      return a.name.localeCompare(b.name);
    }

    if (sortOption === "NEW") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }

    if (sortOption === "OLD") {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }

    return 0;
  });

  const [editTxn, setEditTxn] = useState(null);
const [editData, setEditData] = useState({
  amount: "",
  type: "",
  paymentMethod: "",
  note: ""
});
const [purchaseForm, setPurchaseForm] = useState({
  goods: "",
  quantity: "",
  price: ""
});
const handleAddPurchase = async () => {
    console.log("Purchase clicked", purchaseForm);

  try {
    const token = localStorage.getItem("token");

    const total =
      Number(purchaseForm.quantity) *
      Number(purchaseForm.price);

    await axios.post(
      "http://localhost:5000/api/transactions",
      {
        partyId: selectedCustomer._id,
        amount: total,
        type: "DEBIT", // customer took goods
        paymentMethod: "CASH", // optional default
        note: `${purchaseForm.goods} (${purchaseForm.quantity} × ${purchaseForm.price})`
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    setShowPurchaseModal(false);
    setPurchaseForm({ goods: "", quantity: "", price: "" });

    refreshCustomerData(selectedCustomer._id);


  } catch (err) {
    console.error(err);
  }
};
const [paymentForm, setPaymentForm] = useState({
  amount: "",
  paymentMethod: "CASH",
  note: ""
});
const handleAddPayment = async () => {
  try {
    const token = localStorage.getItem("token");

    await axios.post(
      "http://localhost:5000/api/transactions",
      {
        partyId: selectedCustomer._id,
        amount: Number(paymentForm.amount),
        type: "CREDIT",
        paymentMethod: paymentForm.paymentMethod,
        note: paymentForm.note
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    setShowPaymentModal(false);
    setPaymentForm({
      amount: "",
      paymentMethod: "CASH",
      note: ""
    });

    await refreshCustomerData(selectedCustomer._id);


  } catch (err) {
    console.error(err);
  }
};

const refreshCustomerData = async (customerId) => {
  try {
    const token = localStorage.getItem("token");

    // Refresh customers
    const { data: partyData } = await axios.get(
      "http://localhost:5000/api/parties",
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const onlyCustomers = partyData.filter(
      (party) => party.type === "CUSTOMER"
    );

    setCustomers([...onlyCustomers]); // force re-render

    // Update selected customer
    const updatedCustomer = onlyCustomers.find(
      (c) => c._id === customerId
    );

    if (updatedCustomer) {
      setSelectedCustomer({ ...updatedCustomer }); // new reference
    }

    // Refresh transactions
    const { data: txnData } = await axios.get(
      `http://localhost:5000/api/transactions/${customerId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    setTransactions(txnData);

  } catch (error) {
    console.error(error);
  }
};

// Fetch customers from backend
const fetchCustomers = async () => {
  try {
    const token = localStorage.getItem("token");

    const { data } = await axios.get(
      "http://localhost:5000/api/parties",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const onlyCustomers = data.filter(
      (party) => party.type === "CUSTOMER"
    );

    setCustomers(onlyCustomers);

  } catch (error) {
    console.log(error);
  }
};
useEffect(() => {
  fetchCustomers();
}, []);
const handleSaveCustomer = async () => {
  try {
    const token = localStorage.getItem("token");

    await axios.post(
      "http://localhost:5000/api/parties",
      {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        type: "CUSTOMER",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setShowModal(false);
    setFormData({ name: "", phone: "", address: "" });

    fetchCustomers();

  } catch (error) {
    console.log(error.response?.data || error.message);
  }
};
 useEffect(() => {
  if (!selectedCustomer) return;

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("token");

      const { data } = await axios.get(
        `http://localhost:5000/api/transactions/${selectedCustomer._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setTransactions(data);
    } catch (err) {
      console.error("Error fetching transactions", err);
    }
  };

  fetchTransactions();
}, [selectedCustomer]);

const handleDeleteTransaction = async (txnId) => {
  try {
    const token = localStorage.getItem("token");

    await axios.delete(
      `http://localhost:5000/api/transactions/${txnId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    await refreshCustomerData(selectedCustomer._id);


  } catch (error) {
    console.error(error);
  }
};

const handleUpdateTransaction = async () => {
  try {
    const token = localStorage.getItem("token");

    await axios.put(
      `http://localhost:5000/api/transactions/${editTxn._id}`,
      editData,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    setEditTxn(null);

    await refreshCustomerData(selectedCustomer._id);


  } catch (error) {
    console.error(error);
  }
};

const handleAddItem = () => {
  setPurchaseItems([
    ...purchaseItems,
    { name: "", quantity: "", price: "" }
  ]);
};
const handleItemChange = (index, field, value) => {
  const updated = [...purchaseItems];
  updated[index][field] = value;
  setPurchaseItems(updated);
};
const purchaseTotal = purchaseItems.reduce((acc, item) => {
  return acc + (Number(item.quantity) * Number(item.price) || 0);
}, 0);
const handleSavePurchase = async () => {
  try {
    const token = localStorage.getItem("token");

    const noteString = purchaseItems
      .map(item =>
        `${item.name} (${item.quantity} x ${item.price})`
      )
      .join(", ");

    await axios.post(
      "http://localhost:5000/api/transactions",
      {
        partyId: selectedCustomer._id,
        amount: purchaseTotal,
        type: "DEBIT",
        paymentMethod: "CASH",
        note: noteString
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    setShowPurchaseModal(false);
    setPurchaseItems([{ name: "", quantity: "", price: "" }]);

    await refreshCustomerData(selectedCustomer._id);


  } catch (error) {
    console.error(error);
  }
};

const handleDeleteCustomer = async () => {
  if (!selectedCustomer) return;

  const confirmDelete = window.confirm(
    "Are you sure you want to delete this customer and all transactions?"
  );

  if (!confirmDelete) return;

  try {
    const token = localStorage.getItem("token");

    await axios.delete(
      `http://localhost:5000/api/parties/${selectedCustomer._id}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    // Clear UI
    setSelectedCustomer(null);
    setTransactions([]);

    // Refresh customer list
    const { data } = await axios.get(
      "http://localhost:5000/api/parties",
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const onlyCustomers = data.filter(
      (party) => party.type === "CUSTOMER"
    );

    setCustomers(onlyCustomers);

  } catch (error) {
    console.error(error);
  }
};


const totalPurchases = transactions
  .filter(t => t.type === "DEBIT")
  .reduce((acc, t) => acc + t.amount, 0);

const totalPayments = transactions
  .filter(t => t.type === "CREDIT")
  .reduce((acc, t) => acc + t.amount, 0);

const pendingBalance = totalPurchases - totalPayments;

 return (
  <div className="customers-layout">

    {/* LEFT PANEL */}
    <div className="customers-list">

      {/* FILTER SECTION */}
     <div className="top-controls">

  {/* Row 1 - Date */}
<div className="date-row">
  <div className="date-group">
    <label>From</label>
    <input 
  type="date" 
  value={fromDate}
  onChange={(e) => setFromDate(e.target.value)}
/>

  </div>

  <div className="date-group">
    <label>To</label>
    <input 
  type="date" 
  value={toDate}
  onChange={(e) => setToDate(e.target.value)}
/>

  </div>
</div>


  {/* Row 2 - Filters */}
  <div className="filter-row">
    <select 
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value)}
>
<option value="ALL">All Status</option>
<option value="PENDING">Pending</option>
<option value="SETTLED">Settled</option>

    </select>

    <select 
  value={addressFilter}
  onChange={(e) => setAddressFilter(e.target.value)}
>
  <option value="ALL">All Address</option>
  {[...new Set(customers.map(c => c.address))].map(addr => (
    <option key={addr} value={addr}>{addr}</option>
  ))}
</select>

<select 
  value={sortOption}
  onChange={(e) => setSortOption(e.target.value)}
>
  <option value="AZ">Sort A-Z</option>
  <option value="NEW">Newest First</option>
  <option value="OLD">Oldest First</option>
</select>

  </div>

  {/* Row 3 - Search */}
  <div className="search-wrapper">
    <input
      type="text"
      placeholder="Search name / phone / address"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleSearch();
      }}
    />
    <span className="search-icon">
      <Search size={18} />
    </span>
  </div>

</div>

      {/* SCROLLABLE CUSTOMER LIST */}
      <div className="customer-scroll">
        {filteredCustomers.map((customer) => (
          <div
            key={customer._id}
            className="customer-card"
    onClick={() => setSelectedCustomer(customer)}


          >
            <div>
              <h4>{customer.name}</h4>
              <p>{customer.phone}</p>
            </div>

            <span className={customer.balance > 0 ? "pending" : "settled"}>
              ₹{customer.balance}
            </span>
          </div>
        ))}
      </div>

      {/* ADD BUTTON AT BOTTOM */}
     <button 
  className="floating-add-btn"
  onClick={() => setShowModal(true)}
>
  + Add Customer
</button>

    </div>

    {/* RIGHT PANEL */}
    <div className="customers-right">

  {selectedCustomer ? (
    <>
      {/* Header */}
      <div className="customer-header">

  <div className="header-top">
    <h2>{selectedCustomer.name}</h2>

    {user?.permissions?.delete && (<button
      className="delete-customer-btn"
      onClick={handleDeleteCustomer}
    >
      <Trash2 size={18} />
    </button>)}
  </div>

  <p>{selectedCustomer.phone}</p>
  <p>{selectedCustomer.address}</p>

  <span className={
    pendingBalance > 0
      ? "status-pending"
      : "status-settled"
  }>
    {pendingBalance > 0 ? "Pending" : "Settled"}
  </span>

</div>


      {/* Transaction Cards */}
      <div className="transactions-section">
  {transactions.length === 0 ? (
    <p>No transactions found</p>
  ) : (
    transactions.map((txn) => (
      <div key={txn._id} className="transaction-card">

        <div className="txn-top">
  <span className="txn-date">
    {new Date(txn.date).toLocaleDateString()}
  </span>

  <div className="txn-actions">
    <span className={txn.type === "CREDIT" ? "txn-remaining" : "txn-cleared"}>
      ₹{txn.amount}
    </span>

    {user?.permissions?.delete && (<button
  className="delete-btn"
  onClick={() => handleDeleteTransaction(txn._id)}
>
  <Trash2 size={18} strokeWidth={1.8} />
</button>)}
<button
  className="edit-btn"
  onClick={() => {
    setEditTxn(txn);
    setEditData({
      amount: txn.amount,
      type: txn.type,
      paymentMethod: txn.paymentMethod,
      note: txn.note
    });
  }}
>
  <Pencil size={18} strokeWidth={1.8} />
</button>

  </div>
</div>


        <div className="txn-goods">
          {txn.note || "Transaction"}
        </div>

        <div className="txn-bottom">
          <div>
            <small>Type</small>
            <strong>
  {txn.type === "DEBIT" ? "Purchase" : "Payment"}
</strong>

          </div>

          <div className="payment-method">
  {txn.paymentMethod === "CASH" && (
    <>
      <Banknote size={16} />
      <span>Cash</span>
    </>
  )}

  {txn.paymentMethod === "UPI" && (
    <>
      <Smartphone size={16} />
      <span>UPI</span>
    </>
  )}

  {txn.paymentMethod === "CARD" && (
    <>
      <CreditCard size={16} />
      <span>Card</span>
    </>
  )}

  {txn.paymentMethod === "BANK" && (
    <>
      <Landmark size={16} />
      <span>Bank</span>
    </>
  )}
</div>

        </div>

      </div>
    ))
  )}
</div>


      {/* Summary */}
     <div className="customer-summary">

  <div className="summary-box">
    <span>Total Purchase</span>
    <strong>₹{totalPurchases}</strong>
  </div>

  <div className="summary-box">
    <span>Total Payment</span>
    <strong>₹{totalPayments}</strong>
  </div>

  <div className="summary-box highlight">
    <span>Pending</span>
    <strong>₹{pendingBalance}</strong>

  </div>

  <div className="action-buttons">
    <button
      className="purchase-btn"
      onClick={() => setShowPurchaseModal(true)}
    >
      + Add Purchase
    </button>

    <button
  className="payment-btn"
  disabled={pendingBalance <= 0}
  onClick={() => setShowPaymentModal(true)}
>
  + Add Payment
</button>

  </div>

</div>


    </>
  ) : (
    <div className="empty-state">
      <h3>No customer selected</h3>
    </div>
  )}

</div>

{showModal && (
  <div className="modal-overlay">
    <div className="modal">

      <h3>Add New Customer</h3>

      <div className="form-group">
        <label>Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
        />
      </div>

      <div className="form-group">
        <label>Phone</label>
        <input
          type="text"
          value={formData.phone}
          onChange={(e) =>
            setFormData({ ...formData, phone: e.target.value })
          }
        />
      </div>

      <div className="form-group">
        <label>Address</label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) =>
            setFormData({ ...formData, address: e.target.value })
          }
        />
      </div>

      <div className="modal-actions">
        <button 
          className="cancel-btn"
          onClick={() => setShowModal(false)}
        >
          Cancel
        </button>

        <button 
  className="save-btn"
  onClick={handleSaveCustomer}
>
  Save Customer
</button>

      </div>
    </div>
  </div>
)}
{showPurchaseModal && (
  <div className="modal-overlay">
    <div className="modal">
    <h3>Add Purchase</h3>

{purchaseItems.map((item, index) => (
  <div key={index} className="purchase-row">

    <input
      type="text"
      placeholder="Goods name"
      value={item.name}
      onChange={(e) =>
        handleItemChange(index, "name", e.target.value)
      }
    />

    <input
      type="number"
      placeholder="Qty"
      value={item.quantity}
      onChange={(e) =>
        handleItemChange(index, "quantity", e.target.value)
      }
    />

    <input
      type="number"
      placeholder="Price"
      value={item.price}
      onChange={(e) =>
        handleItemChange(index, "price", e.target.value)
      }
    />

    <span className="subtotal">
      ₹{Number(item.quantity) * Number(item.price) || 0}
    </span>

  </div>
))}

<button className="add-item-btn" onClick={handleAddItem}>
  + Add More Item
</button>

<h4>Total: ₹{purchaseTotal}</h4>

      
      <div className="modal-actions">
        <button 
          className="cancel-btn"
          onClick={() => setShowPurchaseModal(false)}
        >
          Cancel
        </button>
<button className="save-btn" onClick={handleSavePurchase}>
  Save Purchase
</button>


       
      </div>

    </div>
  </div>
)}
{showPaymentModal && (
  <div className="modal-overlay">
    <div className="modal">

      <h3>Add Payment</h3>

      <div className="form-group">
        <label>Amount</label>
        <input
  type="number"
  value={paymentForm.amount}
  onChange={(e) =>
    setPaymentForm({ ...paymentForm, amount: e.target.value })
  }
/>

      </div>

      <div className="form-group">
        <label>Payment Method</label>
        <select
  value={paymentForm.paymentMethod}
  onChange={(e) =>
    setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })
  }
>
          <option value="CASH">Cash</option>
          <option value="UPI">UPI</option>
          <option value="BANK">Bank</option>
          <option value="CARD">Card</option>
        </select>
      </div>

      <div className="form-group">
        <label>Note</label>
        <input
  type="text"
  value={paymentForm.note}
  onChange={(e) =>
    setPaymentForm({ ...paymentForm, note: e.target.value })
  }
/>

      </div>

      <div className="modal-actions">
        <button 
          className="cancel-btn"
          onClick={() => setShowPaymentModal(false)}
        >
          Cancel
        </button>
<button
  className="save-btn"
  onClick={handleAddPayment}
>
  Save Payment
</button>

      </div>

    </div>
  </div>
)}

{editTxn && (
  <div className="modal-overlay">
    <div className="modal">

      <h3>Edit Transaction</h3>

      <div className="form-group">
        <label>Amount</label>
        <input
          type="number"
          value={editData.amount}
          onChange={(e) =>
            setEditData({ ...editData, amount: e.target.value })
          }
        />
      </div>

      <div className="form-group">
        <label>Type</label>
        <select
          value={editData.type}
          onChange={(e) =>
            setEditData({ ...editData, type: e.target.value })
          }
        >
          <option value="CREDIT">Credit</option>
          <option value="DEBIT">Debit</option>
        </select>
      </div>

      <div className="form-group">
        <label>Payment Method</label>
        <select
          value={editData.paymentMethod}
          onChange={(e) =>
            setEditData({ ...editData, paymentMethod: e.target.value })
          }
        >
          
            <option value="CASH">Cash</option>
  <option value="UPI">UPI</option>
  <option value="CARD">Card</option>
  <option value="BANK">Bank</option>
        </select>
      </div>

      <div className="form-group">
        <label>Note</label>
        <input
          type="text"
          value={editData.note}
          onChange={(e) =>
            setEditData({ ...editData, note: e.target.value })
          }
        />
      </div>

      <div className="modal-actions">
        <button
          className="cancel-btn"
          onClick={() => setEditTxn(null)}
        >
          Cancel
        </button>

        <button
  className="save-btn"
  onClick={handleUpdateTransaction}
>
  Update Transaction
</button>


      </div>

    </div>
  </div>
)}

  </div>
);

};
export default Customers;
