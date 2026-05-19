import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { showSuccessAlert, showConfirmAlert, showErrorAlert } from '../utils/sweetAlert';
import { useAuthContext } from '../hooks/useAuthContext';
import * as authService from '../services/authService';
import './SponsorSettings.css';
import SponsorAddPaymentMethod from './SponsorModal/SponsorAddPaymentMethod';
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

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
        streetAddress: "",
        city: "",
        zipCode: ""
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
                    companyName: data.companyName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || "",
                    industry: data.industry || "",
                    avatar: data.avatar || "",
                    streetAddress: data.streetAddress || "",
                    city: data.city || "",
                    zipCode: data.zipCode || ""
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
                if (profile.streetAddress !== undefined) formData.append("streetAddress", profile.streetAddress);
                if (profile.city !== undefined) formData.append("city", profile.city);
                if (profile.zipCode !== undefined) formData.append("zipCode", profile.zipCode);
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

                        {loading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div className="skeleton" style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto' }}></div>
                                <div className="ss-form-row">
                                    <div className="ss-form-group" style={{width: '100%'}}><div className="skeleton skeleton-text" style={{width:'30%'}}></div><div className="skeleton" style={{height:'40px', borderRadius:'6px'}}></div></div>
                                    <div className="ss-form-group" style={{width: '100%'}}><div className="skeleton skeleton-text" style={{width:'40%'}}></div><div className="skeleton" style={{height:'40px', borderRadius:'6px'}}></div></div>
                                </div>
                                <div className="ss-form-group"><div className="skeleton skeleton-text" style={{width:'25%'}}></div><div className="skeleton" style={{height:'40px', borderRadius:'6px'}}></div></div>
                                <div className="ss-form-group"><div className="skeleton skeleton-text" style={{width:'35%'}}></div><div className="skeleton" style={{height:'40px', borderRadius:'6px'}}></div></div>
                                <div className="ss-form-row">
                                    <div className="ss-form-group" style={{width: '100%'}}><div className="skeleton skeleton-text" style={{width:'45%'}}></div><div className="skeleton" style={{height:'40px', borderRadius:'6px'}}></div></div>
                                    <div className="ss-form-group" style={{width: '100%'}}><div className="skeleton skeleton-text" style={{width:'35%'}}></div><div className="skeleton" style={{height:'40px', borderRadius:'6px'}}></div></div>
                                </div>
                                <div className="ss-form-group"><div className="skeleton skeleton-text" style={{width:'20%'}}></div><div className="skeleton" style={{height:'40px', borderRadius:'6px'}}></div></div>
                                <div className="ss-form-row">
                                    <div className="ss-form-group" style={{width: '100%'}}><div className="skeleton skeleton-text" style={{width:'25%'}}></div><div className="skeleton" style={{height:'40px', borderRadius:'6px'}}></div></div>
                                    <div className="ss-form-group" style={{width: '100%'}}><div className="skeleton skeleton-text" style={{width:'35%'}}></div><div className="skeleton" style={{height:'40px', borderRadius:'6px'}}></div></div>
                                </div>
                                <div className="skeleton" style={{width: '120px', height: '40px', borderRadius:'8px', marginTop: '10px'}}></div>
                            </div>
                        ) : (
                            <>
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
                            <PhoneInput
                                defaultCountry="ph"
                                value={profile.phone || ""}
                                onChange={(phone) => setProfile((prev) => ({ ...prev, phone }))}
                                inputClassName="ss-input"
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
                                <input
                                    type="text"
                                    className="ss-input"
                                    value={profile.industry}
                                    onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                                    placeholder="e.g. Technology"
                                />
                            </div>
                        </div>

                        <div className="ss-form-group">
                            <label className="ss-label">Street Address</label>
                            <input
                                type="text"
                                className="ss-input"
                                value={profile.streetAddress}
                                onChange={(e) => setProfile({ ...profile, streetAddress: e.target.value })}
                            />
                        </div>

                        <div className="ss-form-row">
                            <div className="ss-form-group">
                                <label className="ss-label">City</label>
                                <input
                                    type="text"
                                    className="ss-input"
                                    value={profile.city}
                                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                                    placeholder="e.g. New York (US)"
                                />
                            </div>
                            <div className="ss-form-group">
                                <label className="ss-label">Zip Code</label>
                                <input
                                    type="text"
                                    className="ss-input"
                                    value={profile.zipCode}
                                    onChange={(e) => setProfile({ ...profile, zipCode: e.target.value })}
                                />
                            </div>
                        </div>

                        <button type="button" className="ss-save-btn primary-button" onClick={handleSaveProfile}>
                            Save Changes
                        </button>
                            </>
                        )}
                    </div>

                    {/* PASSWORD CARD */}
                    <div className="ss-card">
                        <h4 className="ss-card-title">Password</h4>

                        {loading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div className="ss-form-group"><div className="skeleton skeleton-text" style={{width:'40%'}}></div><div className="skeleton" style={{height:'40px', borderRadius:'6px'}}></div></div>
                                <div className="ss-form-group"><div className="skeleton skeleton-text" style={{width:'35%'}}></div><div className="skeleton" style={{height:'40px', borderRadius:'6px'}}></div></div>
                                <div className="ss-form-group"><div className="skeleton skeleton-text" style={{width:'45%'}}></div><div className="skeleton" style={{height:'40px', borderRadius:'6px'}}></div></div>
                                <div className="skeleton" style={{width: '140px', height: '40px', borderRadius:'8px', marginTop: '10px'}}></div>
                            </div>
                        ) : (
                            <>
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
                            </>
                        )}
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
                            {loading ? (
                                Array.from({ length: 2 }).map((_, i) => (
                                    <div key={i} className="ss-payment-item skeleton" style={{ minHeight: '80px', border: 'none', marginBottom: '12px' }}></div>
                                ))
                            ) : (
                                paymentMethods.map((method) => (
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
                                ))
                            )}
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
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="ss-notification-item skeleton" style={{ minHeight: '60px', border: 'none', marginBottom: '12px' }}></div>
                                ))
                            ) : (
                                <>
                                    <div className="ss-notification-item">
                                <div className="ss-notification-info">
                                    <span className="ss-notification-label">Reservations & Payments</span>
                                    <span className="ss-notification-desc">Get notified about your booth reservations and payment status</span>
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
                                    <span className="ss-notification-label">Concerns</span>
                                    <span className="ss-notification-desc">Receive updates about your support ticket replies and concerns</span>
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
                                    <span className="ss-notification-label">Event Updates</span>
                                    <span className="ss-notification-desc">Get notified when events are added or modified</span>
                                </div>
                                <label className="ss-toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={notifications.userUpdates}
                                        onChange={() => handleNotificationChange('userUpdates')}
                                    />
                                    <span className="ss-slider"></span>
                                </label>
                            </div>
                            <div className="ss-notification-item">
                                <div className="ss-notification-info">
                                    <span className="ss-notification-label">Platform Updates</span>
                                    <span className="ss-notification-desc">Receive news about policies, announcements, and platform changes</span>
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
                                </>
                            )}
                        </div>

                        <button
                            type="button"
                            className="ss-save-btn ss-dark-btn mt-3"
                            onClick={handleSaveProfile}
                            style={{ marginTop: '24px' }}
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
