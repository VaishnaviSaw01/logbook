import "./suppliers.css";
import { useState } from "react";
import { Search, Trash2} from "lucide-react";
import axios from "axios";
import { useEffect } from "react";
import { Banknote, Smartphone, CreditCard, Landmark } from "lucide-react";
import { Pencil } from "lucide-react";


function Suppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [transactions, setTransactions] = useState([]);
const [inventoryItems, setInventoryItems] = useState([]);
const [showPurchaseModal, setShowPurchaseModal] = useState(false);
const [showPaymentModal, setShowPaymentModal] = useState(false);
const [purchaseItems, setPurchaseItems] = useState([
  { itemId: "", quantity: "", price: "" }
]);
async function fetchInventory() {
  const { data } = await axios.get(
    "/api/inventory",
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    }
  );
  setInventoryItems(data);
};
useEffect(() => {
  fetchInventory();
}, []);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
const [addressFilter, setAddressFilter] = useState("ALL");
const [sortType, setSortType] = useState("A-Z");

const [showModal, setShowModal] = useState(false);
const [formData, setFormData] = useState({
  name: "",
  phone: "",
  address: ""
});
  let filteredSuppliers = suppliers.filter((s) =>
  s.name.toLowerCase().includes(search.toLowerCase()) ||
  s.phone.includes(search) ||
  s.address.toLowerCase().includes(search.toLowerCase())
);

// Status Filter
if (statusFilter === "Pending") {
  filteredSuppliers = filteredSuppliers.filter(s => s.balance > 0);
}

if (statusFilter === "Settled") {
  filteredSuppliers = filteredSuppliers.filter(s => s.balance <= 0);
}

// Address Filter
if (addressFilter !== "ALL") {
  filteredSuppliers = filteredSuppliers.filter(
    s => s.address === addressFilter
  );
}

// Sorting
if (sortType === "A-Z") {
  filteredSuppliers.sort((a, b) => a.name.localeCompare(b.name));
}

if (sortType === "Newest") {
  filteredSuppliers.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

if (sortType === "Oldest") {
  filteredSuppliers.sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );
}

  const [editTxn, setEditTxn] = useState(null);
