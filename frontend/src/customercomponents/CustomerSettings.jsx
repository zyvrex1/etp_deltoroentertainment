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

    const [paymentMethods, setPaymentMethods] = useState([]);
    const [visibleMethods, setVisibleMethods] = useState(new Set());

    const toggleMethodVisibility = (id) => {
        setVisibleMethods(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

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
                if (data.notifications) {
                    setNotifications({
                        email: data.notifications.email !== false,
                        sms: data.notifications.sms === true,
                        userUpdates: data.notifications.userUpdates !== false,
                        paymentReminders: data.notifications.paymentReminders !== false,
                        announcements: data.notifications.announcements !== false,
                        supportMessages: data.notifications.supportMessages !== false
                    });
                }
                if (data.paymentMethods) {
                    setPaymentMethods(data.paymentMethods);
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

    const handleDeleteMethod = async (id) => {
        if (!user?.token) return;
        const result = await showConfirmAlert("Delete Method?", "Are you sure you want to remove this payment method?");
        if (result.isConfirmed) {
            try {
                const res = await authService.removePaymentMethod(id, user.token);
                setPaymentMethods(res.data);
                showSuccessAlert("Deleted", "Payment method removed.");
            } catch (err) {
                showErrorAlert("Error", err.response?.data?.error || "Failed to remove payment method.");
            }
        }
    };

    const handleSetDefaultMethod = async (id) => {
        if (!user?.token) return;
        try {
            const res = await authService.setDefaultPaymentMethod(id, user.token);
            setPaymentMethods(res.data);
            showSuccessAlert("Updated", "Default payment method updated.");
        } catch (err) {
            showErrorAlert("Error", err.response?.data?.error || "Failed to set default payment method.");
        }
    };

    const fetchProfileData = async () => {
        if (!user?.token) return;
        try {
            const response = await authService.getProfile(user.token);
            if (response.data.paymentMethods) {
                setPaymentMethods(response.data.paymentMethods);
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) {
        return (
            <div className="cs-settings-container">
                <div className="cs-header">
                    <div className="cs-header-left">
                        <div className="skeleton-box settings-skeleton-title" />
                    </div>
                </div>

                <div className="cs-main-grid">
                    {/* LEFT COLUMN */}
                    <div className="cs-column">
                        {/* PERSONAL INFORMATION CARD */}
                        <div className="cs-card">
                            <div className="skeleton-box settings-skeleton-card-title" />

                            <div className="cs-avatar-section">
                                <div className="skeleton-box settings-skeleton-avatar" />
                            </div>

                            <div className="cs-form-row">
                                <div className="cs-form-group">
                                    <div className="skeleton-box settings-skeleton-label" />
                                    <div className="skeleton-box settings-skeleton-input" />
                                </div>
                                <div className="cs-form-group">
                                    <div className="skeleton-box settings-skeleton-label" />
                                    <div className="skeleton-box settings-skeleton-input" />
                                </div>
                            </div>

                            <div className="cs-form-group">
                                <div className="skeleton-box settings-skeleton-label" />
                                <div className="skeleton-box settings-skeleton-input" />
                            </div>

                            <div className="cs-form-group">
                                <div className="skeleton-box settings-skeleton-label" />
                                <div className="skeleton-box settings-skeleton-input" />
                            </div>

                            <div className="skeleton-box settings-skeleton-btn" />
                        </div>

                        {/* PASSWORD CARD */}
                        <div className="cs-card">
                            <div className="skeleton-box settings-skeleton-card-title" />

                            <div className="cs-form-group">
                                <div className="skeleton-box settings-skeleton-label" />
                                <div className="skeleton-box settings-skeleton-input" />
                            </div>

                            <div className="cs-form-group">
                                <div className="skeleton-box settings-skeleton-label" />
                                <div className="skeleton-box settings-skeleton-input" />
                            </div>

                            <div className="skeleton-box settings-skeleton-btn" />
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="cs-column">
                        {/* PAYMENT METHODS CARD */}
                        <div className="cs-card">
                            <div className="cs-card-header-flex">
                                <div className="skeleton-box settings-skeleton-card-title" style={{ width: '40%', marginBottom: 0 }} />
                                <div className="skeleton-box settings-skeleton-badge-btn" />
                            </div>

                            <div className="cs-payment-list">
                                {[1, 2].map((n) => (
                                    <div key={n} className="cs-payment-item skeleton-card">
                                        <div className="skeleton-box settings-skeleton-payment-icon" />
                                        <div className="cs-payment-info">
                                            <div className="skeleton-box settings-skeleton-payment-title" />
                                            <div className="skeleton-box settings-skeleton-payment-desc" />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="skeleton-box settings-skeleton-storage-msg" />
                        </div>

                        {/* NOTIFICATIONS CARD */}
                        <div className="cs-card">
                            <div className="skeleton-box settings-skeleton-card-title" />
                            <div className="cs-notifications-list">
                                {[1, 2, 3].map((n) => (
                                    <div key={n} className="cs-notification-item">
                                        <div className="cs-notification-info">
                                            <div className="skeleton-box settings-skeleton-notify-title" />
                                            <div className="skeleton-box settings-skeleton-notify-desc" />
                                        </div>
                                        <div className="skeleton-box settings-skeleton-toggle" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                                    <img 
                                        src={profile.avatar} 
                                        alt="Profile" 
                                        className="cs-avatar-image" 
                                        onError={(e) => { e.target.src = '/assets/eventbg.jpg'; }}
                                    />
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
                                defaultCountry="us"
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
                                <div key={method._id || method.id} className="cs-payment-item" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #eee', borderRadius: '8px', marginBottom: '12px'}}>
                                    <div className="cs-payment-icon" style={{marginRight: '16px'}}>
                                        <Icon icon={method.icon || "mdi:credit-card"} width="24" />
                                    </div>
                                    <div className="cs-payment-info" style={{flex: 1}}>
                                        <div className="cs-payment-title-row" style={{marginBottom: '4px'}}>
                                            <span className="cs-payment-type" style={{fontWeight: 600}}>
                                                {method.methodType === 'PayPal' ? 'PayPal' : method.methodType === 'UPI' ? 'UPI' : (method.type || 'Card')}
                                            </span>
                                        </div>
                                        <span className="cs-payment-detail regular-body-text text-black d-block">
                                            {visibleMethods.has(method._id || method.id)
                                              ? (method.cardNumber || method.accountNumber || method.paypalEmail || method.last4)
                                              : '•••• •••• ••••'}
                                        </span>
                                        {method.expires && <span className="cs-payment-expires d-block mt-1" style={{fontSize: '12px', color: '#666'}}>Expires: {method.expires}</span>}
                                    </div>
                                    <div className="cs-payment-actions" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                        <button
                                            className="cs-set-default-btn p-0 border-0 bg-transparent"
                                            onClick={() => handleSetDefaultMethod(method._id || method.id)}
                                        >
                                            <span className={`smaller-body-text ${method.isDefault ? 'button-label cs-pill-default px-2 py-1' : 'cs-set-default-text'}`} style={method.isDefault ? {backgroundColor: '#e6f4ea', color: '#137333', padding: '4px 8px', borderRadius: '16px', fontWeight: 600} : {color: '#0066cc', cursor: 'pointer', fontWeight: 600}}>
                                              {method.isDefault ? "Default" : "Set as Default"}
                                            </span>
                                        </button>
                                        <button
                                            className="cs-icon-btn" style={{border: 'none', background: 'transparent', cursor: 'pointer'}}
                                            onClick={() => toggleMethodVisibility(method._id || method.id)}
                                            title={visibleMethods.has(method._id || method.id) ? "Hide Details" : "Show Details"}
                                        >
                                            <Icon
                                              icon={visibleMethods.has(method._id || method.id) ? "mdi:eye-off-outline" : "mdi:eye-outline"}
                                              width="20"
                                              color="#666"
                                            />
                                        </button>
                                        <button className="cs-icon-btn" style={{border: 'none', background: 'transparent', cursor: 'pointer'}} onClick={() => handleDeleteMethod(method._id || method.id)}>
                                            <Icon icon="mdi:trash-can-outline" width="20" color="#666" />
                                        </button>
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
                                    <span className="cs-notification-label">Reservation & Payments</span>
                                    <span className="cs-notification-desc">Receive updates about your ticket orders, reservations and payments</span>
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
                                    <span className="cs-notification-label">Concerns</span>
                                    <span className="cs-notification-desc">Get notified about responses and updates regarding your submitted concerns</span>
                                </div>
                                <label className="cs-toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={notifications.supportMessages}
                                        onChange={() => handleNotificationChange('supportMessages')}
                                    />
                                    <span className="cs-slider"></span>
                                </label>
                            </div>
                            <div className="cs-notification-item">
                                <div className="cs-notification-info">
                                    <span className="cs-notification-label">Event Updates</span>
                                    <span className="cs-notification-desc">Receive news about new events and updates to existing ones</span>
                                </div>
                                <label className="cs-toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={notifications.userUpdates}
                                        onChange={() => handleNotificationChange('userUpdates')}
                                    />
                                    <span className="cs-slider"></span>
                                </label>
                            </div>
                            <div className="cs-notification-item">
                                <div className="cs-notification-info">
                                    <span className="cs-notification-label">Platform Updates</span>
                                    <span className="cs-notification-desc">Stay informed about platform policies and system announcements</span>
                                </div>
                                <label className="cs-toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={notifications.announcements}
                                        onChange={() => handleNotificationChange('announcements')}
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
                onMethodAdded={fetchProfileData}
            />
        </div>
    );
}
