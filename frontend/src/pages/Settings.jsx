import "./settings.css";
import { useState } from "react";
import { Settings, Trash2, LifeBuoy, Download } from "lucide-react";

import LogSettings from "./LogSettings";
import RecycleBin from "./RecycleBin";
import HelpSupport from "./HelpSupport";
import Backup from "./Backup";

function SettingsPage() {
  const [activeTab, setActiveTab] = useState("log");

  return (
    <div className="settings-page">

      {/* LEFT MENU */}
      <div className="settings-left">

        <div 
          className={`settings-item ${activeTab === "log" ? "active" : ""}`}
          onClick={() => setActiveTab("log")}
        >
          <Settings size={18} />
          <span>Log Settings</span>
        </div>

        <div 
          className={`settings-item ${activeTab === "recycle" ? "active" : ""}`}
          onClick={() => setActiveTab("recycle")}
        >
          <Trash2 size={18} />
          <span>Recycle Bin</span>
        </div>

        <div 
          className={`settings-item ${activeTab === "help" ? "active" : ""}`}
          onClick={() => setActiveTab("help")}
        >
          <LifeBuoy size={18} />
          <span>Help & Support</span>
        </div>

        <div 
          className={`settings-item ${activeTab === "backup" ? "active" : ""}`}
          onClick={() => setActiveTab("backup")}
        >
          <Download size={18} />
          <span>Backup</span>
        </div>

      </div>

      {/* RIGHT CONTENT */}
      <div className="settings-right">
        {activeTab === "log" && <LogSettings />}
        {activeTab === "recycle" && <RecycleBin />}
        {activeTab === "help" && <HelpSupport />}
        {activeTab === "backup" && <Backup />}
      </div>

    </div>
  );
}

export default SettingsPage;
