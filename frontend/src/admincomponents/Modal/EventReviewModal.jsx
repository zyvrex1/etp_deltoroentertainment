import React from 'react';
import { Icon } from '@iconify/react';
import './EventReviewModal.css';

const EventReviewModal = ({ event, onClose, onApprove, onReject }) => {
    const getInitials = (name) => {
        if (!name) return "?";
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 1);
    };

    const isPending = event.status === "pending";
    const promoterName = event.createdBy ? `${event.createdBy.firstName} ${event.createdBy.lastName}` : "Unknown";

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
                                <h5 className="event-review-value">{event.title}</h5>
                            </div>
                            <div className=" event-review-field">
                                <label className="small-body-text">Category</label>
                                <h5 className="event-review-value">{event.category}</h5>
                            </div>
                            <div className=" event-review-field">
                                <label className="small-body-text">Date</label>
                                <h5 className="event-review-value">
                                    {event.startDate ? new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
                                </h5>
                            </div>
                            <div className="event-review-field">
                                <label className="small-body-text">Location</label>
                                <h5 className="event-review-value">{event.venue?.name || "N/A"}</h5>
                            </div>
                            <div className="event-review-field full-width">
                                <label className="small-body-text">Description</label>
                                <h5 className="event-review-value">{event.description || "No description provided."}</h5>
                            </div>
                        </div>
                    </div>

                    <div className="event-review-divider"></div>

                    <div className="event-review-section">
                        <h4>Promoter Info</h4>
                        <div className="promoter-info">
                            <div className="promoter-avatar">
                                {getInitials(promoterName)}
                            </div>
                            <div className="promoter-details">
                                <h5 className="promoter-name">{promoterName}</h5>
                                <div className="smaller-body-text promoter-status">Active Promoter</div>
                            </div>
                        </div>
                    </div>

                    <div className={`general-eventreview-modal-footer ${!isPending ? "status-view" : ""}`}>

                        {isPending ? (
                            <>
                                <button className="cancel-btn" onClick={onClose}>
                                    Close
                                </button>

                                <button className="primary-button reject-btn" onClick={onReject}>
                                    Reject
                                </button>

                                <button className="secondary-button save-btn" onClick={onApprove}>
                                    Approve
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="cancel-btn" onClick={onClose}>
                                    Close
                                </button>

                                <span className={`button-label ${event.status === "approved" ? "status-approved" : "status-rejected"
                                    }`}>
                                    {event.status}
                                </span>
                            </>
                        )}

                    </div>
                </div>


            </div>
        </div>
    );
};

export default EventReviewModal;
