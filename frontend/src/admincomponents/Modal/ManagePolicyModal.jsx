import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import './ManagePolicyModal.css';
import { showSuccessAlert, showCancelConfirmAlert, showUpdateConfirmAlert } from '../utils/sweetAlert';

const ManagePolicyModal = ({ isOpen, onClose, policy, onSave }) => {
    const [content, setContent] = useState('');

    useEffect(() => {
        if (policy) {
            setContent(policy.content || '');
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
            onSave({ ...policy, content });
            await showSuccessAlert('Policy Updated', 'The policy has been updated successfully.');
            onClose();
        } catch (error) {
            console.error('Error updating policy:', error);
        }
    };

    const handleCancel = async () => {
        const hasChanges = content !== (policy?.content || '');
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
            <div className="general-modal-container">
                <div className="general-modal-header">
                    <h3>{policy.title}</h3>
                    <button className="close-btn" onClick={handleCancel}>
                        <Icon icon="mdi:close" />
                    </button>
                </div>

                <div className="modal-body">
                    <form id="policy-form" className="manage-policy-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <h4>Policy Content</h4>
                            <p className="regular-body-text helper-text">You can use Markdown or plain text to format your policy.</p>
                            <textarea
                                className="regular-body-text policy-editor"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Enter policy details here..."
                                required
                            ></textarea>
                        </div>

                        <div className="general-modal-footer">
                            <span className="smaller-body-text last-updated">Last updated: {policy.lastUpdated}</span>
                            <div className="policy-modal-actions">
                                <button type="button" className="button cancel-btn" onClick={handleCancel}>Cancel</button>
                                <button type="submit" form="policy-form" className="primary-button save-btn">
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </form>
                </div>


            </div>
        </div>
    );
};

export default ManagePolicyModal;
