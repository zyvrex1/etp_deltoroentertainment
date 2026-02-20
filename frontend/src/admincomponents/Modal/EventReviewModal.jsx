import React from 'react';
import { Icon } from '@iconify/react';
import './EventReviewModal.css';

const EventReviewModal = ({ event, onClose, onApprove, onReject }) => {
    const getInitials = (name) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 1);
    };

    return (
        <div className="general-modal-overlay" onClick={onClose}>
            <div className="general-eventreview-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="general-modal-header">
                    <h3>Review Event</h3>
                    <button className="close-btn" onClick={onClose}>
                        <Icon icon="mdi:close" width="24" />
                    </button>
                </div>

                <div className="event-review-modal-body">
                    <div className="event-review-section">
                        <h4>Event Details</h4>
                        <div className="event-review-grid">
                            <div className="event-review-field">
                                <label className="small-body-text">Title</label>
                                <h5 className="event-review-value">{event.name}</h5>
                            </div>
                            <div className=" event-review-field">
                                <label className="small-body-text">Category</label>
                                <h5 className="event-review-value">{event.category}</h5>
                            </div>
                            <div className=" event-review-field">
                                <label className="small-body-text">Date</label>
                                <h5 className="event-review-value">{event.date}</h5>
                            </div>
                            <div className="event-review-field">
                                <label className="small-body-text">Location</label>
                                <h5 className="event-review-value">{event.location}</h5>
                            </div>
                            <div className="event-review-field full-width">
                                <label className="small-body-text">Description</label>
                                <h5 className="event-review-value">{event.description}</h5>
                            </div>
                        </div>
                    </div>

                    <div className="event-review-divider"></div>

                    <div className="event-review-section">
                        <h4>Promoter Info</h4>
                        <div className="promoter-info">
                            <div className="promoter-avatar">
                                {getInitials(event.promoter)}
                            </div>
                            <div className="promoter-details">
                                <h5 className="promoter-name">{event.promoter}</h5>
                                <div className="smaller-body-text promoter-status">Active Promoter</div>
                            </div>
                        </div>
                    </div>

                    <div className="general-modal-footer">
                    <button className="cancel-btn" onClick={onClose}>
                        Close
                    </button>
                    <button className="primary-button reject-btn" onClick={onReject}>
                        Reject
                    </button>
                    <button className="secondary-button save-btn" onClick={onApprove}>
                        Approve Event
                    </button>
                </div>
                </div>

                
            </div>
        </div>
    );
};

export default EventReviewModal;
