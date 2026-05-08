import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import './EditUserModal.css';
import { showSuccessAlert, showCancelConfirmAlert, showUpdateConfirmAlert, showErrorAlert, showWarningAlert } from '../../utils/sweetAlert';
import adminService from '../../services/adminService';
import { useAuthContext } from '../../hooks/useAuthContext';

const EditUserModal = ({ isOpen, onClose, user, type }) => {
    const { user: currentUser } = useAuthContext();

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
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);

    // Initialize form data when user/type changes
    useEffect(() => {
        if (user) {
            let initialData = {
                fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                email: user.email || '',
                phone: user.phone || '',
                companyName: user.roleDetails?.companyName || '',
                industry: user.roleDetails?.industry || '',
                bankAccount: user.roleDetails?.bankAccount || '',
                currentPassword: '*************',
                newPassword: ''
            };

            // Adjustments based on type if needed
            if (type === 'promoter') {
                initialData.companyName = user.roleDetails?.companyName || '';
            } else if (type === 'sponsor') {
                initialData.companyName = user.roleDetails?.companyName || '';
                initialData.industry = user.roleDetails?.industry || '';
            }

            setFormData(initialData);
        }
    }, [user, type]);

    if (!isOpen || !user) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.newPassword) {
            showErrorAlert('Error', 'Please enter a new password.');
            return;
        }

        const result = await showUpdateConfirmAlert(
            'Update Password?',
            'Are you sure you want to update this user\'s password?'
        );

        if (!result.isConfirmed) {
            return;
        }

        try {
            const response = await adminService.updateUser(user._id, { password: formData.newPassword }, currentUser.token);
            
            onClose();
            if (response.warning) {
                showWarningAlert('Partial Success', response.message);
            } else {
                showSuccessAlert('Password Updated', 'The user\'s password has been updated successfully.');
            }
        } catch (error) {
            console.error('Error updating password:', error);
            showErrorAlert('Update Failed', error.message || 'Could not update password.');
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
            <div className="general-edituser-modal-container" onClick={e => e.stopPropagation()}>
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
                                    readOnly
                                    className="read-only-input"
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div className="add-user-form-group">
                                <h6>Email Address</h6>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    readOnly
                                    className="read-only-input"
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
                                        readOnly
                                        className="read-only-input"
                                        placeholder="e.g. Acme Corp"
                                    />
                                </div>
                                <div className="add-user-form-group">
                                    <h6>Industry</h6>
                                    <input
                                        type="text"
                                        name="industry"
                                        value={formData.industry}
                                        readOnly
                                        className="read-only-input"
                                        placeholder="e.g. Technology"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Bank Account for Promoter */}
                        {type === 'promoter' && (
                            <div className="add-user-form-row">
                                <div className="add-user-form-group">
                                    <h6>Bank Account (Last 4)</h6>
                                    <input
                                        type="text"
                                        name="bankAccount"
                                        value={formData.bankAccount}
                                        readOnly
                                        className="read-only-input"
                                        placeholder="e.g. 1234"
                                    />
                                </div>
                                <div className="add-user-form-group">
                                    <h6>Phone Number</h6>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        readOnly
                                        className="read-only-input"
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
                                    readOnly
                                    className="read-only-input"
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
                                        type={showCurrentPassword ? "text" : "password"}
                                        name="currentPassword"
                                        value={formData.currentPassword}
                                        readOnly
                                        className="read-only-input"
                                    />
                                    <Icon 
                                        icon={showCurrentPassword ? "mdi:eye-off" : "mdi:eye"} 
                                        className="password-icon" 
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    />
                                </div>
                            </div>
                            <div className="add-user-form-group">
                                <h6>New Password</h6>
                                <input
                                    type="text"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    placeholder="Enter New Password"
                                />
                            </div>
                        </div>

                        <button 
                            type="button" 
                            className="primary-button add-temp-password-btn"
                            onClick={async () => {
                                const result = await showUpdateConfirmAlert(
                                    'Send Temporary Password?',
                                    `A random temporary password will be generated and saved for ${formData.email}.`
                                );
                                if (result.isConfirmed) {
                                    try {
                                        // Generate a random 8-character password
                                        const tempPass = Math.random().toString(36).slice(-8);
                                        const response = await adminService.updateUser(user._id, { password: tempPass }, currentUser.token);
                                        
                                        onClose();
                                        if (response.warning) {
                                            showWarningAlert('Partial Success', response.message);
                                        } else {
                                            showSuccessAlert('Success', `A temporary password has been set and sent to ${formData.email}.`);
                                        }
                                    } catch (error) {
                                        console.error('Error sending temp password:', error);
                                        showErrorAlert('Error', 'Could not set temporary password.');
                                    }
                                }
                            }}
                        >
                            Send Temporary Password
                        </button>

                        <div className="general-edituser-modal-footer">
                            <button type="button" className="outlined-button cancel-btn" onClick={handleCancel}>Cancel</button>
                            <button type="submit" form="edit-user-form" className="primary-button save-btn">Update Password</button>
                        </div>
                    </form>
                </div>


            </div>
        </div>
    );
};

export default EditUserModal;
