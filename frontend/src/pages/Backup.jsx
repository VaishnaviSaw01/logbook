import axios from "axios";
import { useState } from "react";
import "./settings.css";
function Backup() {
  const [downloading, setDownloading] = useState(false);

  const handleBackup = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(
        "/api/auth/backup",
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob"
        }
      );

      const blob = new Blob([response.data], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `logbook-backup-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error(error);

      // responseType "blob" means an error body also arrives as a Blob,
      // not parsed JSON — read it out manually to show the real reason
      // (e.g. "Access denied: role not allowed" for a non-admin).
      let message = "Backup failed";
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          message = JSON.parse(text)?.message || message;
        } catch {
          // ignore — fall back to the generic message
        }
      } else {
        message = error.response?.data?.message || message;
      }

      alert(message);
    } finally {
      setDownloading(false);
    }
  };


  return (
    <div className="settings-card">
      <h2>Backup</h2>

      <p>Download a full backup of your customers, suppliers, inventory, purchases, transactions, and staff as JSON. Admin only.</p>

      <button className="primary-btn" onClick={handleBackup} disabled={downloading}>
        {downloading ? "Preparing…" : "Download Backup"}
      </button>

    </div>
  );
}

export default Backup;
