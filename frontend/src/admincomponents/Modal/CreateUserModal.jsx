import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import './CreateUserModal.css';
import { showSuccessAlert, showCancelConfirmAlert, showCreateConfirmAlert } from '../utils/sweetAlert';

const CreateUserModal = ({ isOpen, onClose }) => {
    const [userType, setUserType] = useState('Admin');
    const [formData, setFormData] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await showCreateConfirmAlert(
            'Create User?',
            `Are you sure you want to create a new ${userType} user?`
        );
        
        if (!result.isConfirmed) {
            return;
        }
        
        try {
            // Here you would typically send the data to your API
            await showSuccessAlert('User Created', 'The user has been created successfully. An invitation email has been sent.');
            onClose();
            setFormData({});
        } catch (error) {
            console.error('Error creating user:', error);
        }
    };

    const handleCancel = async () => {
        const hasChanges = Object.values(formData).some(val => val && val.toString().trim() !== '');
        if (hasChanges) {
            const result = await showCancelConfirmAlert();
            if (result.isConfirmed) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    if (!isOpen) return null;

    const renderFormFields = () => {
        switch (userType) {
            case 'Promoter':
                return (
                    <>
                        <div className="add-user-form-row">
                            <div className="add-user-form-group">
                                <h6>Full Name</h6>
                                <input type="text" placeholder="e.g. John Doe" />
                            </div>
                            <div className="add-user-form-group">
                                <h6>Email Address</h6>
                                <input type="email" placeholder="john@example.com" />
                            </div>
                        </div>
                        <div className="add-user-form-row">
                            <div className="add-user-form-group">
                                <h6>Bank Account (Last 4)</h6>
                                <input type="text" placeholder="e.g. 1234" />
                            </div>
                            <div className="add-user-form-group">
                                <h6>Phone Number</h6>
                                <input type="tel" placeholder="+1 (555) 000-0000" />
                            </div>
                        </div>
                    </>
                );
            case 'Sponsor':
                return (
                    <>
                        <div className="add-user-form-row">
                            <div className="add-user-form-group">
                                <h6>Full Name</h6>
                                <input type="text" placeholder="e.g. John Doe" />
                            </div>
                            <div className="add-user-form-group">
                                <h6>Email Address</h6>
                                <input type="email" placeholder="john@example.com" />
                            </div>
                        </div>
                        <div className="add-user-form-row">
                            <div className="add-user-form-group">
                                <h6>Company Name</h6>
                                <input type="text" placeholder="e.g. 1234" />
                            </div>
                            <div className="add-user-form-group">
                                <h6>Industry</h6>
                                <input type="text" placeholder="e.g. John Doe" />
                            </div>
                        </div>
                        <div className="add-user-form-group add-user-full-width">
                            <h6>Phone Number</h6>
                            <input type="tel" placeholder="+1 (555) 000-0000" />
                        </div>
                    </>
                );
            case 'Admin':
            case 'Customer':
            default:
                return (
                    <>
                        <div className="add-user-form-row">
                            <div className="add-user-form-group">
                                <h6>Full Name</h6>
                                <input type="text" placeholder="e.g. John Doe" />
                            </div>
                            <div className="add-user-form-group">
                                <h6>Email Address</h6>
                                <input type="email" placeholder="john@example.com" />
                            </div>
                        </div>
                        <div className="add-user-form-group add-user-full-width">
                            <h6>Phone Number</h6>
                            <input type="tel" placeholder="+1 (555) 000-0000" />
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="general-modal-overlay">
            <div className="general-modal-container">
                <div className="general-modal-header">
                    <h3>Add New User</h3>
                    <button className="close-btn" onClick={handleCancel}>
                        <Icon icon="mdi:close" />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="user-type-section">
                        <h6 className="section-label">User Type</h6>
                        <div className="user-type-grid">
                            <button
                                className={`type-card admin ${userType === 'Admin' ? 'active' : ''}`}
                                onClick={() => setUserType('Admin')}
                            >
                                <Icon icon="mdi:shield-outline" width="20" />
                                <span>Admin</span>
                            </button>
                            <button
                                className={`type-card promoter ${userType === 'Promoter' ? 'active' : ''}`}
                                onClick={() => setUserType('Promoter')}
                            >
                                <Icon icon="mdi:bullhorn-outline" width="20" />
                                <span>Promoter</span>
                            </button>
                            <button
                                className={`type-card sponsor ${userType === 'Sponsor' ? 'active' : ''}`}
                                onClick={() => setUserType('Sponsor')}
                            >
                                <Icon icon="mdi:office-building" width="20" />
                                <span>Sponsor</span>
                            </button>
                            <button
                                className={`type-card customer ${userType === 'Customer' ? 'active' : ''}`}
                                onClick={() => setUserType('Customer')}
                            >
                                <Icon icon="mdi:account-outline" width="20" />
                                <span>Customer</span>
                            </button>
                        </div>
                    </div>

                    <form className="create-user-form" onSubmit={handleSubmit}>
                        {renderFormFields()}

                        <div className="add-user-info-banner">
                            <div className="info-icon">
                                <Icon icon="mdi:account-plus-outline" width="20" />
                            </div>
                            <div className="info-content">
                                <h6>Account Invitation</h6>
                                <p>An email will be sent to the user with instructions to set their password and activate their account.</p>
                            </div>
                        </div>

                        <div className="general-modal-footer">
                    <button type="button" className="button cancel-btn" onClick={handleCancel}>Cancel</button>
                    <button type="submit" className="primary-button save-btn">Create User</button>
                </div>
                    </form>
                </div>

                
            </div>
        </div>
    );
};

export default CreateUserModal;
