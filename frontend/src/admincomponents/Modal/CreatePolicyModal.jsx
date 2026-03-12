import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import './ManagePolicyModal.css';
import { showSuccessAlert, showCancelConfirmAlert, showCreateConfirmAlert } from '../utils/sweetAlert';

const CreatePolicyModal = ({ isOpen, onClose, onSave }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await showCreateConfirmAlert(
            'Create Policy?',
            `Are you sure you want to create "${title}"?`
        );

        if (!result.isConfirmed) {
            return;
        }

        try {
            const newPolicy = {
                id: title.toLowerCase().replace(/\s+/g, '-'),
                title,
                content,
                lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
            };
            onSave(newPolicy);
            await showSuccessAlert('Policy Created', 'The policy has been created successfully.');
            onClose();
            setTitle('');
            setContent('');
        } catch (error) {
            console.error('Error creating policy:', error);
        }
    };

    const handleCancel = async () => {
        const hasChanges = title || content;
        if (hasChanges) {
            const result = await showCancelConfirmAlert();
            if (result.isConfirmed) {
                onClose();
                setTitle('');
                setContent('');
            }
        } else {
            onClose();
        }
    };

    return (
        <div className="general-modal-overlay">
            <div className="general-announcement-modal-container">
                <div className="general-modal-header">
                    <h3>New Policy</h3>
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
                                    value={new Date().toISOString().split('T')[0]}
                                    readOnly
                                    disabled
                                    style={{
                                        backgroundColor: '#f5f5f5',
                                        cursor: 'not-allowed',
                                        color: '#666'
                                    }}
                                    required
                                />
                            </div>
                        </div>

                        <div className="general-announcement-modal-footer">
                            <button type="button" className="button cancel-btn" onClick={handleCancel}>Cancel</button>
                            <button type="submit" className="primary-button save-btn">
                                Create Policy
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreatePolicyModal;
