import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import './CreateUserModal.css';

const CreateUserModal = ({ isOpen, onClose }) => {
    const [userType, setUserType] = useState('Admin');

    if (!isOpen) return null;

    const renderFormFields = () => {
        switch (userType) {
            case 'Promoter':
                return (
                    <>
                        <div className="form-row">
                            <div className="form-group">
                                <h6>Full Name</h6>
                                <input type="text" placeholder="e.g. John Doe" />
                            </div>
                            <div className="form-group">
                                <h6>Email Address</h6>
                                <input type="email" placeholder="john@example.com" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <h6>Bank Account (Last 4)</h6>
                                <input type="text" placeholder="e.g. 1234" />
                            </div>
                            <div className="form-group">
                                <h6>Phone Number</h6>
                                <input type="tel" placeholder="+1 (555) 000-0000" />
                            </div>
                        </div>
                    </>
                );
            case 'Sponsor':
                return (
                    <>
                        <div className="form-row">
                            <div className="form-group">
                                <h6>Full Name</h6>
                                <input type="text" placeholder="e.g. John Doe" />
                            </div>
                            <div className="form-group">
                                <h6>Email Address</h6>
                                <input type="email" placeholder="john@example.com" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <h6>Company Name</h6>
                                <input type="text" placeholder="e.g. 1234" />
                            </div>
                            <div className="form-group">
                                <h6>Industry</h6>
                                <input type="text" placeholder="e.g. John Doe" />
                            </div>
                        </div>
                        <div className="form-group full-width">
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
                        <div className="form-row">
                            <div className="form-group">
                                <h6>Full Name</h6>
                                <input type="text" placeholder="e.g. John Doe" />
                            </div>
                            <div className="form-group">
                                <h6>Email Address</h6>
                                <input type="email" placeholder="john@example.com" />
                            </div>
                        </div>
                        <div className="form-group user-full-width">
                            <h6>Phone Number</h6>
                            <input type="tel" placeholder="+1 (555) 000-0000" />
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <h3>Add New User</h3>
                    <button className="close-btn" onClick={onClose}>
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

                    <form className="create-user-form">
                        {renderFormFields()}

                        <div className="info-banner">
                            <div className="info-icon">
                                <Icon icon="mdi:account-plus-outline" width="20" />
                            </div>
                            <div className="info-content">
                                <h6>Account Invitation</h6>
                                <p>An email will be sent to the user with instructions to set their password and activate their account.</p>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="modal-footer">
                    <button className="button cancel-btn" onClick={onClose}>Cancel</button>
                    <button className="primary-button create-btn">Create User</button>
                </div>
            </div>
        </div>
    );
};

export default CreateUserModal;
