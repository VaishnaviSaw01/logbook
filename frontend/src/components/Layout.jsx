import Sidebar from "./Sidebar";
import "./layout.css";

function Layout({ children, setToken }) {
  return (
    <div className="layout-container">
      <Sidebar setToken={setToken} />
      <div className="layout-content">
        {children}
      </div>
    </div>
  );
}

export default Layout;
