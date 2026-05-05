import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { showSuccessAlert, showConfirmAlert, showErrorAlert } from '../utils/sweetAlert';
import { useAuthContext } from '../hooks/useAuthContext';
import * as authService from '../services/authService';
import './CustomerSettings.css';
import CustomerAddPaymentMethod from './Modal/CustomerAddPaymentMethod';
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

export default function CustomerSettings() {
    const { user, dispatch } = useAuthContext();
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const [profile, setProfile] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        avatar: ""
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

    // Mock notifications for demonstration
    const [notifications, setNotifications] = useState({
        orderUpdates: true,
        paymentReminders: true,
        marketing: false
    });

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.token) return;
            try {
                const response = await authService.getProfile(user.token);
                const data = response.data;
                
                // Fix for the phone number display issue
                let formattedPhone = data.phone || "";
                if (formattedPhone && !formattedPhone.startsWith('+')) {
                    if (formattedPhone.startsWith('0')) {
                        formattedPhone = `+63${formattedPhone.substring(1)}`;
                    } else {
                        formattedPhone = `+${formattedPhone}`;
                    }
                }

                setProfile({
                    firstName: data.firstName || "",
                    lastName: data.lastName || "",
                    email: data.email || "",
                    phone: formattedPhone,
                    avatar: data.avatar || ""
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
        <div className="cs-settings-container">
            <div className="cs-header">
                <div className="cs-header-left">
                    <h1 className="cs-title">Settings</h1>
                </div>
            </div>

            <div className="cs-main-grid">
                {/* LEFT COLUMN */}
                <div className="cs-column">
                    {/* PERSONAL INFORMATION CARD */}
                    <div className="cs-card">
                        <h4 className="cs-card-title">Personal Information</h4>

                        <div className="cs-avatar-section">
                            <div className="cs-avatar-circle">
                                {profile.avatar ? (
                                    <img src={profile.avatar} alt="Profile" className="cs-avatar-image" />
                                ) : (
                                    <span className="cs-avatar-text">
                                        {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
                                    </span>
                                )}
                                <label htmlFor="avatarInput" className="cs-avatar-upload-overlay">
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

                        <div className="cs-form-row">
                            <div className="cs-form-group">
                                <label className="cs-label">First Name</label>
                                <input
                                    type="text"
                                    className="cs-input"
                                    value={profile.firstName}
                                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                                />
                            </div>
                            <div className="cs-form-group">
                                <label className="cs-label">Last Name</label>
                                <input
                                    type="text"
                                    className="cs-input"
                                    value={profile.lastName}
                                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="cs-form-group">
                            <label className="cs-label">Email Address</label>
                            <input
                                type="email"
                                className="cs-input"
                                value={profile.email}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                            />
                        </div>

                        <div className="cs-form-group">
                            <label className="cs-label">Phone Number</label>
                            <PhoneInput
                                defaultCountry="ph"
                                value={profile.phone || ""}
                                onChange={(phone) => setProfile((prev) => ({ ...prev, phone }))}
                                inputClassName="cs-input"
                                className="phone-input-container"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0',
                                    border: '1px solid var(--color-black-secondary)',
                                    borderRadius: '6px'
                                }}
                                inputStyle={{
                                    border: 'none',
                                    padding: '10px 12px',
                                    outline: 'none',
                                    borderRadius: '0',
                                    flex: 1,
                                    color: 'var(--color-black-secondary)'
                                }}
                                buttonStyle={{
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    boxShadow: 'none',
                                    color: 'var(--color-black-secondary)'
                                }}
                            />
                        </div>

                        <button type="button" className="cs-save-btn primary-button" onClick={handleSaveProfile}>
                            Save Changes
                        </button>
                    </div>

                    {/* PASSWORD CARD */}
                    <div className="cs-card">
                        <h4 className="cs-card-title">Password</h4>

                        <div className="cs-form-group">
                            <label className="cs-label">Current Password</label>
                            <div className="cs-input-wrapper">
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    className="cs-input"
                                    value={passwords.current}
                                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className="cs-password-toggle"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                    <Icon icon={showCurrentPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"} width="20" />
                                </button>
                            </div>
                        </div>

                        <div className="cs-form-group">
                            <label className="cs-label">New Password</label>
                            <div className="cs-input-wrapper">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    className="cs-input"
                                    value={passwords.new}
                                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className="cs-password-toggle"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                    <Icon icon={showNewPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"} width="20" />
                                </button>
                            </div>
                            
                            {/* Password Strength Indicators */}
                            <div className="cs-password-criteria">
                                {getPasswordCriteria(passwords.new).map((crit, idx) => (
                                    <div key={idx} className={`cs-criteria-item ${crit.met ? "met" : ""}`}>
                                        <Icon 
                                            icon={crit.met ? "mdi:check-circle" : "mdi:circle-outline"} 
                                            width="14" 
                                        />
                                        <span className="smaller-body-text">{crit.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="cs-form-group">
                            <label className="cs-label">Confirm New Password</label>
                            <div className="cs-input-wrapper">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    className="cs-input"
                                    value={passwords.confirm}
                                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className="cs-password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <Icon icon={showConfirmPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"} width="20" />
                                </button>
                            </div>
                        </div>

                        <button type="button" className="cs-save-btn cs-dark-btn" onClick={handleUpdatePassword}>
                            Update Password
                        </button>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="cs-column">
                    {/* PAYMENT METHODS CARD */}
                    <div className="cs-card">
                        <div className="cs-card-header-flex">
                            <h4 className="cs-card-title m-0">Payment Methods</h4>
                            <button className="cs-add-card-btn primary-button" onClick={() => setIsPaymentModalOpen(true)}>
                                <Icon icon="mdi:plus" /> Add Card
                            </button>
                        </div>

                        <div className="cs-payment-list">
                            {paymentMethods.map((method) => (
                                <div key={method.id} className="cs-payment-item">
                                    <div className="cs-payment-icon">
                                        <Icon icon={method.icon} width="24" />
                                    </div>
                                    <div className="cs-payment-info">
                                        <div className="cs-payment-title-row">
                                            <span className="cs-payment-type">{method.type} •••• {method.last4}</span>
                                            {method.isDefault && <span className="cs-pill-default">Default</span>}
                                        </div>
                                        <span className="cs-payment-expires">Expires {method.expires}</span>
                                    </div>
                                    <div className="cs-payment-actions">
                                        {!method.isDefault && <span className="cs-set-default-text smaller-body-text">Set as Default</span>}
                                        <button className="cs-icon-btn"><Icon icon="mdi:trash-can-outline" width="20" color="#666" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="cs-secure-storage-msg smaller-body-text">
                            <strong>Secure Storage:</strong> Your payment information is encrypted and stored securely. We never store your full card number or CVV.
                        </div>

                        <div className="cs-payment-footer">
                            <button className="cs-save-changes-black-btn button" onClick={() => handleSaveProfile()}>
                                <Icon icon="mdi:content-save" width="18" /> Save Changes
                            </button>
                        </div>
                    </div>

                    {/* NOTIFICATIONS CARD */}
                    <div className="cs-card">
                        <h4 className="cs-card-title">Notification Preferences</h4>
                        <div className="cs-notifications-list">
                            <div className="cs-notification-item">
                                <div className="cs-notification-info">
                                    <span className="cs-notification-label">Order Updates</span>
                                    <span className="cs-notification-desc">Receive updates about your ticket orders and upcoming events</span>
                                </div>
                                <label className="cs-toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={notifications.orderUpdates} 
                                        onChange={() => handleNotificationChange('orderUpdates')}
                                    />
                                    <span className="cs-slider"></span>
                                </label>
                            </div>
                            <div className="cs-notification-item">
                                <div className="cs-notification-info">
                                    <span className="cs-notification-label">Payment Reminders</span>
                                    <span className="cs-notification-desc">Get notified about upcoming payments and invoices</span>
                                </div>
                                <label className="cs-toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={notifications.paymentReminders}
                                        onChange={() => handleNotificationChange('paymentReminders')}
                                    />
                                    <span className="cs-slider"></span>
                                </label>
                            </div>
                            <div className="cs-notification-item">
                                <div className="cs-notification-info">
                                    <span className="cs-notification-label">Marketing Communications</span>
                                    <span className="cs-notification-desc">Receive news about new events and promotions</span>
                                </div>
                                <label className="cs-toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={notifications.marketing}
                                        onChange={() => handleNotificationChange('marketing')}
                                    />
                                    <span className="cs-slider"></span>
                                </label>
                            </div>
                        </div>

                        <button 
                            type="button" 
                            className="cs-save-btn cs-dark-btn mt-3" 
                            onClick={handleSaveProfile}
                            style={{marginTop: '24px'}}
                        >
                            Save Preferences
                        </button>
                    </div>
                </div>
            </div>

            <CustomerAddPaymentMethod
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
            />
        </div>
    );
}
