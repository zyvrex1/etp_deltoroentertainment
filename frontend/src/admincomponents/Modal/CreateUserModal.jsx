import React, { useState } from "react";
import { Icon } from "@iconify/react";
import "./CreateUserModal.css";
import {
  showSuccessAlert,
  showCancelConfirmAlert,
  showCreateConfirmAlert,
} from "../utils/sweetAlert";
import { useAuthContext } from "../hooks/useAuthContext";

const CreateUserModal = ({ isOpen, onClose, onUserCreated }) => {
  const { user } = useAuthContext();
  const [userType, setUserType] = useState("superadmin", "admin");
  const [formData, setFormData] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await showCreateConfirmAlert(
      "Create User?",
      `Are you sure you want to create a new ${userType} user?`,
    );
    if (!result.isConfirmed) return;

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        companyName: formData.companyName,
        industry: formData.industry,
        role: userType.toLowerCase(),
      };

      // Choose route based on logged-in user
      const route =
        user?.role === "superadmin"
          ? "/api/superadmin/create-user"
          : "/api/admin/create-user";

      const response = await fetch(route, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify(payload),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        data = { error: "Server did not return JSON. Check backend." };
      }

      if (!response.ok) throw new Error(data.error || "Failed to create user");

      await showSuccessAlert("User Created", data.message);

      // 🔥 THIS IS THE IMPORTANT PART
      if (onUserCreated) {
        onUserCreated();
      }

      onClose();
      setFormData({});
    } catch (error) {
      console.error("Error creating user:", error);
      alert(error.message);
    }
  };

  const handleCancel = async () => {
    const hasChanges = Object.values(formData).some(
      (val) => val && val.toString().trim() !== "",
    );
    if (hasChanges) {
      const result = await showCancelConfirmAlert();
      if (result.isConfirmed) onClose();
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  const renderFormFields = () => {
    switch (userType) {
      case "Promoter":
        return (
          <>
            <div className="add-user-form-row">
              <div className="add-user-form-group">
                <h6>First Name</h6>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName || ""}
                  onChange={handleChange}
                  placeholder="e.g. John"
                />
              </div>
              <div className="add-user-form-group">
                <h6>Last Name</h6>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName || ""}
                  onChange={handleChange}
                  placeholder="e.g. Doe"
                />
              </div>
              <div className="add-user-form-group">
                <h6>Email Address</h6>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  placeholder="john@example.com"
                />
              </div>
              <div className="add-user-form-group">
                <h6>Phone Number</h6>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
            <div className="add-user-form-row">
              <div className="add-user-form-group">
                <h6>Company Name</h6>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName || ""}
                  onChange={handleChange}
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div className="add-user-form-group">
                <h6>Industry</h6>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry || ""}
                  onChange={handleChange}
                  placeholder="e.g. Tech"
                />
              </div>
            </div>
          </>
        );
      case "Sponsor":
        return (
          <>
            <div className="add-user-form-row">
              <div className="add-user-form-group">
                <h6>First Name</h6>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName || ""}
                  onChange={handleChange}
                  placeholder="e.g. John"
                />
              </div>
              <div className="add-user-form-group">
                <h6>Last Name</h6>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName || ""}
                  onChange={handleChange}
                  placeholder="e.g. Doe"
                />
              </div>
              <div className="add-user-form-group">
                <h6>Email Address</h6>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  placeholder="john@example.com"
                />
              </div>
              <div className="add-user-form-group add-user-full-width">
                <h6>Phone Number</h6>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
            <div className="add-user-form-row">
              <div className="add-user-form-group">
                <h6>Company Name</h6>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName || ""}
                  onChange={handleChange}
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div className="add-user-form-group">
                <h6>Industry</h6>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry || ""}
                  onChange={handleChange}
                  placeholder="e.g. Tech"
                />
              </div>
            </div>
          </>
        );
      case "Admin":
      case "Customer":
      default:
        return (
          <>
            <div className="add-user-form-row">
              <div className="add-user-form-group">
                <h6>First Name</h6>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName || ""}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="add-user-form-group">
                <h6>LastName</h6>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName || ""}
                  onChange={handleChange}
                  placeholder="e.g. Doe"
                />
              </div>
              <div className="add-user-form-group">
                <h6>Email Address</h6>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  placeholder="john@example.com"
                />
              </div>
              <div className="add-user-form-group">
                <h6>Phone Number</h6>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="general-modal-overlay">
      <div className="general-createuser-modal-container">
        <div className="general-modal-header">
          <h3>Add New User</h3>
          <button className="close-btn" onClick={handleCancel}>
            <Icon icon="mdi:close" />
          </button>
        </div>

        <div className="modal-body">
          <div className="user-type-section">
            <h6 className="section-label">User Type</h6>
            <div className="user-type-grid">
              <button
                className={`type-card admin ${userType === "Admin" ? "active" : ""}`}
                onClick={() => setUserType("Admin")}
              >
                <Icon icon="mdi:shield-outline" width="20" />
                <span>Admin</span>
              </button>
              <button
                className={`type-card promoter ${userType === "Promoter" ? "active" : ""}`}
                onClick={() => setUserType("Promoter")}
              >
                <Icon icon="mdi:bullhorn-outline" width="20" />
                <span>Promoter</span>
              </button>
              <button
                className={`type-card sponsor ${userType === "Sponsor" ? "active" : ""}`}
                onClick={() => setUserType("Sponsor")}
              >
                <Icon icon="mdi:office-building" width="20" />
                <span>Sponsor</span>
              </button>
              <button
                className={`type-card customer ${userType === "Customer" ? "active" : ""}`}
                onClick={() => setUserType("Customer")}
              >
                <Icon icon="mdi:account-outline" width="20" />
                <span>Customer</span>
              </button>
            </div>
          </div>

          <form className="create-user-form" onSubmit={handleSubmit}>
            {renderFormFields()}

            <div className="add-user-info-banner">
              <div className="info-icon">
                <Icon icon="mdi:account-plus-outline" width="20" />
              </div>
              <div className="info-content">
                <h6>Account Invitation</h6>
                <p>
                  An email will be sent to the user with a temporary password.
                  They can log in and set a permanent password.
                </p>
              </div>
            </div>

            <div className="general-createuser-modal-footer">
              <button
                type="button"
                className="button cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button save-btn">
                Create User
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateUserModal;
