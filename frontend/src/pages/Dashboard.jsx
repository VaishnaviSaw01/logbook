import { useState, useEffect } from "react";
import axios from "axios";
import "./dashboard.css";
import {
  Users,
  Truck,
  IndianRupee,
  TrendingUp,
  Package,
  UserPlus,
  TrendingDown, 
  Wallet2
} from "lucide-react";
import { useNavigate } from "react-router-dom";


function Dashboard() {
const navigate = useNavigate();
const user = JSON.parse(localStorage.getItem("user"));
const [summary, setSummary] = useState({
  totalCustomers: 0,
  totalSuppliers: 0,
  totalReceived: 0,
  totalPaid: 0,
  totalPending: 0,
  totalPayable: 0
});
async function fetchDashboardData() {
  try {
    const token = localStorage.getItem("token");

    // Get all parties
    const { data: parties } = await axios.get(
      "/api/parties",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Get all transactions
    const { data: transactions } = await axios.get(
      "/api/transactions",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const customers = parties.filter(p => p.type === "CUSTOMER");
    const suppliers = parties.filter(p => p.type === "SUPPLIER");

    let totalReceived = 0;
    let totalPaid = 0;

    transactions.forEach(t => {
      if (t.party?.type === "CUSTOMER" && t.type === "CREDIT") {
        totalReceived += t.amount;
      }

      if (t.party?.type === "SUPPLIER" && t.type === "DEBIT") {
        totalPaid += t.amount;
      }
    });

    const totalPending = parties
  .filter(p => p.type === "CUSTOMER" && p.balance > 0)
  .reduce((acc, p) => acc + p.balance, 0);

const totalPayable = parties
  .filter(p => p.type === "SUPPLIER")
  .reduce((acc, p) => {
    return p.balance > 0 ? acc + p.balance : acc;
  }, 0);
    setSummary({
      totalCustomers: customers.length,
      totalSuppliers: suppliers.length,
      totalReceived,
      totalPaid,
      totalPending,
      totalPayable
    });

  } catch (error) {
    console.error(error);
  }
};

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="dashboard-container">

      {/* HEADER */}
      <div className="dashboard-header">
  <h2>
    Welcome Back{user?.name ? `, ${user.name}` : ""} 👋
  </h2>
  <p>Here is your business overview</p>
</div>


      {/* KPI CARDS ROW */}
     <div className="dashboard-grid">

  <div className="dash-card blue">
    <div className="dash-icon customers">
      <Users size={26} />
    </div>
    <h4>Total Customers</h4>
    <h2>{summary.totalCustomers}</h2>
  </div>

  <div className="dash-card yellow">
    <div className="dash-icon suppliers">
      <Truck size={26} />
    </div>
    <h4>Total Suppliers</h4>
    <h2>{summary.totalSuppliers}</h2>
  </div>

  <div className="dash-card green">
    <div className="dash-icon received">
      <TrendingUp size={26} />
    </div>
    <h4>Total Received</h4>
    <h2>₹{summary.totalReceived}</h2>
  </div>

  <div className="dash-card red">
    <div className="dash-icon paid">
      <TrendingDown size={26} />
    </div>
    <h4>Total Paid</h4>
    <h2>₹{summary.totalPaid}</h2>
  </div>

  <div className="dash-card p">
    <div className="dash-icon pending">
      <Wallet2 size={26} />
    </div>
    <h4>Total Pending</h4>
    <h2>₹{summary.totalPending}</h2>
  </div>

<div className="dash-card pink">
  <div className="dash-icon payable">
    <IndianRupee size={26} />
  </div>
  <h4>Total Payable</h4>
  <h2>₹{summary.totalPayable}</h2>
</div>
</div>

      {/* ACTION CARDS ROW */}
      <div className="quick-actions">

        <div className="action-card">
          <Package size={28} />
          <h3>Inventory</h3>
          <p>Manage stock & goods</p>
          <button onClick={() => navigate("/inventory")}>
  Open Inventory
</button>

        </div>

        <div className="action-card">
  <UserPlus size={28} />
  <h3>Staff Management</h3>
  <p>Add and manage staff</p>
  <button onClick={() => {user?.role === "ADMIN" && navigate("/staff")}}>
    Manage Staff
  </button>
</div>


      </div>

    </div>
  );
}

export default Dashboard;
