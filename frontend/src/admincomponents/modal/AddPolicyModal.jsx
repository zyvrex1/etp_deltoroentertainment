import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { showSuccessAlert, showCancelConfirmAlert } from '../utils/sweetAlert';

const AddPolicyModal = ({ isOpen, onClose, onSave, existingPolicies = [] }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [policyKey, setPolicyKey] = useState('tos'); // default selection

    if (!isOpen) return null;

    // Collect keys already used
    const usedKeys = existingPolicies.map(policy => policy.policyKey);

    const availableKeys = ["tos", "privacy", "refund"].filter(key => !usedKeys.includes(key));

    // If default policyKey is already used, pick the first available
    const defaultKey = availableKeys.includes(policyKey) ? policyKey : availableKeys[0] || '';

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const newPolicy = {
                title,
                content,
                policyKey: defaultKey, // use the selected key
            };

            await onSave(newPolicy);
            await showSuccessAlert('Policy Added', 'The policy has been added successfully.');
            onClose();
        } catch (error) {
            console.error('Error adding policy:', error);
        }
    };

    const handleCancel = async () => {
        const hasChanges = title || content;
        if (hasChanges) {
            const result = await showCancelConfirmAlert();
            if (result.isConfirmed) onClose();
        } else {
            onClose();
        }
    };

    return (
        <div className="general-modal-overlay">
            <div className="general-modal-container">
                <div className="general-modal-header">
                    <h3>Add New Policy</h3>
                    <button className="close-btn" onClick={handleCancel}>
                        <Icon icon="mdi:close" />
                    </button>
                </div>

                <div className="modal-body">
                    <form id="add-policy-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <h4>Policy Key</h4>
                            <select
                                value={defaultKey}
                                onChange={(e) => setPolicyKey(e.target.value)}
                                required
                            >
                                {availableKeys.map(key => (
                                    <option key={key} value={key}>
                                        {key === "tos"
                                            ? "Terms of Service"
                                            : key === "privacy"
                                            ? "Privacy Policy"
                                            : "Refund Policy"}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <h4>Policy Title</h4>
                            <input
                                type="text"
                                className="regular-body-text policy-title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter policy title..."
                                required
                            />
                        </div>

                        <div className="form-group">
                            <h4>Policy Content</h4>
                            <textarea
                                className="regular-body-text policy-editor"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Enter policy details here..."
                                required
                            ></textarea>
                        </div>

                        <div className="policy-modal-footer">
                            <div className="policy-modal-actions">
                                <button type="button" className="button cancel-btn" onClick={handleCancel}>
                                    Cancel
                                </button>
                                <button type="submit" className="primary-button save-btn">
                                    Add Policy
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddPolicyModal;