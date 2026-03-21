import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import './ManagePolicyModal.css';
import { showSuccessAlert, showCancelConfirmAlert, showCreateConfirmAlert } from '../utils/sweetAlert';

const CreateAnnouncementModal = ({ isOpen, onClose, onSave }) => {
    const getCurrentDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        date: getCurrentDate(),
        contentcategory: 'Update' // matches backend field
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const result = await showCreateConfirmAlert(
            'Create Announcement?',
            `Are you sure you want to create "${formData.title}"?`
        );

        if (!result.isConfirmed) return;

        try {
            // --- Pass the announcement object back to parent to handle save ---
            await onSave(formData);

            await showSuccessAlert(
                'Announcement Created',
                'The announcement has been created successfully.'
            );
            onClose();

            // Reset form
            setFormData({
                title: '',
                content: '',
                date: getCurrentDate(),
                contentcategory: 'Update'
            });
        } catch (error) {
            console.error('Error creating announcement:', error);
        }
    };

    const handleCancel = async () => {
        const hasChanges = formData.title || formData.content;
        if (hasChanges) {
            const result = await showCancelConfirmAlert();
            if (result.isConfirmed) onClose();
        } else {
            onClose();
        }
    };

    return (
        <div className="general-modal-overlay">
            <div className="general-announcement-modal-container">
                <div className="general-modal-header">
                    <h3>New Announcement</h3>
                    <button className="close-btn" onClick={handleCancel}>
                        <Icon icon="mdi:close" />
                    </button>
                </div>

                <div className="modal-body">
                    <form className="create-announcement-form" onSubmit={handleSubmit}>
                      <div className="announcement-form-row">

                           <div className="announcement-form-group">
                                <h6>Category</h6>
                                <select
                                    name="contentcategory"
                                    value={formData.contentcategory}
                                    onChange={handleChange}
                                >
                                    <option value="General">General</option>
                                    <option value="Update">Update</option>
                                    <option value="News">News</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Alert">Alert</option>
                                </select>
                            </div>
                            <div className="announcement-form-group">
                                <h6>Publish Date</h6>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    readOnly
                                    disabled
                                    style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed', color: '#666',   padding: '7px 12px', fontSize: '14px'}}
                                />
                            </div>
                         
                        </div>
                     
                       <div className="announcement-form-group">
                            <h6>Announcement Title</h6>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g., System Maintenance"
                                required
                            />
                        </div>

                        <div className="announcement-form-group">
                            <h6>Content</h6>
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleChange}
                                placeholder="Enter announcement details..."
                                rows="6"
                                required
                            ></textarea>
                        </div>

                       

                        <div className="general-announcement-modal-footer">
                            <button type="button" className="button cancel-btn" onClick={handleCancel}>
                                Cancel
                            </button>
                            <button type="submit" className="primary-button save-btn">
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateAnnouncementModal;