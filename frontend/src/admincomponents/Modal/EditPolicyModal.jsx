import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import './ManagePolicyModal.css';
import { showSuccessAlert, showCancelConfirmAlert, showUpdateConfirmAlert } from '../utils/sweetAlert';

const ManagePolicyModal = ({ isOpen, onClose, policy, onSave }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [date, setDate] = useState('');

    useEffect(() => {
        if (policy) {
            setTitle(policy.title || '');
            setContent(policy.content || '');
            setDate(policy.lastUpdated ? new Date(policy.lastUpdated).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        }
    }, [policy]);

    if (!isOpen || !policy) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await showUpdateConfirmAlert(
            'Update Policy?',
            `Are you sure you want to update "${policy.title}"?`
        );

        if (!result.isConfirmed) {
            return;
        }

        try {
            onSave({ ...policy, title, content, lastUpdated: new Date(date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) });
            await showSuccessAlert('Policy Updated', 'The policy has been updated successfully.');
            onClose();
        } catch (error) {
            console.error('Error updating policy:', error);
        }
    };

    const handleCancel = async () => {
        const hasChanges = title !== (policy?.title || '') || content !== (policy?.content || '') || date !== (policy?.lastUpdated ? new Date(policy.lastUpdated).toISOString().split('T')[0] : '');
        if (hasChanges) {
            const result = await showCancelConfirmAlert();
            if (result.isConfirmed) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    return (
        <div className="general-modal-overlay">
            <div className="general-announcement-modal-container">
                <div className="general-modal-header">
                    <h3>Edit Policy</h3>
                    <button type="button" className="close-btn" onClick={handleCancel}>
                        <Icon icon="mdi:close" />
                    </button>
                </div>

                <div className="modal-body">
                    <form className="create-announcement-form" onSubmit={handleSubmit}>
                        <div className="announcement-form-group">
                            <h6>Policy Title</h6>
                            <input
                                type="text"
                                className="regular-body-text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Terms of Service"
                                required
                            />
                        </div>

                        <div className="announcement-form-group">
                            <h6>Content</h6>
                            <textarea
                                className="regular-body-text"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Enter policy details here..."
                                rows="6"
                                required
                            ></textarea>
                        </div>

                        <div className="announcement-form-row">
                            <div className="announcement-form-group">
                                <h6>Publish Date</h6>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="general-announcement-modal-footer">
                            <button type="button" className="button cancel-btn" onClick={handleCancel}>Cancel</button>
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

export default ManagePolicyModal;
