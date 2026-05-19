import { useState } from "react";
import { Plus, Package, ArrowLeft } from "lucide-react";
import "./inventory.css";
import axios from "axios";
import { useEffect } from "react";


function Inventory() {
const [items, setItems] = useState([]);
const [dashboard, setDashboard] = useState(null);
const [selectedItem, setSelectedItem] = useState(null);
const [purchases, setPurchases] = useState([]);
const [showAdjustModal, setShowAdjustModal] = useState(false);
const [adjustData, setAdjustData] = useState({
  name: "",
  quantity: "",
  purchasePrice: "",
  sellingPrice: ""
});
const [allItems, setAllItems] = useState([]);
function InventoryDetail({ item, onBack }) {

  const profitPerUnit = item.sellingPrice - 30; // temporary demo cost

  return (
    <div className="inventory-detail">

  <div className="detail-header">
    <ArrowLeft
      size={20}
      className="back-arrow"
      onClick={onBack}
    />
    <h3>{item.name}</h3>
  </div>

  <div className="detail-row">
    <span>Available Stock</span>
    <strong>{item.stock}</strong>
  </div>

  <div className="detail-row">
    <span>Selling Price</span>
    <strong>₹{item.sellingPrice}</strong>
  </div>

  <div className="detail-row">
    <span>Total Value</span>
    <strong>₹{item.stock * item.sellingPrice}</strong>
  </div>

</div>
  );
}
useEffect(() => {
  fetchInventory();
  fetchDashboard();
}, []);
const fetchInventory = async () => {
  const { data } = await axios.get(
    "http://localhost:5000/api/inventory",
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    }
  );

  setItems(data);
  setAllItems(data);
};

const fetchDashboard = async () => {
  const { data } = await axios.get(
    "http://localhost:5000/api/inventory/dashboard",
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    }
  );
  setDashboard(data);
};
const fetchItemDetails = async (id) => {
  const { data } = await axios.get(
    `http://localhost:5000/api/inventory/${id}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    }
  );

  setSelectedItem(data.item);
  setPurchases(data.purchases);
};
const handleAdjustStock = async () => {
  try {
    await axios.post(
      "http://localhost:5000/api/inventory/adjust",
      {
        ...adjustData,
        quantity: Number(adjustData.quantity),
        purchasePrice: Number(adjustData.purchasePrice),
        sellingPrice: Number(adjustData.sellingPrice)
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      }
    );

    setShowAdjustModal(false);
    setAdjustData({
      name: "",
      quantity: "",
      purchasePrice: "",
      sellingPrice: ""
    });

    fetchInventory();
    fetchDashboard();

  } catch (error) {
    console.log(error.response?.data || error.message);
  }
};
  return (
    <div className="inventory-layout">

      {/* LEFT SECTION */}
      <div className="inventory-left">

        <h2>Inventory</h2>

<input
  className="inventory-search"
  placeholder="Search item..."
  onChange={(e) => {
  const value = e.target.value.toLowerCase();

  if (value === "") {
    setItems(allItems);
  } else {
    const filtered = allItems.filter(i =>
      i.name.toLowerCase().includes(value)
    );
    setItems(filtered);
  }
}}
/>

<div className="inventory-list">
  {items.map(item => (
    <div
      key={item._id}
      className={`inventory-card ${selectedItem?._id === item._id ? "active" : ""}`}
      onClick={() => fetchItemDetails(item._id)}
    >
      <Package size={18} />

      <div className="inventory-card-content">
        <h4>{item.name}</h4>
        <p>₹{item.sellingPrice}</p>
        <span>Stock: {item.stock}</span>
      </div>
    </div>
  ))}
</div>
<button
  className="inventory-adjust-btn"
  onClick={() => setShowAdjustModal(true)}
>
  Adjust Stock
</button>
      </div>

      {/* RIGHT SECTION */}
      <div className="inventory-right">

       {selectedItem ? (
  <div className="inventory-detail">

    <div className="detail-header">
      <ArrowLeft
        size={20}
        className="back-arrow"
        onClick={() => setSelectedItem(null)}
      />
      <h3>{selectedItem.name}</h3>
    </div>

    <div className="detail-row">
      <span>Stock</span>
      <strong>{selectedItem.stock}</strong>
    </div>

    <div className="detail-row">
      <span>Selling Price</span>
      <strong>₹{selectedItem.sellingPrice}</strong>
    </div>

    <div className="detail-row">
      <span>Total Value</span>
      <strong>₹{selectedItem.stock * selectedItem.sellingPrice}</strong>
    </div>

    <h4 style={{ marginTop: "30px" }}>Last 5 Purchases</h4>

    {purchases.map(p => (
      <div key={p._id} className="purchase-card">
        <div>
          <strong>{p.supplier?.name}</strong>
          <div style={{ fontSize: "12px", color: "#6b7280" }}>
            {new Date(p.createdAt).toLocaleString()}
          </div>
        </div>

        <div>
          Qty: {p.quantity}
          <br />
          ₹{p.purchasePrice}
        </div>
      </div>
    ))}

  </div>
) : dashboard ? (
  <div>

    <h3 className="inventory-overview-title">
  Inventory Overview
</h3>
<div className="inventory-dashboard">

  <div className="inventory-summary-grid">

    <div className="inventory-summary-card">
      <p>Total Inventory Value</p>
      <h2>₹{dashboard.totalCost}</h2>
    </div>

    <div className="inventory-summary-card warning">
      <p>Low Stock Items</p>
      <h2>{dashboard.lowStock.length}</h2>
    </div>

  </div>

  <div className="inventory-low-section">
    <h4>Low Stock (Below 5)</h4>

    {dashboard.lowStock.length === 0 ? (
      <div className="empty-low">
        All items sufficiently stocked
      </div>
    ) : (
      dashboard.lowStock.map(item => (
        <div key={item._id} className="low-stock-card">
          <div>
            <strong>{item.name}</strong>
            <span>Stock: {item.stock}</span>
          </div>
        </div>
      ))
    )}
  </div>

</div>
  </div>
) : null}

      </div>
{showAdjustModal && (
  <div className="modal-overlay">
    <div className="modal">

      <h3>Adjust Inventory</h3>

      <input
        placeholder="Item Name"
        value={adjustData.name}
        onChange={(e) =>
          setAdjustData({ ...adjustData, name: e.target.value })
        }
      />

      <input
        type="number"
        placeholder="Quantity"
        value={adjustData.quantity}
        onChange={(e) =>
          setAdjustData({ ...adjustData, quantity: e.target.value })
        }
      />

      <input
        type="number"
        placeholder="Purchase Price"
        value={adjustData.purchasePrice}
        onChange={(e) =>
          setAdjustData({ ...adjustData, purchasePrice: e.target.value })
        }
      />

      <input
        type="number"
        placeholder="Selling Price"
        value={adjustData.sellingPrice}
        onChange={(e) =>
          setAdjustData({ ...adjustData, sellingPrice: e.target.value })
        }
      />

      <div className="modal-actions">
        <button onClick={() => setShowAdjustModal(false)}>
          Cancel
        </button>
        <button onClick={handleAdjustStock}>
          Save
        </button>
      </div>

    </div>
  </div>
)}
    </div>
    
  );
}

export default Inventory;