const [editData, setEditData] = useState({
  amount: "",
  type: "",
  paymentMethod: "",
  note: ""
});
const [paymentForm, setPaymentForm] = useState({
  amount: "",
  paymentMethod: "CASH",
  note: ""
});
const handleAddPayment = async () => {
  try {
    const token = localStorage.getItem("token");

    await axios.post(
      "/api/transactions",
      {
        partyId: selectedSupplier._id,
        amount: Number(paymentForm.amount),
        type: "DEBIT", // PAYMENT reduces supplier balance
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

    await refreshSupplierData(selectedSupplier._id);

  } catch (err) {
    console.error(err);
  }
};


const refreshSupplierData = async (supplierId) => {
  try {
    const token = localStorage.getItem("token");

    // Refresh suppliers
    const { data: partyData } = await axios.get(
      "/api/parties",
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const onlySuppliers = partyData.filter(
      (party) => party.type === "SUPPLIER"
    );

    setSuppliers([...onlySuppliers]); // force re-render

    // Update selected supplier
    const updatedSupplier = onlySuppliers.find(
      (c) => c._id === supplierId
    );

    if (updatedSupplier) {
      setSelectedSupplier({ ...updatedSupplier }); // new reference
    }

    // Refresh transactions
    const { data: txnData } = await axios.get(
      `/api/transactions/${supplierId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    setTransactions(txnData);

  } catch (error) {
    console.error(error);
  }
};

// Fetch suppliers from backend
const fetchSuppliers = async () => {
  try {
    const token = localStorage.getItem("token");

    const { data } = await axios.get(
      "/api/parties",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const onlySuppliers = data.filter(
      (party) => party.type === "SUPPLIER"
    );

    setSuppliers(onlySuppliers);

  } catch (error) {
    console.log(error);
  }
};
useEffect(() => {
  fetchSuppliers();
}, []);
const handleSaveSupplier = async () => {
  try {
    const token = localStorage.getItem("token");

    await axios.post(
      "/api/parties",
      {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        type: "SUPPLIER",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setShowModal(false);
    setFormData({ name: "", phone: "", address: "" });

    fetchSuppliers();

  } catch (error) {
    console.log(error.response?.data || error.message);
  }
};
 useEffect(() => {
  if (!selectedSupplier) return;

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("token");

      const { data } = await axios.get(
        `/api/transactions/${selectedSupplier._id}`,
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
}, [selectedSupplier]);

const handleDeleteTransaction = async (txnId) => {
  try {
    const token = localStorage.getItem("token");

    await axios.delete(
      `/api/transactions/${txnId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    await refreshSupplierData(selectedSupplier._id);


  } catch (error) {
    console.error(error);
  }
};

const handleUpdateTransaction = async () => {
  try {
    const token = localStorage.getItem("token");

    await axios.put(
      `/api/transactions/${editTxn._id}`,
      editData,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    setEditTxn(null);

    await refreshSupplierData(selectedSupplier._id);


  } catch (error) {
    console.error(error);
  }
};

const handleAddItem = () => {
  setPurchaseItems([
    ...purchaseItems,
    { itemId: "", quantity: "", price: "" }
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

    const validItems = purchaseItems.filter(
      item => item.itemId && Number(item.quantity) > 0 && item.price !== ""
    );

    if (validItems.length === 0) {
      alert("Select at least one item with a quantity before saving.");
      return;
    }

    // The transaction API links a single itemId/quantity to each
    // transaction, so a multi-item purchase is recorded as one
    // transaction per line item — each one updates that item's stock.
    // Sequential (not Promise.all) so two rows for the same item don't
    // race on the same stock read-modify-write.
    for (const item of validItems) {
      const itemName = inventoryItems.find(i => i._id === item.itemId)?.name || "Item";

      await axios.post(
        "/api/transactions",
        {
          partyId: selectedSupplier._id,
          amount: Number(item.quantity) * Number(item.price),
          type: "CREDIT",
          paymentMethod: "CASH",
          note: `${itemName} (${item.quantity} x ${item.price})`,
          itemId: item.itemId,
          quantity: Number(item.quantity)
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
    }

    setShowPurchaseModal(false);
    setPurchaseItems([{ itemId: "", quantity: "", price: "" }]);

    await refreshSupplierData(selectedSupplier._id);
    await fetchInventory();

  } catch (error) {
    console.error(error);
    alert(error.response?.data?.message || "Failed to save purchase");
  }
};

const handleDeleteSupplier = async () => {
  if (!selectedSupplier) return;

  const confirmDelete = window.confirm(
    "Are you sure you want to delete this supplier and all transactions?"
  );

  if (!confirmDelete) return;

  try {
    const token = localStorage.getItem("token");

    await axios.delete(
      `/api/parties/${selectedSupplier._id}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    // Clear UI
    setSelectedSupplier(null);
    setTransactions([]);

    // Refresh supplier list
    const { data } = await axios.get(
      "/api/parties",
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const onlySuppliers = data.filter(
      (party) => party.type === "SUPPLIER"
    );

    setSuppliers(onlySuppliers);

  } catch (error) {
    console.error(error);
  }
};

const totalPurchases = transactions
  .filter(t => t.type === "CREDIT")
  .reduce((acc, t) => acc + t.amount, 0);

const totalPayments = transactions
  .filter(t => t.type === "DEBIT")
  .reduce((acc, t) => acc + t.amount, 0);

const pendingBalance = totalPurchases - totalPayments;

 return (
  <div className="suppliers-layout">

    {/* LEFT PANEL */}
    <div className="suppliers-list">

      {/* FILTER SECTION */}
     <div className="top-controls">

  {/* Row 1 - Date */}
<div className="date-row">
  <div className="date-group">
    <label>From</label>
    <input type="date" />
  </div>

  <div className="date-group">
    <label>To</label>
    <input type="date" />
  </div>
</div>


  {/* Row 2 - Filters */}
  <div className="filter-row">
    <select
  value={statusFilter}
  onChange={(e) => setStatusFilter(e.target.value)}
>
  <option value="ALL">All Status</option>
  <option value="Pending">Pending</option>
  <option value="Settled">Settled</option>
</select>

<select
  value={addressFilter}
  onChange={(e) => setAddressFilter(e.target.value)}
>
  <option value="ALL">All Address</option>

  {[...new Set(suppliers.map(s => s.address))].map(addr => (
    <option key={addr} value={addr}>{addr}</option>
  ))}

</select>


    <select
  value={sortType}
  onChange={(e) => setSortType(e.target.value)}
>
  <option value="A-Z">Sort A-Z</option>
  <option value="Newest">Newest First</option>
  <option value="Oldest">Oldest First</option>
</select>

  </div>

  {/* Row 3 - Search */}
  <div className="search-wrapper">
    <input
      type="text"
      placeholder="Search name / phone / address"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
    <span className="search-icon">
      <Search size={18} />
    </span>
  </div>

</div>

      {/* SCROLLABLE supplier LIST */}
      <div className="supplier-scroll">
        {filteredSuppliers.map((supplier) => (
          <div
            key={supplier._id}
            className="supplier-card"
    onClick={() => setSelectedSupplier(supplier)}


          >
            <div>
              <h4>{supplier.name}</h4>
              <p>{supplier.phone}</p>
            </div>

            <span className={supplier.balance > 0 ? "pending" : "settled"}>
              ₹{supplier.balance}
            </span>
          </div>
        ))}
      </div>

      {/* ADD BUTTON AT BOTTOM */}
     <button 
  className="floating-add-btn"
  onClick={() => setShowModal(true)}
>
  + Add Supplier
</button>

    </div>

    {/* RIGHT PANEL */}
    <div className="suppliers-right">

  {selectedSupplier ? (
    <>
      {/* Header */}
      <div className="supplier-header">

  <div className="header-top">
    <h2>{selectedSupplier.name}</h2>

    <button
      className="delete-supplier-btn"
      onClick={handleDeleteSupplier}
    >
      <Trash2 size={18} />
    </button>
  </div>

  <p>{selectedSupplier.phone}</p>
  <p>{selectedSupplier.address}</p>

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
    <span className={txn.type === "DEBIT" ? "txn-remaining" : "txn-cleared"}>
      ₹{txn.amount}
    </span>

    <button
  className="delete-btn"
  onClick={() => handleDeleteTransaction(txn._id)}
>
  <Trash2 size={18} strokeWidth={1.8} />
</button>
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
  {txn.type === "CREDIT" ? "Purchase" : "Payment"}
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
     <div className="supplier-summary">
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
      <h3>No supplier selected</h3>
    </div>
  )}

</div>

{showModal && (
  <div className="modal-overlay">
    <div className="modal">

      <h3>Add New Supplier</h3>

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
  onClick={handleSaveSupplier}
>
  Save Supplier
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

    <select
  value={item.itemId}
  onChange={(e) => {
    const updated = [...purchaseItems];
    updated[index].itemId = e.target.value;
    setPurchaseItems(updated);
  }}
>
  <option value="">Select Item</option>
  {inventoryItems.map(inv => (
    <option key={inv._id} value={inv._id}>
      {inv.name}
    </option>
  ))}
</select>

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
          <option value="DEBIT">Debit</option>
          <option value="CREDIT">Credit</option>
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
export default Suppliers;
