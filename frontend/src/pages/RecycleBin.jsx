import axios from "axios";
import { useEffect, useState } from "react";
import "./settings.css";
function RecycleBin() {

  const [deletedParties, setDeletedParties] = useState([]);

  useEffect(() => {
    fetchDeleted();
  }, []);

  const fetchDeleted = async () => {
    const token = localStorage.getItem("token");

    const { data } = await axios.get(
      "http://localhost:5000/api/parties/deleted",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setDeletedParties(data);
  };

  const handleRestore = async (id) => {
    const token = localStorage.getItem("token");

    await axios.put(
      `http://localhost:5000/api/parties/restore/${id}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    fetchDeleted();
  };

  const handlePermanentDelete = async (id) => {
    const token = localStorage.getItem("token");

    await axios.delete(
      `http://localhost:5000/api/parties/permanent/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    fetchDeleted();
  };

  return (
    <div className="settings-card">

      <h2>Recycle Bin</h2>

      {deletedParties.length === 0 && <p>No deleted records</p>}

      {deletedParties.map(p => (
        <div key={p._id} className="settings-row">
  <span>{p.name} ({p.type})</span>

  <div className="action-group">
    <button className="primary-btn" onClick={()=>handleRestore(p._id)}>
      Restore
    </button>

    <button 
      className="danger-btn"
      onClick={()=>handlePermanentDelete(p._id)}
    >
      Delete Permanently
    </button>
  </div>
</div>

      ))}

    </div>
  );
}

export default RecycleBin;
