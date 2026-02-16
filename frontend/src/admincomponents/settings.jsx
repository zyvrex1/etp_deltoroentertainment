import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import './settings.css';

const Settings = () => {
    // State for form fields (mock data)
    const [profile, setProfile] = useState({
        fullName: 'Alex Thompson',
        email: 'alex@eticketspro.com',
        phone: '+1 (555) 0101'
    });

    const [security, setSecurity] = useState({
        currentPassword: 'password123',
        newPassword: 'password123',
        confirmPassword: 'password123',
        twoFactor: false
    });

    const [notifications, setNotifications] = useState({
        email: true,
        sms: false
    });

    const [general, setGeneral] = useState({
        platformName: 'eTicketsPro',
        supportEmail: 'support@eticketspro.com',
        maintenanceMode: 'disabled'
    });

    const [fees, setFees] = useState({
        platformFee: '5.0',
        fixedFee: '0.99',
        payoutSchedule: 'weekly'
    });

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
                                <Icon icon="ph:user" className="avatar-icon" />
                                <button className="camera-btn">
                                    <Icon icon="mdi:camera-outline" />
                                </button>
                            </div>
                        </div>

                        <div className="form-grid top-profile-grid">
                            <div className="form-group full-name-group">
                                <label className="small-body-text">Full Name</label>
                                <input
                                    type="text"
                                    value={profile.fullName}
                                    className="input-field"
                                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                                />
                            </div>
                            <div className="form-group email-group">
                                <label className="small-body-text">Email Address</label>
                                <input
                                    type="email"
                                    value={profile.email}
                                    className="input-field"
                                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                />
                            </div>
                            <div className="form-group phone-group">
                                <label className="small-body-text">Phone Number</label>
                                <input
                                    type="text"
                                    value={profile.phone}
                                    className="input-field"
                                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                />
                            </div>
                        </div>
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
                                    readOnly
                                />
                            </div>
                            <div className="form-group">
                                <label className="small-body-text">New Password</label>
                                <input
                                    type="password"
                                    value={security.newPassword}
                                    className="input-field"
                                    readOnly
                                />
                            </div>
                            <div className="form-group">
                                <label className="small-body-text">Confirm Password</label>
                                <input
                                    type="password"
                                    value={security.confirmPassword}
                                    className="input-field"
                                    readOnly
                                />
                            </div>
                        </div>

                        <div className="toggle-row two-factor-row">
                            <div className="toggle-info">
                                <h5>Two-Factor Authentication</h5>
                                <p className="small-body-text">Add an extra layer of security to your account</p>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={security.twoFactor}
                                    onChange={(e) => setSecurity({ ...security, twoFactor: e.target.checked })}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>
                    </div>

                    <div className="section-divider"></div>

                    {/* Notifications Section */}
                    <div className="subsection notifications-section">
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
                                        onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
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
                                        onChange={(e) => setNotifications({ ...notifications, sms: e.target.checked })}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="section-divider"></div>

                    <div className="account-actions">
                        <button className="outlined-button delete-btn">Delete Account</button>
                        <button className="primary-button save-profile-btn">Save Profile</button>
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
                                    onChange={(e) => setGeneral({ ...general, platformName: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="small-body-text">Support Email</label>
                                <input
                                    type="email"
                                    value={general.supportEmail}
                                    className="input-field"
                                    onChange={(e) => setGeneral({ ...general, supportEmail: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="small-body-text">Maintenance Mode</label>
                                <div className="select-wrapper">
                                    <select
                                        value={general.maintenanceMode}
                                        className="input-field"
                                        onChange={(e) => setGeneral({ ...general, maintenanceMode: e.target.value })}
                                    >
                                        <option value="disabled">Disabled (Live)</option>
                                        <option value="enabled">Enabled</option>
                                    </select>
                                    <Icon icon="mdi:chevron-down" className="select-icon" />
                                </div>
                            </div>
                            <button className="primary-button save-changes-btn">Save Changes</button>
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
                                    onChange={(e) => setFees({ ...fees, platformFee: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="small-body-text">Fixed Fee per Ticket ($)</label>
                                <input
                                    type="text"
                                    value={fees.fixedFee}
                                    className="input-field"
                                    onChange={(e) => setFees({ ...fees, fixedFee: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="small-body-text">Payout Schedule</label>
                                <div className="select-wrapper">
                                    <select
                                        value={fees.payoutSchedule}
                                        className="input-field"
                                        onChange={(e) => setFees({ ...fees, payoutSchedule: e.target.value })}
                                    >
                                        <option value="weekly">Weekly</option>
                                        <option value="biweekly">Bi-Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                    <Icon icon="mdi:chevron-down" className="select-icon" />
                                </div>
                            </div>
                            <button className="primary-button update-fees-btn">Update Fees</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
