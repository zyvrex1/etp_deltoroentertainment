import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import "./promotersettings.css";
import PromoterPayoutMethodModal from "./PromoterModal/PromoterPayoutMethodModal.jsx";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { showConfirmAlert, showSuccessAlert, showErrorAlert } from "../utils/sweetAlert";
import { useAuthContext } from "../hooks/useAuthContext";
import * as authService from "../services/authService";

const PromoterSettings = () => {
  const { user, dispatch } = useAuthContext();
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    companyName: user?.companyName || "",
    industry: user?.industry || "",
    avatar: user?.avatar || "",
    notifications: {
      email: true,
      sms: false,
      userUpdates: true,
      paymentReminders: true,
      announcements: true,
      supportMessages: true
    }
  });
  const [avatarFile, setAvatarFile] = useState(null);

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [payoutMethods, setPayoutMethods] = useState(user?.paymentMethods || []);
  const [visibleMethods, setVisibleMethods] = useState(new Set());

  const toggleMethodVisibility = (id) => {
    setVisibleMethods(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const [teamMembers, setTeamMembers] = useState([]);
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.token) return;
      try {
        const response = await authService.getProfile(user.token);
        const profileData = response.data;

        // Fix for the phone number display issue
        let formattedPhone = profileData.phone || "";
        if (formattedPhone && !formattedPhone.startsWith('+')) {
          // If it's a local number like 0908..., replace 0 with +63
          if (formattedPhone.startsWith('0')) {
            formattedPhone = `+63${formattedPhone.substring(1)}`;
          } else {
            // If it's 63908..., just add the +
            formattedPhone = `+${formattedPhone}`;
          }
        }

        setProfile({
          firstName: profileData.firstName || "",
          lastName: profileData.lastName || "",
          email: profileData.email || "",
          phone: formattedPhone,
          companyName: profileData.companyName || "",
          industry: profileData.industry || "",
          avatar: profileData.avatar || "",
          notifications: {
            email: profileData.notifications?.email !== false,
            sms: profileData.notifications?.sms === true,
            userUpdates: profileData.notifications?.userUpdates !== false,
            paymentReminders: profileData.notifications?.paymentReminders !== false,
            announcements: profileData.notifications?.announcements !== false,
            supportMessages: profileData.notifications?.supportMessages !== false
          }
        });
        if (profileData.paymentMethods) {
          setPayoutMethods(profileData.paymentMethods);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchTeamMembers = async () => {
      if (!user?.token) return;
      try {
        const response = await fetch(`${backendUrl}/api/events`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const events = await response.json();

        if (!Array.isArray(events)) return;

        let members = [];

        const isOnline = (lastActive) => {
          if (!lastActive) return false;
          const activeDate = new Date(lastActive);
          const now = new Date();
          // Consider online if active within the last 5 minutes (300000 ms)
          return (now - activeDate) < 5 * 60 * 1000;
        };

        events.forEach(event => {
          const eventTitle = event.title || "Unknown Event";

          if (event.createdBy && event.createdBy._id !== user._id) {
            const onlineStatus = isOnline(event.createdBy.lastActive) ? "Active" : "Offline";
            members.push({
              id: `${event.createdBy._id}-${event._id}-creator`,
              initials: `${event.createdBy.firstName?.[0] || ""}${event.createdBy.lastName?.[0] || ""}`.toUpperCase(),
              name: `${event.createdBy.firstName || ""} ${event.createdBy.lastName || ""}`.trim(),
              email: event.createdBy.email || "",
              status: onlineStatus,
              event: eventTitle,
            });
          }

          if (event.assignedPromoters && Array.isArray(event.assignedPromoters)) {
            event.assignedPromoters.forEach(p => {
              if (p._id !== user._id) {
                const onlineStatus = isOnline(p.lastActive) ? "Active" : "Offline";
                members.push({
                  id: `${p._id}-${event._id}-promoter`,
                  initials: `${p.firstName?.[0] || ""}${p.lastName?.[0] || ""}`.toUpperCase(),
                  name: `${p.firstName || ""} ${p.lastName || ""}`.trim(),
                  email: p.email || "",
                  status: onlineStatus,
                  event: eventTitle,
                });
              }
            });
          }
        });

        setTeamMembers(members);
      } catch (error) {
        console.error("Error fetching team members:", error);
      }
    };

    fetchProfile();
    fetchTeamMembers();
  }, [user, backendUrl]);

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
        const formData = new FormData();
        formData.append("firstName", profile.firstName);
        formData.append("lastName", profile.lastName);
        formData.append("email", profile.email);
        formData.append("phone", profile.phone);
        if (profile.companyName) formData.append("companyName", profile.companyName);
        if (profile.industry) formData.append("industry", profile.industry);
        formData.append("notifications", JSON.stringify(profile.notifications));

        if (avatarFile) {
          formData.append("avatar", avatarFile);
        }

        const response = await authService.updateProfile(formData, user.token);
        const updatedData = response.data.user || response.data;

        // Update user context and local storage
        const updatedUser = { ...user, ...updatedData };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        dispatch({ type: "LOGIN", payload: updatedUser });

        // Sync local profile state with server response (important for avatar URLs)
        setProfile(prev => ({
          ...prev,
          ...updatedData,
          notifications: {
            ...prev.notifications,
            ...updatedData.notifications
          }
        }));

        await showSuccessAlert(
          "Profile Saved",
          "Your profile has been saved successfully."
        );
        setAvatarFile(null); // Clear selected file after success
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

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNotificationToggle = (field) => {
    setProfile(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: !prev.notifications[field]
      }
    }));
  };

  const handleSavePayoutSettings = async (updatedMethods = payoutMethods) => {
    if (!user?.token) return;

    try {
      const formData = new FormData();
      formData.append("paymentMethods", JSON.stringify(updatedMethods));

      const response = await authService.updateProfile(formData, user.token);
      const updatedUser = { ...user, ...response.data };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      dispatch({ type: "LOGIN", payload: updatedUser });
      setPayoutMethods(response.data.paymentMethods || []);

      await showSuccessAlert("Payout Settings Saved", "Your payout methods have been updated.");
    } catch (error) {
      console.error("Save Error:", error);
      showErrorAlert("Update Failed", error.response?.data?.error || error.message || "Failed to save payout methods.");
    }
  };

  const handleAddPayoutMethod = (newMethod) => {
    const updated = [...payoutMethods, { ...newMethod, id: Date.now() }];
    // Ensure only one default exists
    if (newMethod.isDefault) {
      updated.forEach(m => {
        if (m.id !== updated[updated.length - 1].id) m.isDefault = false;
      });
    }
    setPayoutMethods(updated);
    handleSavePayoutSettings(updated);
  };

  const handleRemovePayoutMethod = async (id) => {
    const result = await showConfirmAlert(
      "Remove Method?",
      "Are you sure you want to remove this payout method?",
      "Yes, Remove",
      "Cancel"
    );

    if (result.isConfirmed) {
      const updated = payoutMethods.filter(m => (m.id || m._id) !== id);
      setPayoutMethods(updated);
      handleSavePayoutSettings(updated);
    }
  };

  const handleSetDefaultMethod = (id) => {
    // Find the current method to see its state
    const currentMethod = payoutMethods.find(m => (m.id || m._id) === id);
    const wasDefault = currentMethod?.isDefault;

    const updated = payoutMethods.map(m => {
      const isTarget = (m.id || m._id) === id;
      if (isTarget) {
        return { ...m, isDefault: !wasDefault };
      }
      return { ...m, isDefault: false }; // Only one default allowed
    });

    setPayoutMethods(updated);
    handleSavePayoutSettings(updated);
  };

  if (loading) {
    return (
      <div className="ps-settings-container d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="ps-loader-wrapper text-center">
          <Icon icon="line-md:loading-twotone-loop" width="48" height="48" className="mb-2" />
          <p className="text-secondary">Loading settings...</p>
        </div>
      </div>
    );
  }

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
              <PhoneInput
                defaultCountry="us"
                value={profile.phone || ""}
                onChange={(phone) => setProfile((prev) => ({ ...prev, phone }))}
                inputClassName="ps-input"
                className="phone-input-container"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0',
                  border: '1px solid var(--color-black-tertiary)',
                  borderRadius: '6px'
                }}
                inputStyle={{
                  border: 'none',
                  padding: '10px 12px',
                  outline: 'none',
                  borderRadius: '0',
                  flex: 1,
                }}
                buttonStyle={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  boxShadow: 'none',
                  color: '#64748b'
                }}
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
              <h4 className="ps-card-title m-0">Payout Methods</h4>
              <button className="ps-add-card-btn primary-button" onClick={() => setIsPayoutModalOpen(true)}>
                <Icon icon="mdi:plus" /> Add Method
              </button>
            </div>

            <div className="ps-payout-list">
              {payoutMethods.length === 0 ? (
                <div className="ps-empty-payment text-center py-4">
                  <p className="smaller-body-text text-secondary">No payout methods added yet.</p>
                </div>
              ) : (
                payoutMethods.map((method) => (
                  <div key={method.id || method._id} className="ps-payout-item">
                    <div className="ps-payout-icon">
                      <Icon icon={method.icon || "mdi:credit-card"} width="24" />
                    </div>
                    <div className="ps-payout-info">
                      <div className="ps-payout-title-row">
                        <span className="ps-payout-type">{method.type}</span>
                      </div>
                      <span className="ps-payout-detail regular-body-text text-black d-block">
                        {visibleMethods.has(method.id || method._id)
                          ? (method.cardNumber || method.accountNumber || method.paypalEmail || method.last4)
                          : '•••• •••• ••••'}
                      </span>
                      <span className="ps-payout-expires d-block mt-1">Expires: {method.expires}</span>
                    </div>
                    <div className="ps-payout-actions">
                      <button
                        className="ps-set-default-btn p-0 border-0 bg-transparent"
                        onClick={() => handleSetDefaultMethod(method.id || method._id)}
                      >
                        <span className={`smaller-body-text ${method.isDefault ? 'button-label ps-pill-default px-2 py-1' : 'ps-set-default-text'}`}>
                          {method.isDefault ? "Default" : "Set as Default"}
                        </span>
                      </button>
                      <button
                        className="ps-icon-btn"
                        onClick={() => toggleMethodVisibility(method.id || method._id)}
                        title={visibleMethods.has(method.id || method._id) ? "Hide Details" : "Show Details"}
                      >
                        <Icon
                          icon={visibleMethods.has(method.id || method._id) ? "mdi:eye-off-outline" : "mdi:eye-outline"}
                          width="20"
                          color="#666"
                        />
                      </button>
                      <button
                        className="ps-icon-btn"
                        onClick={() => handleRemovePayoutMethod(method.id || method._id)}
                      >
                        <Icon icon="mdi:trash-can-outline" width="20" color="#666" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="ps-secure-storage-msg smaller-body-text">
              <strong>Secure Storage:</strong> Your payout information is encrypted and stored securely. We never store your full card number or CVV.
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
                    <span className={`button-label ${member.status === 'Active' ? 'ps-pill-active' : 'ps-pill-offline'}`}>{member.status}</span>
                    <span className="ps-team-event small-body-text">{member.event}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* NOTIFICATION PREFERENCES CARD */}
          <div className="ps-card mt-4">
            <h4 className="ps-card-title">Notification Preferences</h4>

            <div className="ps-notif-item">
              <div className="ps-notif-info">
                <span className="ps-notif-label">Email Notifications</span>
                <p className="smaller-body-text text-muted">Receive updates via email</p>
              </div>
              <label className="ps-toggle">
                <input
                  type="checkbox"
                  checked={profile.notifications.email}
                  onChange={() => handleNotificationToggle('email')}
                />
                <span className="ps-slider"></span>
              </label>
            </div>

            <div className="ps-notif-divider"></div>

            <div className="ps-notif-item">
              <div className="ps-notif-info">
                <span className="ps-notif-label">Event Announcements</span>
                <p className="smaller-body-text text-muted">Get notified about new events</p>
              </div>
              <label className="ps-toggle">
                <input
                  type="checkbox"
                  checked={profile.notifications.announcements}
                  onChange={() => handleNotificationToggle('announcements')}
                />
                <span className="ps-slider"></span>
              </label>
            </div>

            <div className="ps-notif-divider"></div>

            <div className="ps-notif-item">
              <div className="ps-notif-info">
                <span className="ps-notif-label">Payout Alerts</span>
                <p className="smaller-body-text text-muted">Updates on revenue and payouts</p>
              </div>
              <label className="ps-toggle">
                <input
                  type="checkbox"
                  checked={profile.notifications.paymentReminders}
                  onChange={() => handleNotificationToggle('paymentReminders')}
                />
                <span className="ps-slider"></span>
              </label>
            </div>

            <div className="ps-notif-divider"></div>

            <div className="ps-notif-item">
              <div className="ps-notif-info">
                <span className="ps-notif-label">Support Messages</span>
                <p className="smaller-body-text text-muted">Get notified on support ticket replies</p>
              </div>
              <label className="ps-toggle">
                <input
                  type="checkbox"
                  checked={profile.notifications.supportMessages}
                  onChange={() => handleNotificationToggle('supportMessages')}
                />
                <span className="ps-slider"></span>
              </label>
            </div>

            <button
              type="button"
              className="ps-save-btn ps-dark-btn mt-4"
              onClick={handleSaveProfile}
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>

      <PromoterPayoutMethodModal
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        onAdd={handleAddPayoutMethod}
      />
    </div>
  );
};

export default PromoterSettings;
