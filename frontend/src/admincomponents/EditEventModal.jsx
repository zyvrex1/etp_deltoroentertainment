import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import './EditEventModal.css';

const EditEventModal = ({ isOpen, onClose, event }) => {
    // Local state for form fields to handle editing
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        date: '',
        location: '',
        totalTickets: '',
        totalBooths: '',
        description: '',
        venueInfo: ''
    });

    useEffect(() => {
        if (event) {
            setFormData({
                title: event.name || '',
                category: event.category || '', // Assuming category exists in event object or default
                date: event.date ? new Date(event.date).toISOString().split('T')[0] : '', // Simple formatting
                location: event.location || '',
                totalTickets: event.total || '',
                totalBooths: event.booths || '', // Assuming booths count exists
                description: event.description || '',
                venueInfo: event.venueInfo || ''
            });
        }
    }, [event]);

    if (!isOpen) return null;

    return (
        <div className="edit-event-modal-overlay">
            <div className="edit-event-modal-container">
                <div className="edit-event-modal-header">
                    <h3>Edit Event</h3>
                    <button className="close-btn" onClick={onClose}>
                        <Icon icon="mdi:close" width="24" height="24" />
                    </button>
                </div>

                <div className="edit-event-modal-body">
                    <form className="edit-event-form">
                        <div className="form-row">
                            <div className="form-group">
                                <h6>Event Title</h6>
                                <input
                                    className="outlined-button"
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Tech Summit 2024"
                                />
                            </div>
                            <div className="form-group">
                                <h6>Category</h6>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    placeholder="e.g. Technology"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <h6>Date</h6>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    placeholder="mm/dd/yyyy"
                                />
                            </div>
                            <div className="form-group">
                                <h6>Location</h6>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="Venue name"
                                />
                            </div>
                        </div>

                        <div className="section-box">
                            <h5 className="modal-section-title">Capacity & Layout</h5>
                            <div className="form-row">
                                <div className="form-group">
                                    <h6>Total Tickets</h6>
                                    <input
                                        type="number"
                                        value={formData.totalTickets}
                                        onChange={(e) => setFormData({ ...formData, totalTickets: e.target.value })}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="form-group">
                                    <h6>Total Booths</h6>
                                    <input
                                        type="number"
                                        value={formData.totalBooths}
                                        onChange={(e) => setFormData({ ...formData, totalBooths: e.target.value })}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-group full-width">
                            <h6>About The Event</h6>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Event description..."
                                rows="4"
                            ></textarea>
                        </div>

                        <div className="form-group full-width">
                            <h6>Venue Information</h6>
                            <textarea
                                value={formData.venueInfo}
                                onChange={(e) => setFormData({ ...formData, venueInfo: e.target.value })}
                                placeholder="Venue details..."
                                rows="4"
                            ></textarea>
                        </div>
                    </form>

                    {/* Extra Action Buttons for Edit Mode */}
                    <div className="extra-actions-row">
                        <button className="outlined-button action-row-btn">
                            <Icon icon="mdi:ticket-confirmation-outline" />
                            Manage Tickets
                        </button>
                        <button className="outlined-button action-row-btn">
                            <Icon icon="mdi:floor-plan" />
                            Edit Booth Map
                        </button>
                    </div>
                </div>

                <div className="edit-event-modal-footer">
                    <button className="button cancel-btn" onClick={onClose}>Cancel</button>
                    <button className="primary-button save-btn">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default EditEventModal;
