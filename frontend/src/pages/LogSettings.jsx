import axios from "axios";
import { useEffect, useState } from "react";
import "./settings.css";
function LogSettings() {

  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");

  useEffect(() => {
    fetchParties();
  }, []);

  const fetchParties = async () => {
    const token = localStorage.getItem("token");

    const { data } = await axios.get(
      "http://localhost:5000/api/parties",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setCustomers(data.filter(p => p.type === "CUSTOMER"));
    setSuppliers(data.filter(p => p.type === "SUPPLIER"));
  };

  const handleSoftDelete = async (id) => {
    const token = localStorage.getItem("token");

    await axios.put(
      `http://localhost:5000/api/parties/soft-delete/${id}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    fetchParties();
  };

  return (
  <div className="settings-card">

    <div className="settings-header">
      <h2>⚙ Log Settings</h2>
      <p>Manage customers and suppliers safely with soft delete.</p>
    </div>

    {/* CUSTOMER SECTION */}
    <div className="settings-section">
      <h3>Customer Management</h3>

      <div className="settings-row">
        <select
          value={selectedCustomer}
          onChange={(e) => setSelectedCustomer(e.target.value)}
        >
          <option value="">Choose Customer...</option>
          {customers.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          className="danger-btn"
          disabled={!selectedCustomer}
          onClick={() => handleSoftDelete(selectedCustomer)}
        >
          Delete Customer
        </button>
      </div>
    </div>

    {/* SUPPLIER SECTION */}
    <div className="settings-section">
      <h3>Supplier Management</h3>

      <div className="settings-row">
        <select
          value={selectedSupplier}
          onChange={(e) => setSelectedSupplier(e.target.value)}
        >
          <option value="">Choose Supplier...</option>
          {suppliers.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>

        <button
          className="danger-btn"
          disabled={!selectedSupplier}
          onClick={() => handleSoftDelete(selectedSupplier)}
        >
          Delete Supplier
        </button>
      </div>
    </div>

  </div>
);

}

export default LogSettings;
