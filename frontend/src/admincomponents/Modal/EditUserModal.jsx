import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import './EditUserModal.css';
import { showSuccessAlert, showCancelConfirmAlert, showUpdateConfirmAlert } from '../utils/sweetAlert';

const EditUserModal = ({ isOpen, onClose, user, type }) => {
    if (!isOpen || !user) return null;

    // Form States
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        companyName: '',
        industry: '',
        bankAccount: '',
        currentPassword: '*************',
        newPassword: '',
    });

    const [showPassword, setShowPassword] = useState(false);

    // Initialize form data when user/type changes
    useEffect(() => {
        if (user) {
            let initialData = {
                fullName: '',
                email: '',
                phone: '+1 (555) 000-0000', // Mock default
                companyName: '',
                industry: '',
                bankAccount: '',
                currentPassword: '*************',
                newPassword: ''
            };

            if (type === 'admin' || type === 'customer') {
                initialData.fullName = user.name;
                initialData.email = user.email;
            } else if (type === 'promoter') {
                // Promoter: name is Org, contact is Email
                initialData.companyName = user.name;
                initialData.email = user.contact;
                initialData.fullName = "Alex Thompson"; // Mock person name
                initialData.industry = "Event Management"; // Mock
                initialData.bankAccount = "1234"; // Mock
            } else if (type === 'sponsor') {
                // Sponsor: company is Org, contact is Name
                initialData.companyName = user.company;
                initialData.fullName = user.contact;
                initialData.email = "sponsor@example.com"; // Mock missing email
                initialData.industry = user.industry;
            } else {
                // Fallback for All Users tab items that are mixed
                initialData.fullName = user.name;
                initialData.email = user.email || user.contact;
            }

            setFormData(initialData);
        }
    }, [user, type]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await showUpdateConfirmAlert(
            'Update User?',
            'Are you sure you want to update this user\'s information?'
        );

        if (!result.isConfirmed) {
            return;
        }

        try {
            // Here you would typically send the data to your API
            await showSuccessAlert('User Updated', 'The user information has been updated successfully.');
            onClose();
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };

    const handleCancel = async () => {
        const hasChanges = Object.keys(formData).some(key => {
            const originalValue = user[key] || user.name || user.email || user.contact || '';
            return formData[key] !== originalValue;
        });

        if (hasChanges) {
            const result = await showCancelConfirmAlert();
            if (result.isConfirmed) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    const getTitle = () => {
        return "Edit User";
    };

    return (
        <div className="general-modal-overlay" onClick={handleCancel}>
            <div className="general-modal-container" onClick={e => e.stopPropagation()}>
                <div className="general-modal-header">
                    <h3>{getTitle()}</h3>
                    <button className="close-btn" onClick={handleCancel}>
                        <Icon icon="mdi:close" width="24" height="24" />
                    </button>
                </div>

                <div className="edit-user-modal-body">
                    <form id="edit-user-form" className="edit-user-form" onSubmit={handleSubmit}>
                        {/* Common Fields: Full Name & Email (or specific based on type) */}
                        <div className="add-user-form-row">
                            <div className="add-user-form-group">
                                <h6>Full Name</h6>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div className="add-user-form-group">
                                <h6>Email Address</h6>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="john@example.com"
                                />
                            </div>
                        </div>

                        {/* Specific Fields */}
                        {(type === 'sponsor') && (
                        <div className="add-user-form-row">
                            <div className="add-user-form-group">
                                    <h6>Company Name</h6>
                                    <input
                                        type="text"
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        placeholder="e.g. 1234"
                                    />
                                </div>
                            <div className="add-user-form-group">
                                    <h6>Industry</h6>
                                    <input
                                        type="text"
                                        name="industry"
                                        value={formData.industry}
                                        onChange={handleChange}
                                        placeholder="e.g. Technology"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Bank Account for Promoter (as per inference from design/context) */}
                        {/* Design 3 has Bank Account (Last 4) */}
                        {type === 'promoter' && (
                        <div className="add-user-form-row">
                            <div className="add-user-form-group">
                                    <h6>Bank Account (Last 4)</h6>
                                    <input
                                        type="text"
                                        name="bankAccount"
                                        value={formData.bankAccount}
                                        onChange={handleChange}
                                        placeholder="e.g. 1234"
                                    />
                                </div>
                                {/* Phone placeholder to balance grid if needed, or maintain single row */}
                            <div className="add-user-form-group">
                                    <h6>Phone Number</h6>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                            </div>
                        )}

                        {type !== 'promoter' && (
                        <div className="add-user-form-group add-user-full-width">
                                    <h6>Phone Number</h6>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                        )}

                        {/* Password Section */}
                        <div className="add-user-form-row">
                            <div className="add-user-form-group">
                                <h6>Current Password</h6>
                                <div className="password-input-wrapper">
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        value={formData.currentPassword}
                                        readOnly
                                        className="read-only-input"
                                    />
                                    <Icon icon="mdi:eye" className="password-icon" />
                                </div>
                            </div>
                            <div className="add-user-form-group">
                                <h6>Edit Password</h6>
                                <input
                                    type="text" // Design shows clear text placeholder "Edit Password" initially maybe?
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    placeholder="Edit Password"
                                />
                            </div>
                        </div>

                        <button type="button" className="primary-button add-temp-password-btn">
                            Add Temporary Password
                        </button>

                        <div className="general-modal-footer">
                            <button type="button" className="outlined-button cancel-btn" onClick={handleCancel}>Cancel</button>
                            <button type="submit" form="edit-user-form" className="primary-button save-btn">Save Changes</button>
                            {/* Design sometimes shows "Create User" but "Save Changes" is correct for Edit */}
                        </div>
                    </form>

                </div>


            </div>
        </div>
    );
};

export default EditUserModal;
