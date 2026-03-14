import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import "./AssignAdmin.css";

const AssignAdmin = ({ isOpen, onClose, onAssign, ticket }) => {
  const admins = [
    { id: "robert_chen", name: "Robert Chen", role: "Support" },
    { id: "michael_brown", name: "Michael Brown", role: "Manager" },
    { id: "sophia_garcia", name: "Sophia Garcia", role: "Billing" },
  ];

  const [selectedAdmin, setSelectedAdmin] = useState("robert_chen");

  useEffect(() => {
    if (isOpen && ticket) {
      if (ticket.assignedTo === "Michael Brown") setSelectedAdmin("michael_brown");
      else if (ticket.assignedTo === "Sophia Garcia") setSelectedAdmin("sophia_garcia");
      else setSelectedAdmin("robert_chen"); // default
    }
  }, [isOpen, ticket]);

  if (!isOpen) return null;

  const handleAssign = () => {
    if (onAssign) {
      onAssign(selectedAdmin);
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
            Select an admin to assign to this support ticket.
          </p>

          <div className="assign-admin-field">
            <h6 htmlFor="admin-select">Admin</h6>
            <div className="assign-admin-select-wrapper">
              <select
                id="admin-select"
                value={selectedAdmin}
                onChange={(e) => setSelectedAdmin(e.target.value)}
              >
                {admins.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.name} — {admin.role}
                  </option>
                ))}
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
