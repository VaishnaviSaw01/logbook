import Sidebar from "./Sidebar";
import ReminderPopup from "./ReminderPopup";
import "./layout.css";

function Layout({ children, setToken }) {
  return (
    <div className="layout-container">
      <Sidebar setToken={setToken} />
      <div className="layout-content">
        {children}
      </div>
      <ReminderPopup />
    </div>
  );
}

export default Layout;
