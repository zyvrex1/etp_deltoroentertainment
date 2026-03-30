import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useAuthContext } from "../admincomponents/hooks/useAuthContext"
import "./settings.css";
import { showConfirmAlert, showSuccessAlert, showErrorAlert } from "./utils/sweetAlert";
import * as authService from "../services/authService";

const Settings = () => {
  const { user, dispatch } = useAuthContext();
  const [loading, setLoading] = useState(true); // ✅ Loading state
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    avatar: "",
  });

  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactor: false,
  });

  const [notifications, setNotifications] = useState({
    email: false,
    sms: false,
  });

  const [general, setGeneral] = useState({
    platformName: "",
    supportEmail: "",
    maintenanceMode: "disabled",
  });

  const [fees, setFees] = useState({
    platformFee: "",
    fixedFee: "",
    payoutSchedule: "weekly",
  });

  // ------------------ Fetch Profile & Settings ------------------
  const fetchSettings = async () => {
    if (!user?._id || !user?.token) return;

    try {
      // Profile
      const profileRes = await authService.getProfile(user.token);
      const profileData = profileRes.data;

      setProfile({
        firstName: profileData.firstName || "",
        lastName: profileData.lastName || "",
        email: profileData.email || "",
        phone: profileData.phone || "",
        avatar: profileData.avatar || "",
      });
      setNotifications({
        email: profileData.notifications?.email || false,
        sms: profileData.notifications?.sms || false,
      });
      setSecurity((prev) => ({
        ...prev,
        twoFactor: profileData.twoFactor || false,
      }));

      // General settings (optional)
      // const settingsRes = await fetch("/api/settings", {
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: `Bearer ${user.token}`,
      //   },
      // });
      // const settingsJson = await settingsRes.json();
      // if (settingsRes.ok) {
      //   setGeneral({
      //     platformName: settingsJson.platformName || "",
      //     supportEmail: settingsJson.supportEmail || "",
      //     maintenanceMode: settingsJson.maintenanceMode || "disabled",
      //   });
      //   setFees({
      //     platformFee: settingsJson.fees?.platformFee || "",
      //     fixedFee: settingsJson.fees?.fixedFee || "",
      //     payoutSchedule: settingsJson.fees?.payoutSchedule || "weekly",
      //   });
      // }
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      return showErrorAlert("File Too Large", "Please upload an image smaller than 2MB.");
    }
    
    const reader = new FileReader();
    reader.onloadend = () => setProfile((prev) => ({ ...prev, avatar: reader.result }));
    reader.readAsDataURL(file);
  };

  // ------------------ Save Profile ------------------
  const handleSaveProfile = async () => {
    const result = await showConfirmAlert("Save Profile?", "Are you sure you want to save your changes?", "Yes, Save", "Cancel");
    if (!result.isConfirmed) return;

    try {
      const response = await authService.updateProfile(profile, user.token);
      
      // Update user context and local storage
      const updatedUser = { ...user, ...response.data.user };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      dispatch({ type: "LOGIN", payload: updatedUser });

      await showSuccessAlert("Profile Saved", "Your profile has been updated successfully!");
    } catch (err) {
      console.error("Error saving profile:", err);
      showErrorAlert("Save Failed", err.response?.data?.error || "Failed to update profile.");
    }
  };

  const handleChangePassword = async () => {
  if (!security.currentPassword || !security.newPassword || !security.confirmPassword) {
    return alert("Please fill all password fields.");
  }

  if (security.newPassword !== security.confirmPassword) {
    return alert("New password and confirm password do not match.");
  }

  try {
    const res = await fetch("/api/user/security", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify({
        currentPassword: security.currentPassword,
        newPassword: security.newPassword,
        twoFactor: security.twoFactor
      }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Password updated successfully!");
      setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "", twoFactor: security.twoFactor });
    } else {
      alert(data.error || "Failed to change password.");
    }
  } catch (err) {
    console.error(err);
    alert("Server error while changing password.");
  }
};

  // ------------------ Save General Settings ------------------
  const handleSaveGeneral = async () => {
    const result = await showConfirmAlert(
      "Save General Settings?",
      "Are you sure?",
      "Yes",
      "Cancel"
    );
    if (!result.isConfirmed) return;

    try {
      const res = await fetch("/api/settings/general", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(general),
      });
      const json = await res.json();
      if (res.ok) {
        await showSuccessAlert("Settings Saved", "General settings updated!");
        setGeneral({ ...general, ...json.settings });
      }
    } catch (err) {
      console.error("Error saving general settings:", err);
    }
  };

  // ------------------ Update Fees ------------------
  const handleUpdateFees = async () => {
    const result = await showConfirmAlert(
      "Update Fees?",
      "Are you sure?",
      "Yes",
      "Cancel"
    );
    if (!result.isConfirmed) return;

    try {
      const res = await fetch("/api/settings/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(fees),
      });
      const json = await res.json();
      if (res.ok) {
        await showSuccessAlert("Fees Updated", "Fee structure updated!");
        setFees({ ...fees, ...json.settings.fees });
      }
    } catch (err) {
      console.error("Error updating fees:", err);
    }
  };

  if (loading) {
    return <div className="settings-container">Loading profile...</div>;
  }


  return (
    <div className="settings-container">
      {/* Header */}
      <div className="settings-header">
        <div>
          <h1>System Settings</h1>
          <p>Configure platform-wide settings and preferences.</p>
        </div>
      </div>

      <div className="settings-content">
        {/* Account Settings Card */}
        <div className="settings-card account-card">
          <h3>Account Settings</h3>

          <div className="account-form-section">
            <div className="profile-photo-section">
  <div className="settings-profile-avatar">
    {/* Avatar Image or Default Icon */}
    {profile.avatar ? (
      <img
        src={profile.avatar}
        alt="Avatar"
        className="avatar-img"
      />
    ) : (
      <span className="avatar-text">
        {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
      </span>
    )}

    {/* Camera Upload */}
    <div className="avatar-upload">
      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        onChange={handleAvatarChange}
        id="avatarInput"
        style={{ display: "none" }}
      />

      {/* Overlay label clickable */}
      <label htmlFor="avatarInput" className="camera-btn">
        <Icon icon="mdi:camera-outline" />
      </label>
    </div>
  </div>
</div>

            <div className="form-grid top-profile-grid">
              <div className="form-group full-name-group">
                <label className="small-body-text">First Name</label>
                <input
                  type="text"
                  value={profile.firstName}
                  className="input-field"
                  onChange={(e) =>
                    setProfile({ ...profile, firstName: e.target.value })
                  }
                />
              </div>
              <div className="form-group email-group">
                <label className="small-body-text">Last Name</label>
                <input
                  type="text"
                  value={profile.lastName}
                  className="input-field"
                  onChange={(e) =>
                    setProfile({ ...profile, lastName: e.target.value })
                  }
                />
              </div>
              <div className="form-group full-name-group">
                <label className="small-body-text">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  className="input-field"
                  onChange={(e) =>
                    setProfile({ ...profile, email: e.target.value })
                  }
                />
              </div>
              <div className="form-group email-group">
                <label className="small-body-text">Phone Number</label>
                <input
                  type="text"
                  value={profile.phone}
                  className="input-field"
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                />
              </div>
            </div>
            
          </div>
          <div className="section-divider"></div>


            <div className="account-actions">
            <button
              className="primary-button save-profile-btn"
              onClick={handleSaveProfile}
            >
              Save Profile
            </button>
          </div>

          <div className="section-divider"></div>

          {/* Security Section */}
          <div className="subsection security-section">
            <div className="subsection-header">
              <Icon icon="mdi:lock-outline" className="subsection-icon" />
              <h4>Security</h4>
            </div>

            <div className="form-grid password-grid">
              <div className="form-group">
                <label className="small-body-text">Current Password</label>
                <input
                  type="password"
                  value={security.currentPassword}
                  className="input-field"
                  onChange={(e) =>
                    setSecurity({ ...security, currentPassword: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="small-body-text">New Password</label>
                <input
                  type="password"
                  value={security.newPassword}
                  className="input-field"
                  onChange={(e) =>
                    setSecurity({ ...security, newPassword: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="small-body-text">Confirm Password</label>
                <input
                  type="password"
                  value={security.confirmPassword}
                  className="input-field"
                  onChange={(e) =>
                    setSecurity({ ...security, confirmPassword: e.target.value })
                  }
                />
              </div>
            </div>
                      

            {/* <div className="toggle-row two-factor-row">
              <div className="toggle-info">
                <h5>Two-Factor Authentication</h5>
                <p className="small-body-text">
                  Add an extra layer of security to your account
                </p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={security.twoFactor}
                  onChange={(e) =>
                    setSecurity({ ...security, twoFactor: e.target.checked })
                  }
                />
                <span className="slider round"></span>
              </label>
            </div> */}
          </div>

          <div className="section-divider"></div>

          {/* Notifications Section */}
          {/* <div className="subsection notifications-section">
            <div className="subsection-header">
              <Icon icon="mdi:bell-outline" className="subsection-icon" />
              <h4>Notifications</h4>
            </div>

            <div className="notification-toggles">
              <div className="toggle-row">
                <span className="regular-body-text">Email Notifications</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={notifications.email}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        email: e.target.checked,
                      })
                    }
                  />
                  <span className="slider round"></span>
                </label>
              </div>
              <div className="toggle-row">
                <span className="regular-body-text">SMS Notifications</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={notifications.sms}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        sms: e.target.checked,
                      })
                    }
                  />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          </div> */}

          {/* <div className="section-divider"></div> */}

          <div className="account-actions">
  <button
    className="primary-button save-password-btn"
    onClick={handleChangePassword}
  >
    Change Password
  </button>
</div>

          
        </div>

        <div className="bottom-grid">
          {/* General Configuration Card */}
          <div className="settings-card general-card">
            <h3>General Configuration</h3>
            <div className="form-stack">
              <div className="form-group">
                <label className="small-body-text">Platform Name</label>
                <input
                  type="text"
                  value={general.platformName}
                  className="input-field"
                  onChange={(e) =>
                    setGeneral({ ...general, platformName: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="small-body-text">Support Email</label>
                <input
                  type="email"
                  value={general.supportEmail}
                  className="input-field"
                  onChange={(e) =>
                    setGeneral({ ...general, supportEmail: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="small-body-text">Maintenance Mode</label>
                <div className="select-wrapper">
                  <select
                    value={general.maintenanceMode}
                    className="input-field"
                    onChange={(e) =>
                      setGeneral({
                        ...general,
                        maintenanceMode: e.target.value,
                      })
                    }
                  >
                    <option value="disabled">Disabled (Live)</option>
                    <option value="enabled">Enabled</option>
                  </select>
                  <Icon icon="mdi:chevron-down" className="select-icon" />
                </div>
              </div>
              <button
                className="primary-button save-changes-btn"
                onClick={handleSaveGeneral}
              >
                Save Changes
              </button>
            </div>
          </div>

          {/* Fees & Payments Card */}
          <div className="settings-card fees-card">
            <h3>Fees & Payments</h3>
            <div className="form-stack">
              <div className="form-group">
                <label className="small-body-text">Platform Fee (%)</label>
                <input
                  type="text"
                  value={fees.platformFee}
                  className="input-field"
                  onChange={(e) =>
                    setFees({ ...fees, platformFee: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="small-body-text">
                  Fixed Fee per Ticket ($)
                </label>
                <input
                  type="text"
                  value={fees.fixedFee}
                  className="input-field"
                  onChange={(e) =>
                    setFees({ ...fees, fixedFee: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="small-body-text">Payout Schedule</label>
                <div className="select-wrapper">
                  <select
                    value={fees.payoutSchedule}
                    className="input-field"
                    onChange={(e) =>
                      setFees({ ...fees, payoutSchedule: e.target.value })
                    }
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <Icon icon="mdi:chevron-down" className="select-icon" />
                </div>
              </div>
              <button
                className="primary-button update-fees-btn"
                onClick={handleUpdateFees}
              >
                Update Fees
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
