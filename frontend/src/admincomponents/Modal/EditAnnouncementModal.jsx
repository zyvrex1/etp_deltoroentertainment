import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import './ManagePolicyModal.css';
import { showSuccessAlert, showCancelConfirmAlert, showUpdateConfirmAlert } from '../../utils/sweetAlert';

const EditAnnouncementModal = ({ isOpen, onClose, onSave, announcement }) => {
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        date: '',
        contentcategory: 'Update' // match backend
    });

    useEffect(() => {
        if (announcement) {
            setFormData({
                title: announcement.title || '',
                content: announcement.content || '',
                date: announcement.date ? announcement.date.split('T')[0] : '', // format for date input
                contentcategory: announcement.contentcategory || 'Update'
            });
        }
    }, [announcement]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await showUpdateConfirmAlert(
            'Update Announcement?',
            `Are you sure you want to update "${formData.title}"?`
        );
        if (!result.isConfirmed) return;

        try {
            await onSave({ ...formData, id: announcement?.id });
            onClose();
            showSuccessAlert('Announcement Updated', 'The announcement has been updated successfully.');
        } catch (error) {
            console.error('Error updating announcement:', error);
        }
    };

    const handleCancel = async () => {
        const hasChanges =
            formData.title !== (announcement?.title || '') ||
            formData.content !== (announcement?.content || '') ||
            formData.date !== (announcement?.date ? announcement.date.split('T')[0] : '') ||
            formData.contentcategory !== (announcement?.contentcategory || 'Update');

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
                    <h3>Edit Announcement</h3>
                    <button className="close-btn" onClick={handleCancel}>
                        <Icon icon="mdi:close" />
                    </button>
                </div>

                <div className="modal-body">
                    <form className="create-announcement-form" onSubmit={handleSubmit}>
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

                        <div className="announcement-form-row">
                            <div className="announcement-form-group">
                                <h6>Publish Date</h6>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="announcement-form-group">
                                <h6>Category</h6>
                                <select
                                    name="contentcategory"
                                    value={formData.contentcategory}
                                    onChange={handleChange}
                                >
                                    <option value="Update">Update</option>
                                    <option value="News">News</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Alert">Alert</option>
                                </select>
                            </div>
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

export default EditAnnouncementModal;