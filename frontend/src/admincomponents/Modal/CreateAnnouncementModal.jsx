import React from 'react';
import { Icon } from '@iconify/react';
import './CreateAnnouncementModal.css';

const CreateAnnouncementModal = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = React.useState({
        title: '',
        content: '',
        date: '',
        category: 'Update'
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
        // Reset form
        setFormData({
            title: '',
            content: '',
            date: '',
            category: 'Update'
        });
    };

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
                    <form className="create-announcement-form" onSubmit={handleSubmit}>
                        <div className="form-group">
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

                        <div className="form-group">
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

                        <div className="form-row">
                            <div className="form-group">
                                <h6>Publish Date</h6>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    placeholder="mm/dd/yyyy"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <h6>Category</h6>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                >
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
                    <button className="primary-button announce-save-btn" onClick={handleSubmit}>
                        <Icon icon="mdi:content-save-outline" width="18" />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateAnnouncementModal;
