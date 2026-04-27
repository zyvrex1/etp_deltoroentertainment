import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import "./settings.css";
import "../admincomponents/modal/CreateUserModal.css";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { showConfirmAlert, showSuccessAlert, showErrorAlert } from "../utils/sweetAlert";
import { useAuthContext } from "../hooks/useAuthContext";
import * as authService from "../services/authService";

const Settings = () => {
    const { user, dispatch } = useAuthContext();
    const [loading, setLoading] = useState(true);

    const [profile, setProfile] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        avatar: "",
        notifications: {
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

    useEffect(() => {
        const fetchProfile = async () => {
            // Token check
            if (!user?.token) return;

            try {
                // Passing the token to the service
                const response = await authService.getProfile(user.token);
                const data = response.data;

                // Fix for the phone number display issue
                let formattedPhone = data.phone || "";
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
                    firstName: data.firstName || "",
                    lastName: data.lastName || "",
                    email: data.email || "",
                    phone: formattedPhone,
                    avatar: data.avatar || "",
                    notifications: {
                        userUpdates: data.notifications?.userUpdates !== false,
                        paymentReminders: data.notifications?.paymentReminders !== false,
                        announcements: data.notifications?.announcements !== false,
                        supportMessages: data.notifications?.supportMessages !== false
                    }
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

    const handleNotificationToggle = (field) => {
        setProfile(prev => ({
            ...prev,
            notifications: {
                ...prev.notifications,
                [field]: !prev.notifications[field]
            }
        }));
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

    const handleSaveProfile = async () => {
        if (!user?.token) return;

        const result = await showConfirmAlert(
            "Save Changes?",
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
                formData.append("notifications", JSON.stringify(profile.notifications));
                if (avatarFile) {
                    formData.append("avatar", avatarFile);
                }

                const response = await authService.updateProfile(formData, user.token);

                // Update user context and local storage
                const updatedUser = { ...user, ...response.data };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                dispatch({ type: "LOGIN", payload: updatedUser });

                await showSuccessAlert(
                    "Profile Updated",
                    "Your personal information has been saved successfully."
                );
                setAvatarFile(null);
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

    if (loading) {
        return <div className="as-settings-container">Loading...</div>;
    }

    return (
        <div className="as-settings-container">
            <div className="as-header">
                <div className="as-header-left">
                    <h1 className="as-title">Settings</h1>
                    <p>Manage your account settings and preferences.</p>
                </div>
            </div>

            <div className="as-main-grid">
                <div className="as-card">
                    <h4 className="as-card-title">Personal Information</h4>

                    <div className="as-avatar-section">
                        <div className="as-avatar-circle">
                            {profile.avatar ? (
                                <img src={profile.avatar} alt="Profile" className="as-avatar-image" />
                            ) : (
                                <span className="as-avatar-text">
                                    {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
                                </span>
                            )}
                            <label htmlFor="avatarInput" className="as-avatar-upload-overlay">
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

                    <div className="as-form-row">
                        <div className="as-form-group">
                            <label className="as-label">First Name</label>
                            <input
                                type="text"
                                className="as-input"
                                value={profile.firstName}
                                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                            />
                        </div>
                        <div className="as-form-group">
                            <label className="as-label">Last Name</label>
                            <input
                                type="text"
                                className="as-input"
                                value={profile.lastName}
                                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                            />
                        </div>
                    </div>
<div className="as-form-row">
                    <div className="as-form-group">
                        <label className="as-label">Email Address</label>
                        <input
                            type="email"
                            className="as-input"
                            value={profile.email}
                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        />
                    </div>

                    <div className="as-form-group">
                        <label className="as-label">Phone Number</label>
                        <PhoneInput
                            defaultCountry="ph"
                            value={profile.phone || ""}
                            onChange={(phone) => setProfile((prev) => ({ ...prev, phone }))}
                            inputClassName="as-input"
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
</div>




                    <button type="button" className="as-save-btn primary-button" onClick={handleSaveProfile}>
                        Save Changes
                    </button>
                </div>

                {/* PASSWORD CARD */}
                <div className="as-card">
                    <h4 className="as-card-title">Change Password</h4>

                    <div className="as-form-group">
                        <label className="as-label">Current Password</label>
                        <div className="as-input-wrapper">
                            <input
                                type={showCurrentPassword ? "text" : "password"}
                                className="as-input"
                                value={passwords.current}
                                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                            />
                            <button
                                type="button"
                                className="as-password-toggle"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                                <Icon icon={showCurrentPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"} width="20" />
                            </button>
                        </div>
                    </div>

                    <div className="as-form-group">
                        <label className="as-label">New Password</label>
                        <div className="as-input-wrapper">
                            <input
                                type={showNewPassword ? "text" : "password"}
                                className="as-input"
                                value={passwords.new}
                                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                            />
                            <button
                                type="button"
                                className="as-password-toggle"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                                <Icon icon={showNewPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"} width="20" />
                            </button>
                        </div>

                        <div className="as-password-criteria">
                            {getPasswordCriteria(passwords.new).map((crit, idx) => (
                                <div key={idx} className={`as-criteria-item ${crit.met ? "met" : ""}`}>
                                    <Icon
                                        icon={crit.met ? "mdi:check-circle" : "mdi:circle-outline"}
                                        width="14"
                                    />
                                    <span className="smaller-body-text">{crit.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="as-form-group">
                        <label className="as-label">Confirm New Password</label>
                        <div className="as-input-wrapper">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                className="as-input"
                                value={passwords.confirm}
                                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                            />
                            <button
                                type="button"
                                className="as-password-toggle"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                <Icon icon={showConfirmPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"} width="20" />
                            </button>
                        </div>
                    </div>

                    <button type="button" className="as-save-btn as-dark-btn" onClick={handleUpdatePassword}>
                        Update Password
                    </button>
                </div>

                {/* NOTIFICATION PREFERENCES CARD */}
                <div className="as-card as-notif-card">
                    <h4 className="as-card-title">Notification Preferences</h4>

                    <div className="as-notif-item">
                        <div className="as-notif-info">
                            <span className="as-notif-label">User Updates</span>
                            <p className="smaller-body-text text-muted">Receive updates about user signup</p>
                        </div>
                        <label className="as-toggle">
                            <input
                                type="checkbox"
                                checked={profile.notifications.userUpdates}
                                onChange={() => handleNotificationToggle('userUpdates')}
                            />
                            <span className="as-slider"></span>
                        </label>
                    </div>

                    <div className="as-notif-divider"></div>

                    <div className="as-notif-item">
                        <div className="as-notif-info">
                            <span className="as-notif-label">Payment Reminders</span>
                            <p className="smaller-body-text text-muted">Get notified about upcoming payments and invoices</p>
                        </div>
                        <label className="as-toggle">
                            <input
                                type="checkbox"
                                checked={profile.notifications.paymentReminders}
                                onChange={() => handleNotificationToggle('paymentReminders')}
                            />
                            <span className="as-slider"></span>
                        </label>
                    </div>

                    <div className="as-notif-divider"></div>

                    <div className="as-notif-item">
                        <div className="as-notif-info">
                            <span className="as-notif-label">Support & Dispute Messages</span>
                            <p className="smaller-body-text text-muted">Get notified when someone messages in support tickets</p>
                        </div>
                        <label className="as-toggle">
                            <input
                                type="checkbox"
                                checked={profile.notifications.supportMessages}
                                onChange={() => handleNotificationToggle('supportMessages')}
                            />
                            <span className="as-slider"></span>
                        </label>
                    </div>

                    <div className="as-notif-divider"></div>

                    <div className="as-notif-item">
                        <div className="as-notif-info">
                            <span className="as-notif-label">Message Notifications</span>
                            <p className="smaller-body-text text-muted">Receive news about new messages</p>
                        </div>
                        <label className="as-toggle">
                            <input
                                type="checkbox"
                                checked={profile.notifications.announcements}
                                onChange={() => handleNotificationToggle('announcements')}
                            />
                            <span className="as-slider"></span>
                        </label>
                    </div>

                    <button
                        type="button"
                        className="as-save-btn as-dark-btn as-notif-save-btn"
                        onClick={handleSaveProfile}
                    >
                        Save Preferences
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
