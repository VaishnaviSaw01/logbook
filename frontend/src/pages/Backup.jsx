import axios from "axios";
import "./settings.css";
function Backup() {

  const handleBackup = async () => {
  try {
    const token = localStorage.getItem("token");

    const response = await axios.get(
      "/api/backup",
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

  } catch (error) {
    console.error(error);
    alert("Backup failed");
  }
};


  return (
    <div className="settings-card">
      <h2>Backup</h2>

      <p>Download full logbook backup.</p>

      <button className="primary-btn" onClick={handleBackup}>
  Download Backup
</button>

    </div>
  );
}

export default Backup;
