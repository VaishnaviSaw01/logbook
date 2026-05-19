import axios from "axios";
import { useState, useEffect } from "react";
import { UserPlus, Trash2 } from "lucide-react";
import "./staff.css";

function Staff() {

  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    read: false,
    write: false,
    delete: false
  });
const fetchStaff = async () => {
  try {
    const { data } = await axios.get(
      "http://localhost:5000/api/staff",
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      }
    );

    setStaffList(data);

  } catch (error) {
    console.log("Failed to fetch staff");
  }
};
useEffect(() => {
  fetchStaff();
}, []);
  const handleAddStaff = async () => {
  try {
    const { data } = await axios.post(
      "http://localhost:5000/api/staff",
      {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        permissions: {
          read: formData.read,
          write: formData.write,
          delete: formData.delete
        }
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      }
    );

    setStaffList([...staffList, data]);

    setShowModal(false);

    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      read: false,
      write: false,
      delete: false
    });

  } catch (error) {
    alert(error.response?.data?.message || "Failed to add staff");
  }
};
const handleDeleteStaff = async (id) => {
  try {
    await axios.delete(
      `http://localhost:5000/api/staff/${id}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      }
    );

    setStaffList(staffList.filter(s => s._id !== id));
    setSelectedStaff(null);

  } catch (error) {
    alert("Failed to delete staff");
  }
};
const handleDeleteActivity = async (id) => {
  await axios.delete(
    `http://localhost:5000/api/staff/activity/${id}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    }
  );

  setSelectedStaff({
    ...selectedStaff,
    activity: selectedStaff.activity.filter(a => a._id !== id)
  });
};
  return (
    <div className="staff-layout">

      {/* LEFT */}
      <div className="staff-left">
        <h3>All Staff</h3>

  <div className="staff-scroll">
  {staffList.map((s) => (
    <div
      key={s._id}
      className="staff-card"
      onClick={() => setSelectedStaff(s)}
      style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
    >
      <div>
        <h4>{s.name}</h4>
        <p>{s.email}</p>
      </div>

      <Trash2
        size={18}
        style={{ color: "#dc2626", cursor: "pointer" }}
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteStaff(s._id);
        }}
      />
    </div>
  ))}
</div>

  <button
    className="staff-add-btn"
    onClick={() => setShowModal(true)}
  >
    + Add Staff
  </button>
      </div>

      {/* RIGHT */}
     <div className="staff-right">

  {selectedStaff ? (
    <>
      {/* STAFF HEADER CARD */}
      <div className="staff-header-card">
        <div className="staff-header-left">
          <h2>{selectedStaff.name}</h2>
          <p>{selectedStaff.email}</p>
        <p>{selectedStaff.phone}</p>
        
          <div className="permission-badge">
            Read: {selectedStaff.permissions?.read ? "Yes" : "No"} | 
            Write: {selectedStaff.permissions?.write ? "Yes" : "No"} | 
            Delete: {selectedStaff.permissions?.delete ? "Yes" : "No"}
          </div>
        </div>
      </div>

      {/* ACTIVITY CARDS */}
      {selectedStaff.activity?.map((log) => (
        <div key={log._id} className="activity-log-card">

          <div className="activity-top">
            <span className="activity-date">
              {new Date(log.createdAt).toLocaleDateString()}
            </span>

            <div className="activity-actions">
              <Trash2
                size={16}
                className="activity-delete"
                onClick={() => handleDeleteActivity(log._id)}
              />
            </div>
          </div>

          <div className="activity-body">
            <strong>{log.action}</strong>
          </div>

          <div className="activity-time">
            {new Date(log.createdAt).toLocaleTimeString()}
          </div>

        </div>
      ))}

    </>
  ) : (
    <div className="empty-state">
      Select a staff member
    </div>
  )}

</div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add Staff</h3>

            <input
              placeholder="Name"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />

            <input
              placeholder="Email"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />

            <input
              placeholder="Phone"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />

            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />

            <div className="permissions">
              <label>
                <input type="checkbox"
                  checked={formData.read}
                  onChange={e => setFormData({...formData, read: e.target.checked})}
                />
                Read
              </label>

              <label>
                <input type="checkbox"
                  checked={formData.write}
                  onChange={e => setFormData({...formData, write: e.target.checked})}
                />
                Write
              </label>

              <label>
                <input type="checkbox"
                  checked={formData.delete}
                  onChange={e => setFormData({...formData, delete: e.target.checked})}
                />
                Delete
              </label>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button onClick={handleAddStaff}>
                Save Staff
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Staff;
