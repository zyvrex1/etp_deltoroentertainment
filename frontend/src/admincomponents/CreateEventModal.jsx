import React from 'react';
import { Icon } from '@iconify/react';
import './CreateEventModal.css';

const CreateEventModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <h3>Create New Event</h3>
                    <button className="close-btn" onClick={onClose}>
                        <Icon icon="mdi:close" />
                    </button>
                </div>

                <div className="modal-body">
                    <form className="create-event-form">
                        <div className="form-row">
                            <div className="form-group">
                                <h6>Event Title</h6>
                                <input className="outlined-button" type="text" placeholder="e.g. Tech Summit 2024" />
                            </div>
                            <div className="form-group">
                                <h6>Category</h6>
                                <input type="text" placeholder="e.g. Technology" />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <h6>Date</h6>
                                <input type="date" placeholder="mm/dd/yyyy" />
                            </div>
                            <div className="form-group">
                                <h6>Location</h6>
                                <input type="text" placeholder="Venue name" />
                            </div>
                        </div>

                        <div className="section-box">
                            <h5 className="modal-section-title">Capacity & Layout</h5>
                            <div className="form-row">
                                <div className="form-group">
                                    <h6>Total Tickets</h6>
                                    <input type="number" placeholder="0" />
                                </div>
                                <div className="form-group">
                                    <h6>Total Booths</h6>
                                    <input type="number" placeholder="0" />
                                </div>
                            </div>
                        </div>

                        <div className="form-group full-width">
                            <h6>About The Event</h6>
                            <textarea placeholder="Event description..." rows="4"></textarea>
                        </div>

                        <div className="form-group full-width">
                            <h6>Venue Information</h6>
                            <textarea placeholder="Event description..." rows="4"></textarea>
                        </div>
                    </form>
                </div>

                <div className="modal-footer">
                    <button className="button cancel-btn" onClick={onClose}>Cancel</button>
                    <button className="primary-button create-btn">Create Event</button>
                </div>
            </div>
        </div>
    );
};

export default CreateEventModal;
