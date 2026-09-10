import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Truck,
  ArrowLeftRight,
  Settings,
  LogOut,
  Package,
  UserCog
} from "lucide-react";
import "./sidebar.css";
function Sidebar({ setToken }) {
  const navigate = useNavigate();
const user = JSON.parse(localStorage.getItem("user"));
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null); 

    navigate("/login");
  };

  return (
   <div className="sidebar">

  {/* LOGO SECTION */}
<div className="logo-section">
  <h1 className="logo-text">
    Log<span>Book</span>
  </h1>
</div>

<div
  style={{
    fontSize: "12px",
    textAlign: "center",
    marginTop: "6px",
    padding: "4px 8px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "6px",
    marginBottom: "10px"
  }}
>
  {user?.name} ({user?.role})
</div>
  {/* MENU ITEMS */}
  <div className="menu">

  <NavLink to="/" className="menu-item">
  <LayoutDashboard size={18} />
  <span>Dashboard</span>
</NavLink>

  <NavLink to="/Customers" className="menu-item">
    <Users size={18} />
    <span>Customers</span>
  </NavLink>

  <NavLink to="/Suppliers" className="menu-item">
    <Truck size={18} />
    <span>Suppliers</span>
  </NavLink>

  <NavLink to="/Transactions" className="menu-item">
    <ArrowLeftRight size={18} />
    <span>Transactions</span>
  </NavLink>

  <NavLink to="/inventory" className="menu-item">
    <Package size={18} />
    <span>Inventory</span>
  </NavLink>

  {user?.role === "ADMIN" && (
    <NavLink to="/staff" className="menu-item">
      <UserCog size={18} />
      <span>Staff</span>
    </NavLink>
  )}

  <NavLink to="/Settings" className="menu-item">
    <Settings size={18} />
    <span>Settings</span>
  </NavLink>

</div>


  {/* LOGOUT */}
  <button className="logout-btn" onClick={handleLogout}>
  <LogOut size={18} />
  <span>Logout</span>
</button>


</div>

  );
}

export default Sidebar;
