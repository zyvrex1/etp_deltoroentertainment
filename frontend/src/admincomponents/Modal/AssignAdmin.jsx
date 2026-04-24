import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import "./AssignAdmin.css";
import { useAuthContext } from "../../hooks/useAuthContext";

const AssignAdmin = ({ isOpen, onClose, onAssign, ticket }) => {
  const { user: currentUser } = useAuthContext();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState("");

  useEffect(() => {
    const fetchAdmins = async () => {
      if (!currentUser?.token) return;
      setLoading(true);
      try {
        const response = await fetch("/api/admin/users", {
          headers: {
            "Authorization": `Bearer ${currentUser.token}`,
          },
        });
        const json = await response.json();
        if (response.ok) {
          // Filter for admins and superadmins
          const adminUsers = json.filter(u => u.role === "admin" || u.role === "superadmin");
          setAdmins(adminUsers);
          
          if (adminUsers.length > 0) {
            setSelectedAdmin(prev => prev || adminUsers[0]._id);
          }
        }
      } catch (err) {
        console.error("Error fetching admins:", err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchAdmins();
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (isOpen && ticket && admins.length > 0) {
      const match = admins.find(a => `${a.firstName} ${a.lastName}` === ticket.assignedTo);
      if (match) setSelectedAdmin(match._id);
    }
  }, [isOpen, ticket, admins]);

  if (!isOpen) return null;

  const handleAssign = () => {
    if (onAssign && selectedAdmin) {
      const admin = admins.find(a => a._id === selectedAdmin);
      if (admin) {
        onAssign(`${admin.firstName} ${admin.lastName}`, admin._id);
      }
    }
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="assign-admin-overlay"
      role="dialog"
      aria-modal="true"
      onClick={handleOverlayClick}
    >
      <div className="assign-admin-container">
        <div className="assign-admin-header">
          <h3>Assign Admin</h3>
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon icon="mdi:close" />
          </button>
        </div>

        <div className="assign-admin-body">
          <p className="small-body-text instructions">
            Select an admin to assign to this support ticket. Only accounts with admin roles are listed here.
          </p>

          <div className="assign-admin-field">
            <h6 htmlFor="admin-select">Admin</h6>
            <div className="assign-admin-select-wrapper">
              <select
                id="admin-select"
                value={selectedAdmin}
                onChange={(e) => setSelectedAdmin(e.target.value)}
                disabled={loading || admins.length === 0}
              >
                {loading ? (
                  <option>Loading admins...</option>
                ) : admins.length === 0 ? (
                  <option>No admins found</option>
                ) : (
                  admins.map((admin) => (
                    <option key={admin._id} value={admin._id}>
                      {admin.firstName} {admin.lastName} — {admin.role.charAt(0).toUpperCase() + admin.role.slice(1)}
                    </option>
                  ))
                )}
              </select>
              <Icon icon="mdi:chevron-down" className="select-chevron" />
            </div>
          </div>
        </div>

        <div className="assign-admin-footer">
          <button
            type="button"
            className="outlined-button cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="primary-button assign-btn"
            onClick={handleAssign}
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignAdmin;
