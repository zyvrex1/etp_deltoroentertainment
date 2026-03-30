import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { showSuccessAlert, showConfirmAlert, showErrorAlert } from '../admincomponents/utils/sweetAlert';
import { useAuthContext } from '../admincomponents/hooks/useAuthContext';
import * as authService from '../services/authService';
import './CustomerSettings.css';
import CustomerAddPaymentMethod from './Modal/CustomerAddPaymentMethod';

export default function CustomerSettings() {
    const { user, dispatch } = useAuthContext();
    const [activeTab, setActiveTab] = useState('personalInfo');
    const [isAddCardOpen, setIsAddCardOpen] = useState(false);

    const [profile, setProfile] = useState({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        phone: user?.phone || "",
        avatar: user?.avatar || ""
    });

    const tabs = [
        { id: 'personalInfo', label: 'Personal Info', icon: 'mdi:account-outline' },
        { id: 'billingMethods', label: 'Billing Methods', icon: 'mdi:credit-card-outline' },
        { id: 'notifications', label: 'Notifications', icon: 'mdi:bell-outline' }
    ];

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

    const handleSave = async () => {
        const result = await showConfirmAlert("Save Changes?", "Are you sure you want to update your profile?", "Yes, Save");
        if (result.isConfirmed) {
            try {
                const response = await authService.updateProfile(profile, user.token);
                
                // Update context and storage
                const updatedUser = { ...user, ...response.data.user };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                dispatch({ type: "LOGIN", payload: updatedUser });

                await showSuccessAlert("Saved", "Your profile has been saved successfully.");
            } catch (error) {
                showErrorAlert("Update Failed", error.response?.data?.error || "Failed to update profile.");
            }
        }
    };

    const handleAddCard = () => {
        setIsAddCardOpen(true);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'personalInfo':
                return (
                    <div className="settings-content-pane">
                        <h4 className="settings-pane-title">Personal Information</h4>
                        
                        <div className="settings-avatar-section">
                            <div className="settings-avatar-circle">
                                {profile.avatar ? (
                                    <img src={profile.avatar} alt="Profile" className="settings-avatar-image" />
                                ) : (
                                    <span className="settings-avatar-text">
                                        {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
                                    </span>
                                )}
                            </div>
                            <input
                                type="file"
                                id="avatarInput"
                                hidden
                                accept="image/*"
                                onChange={handlePhotoChange}
                            />
                            <button 
                                type="button" 
                                className="settings-change-photo-btn"
                                onClick={() => document.getElementById('avatarInput').click()}
                            >
                                Change Photo
                            </button>
                        </div>

                        <div className="settings-form-group">
                            <div className="settings-input-row">
                                <div className="settings-input-field">
                                    <label className="small-body-text">First Name</label>
                                    <input 
                                        type="text" 
                                        className="settings-input regular-body-text" 
                                        value={profile.firstName} 
                                        onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                                    />
                                </div>
                                <div className="settings-input-field">
                                    <label className="small-body-text">Last Name</label>
                                    <input 
                                        type="text" 
                                        className="settings-input regular-body-text" 
                                        value={profile.lastName} 
                                        onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="settings-input-field">
                                <label className="small-body-text">Email Address</label>
                                <input 
                                    type="email" 
                                    className="settings-input regular-body-text" 
                                    value={profile.email} 
                                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                />
                            </div>
                            <div className="settings-input-field">
                                <label className="small-body-text">Phone Number</label>
                                <input 
                                    type="tel" 
                                    className="settings-input regular-body-text" 
                                    value={profile.phone} 
                                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="settings-form-actions">
                            <button className="button settings-save-btn" onClick={handleSave}>
                                <Icon icon="mdi:content-save-outline" width="20" /> Save Changes
                            </button>
                        </div>
                    </div>
                );
            case 'billingMethods':
                return (
                    <div className="settings-content-pane">
                        <div className="settings-pane-header flex-between">
                            <h4 className="settings-pane-title">Payment Methods</h4>
                            <button className="primary-button add-card-btn regular-body-text" onClick={handleAddCard}>
                                <Icon icon="mdi:plus" width="18" /> Add Card
                            </button>
                        </div>
                        <div className="settings-cards-list">
                            <div className="settings-card-item">
                                <div className="card-item-left">
                                    <div className="card-icon-box bg-dark">
                                        <Icon icon="mdi:credit-card" width="24" color="#fff" />
                                    </div>
                                    <div className="card-item-info">
                                        <div className="card-number-row">
                                            <h5>Visa •••• 4242</h5>
                                            <span className="badge-default button-label">Default</span>
                                        </div>
                                        <div className="small-body-text text-muted">Expires 12/25</div>
                                    </div>
                                </div>
                                <div className="card-item-right">
                                    <button className="action-icon-btn"><Icon icon="mdi:trash-can-outline" width="20" className="text-muted" /></button>
                                </div>
                            </div>

                            <div className="settings-card-item">
                                <div className="card-item-left">
                                    <div className="card-icon-box bg-dark">
                                        <Icon icon="mdi:credit-card" width="24" color="#fff" />
                                    </div>
                                    <div className="card-item-info">
                                        <div className="card-number-row">
                                            <h5>Mastercard •••• 8888</h5>
                                        </div>
                                        <div className="small-body-text text-muted">Expires 08/26</div>
                                    </div>
                                </div>
                                <div className="card-item-right card-actions-right">
                                    <button className="text-btn red-text small-body-text">Set as Default</button>
                                    <button className="action-icon-btn"><Icon icon="mdi:trash-can-outline" width="20" /></button>
                                </div>
                            </div>
                        </div>

                        <div className="settings-secure-storage">
                            <p className="small-body-text secure-text">
                                <span className="font-medium secure-bold">Secure Storage:</span> Your payment information is encrypted and stored securely. We never store your full card number or CVV.
                            </p>
                        </div>

                        <div className="settings-form-actions mt-auto">
                            <button className="settings-save-btn button" onClick={() => handleSave('billing methods')}>
                                <Icon icon="mdi:content-save-outline" width="20" /> Save Changes
                            </button>
                        </div>
                    </div>
                );
            case 'notifications':
                return (
                    <div className="settings-content-pane">
                        <h4 className="settings-pane-title">Notification Preferences</h4>
                        <div className="settings-notifications-list">
                            <div className="notification-item">
                                <div className="notification-info">
                                    <div className="regular-body-text font-medium text-black">Order Updates</div>
                                    <div className="small-body-text text-muted">Receive updates about your ticket orders and upcoming events</div>
                                </div>
                                <label className="toggle-switch">
                                    <input type="checkbox" defaultChecked />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                            <hr className="notification-divider" />
                            <div className="notification-item">
                                <div className="notification-info">
                                    <div className="regular-body-text font-medium text-black">Payment Reminders</div>
                                    <div className="small-body-text text-muted">Get notified about upcoming payments or renewals</div>
                                </div>
                                <label className="toggle-switch">
                                    <input type="checkbox" defaultChecked />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                            <hr className="notification-divider" />
                            <div className="notification-item">
                                <div className="notification-info">
                                    <div className="regular-body-text font-medium text-black">Marketing Communications</div>
                                    <div className="small-body-text text-muted">Receive news about new events and promotions</div>
                                </div>
                                <label className="toggle-switch">
                                    <input type="checkbox" />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        </div>
                        <div className="settings-form-actions mt-auto-p-none">
                            <button className="settings-save-btn button regular-body-text" onClick={() => handleSave('notification preferences')}>
                                <Icon icon="mdi:content-save-outline" width="20" /> Save Preferences
                            </button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="customer-settings-container">
            <h2 className="settings-page-title">Profile Settings</h2>

            <div className="settings-layout">
                {/* Sidebar */}
                <div className="settings-sidebar">
                    <ul className="settings-tab-list">
                        {tabs.map(tab => (
                            <li key={tab.id}>
                                <button
                                    className={`settings-tab-btn regular-body-text ${activeTab === tab.id ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <Icon icon={tab.icon} width="20" className="tab-icon" />
                                    {tab.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Content Area */}
                <div className="settings-content-area">
                    {renderContent()}
                </div>
            </div>

            <CustomerAddPaymentMethod
                isOpen={isAddCardOpen}
                onClose={() => setIsAddCardOpen(false)}
            />
        </div>
    );
}
