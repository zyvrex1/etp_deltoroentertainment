import React from 'react';
import { Icon } from '@iconify/react';
import './CreateAnnouncementModal.css';

const CreateAnnouncementModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <h3>New Announcement</h3>
                    <button className="close-btn" onClick={onClose}>
                        <Icon icon="mdi:close" />
                    </button>
                </div>

                <div className="modal-body">
                    <form className="create-announcement-form">
                        <div className="form-group">
                            <h6>Announcement Title</h6>
                            <input type="text" placeholder="e.g., System Maintenance" />
                        </div>

                        <div className="form-group">
                            <h6>Content</h6>
                            <textarea placeholder="Enter announcement details..." rows="6"></textarea>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <h6>Publish Date</h6>
                                <input type="date" placeholder="mm/dd/yyyy" />
                            </div>
                            <div className="form-group">
                                <h6>Category</h6>
                                <select defaultValue="Update">
                                    <option value="Update">Update</option>
                                    <option value="News">News</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Alert">Alert</option>
                                </select>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="modal-footer">
                    <button className="button cancel-btn" onClick={onClose}>Cancel</button>
                    <button className="primary-button save-btn">
                        <Icon icon="mdi:content-save-outline" width="18" />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateAnnouncementModal;
