import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import './ManagePolicyModal.css';

const ManagePolicyModal = ({ isOpen, onClose, policy, onSave }) => {
    const [content, setContent] = useState('');

    useEffect(() => {
        if (policy) {
            setContent(policy.content || '');
        }
    }, [policy]);

    if (!isOpen || !policy) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...policy, content });
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container policy-modal">
                <div className="modal-header">
                    <h3>{policy.title}</h3>
                    <button className="policy-close-btn" onClick={onClose}>
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
                    </form>
                </div>

                <div className="policy-modal-footer">
                    <span className="smaller-body-text last-updated">Last updated: {policy.lastUpdated}</span>
                    <div className="policy-modal-actions">
                        <button className="button cancel-btn" onClick={onClose}>Cancel</button>
                        <button type="submit" form="policy-form" className="primary-button save-btn">
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagePolicyModal;
