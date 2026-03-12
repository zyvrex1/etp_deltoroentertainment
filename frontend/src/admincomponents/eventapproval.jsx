import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import './eventapproval.css';
import EventReviewModal from './Modal/EventReviewModal';
import EventRejectionModal from './Modal/EventRejectionModal';
import { showConfirmAlert } from './utils/sweetAlert';

const EventApproval = () => {
    const [events, setEvents] = useState([
        {
            id: 1,
            name: 'Creator Economy Expo',
            category: 'Business',
            promoter: 'David Kim',
            date: 'Nov 5, 2024',
            status: 'Pending Review',
            description: 'Connecting creators with brands.',
            location: 'Austin Convention Center'
        },
        {
            id: 2,
            name: 'Health & Wellness Expo',
            category: 'Health',
            promoter: 'James Wilson',
            date: 'Jan 20, 2025',
            status: 'Pending Review',
            description: 'Promoting health and wellness.',
            location: 'Los Angeles Convention Center'
        }
    ]);

    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [expandedRow, setExpandedRow] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    const totalPages = Math.ceil(events.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedEvents = events.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const toggleRow = (id) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const handleReview = (event) => {
        setSelectedEvent(event);
        setShowReviewModal(true);
    };

    const handleApproveClick = async (event) => {
        setSelectedEvent(event);
        
        const result = await showConfirmAlert(
            'Approve Event',
            `Are you sure you want to approve "${event.name}"? This will make the event live and visible to customers. The promoter will be notified of the approval.`,
            'Confirm Approval',
            'Cancel'
        );

        if (result.isConfirmed) {
            handleApprove(event);
        }
    };

    const handleRejectClick = (event) => {
        setSelectedEvent(event);
        setShowRejectionModal(true);
    };

    const handleApprove = (event) => {
        if (event) {
            setEvents(events.map(e =>
                e.id === event.id
                    ? { ...e, status: 'Approved' }
                    : e
            ));
        }
        setShowReviewModal(false);
        setSelectedEvent(null);
    };

    const handleReject = (reason) => {
        if (selectedEvent) {
            setEvents(events.map(event =>
                event.id === selectedEvent.id
                    ? { ...event, status: 'Rejected' }
                    : event
            ));
        }
        setShowRejectionModal(false);
        setShowReviewModal(false);
        setSelectedEvent(null);
    };

    const getStatusClass = (status) => {
        if (status === 'Approved') return 'status-approved';
        if (status === 'Rejected') return 'status-rejected';
        return 'status-pending';
    };

    return (
        <div className="event-approval">
            <div className="event-approval-header">
                <div>
                    <h1>Event Approvals</h1>
                    <p className="large-body-text">Review and approve incoming event requests.</p>
                </div>
            </div>

            <div className="event-approval-content">
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Event Name</th>
                                <th>Promoter</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedEvents.length > 0 ? (
                                paginatedEvents.map((event) => (
                                    <tr 
                                        key={event.id} 
                                        className={expandedRow === event.id ? 'expanded' : ''}
                                    >
                                        <td data-label="Event Name" className="event-name-td">
                                            <div className="mobile-expand-icon" onClick={() => toggleRow(event.id)}>
                                                <Icon icon={expandedRow === event.id ? "mdi:chevron-up" : "mdi:chevron-down"} />
                                            </div>
                                            <div className="event-name-cell">
                                                <div className="event-avatar">
                                                    {getInitials(event.name)}
                                                </div>
                                                <div className="event-name-info">
                                                    <h6 className="event-name">{event.name}</h6>
                                                    <div className="smaller-body-text event-category">{event.category}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td data-label="Promoter" className="regular-body-text">
                                            {event.promoter}
                                        </td>
                                        <td data-label="Date" className="small-body-text">
                                            {event.date}
                                        </td>
                                        <td data-label="Status">
                                            <span className={`button-label ${getStatusClass(event.status)}`}>
                                                {event.status}
                                            </span>
                                        </td>
                                        <td data-label="Actions">
                                            <div className="action-buttons">
                                                <button
                                                    className="button-label approval-review"
                                                    onClick={() => handleReview(event)}
                                                >
                                                    Review
                                                </button>
                                                <button
                                                    className="button-label approval-reject"
                                                    onClick={() => handleRejectClick(event)}
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    className="button-label approval-approve"
                                                    onClick={() => handleApproveClick(event)}
                                                >
                                                    Approve Event
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                                        <p className="regular-body-text">No events found.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="pagination">
                        <button
                            className="pagination-btn"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>

                        <span className="pagination-info">
                            Page {currentPage} of {totalPages}
                        </span>

                        <button
                            className="pagination-btn"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {showReviewModal && selectedEvent && (
                <EventReviewModal
                    event={selectedEvent}
                    onClose={() => {
                        setShowReviewModal(false);
                        setSelectedEvent(null);
                    }}
                    onApprove={() => handleApproveClick(selectedEvent)}
                    onReject={() => handleRejectClick(selectedEvent)}
                />
            )}

            {showRejectionModal && selectedEvent && (
                <EventRejectionModal
                    event={selectedEvent}
                    onClose={() => {
                        setShowRejectionModal(false);
                        setSelectedEvent(null);
                    }}
                    onConfirm={handleReject}
                />
            )}
        </div>
    );
};

export default EventApproval;
