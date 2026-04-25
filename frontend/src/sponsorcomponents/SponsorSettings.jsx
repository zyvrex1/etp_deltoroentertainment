import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { showSuccessAlert, showConfirmAlert, showErrorAlert } from '../utils/sweetAlert';
import { useAuthContext } from '../hooks/useAuthContext';
import * as authService from '../services/authService';
import './SponsorSettings.css';
import SponsorAddPaymentMethod from './SponsorModal/SponsorAddPaymentMethod';

export default function SponsorSettings() {
    const { user, dispatch } = useAuthContext();
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const [profile, setProfile] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        companyName: "",
        industry: "",
        avatar: "",
        website: "https://techcorp.com",
        companyDescription: "Leading provider of enterprise software solutions..."
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

    // Mock payment methods for demonstration
    const paymentMethods = [
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
    ];

    // Sync with User model notifications
    const [notifications, setNotifications] = useState({
        email: true,
        sms: false,
        userUpdates: true,
        paymentReminders: true,
        announcements: true,
        supportMessages: true
    });

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
                    website: response.data.website || "https://techcorp.com",
                    companyDescription: response.data.companyDescription || "Leading provider of enterprise software solutions..."
                });
                if (response.data.notifications) {
                    setNotifications({
                        email: response.data.notifications.email !== false,
                        sms: response.data.notifications.sms === true,
                        userUpdates: response.data.notifications.userUpdates !== false,
                        paymentReminders: response.data.notifications.paymentReminders !== false,
                        announcements: response.data.notifications.announcements !== false,
                        supportMessages: response.data.notifications.supportMessages !== false
                    });
                }
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
                if (profile.website) formData.append("website", profile.website);
                if (profile.companyDescription) formData.append("companyDescription", profile.companyDescription);
                formData.append("notifications", JSON.stringify(notifications));
                
                if (avatarFile) {
                    formData.append("avatar", avatarFile);
                }

                const response = await authService.updateProfile(formData, user.token);
                
                // Update user context and local storage
                const updatedUser = { ...user, ...response.data };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                dispatch({ type: "LOGIN", payload: updatedUser });

                await showSuccessAlert("Saved", "Your profile has been saved successfully.");
                setAvatarFile(null); // Clear selected file after success
            } catch (error) {
                showErrorAlert("Update Failed", error.response?.data?.error || "Failed to update profile.");
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

    const handleNotificationChange = (key) => {
        setNotifications(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    return (
        <div className="ss-settings-container">
            <div className="ss-header">
                <div className="ss-header-left">
                    <h1 className="ss-title">Settings</h1>
                </div>
            </div>

            <div className="ss-main-grid">
                {/* LEFT COLUMN */}
                <div className="ss-column">
                    {/* PERSONAL INFORMATION CARD */}
                    <div className="ss-card">
                        <h4 className="ss-card-title">Personal Information</h4>

                        <div className="ss-avatar-section">
                            <div className="ss-avatar-circle">
                                {profile.avatar ? (
                                    <img src={profile.avatar} alt="Profile" className="ss-avatar-image" />
                                ) : (
                                    <span className="ss-avatar-text">
                                        {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
                                    </span>
                                )}
                                <label htmlFor="avatarInput" className="ss-avatar-upload-overlay">
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

                        <div className="ss-form-row">
                            <div className="ss-form-group">
                                <label className="ss-label">First Name</label>
                                <input
                                    type="text"
                                    className="ss-input"
                                    value={profile.firstName}
                                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                                />
                            </div>
                            <div className="ss-form-group">
                                <label className="ss-label">Last Name</label>
                                <input
                                    type="text"
                                    className="ss-input"
                                    value={profile.lastName}
                                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="ss-form-group">
                            <label className="ss-label">Email Address</label>
                            <input
                                type="email"
                                className="ss-input"
                                value={profile.email}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                            />
                        </div>

                        <div className="ss-form-group">
                            <label className="ss-label">Phone Number</label>
                            <input
                                type="text"
                                className="ss-input"
                                value={profile.phone}
                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            />
                        </div>

                        <div className="ss-form-row">
                            <div className="ss-form-group">
                                <label className="ss-label">Company Name</label>
                                <input
                                    type="text"
                                    className="ss-input"
                                    value={profile.companyName}
                                    onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                                />
                            </div>
                            <div className="ss-form-group">
                                <label className="ss-label">Industry</label>
                                <select 
                                    className="ss-input ss-select" 
                                    value={profile.industry} 
                                    onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                                >
                                    <option value="">Select Industry</option>
                                    <option value="Technology">Technology</option>
                                    <option value="Healthcare">Healthcare</option>
                                    <option value="Finance">Finance</option>
                                    <option value="Education">Education</option>
                                </select>
                            </div>
                        </div>

                        <div className="ss-form-group">
                            <label className="ss-label">Website</label>
                            <input 
                                type="text" 
                                className="ss-input" 
                                value={profile.website} 
                                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                            />
                        </div>

                        <div className="ss-form-group">
                            <label className="ss-label">Company Description</label>
                            <textarea 
                                className="ss-input ss-textarea" 
                                rows="4" 
                                value={profile.companyDescription} 
                                onChange={(e) => setProfile({ ...profile, companyDescription: e.target.value })}
                            ></textarea>
                            <p className="ss-notification-desc mt-1">This will be displayed on your exhibitor profile.</p>
                        </div>

                        <button type="button" className="ss-save-btn primary-button" onClick={handleSaveProfile}>
                            Save Changes
                        </button>
                    </div>

                    {/* PASSWORD CARD */}
                    <div className="ss-card">
                        <h4 className="ss-card-title">Password</h4>

                        <div className="ss-form-group">
                            <label className="ss-label">Current Password</label>
                            <div className="ss-input-wrapper">
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    className="ss-input"
                                    value={passwords.current}
                                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className="ss-password-toggle"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                    <Icon icon={showCurrentPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"} width="20" />
                                </button>
                            </div>
                        </div>

                        <div className="ss-form-group">
                            <label className="ss-label">New Password</label>
                            <div className="ss-input-wrapper">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    className="ss-input"
                                    value={passwords.new}
                                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className="ss-password-toggle"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                    <Icon icon={showNewPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"} width="20" />
                                </button>
                            </div>
                            
                            {/* Password Strength Indicators */}
                            <div className="ss-password-criteria">
                                {getPasswordCriteria(passwords.new).map((crit, idx) => (
                                    <div key={idx} className={`ss-criteria-item ${crit.met ? "met" : ""}`}>
                                        <Icon 
                                            icon={crit.met ? "mdi:check-circle" : "mdi:circle-outline"} 
                                            width="14" 
                                        />
                                        <span className="smaller-body-text">{crit.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="ss-form-group">
                            <label className="ss-label">Confirm New Password</label>
                            <div className="ss-input-wrapper">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    className="ss-input"
                                    value={passwords.confirm}
                                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className="ss-password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <Icon icon={showConfirmPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"} width="20" />
                                </button>
                            </div>
                        </div>

                        <button type="button" className="ss-save-btn ss-dark-btn" onClick={handleUpdatePassword}>
                            Update Password
                        </button>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="ss-column">
                    {/* PAYMENT METHODS CARD */}
                    <div className="ss-card">
                        <div className="ss-card-header-flex">
                            <h4 className="ss-card-title m-0">Payment Methods</h4>
                            <button className="ss-add-card-btn primary-button" onClick={() => setIsPaymentModalOpen(true)}>
                                <Icon icon="mdi:plus" /> Add Card
                            </button>
                        </div>

                        <div className="ss-payment-list">
                            {paymentMethods.map((method) => (
                                <div key={method.id} className="ss-payment-item">
                                    <div className="ss-payment-icon">
                                        <Icon icon={method.icon} width="24" />
                                    </div>
                                    <div className="ss-payment-info">
                                        <div className="ss-payment-title-row">
                                            <span className="ss-payment-type">{method.type} •••• {method.last4}</span>
                                            {method.isDefault && <span className="ss-pill-default">Default</span>}
                                        </div>
                                        <span className="ss-payment-expires">Expires {method.expires}</span>
                                    </div>
                                    <div className="ss-payment-actions">
                                        {!method.isDefault && <span className="ss-set-default-text smaller-body-text">Set as Default</span>}
                                        <button className="ss-icon-btn"><Icon icon="mdi:trash-can-outline" width="20" color="#666" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="ss-secure-storage-msg smaller-body-text">
                            <strong>Secure Storage:</strong> Your payment information is encrypted and stored securely. We never store your full card number or CVV.
                        </div>

                        <div className="ss-payment-footer">
                            <button className="ss-save-changes-black-btn button" onClick={() => handleSaveProfile()}>
                                <Icon icon="mdi:content-save" width="18" /> Save Changes
                            </button>
                        </div>
                    </div>

                    {/* NOTIFICATIONS CARD */}
                    <div className="ss-card">
                        <h4 className="ss-card-title">Notification Preferences</h4>
                        <div className="ss-notifications-list">
                            <div className="ss-notification-item">
                                <div className="ss-notification-info">
                                    <span className="ss-notification-label">Email Notifications</span>
                                    <span className="ss-notification-desc">Receive updates via email about your reservations</span>
                                </div>
                                <label className="ss-toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={notifications.email} 
                                        onChange={() => handleNotificationChange('email')}
                                    />
                                    <span className="ss-slider"></span>
                                </label>
                            </div>
                            <div className="ss-notification-item">
                                <div className="ss-notification-info">
                                    <span className="ss-notification-label">Payment & Invoice Alerts</span>
                                    <span className="ss-notification-desc">Get notified about upcoming payments and invoices</span>
                                </div>
                                <label className="ss-toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={notifications.paymentReminders}
                                        onChange={() => handleNotificationChange('paymentReminders')}
                                    />
                                    <span className="ss-slider"></span>
                                </label>
                            </div>
                            <div className="ss-notification-item">
                                <div className="ss-notification-info">
                                    <span className="ss-notification-label">Support Messages</span>
                                    <span className="ss-notification-desc">Receive news about your support ticket replies</span>
                                </div>
                                <label className="ss-toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={notifications.supportMessages}
                                        onChange={() => handleNotificationChange('supportMessages')}
                                    />
                                    <span className="ss-slider"></span>
                                </label>
                            </div>
                            <div className="ss-notification-item">
                                <div className="ss-notification-info">
                                    <span className="ss-notification-label">Event Announcements</span>
                                    <span className="ss-notification-desc">Receive news about new events and sponsorship opportunities</span>
                                </div>
                                <label className="ss-toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={notifications.announcements}
                                        onChange={() => handleNotificationChange('announcements')}
                                    />
                                    <span className="ss-slider"></span>
                                </label>
                            </div>
                        </div>

                        <button 
                            type="button" 
                            className="ss-save-btn ss-dark-btn mt-3" 
                            onClick={handleSaveProfile}
                            style={{marginTop: '24px'}}
                        >
                            Save Preferences
                        </button>
                    </div>
                </div>
            </div>

            <SponsorAddPaymentMethod
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
            />
        </div>
    );
}
