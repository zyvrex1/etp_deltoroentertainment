import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import "./promotersettings.css";
import PromoterPayoutMethodModal from "./PromoterModal/PromoterPayoutMethodModal.jsx";
import { showConfirmAlert, showSuccessAlert, showErrorAlert } from "../admincomponents/utils/sweetAlert";
import { useAuthContext } from "../admincomponents/hooks/useAuthContext";
import * as authService from "../services/authService";

const PromoterSettings = () => {
  const { user, dispatch } = useAuthContext();
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    industry: "",
    avatar: ""
  });

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.token) return;
      try {
        const response = await authService.getProfile(user.token);
        setProfile({
          firstName: response.data.firstName || "",
          lastName: response.data.lastName || "",
          email: response.data.email || "",
          phone: response.data.phone || "",
          companyName: response.data.companyName || "",
          industry: response.data.industry || "",
          avatar: response.data.avatar || "",
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const getPasswordCriteria = (password) => {
    return [
      { label: "At least 8 characters", met: password.length >= 8 },
      { label: "One uppercase letter", met: /[A-Z]/.test(password) },
      { label: "One lowercase letter", met: /[a-z]/.test(password) },
      { label: "One number", met: /[0-9]/.test(password) },
      { label: "One special character", met: /[^A-Za-z0-9]/.test(password) },
    ];
  };

  const handleSaveProfile = async () => {
    if (!user?.token) return;

    const result = await showConfirmAlert(
      "Save Profile?",
      "Are you sure you want to update your profile information?",
      "Yes, Save",
      "Cancel"
    );

    if (result.isConfirmed) {
      try {
        const response = await authService.updateProfile(profile, user.token);
        
        // Update user context and local storage
        const updatedUser = { ...user, ...response.data.user };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        dispatch({ type: "LOGIN", payload: updatedUser });

        await showSuccessAlert(
          "Profile Saved",
          "Your profile has been saved successfully."
        );
      } catch (error) {
        showErrorAlert("Update Failed", error.response?.data?.error || "An error occurred while updating profile.");
      }
    }
  };

  const handleUpdatePassword = async () => {
    if (!user?.token) return;

    if (!passwords.current || !passwords.new || !passwords.confirm) {
      return showErrorAlert("Required Fields", "Please fill in all password fields.");
    }

    if (passwords.new !== passwords.confirm) {
      return showErrorAlert("Mismatch", "New password and confirmation do not match.");
    }

    const result = await showConfirmAlert(
      "Update Password?",
      "Are you sure you want to update your password?",
      "Yes, Update",
      "Cancel"
    );

    if (result.isConfirmed) {
      try {
        await authService.updatePassword({
          currentPassword: passwords.current,
          newPassword: passwords.new,
          confirmNewPassword: passwords.confirm
        }, user.token);

        await showSuccessAlert(
          "Password Updated",
          "Your password has been updated successfully."
        );
        setPasswords({ current: "", new: "", confirm: "" });
      } catch (error) {
        showErrorAlert("Update Failed", error.response?.data?.error || "An error occurred while updating password.");
      }
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB Limit
        return showErrorAlert("File Too Large", "Please upload an image smaller than 2MB.");
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, avatar: reader.result });
      };
      reader.readAsDataURL(file);
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
                {profile.avatar ? (
                  <img src={profile.avatar} alt="Profile" className="ps-avatar-image" />
                ) : (
                  <span className="ps-avatar-text">
                    {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
                  </span>
                )}
                <label htmlFor="avatarInput" className="ps-avatar-upload-overlay">
                  <Icon icon="mdi:camera" width="20" />
                </label>
              </div>
              <input
                type="file"
                id="avatarInput"
                hidden
                accept="image/*"
                onChange={handlePhotoChange}
              />
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

            {user?.role === 'promoter' && (
              <>
                <div className="ps-form-row">
                  <div className="ps-form-group">
                    <label className="ps-label">Company Name</label>
                    <input
                      type="text"
                      className="ps-input"
                      value={profile.companyName}
                      onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                    />
                  </div>
                  <div className="ps-form-group">
                    <label className="ps-label">Industry</label>
                    <input
                      type="text"
                      className="ps-input"
                      value={profile.industry}
                      onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            <button type="button" className="ps-save-btn primary-button" onClick={handleSaveProfile}>
              Save Changes
            </button>
          </div>

          {/* PASSWORD CARD */}
          <div className="ps-card">
            <h4 className="ps-card-title">Password</h4>

            <div className="ps-form-group">
              <label className="ps-label">Current Password</label>
              <div className="ps-input-wrapper">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  className="ps-input"
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                />
                <button
                  type="button"
                  className="ps-password-toggle"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  <Icon icon={showCurrentPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"} width="20" />
                </button>
              </div>
            </div>

            <div className="ps-form-group">
              <label className="ps-label">New Password</label>
              <div className="ps-input-wrapper">
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="ps-input"
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                />
                <button
                  type="button"
                  className="ps-password-toggle"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  <Icon icon={showNewPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"} width="20" />
                </button>
              </div>
              
              {/* Password Strength Indicators */}
              <div className="ps-password-criteria">
                {getPasswordCriteria(passwords.new).map((crit, idx) => (
                  <div key={idx} className={`ps-criteria-item ${crit.met ? "met" : ""}`}>
                    <Icon 
                      icon={crit.met ? "mdi:check-circle" : "mdi:circle-outline"} 
                      width="14" 
                    />
                    <span className="smaller-body-text">{crit.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="ps-form-group">
              <label className="ps-label">Confirm New Password</label>
              <div className="ps-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="ps-input"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                />
                <button
                  type="button"
                  className="ps-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Icon icon={showConfirmPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"} width="20" />
                </button>
              </div>
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
