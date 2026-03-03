import React from 'react';
import { Icon } from '@iconify/react';
import './SponsorAddExhibitor.css';

const SponsorAddExhibitor = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="add-exhibitor-modal-overlay">
            <div className="add-exhibitor-modal-content">
                <div className="add-exhibitor-modal-header">
                    <h4>Add Exhibitor</h4>
                    <button className="add-exhibitor-close-btn" onClick={onClose}>
                        <Icon icon="mdi:close" width="24" />
                    </button>
                </div>

                <div className="add-exhibitor-modal-body">
                    <div className="add-exhibitor-form-group">
                        <label className="smaller-body-text">Name <span className="text-red">*</span></label>
                        <input type="text" placeholder="John Doe" className="add-exhibitor-input" />
                    </div>
                    <div className="add-exhibitor-form-group">
                        <label className="smaller-body-text">Email Address <span className="text-red">*</span></label>
                        <input type="email" placeholder="john@company.com" className="add-exhibitor-input" />
                    </div>
                    <div className="add-exhibitor-form-group">
                        <label className="smaller-body-text">Role <span className="text-red">*</span></label>
                        <input type="text" placeholder="Sales Manager" className="add-exhibitor-input" />
                    </div>
                    <div className="add-exhibitor-form-group">
                        <label className="smaller-body-text">Phone Number <span className="text-red">*</span></label>
                        <input type="text" placeholder="+1 (555) 123-4569" className="add-exhibitor-input" />
                    </div>
                </div>

                <div className="add-exhibitor-modal-footer">
                    <button className="outlined-button add-exhibitor-cancel-btn" onClick={onClose}>Cancel</button>
                    <button className="primary-button add-exhibitor-submit-btn">Add Exhibitor</button>
                </div>
            </div>
        </div>
    );
};

export default SponsorAddExhibitor;
