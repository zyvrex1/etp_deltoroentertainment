import React, { useState } from "react";
import { Icon } from "@iconify/react";
import "./promotersettings.css";
import PromoterPayoutMethodModal from "./PromoterModal/PromoterPayoutMethodModal.jsx";
import { showConfirmAlert, showSuccessAlert } from "../admincomponents/utils/sweetAlert";

const PromoterSettings = () => {
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);

  const [profile, setProfile] = useState({
    firstName: "Alex",
    lastName: "Thompson",
    email: "alex@eventpro.com",
    phone: "+1 (555) 123-4567",
  });

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: 1,
      type: "Visa",
      last4: "4242",
      expires: "12/25",
      isDefault: true,
      icon: "mdi:credit-card"
    },
    {
      id: 2,
      type: "Mastercard",
      last4: "8888",
      expires: "08/26",
      isDefault: false,
      icon: "mdi:credit-card"
    }
  ]);

  const teamMembers = [
    {
      id: 1,
      initials: "SJ",
      name: "Sarah Jenkins",
      email: "sarah@example.com",
      status: "Active",
      event: "TechStart Summit 2024",
    },
    {
      id: 2,
      initials: "SJ",
      name: "Sarah Jenkins",
      email: "sarah@example.com",
      status: "Active",
      event: "TechStart Summit 2024",
    },
    {
      id: 3,
      initials: "SJ",
      name: "Sarah Jenkins",
      email: "sarah@example.com",
      status: "Active",
      event: "TechStart Summit 2024",
    },
    {
      id: 4,
      initials: "SJ",
      name: "Sarah Jenkins",
      email: "sarah@example.com",
      status: "Active",
      event: "TechStart Summit 2024",
    },
    {
      id: 5,
      initials: "SJ",
      name: "Sarah Jenkins",
      email: "sarah@example.com",
      status: "Active",
      event: "TechStart Summit 2024",
    },
    {
      id: 6,
      initials: "SJ",
      name: "Sarah Jenkins",
      email: "sarah@example.com",
      status: "Active",
      event: "TechStart Summit 2024",
    }
  ];

  const handleSaveProfile = async () => {
    const result = await showConfirmAlert(
      "Save Profile?",
      "Are you sure you want to update your profile information?",
      "Yes, Save",
      "Cancel"
    );

    if (result.isConfirmed) {
      await showSuccessAlert(
        "Profile Saved",
        "Your profile has been saved successfully."
      );
    }
  };

  const handleUpdatePassword = async () => {
    const result = await showConfirmAlert(
      "Update Password?",
      "Are you sure you want to update your password?",
      "Yes, Update",
      "Cancel"
    );

    if (result.isConfirmed) {
      await showSuccessAlert(
        "Password Updated",
        "Your password has been updated successfully."
      );
      setPasswords({ current: "", new: "", confirm: "" });
    }
  };

  return (
    <div className="ps-settings-container">
      <div className="ps-header">
        <div className="ps-header-left">
          <h1 className="ps-title">Settings</h1>
        </div>
      </div>
      <div className="ps-main-grid">
        {/* LEFT COLUMN */}
        <div className="ps-column">
          {/* PERSONAL INFORMATION CARD */}
          <div className="ps-card">
            <h4 className="ps-card-title">Personal Information</h4>

            <div className="ps-avatar-section">
              <div className="ps-avatar-circle">
                <span className="ps-avatar-text">AT</span>
              </div>
              <button type="button" className="ps-change-photo-btn outlined-button">Change Photo</button>
            </div>

            <div className="ps-form-row">
              <div className="ps-form-group">
                <label className="ps-label">First Name</label>
                <input
                  type="text"
                  className="ps-input"
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                />
              </div>
              <div className="ps-form-group">
                <label className="ps-label">Last Name</label>
                <input
                  type="text"
                  className="ps-input"
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="ps-form-group">
              <label className="ps-label">Email Address</label>
              <input
                type="email"
                className="ps-input"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>

            <div className="ps-form-group">
              <label className="ps-label">Phone Number</label>
              <input
                type="text"
                className="ps-input"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>

            <button type="button" className="ps-save-btn primary-button" onClick={handleSaveProfile}>
              Save Changes
            </button>
          </div>

          {/* PASSWORD CARD */}
          <div className="ps-card">
            <h4 className="ps-card-title">Password</h4>

            <div className="ps-form-group">
              <label className="ps-label">Current Password</label>
              <input
                type="password"
                className="ps-input"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              />
            </div>

            <div className="ps-form-group">
              <label className="ps-label">New Password</label>
              <input
                type="password"
                className="ps-input"
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
              />
            </div>

            <div className="ps-form-group">
              <label className="ps-label">Confirm New Password</label>
              <input
                type="password"
                className="ps-input"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              />
            </div>

            <button type="button" className="ps-save-btn ps-dark-btn" onClick={handleUpdatePassword}>
              Update Password
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="ps-column">
          {/* PAYMENT METHODS CARD */}
          <div className="ps-card">
            <div className="ps-card-header-flex">
              <h4 className="ps-card-title m-0">Payment Methods</h4>
              <button className="ps-add-card-btn primary-button" onClick={() => setIsPayoutModalOpen(true)}>
                <Icon icon="mdi:plus" /> Add Card
              </button>
            </div>

            <div className="ps-payment-list">
              {paymentMethods.map((method) => (
                <div key={method.id} className="ps-payment-item">
                  <div className="ps-payment-icon">
                    <Icon icon={method.icon} width="24" />
                  </div>
                  <div className="ps-payment-info">
                    <div className="ps-payment-title-row">
                      <span className="ps-payment-type">{method.type} &bull;&bull;&bull;&bull; {method.last4}</span>
                      {method.isDefault && <span className="button-label ps-pill-default">Default</span>}
                    </div>
                    <span className="ps-payment-expires">Expires {method.expires}</span>
                  </div>
                  <div className="ps-payment-actions">
                    {!method.isDefault && <span className="ps-set-default-text smaller-body-text">Set as Default</span>}
                    <button className="ps-icon-btn"><Icon icon="mdi:trash-can-outline" width="20" color="#666" /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="ps-secure-storage-msg smaller-body-text">
              <strong>Secure Storage:</strong> Your payment information is encrypted and stored securely. We never store your full card number or CVV.
            </div>

            <div className="ps-payment-footer">
              <button className="ps-save-changes-black-btn button">
                <Icon icon="mdi:content-save" width="18" /> Save Changes
              </button>
            </div>
          </div>

          {/* TEAM MEMBERS CARD */}
          <div className="ps-card">
            <h4 className="ps-card-title">Team Members</h4>
            <div className="ps-team-list">
              {teamMembers.map((member) => (
                <div key={member.id} className="ps-team-item">
                  <div className="ps-team-item-left">
                    <div className="ps-team-avatar">{member.initials}</div>
                    <div className="ps-team-details">
                      <h5 className="ps-team-name">{member.name}</h5>
                      <span className="ps-team-email smaller-body-text">{member.email}</span>
                    </div>
                  </div>
                  <div className="ps-team-item-right">
                    <span className="button-label ps-pill-active">{member.status}</span>
                    <span className="ps-team-event small-body-text">{member.event}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <PromoterPayoutMethodModal
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
      />
    </div>
  );
};

export default PromoterSettings;
