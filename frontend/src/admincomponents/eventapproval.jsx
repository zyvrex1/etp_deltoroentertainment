import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';
import './eventapproval.css';
import EventReviewModal from './Modal/EventReviewModal';
import EventRejectionModal from './Modal/EventRejectionModal';
import { showConfirmAlert, showSuccessAlert, showErrorAlert } from '../utils/sweetAlert';
import { useAuthContext } from '../hooks/useAuthContext';

const EventApproval = () => {
    const { user } = useAuthContext();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [expandedRow, setExpandedRow] = useState(null);

    // SEARCH + FILTER
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("pending");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // PAGINATION
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    const filterOptions = [
        { value: "all", label: "All Status" },
        { value: "pending", label: "Pending Review" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" }
    ];

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:4000/api/events', {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            setEvents(response.data);
        } catch (error) {
            console.error('Error fetching events:', error);
            showErrorAlert('Error', 'Failed to load events.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchEvents();
        }
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDropdownOpen]);

    const getFilterLabel = () => {
        const option = filterOptions.find((opt) => opt.value === activeFilter);
        return option ? option.label : "All Status";
    };

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
        setCurrentPage(1);
        setIsDropdownOpen(false);
    };

    // FILTER EVENTS
    const filteredEvents = useMemo(() => {
        const q = searchQuery.toLowerCase();

        return events.filter((event) => {
            const matchesFilter =
                activeFilter === "all" ? true : event.status === activeFilter;

            if (!matchesFilter) return false;

            if (!q) return true;

            const promoterName = event.createdBy ? `${event.createdBy.firstName} ${event.createdBy.lastName}` : "Unknown";

            return (
                (event.title || "").toLowerCase().includes(q) ||
                promoterName.toLowerCase().includes(q) ||
                (event.category || "").toLowerCase().includes(q)
            );
        });
    }, [events, searchQuery, activeFilter]);

    // PAGINATION BASED ON FILTERED EVENTS
    const totalPages = Math.ceil(filteredEvents.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const toggleRow = (id) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const getInitials = (name) => {
        if (!name) return "??";
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
        const result = await showConfirmAlert(
            'Approve Event',
            `Are you sure you want to approve "${event.title}"? This will make the event live and visible to customers. The promoter will be notified of the approval.`,
            'Confirm Approval',
            'Cancel',
            true
        );

        if (result.isConfirmed) {
            handleUpdateStatus(event.id || event._id, 'approved');
        }
    };

    const handleRejectClick = (event) => {
        setSelectedEvent(event);
        setShowRejectionModal(true);
    };

    const handleUpdateStatus = async (eventId, status) => {
        try {
            const response = await axios.patch(`http://localhost:4000/api/events/${eventId}`, 
                { status }, 
                { headers: { 'Authorization': `Bearer ${user.token}` } }
            );
            
            // Update local state
            setEvents(prev => prev.map(e => (e._id === eventId || e.id === eventId) ? response.data.event : e));
            
            setShowReviewModal(false);
            setShowRejectionModal(false);
            setSelectedEvent(null);

            await showSuccessAlert('Success!', `Event has been ${status}.`);
            
        } catch (error) {
            console.error('Error updating status:', error);
            showErrorAlert('Update Failed', error.response?.data?.error || 'Could not update event status.');
        }
    };

    const handleReject = (reason) => {
        if (selectedEvent) {
            handleUpdateStatus(selectedEvent.id || selectedEvent._id, 'rejected');
        }
    };

    const getStatusClass = (status) => {
        if (status === 'approved') return 'status-approved';
        if (status === 'rejected') return 'status-rejected';
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
                <div className="eventapproval-toolbar">
                    <div className="eventapproval-toolbar-left">
                        <div className="eventapproval-search">
                            <Icon icon="mdi:magnify" />
                            <input
                                type="text"
                                placeholder="Search events..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="small-body-text"
                            />
                        </div>
                    </div>

                    <div className="eventapproval-toolbar-right">
                        <div className="eventapproval-filter-dropdown" ref={dropdownRef}>
                            <button
                                className="eventapproval-filter-dropdown-btn"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <span className="truncate-text">{getFilterLabel()}</span>
                                <Icon
                                    icon="mdi:chevron-down"
                                    className={`dropdown-icon ${isDropdownOpen ? "open" : ""}`}
                                />
                            </button>

                            {isDropdownOpen && (
                                <div className="eventapproval-filter-dropdown-menu">
                                    {filterOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            className={`eventapproval-filter-dropdown-item small-body-text ${activeFilter === option.value ? "active" : ""
                                                }`}
                                            onClick={() => handleFilterChange(option.value)}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="table-wrapper">
                    {loading ? (
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
                                {[...Array(itemsPerPage)].map((_, i) => (
                                    <tr key={i}>
                                        <td>
                                            <div className="event-name-cell" style={{ gap: '12px' }}>
                                                <div className="skeleton skeleton-circle" style={{ width: '40px', height: '40px' }} />
                                                <div style={{ flex: 1 }}>
                                                    <div className="skeleton skeleton-text title" style={{ width: '120px', marginBottom: '4px' }} />
                                                    <div className="skeleton skeleton-text short" style={{ width: '80px' }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '100px' }} /></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '80px' }} /></td>
                                        <td><div className="skeleton skeleton-badge" style={{ width: '70px', height: '24px' }} /></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <div className="skeleton skeleton-rect" style={{ width: '60px', height: '32px' }} />
                                                <div className="skeleton skeleton-rect" style={{ width: '60px', height: '32px' }} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : paginatedEvents.length === 0 ? (
                        // Empty state outside table for mobile-friendly display
                        <div className="empty-state">
                            <Icon 
                                icon={
                                    activeFilter === "pending"
                                        ? "mdi:calendar-clock"
                                        : activeFilter === "approved"
                                            ? "mdi:calendar-check"
                                            : activeFilter === "rejected"
                                                ? "mdi:calendar-remove"
                                                : "mdi:calendar-multiple"
                                } 
                                width="48" 
                            />
                            <h4>{searchQuery ? "No events found" : `No ${activeFilter} events yet`}</h4>
                            <p className="small-body-text">
                                {searchQuery 
                                    ? <>No events match "<strong>{searchQuery}</strong>".</>
                                    : `There are currently no events waiting for approval in this category.`
                                }
                            </p>
                        </div>
                    ) : (
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
                                {paginatedEvents.map((event) => (
                                    <tr
                                        key={event._id || event.id}
                                        className={expandedRow === (event._id || event.id) ? 'expanded' : ''}
                                    >
                                        <td data-label="Event Name" className="event-name-td">
                                            <div className="mobile-expand-icon" onClick={() => toggleRow(event._id || event.id)}>
                                                <Icon icon={expandedRow === (event._id || event.id) ? "mdi:chevron-up" : "mdi:chevron-down"} />
                                            </div>
                                            <div className="event-name-cell">
                                                <div className="event-avatar">
                                                    {getInitials(event.title)}
                                                </div>
                                                <div className="event-name-info">
                                                    <h6 className="event-name">{event.title}</h6>
                                                    <div className="smaller-body-text event-category">{event.category}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td data-label="Promoter" className="regular-body-text">
                                            {event.createdBy ? `${event.createdBy.firstName} ${event.createdBy.lastName}` : "System"}
                                        </td>
                                        <td data-label="Date" className="small-body-text">
                                            {event.startDate ? new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
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

                                                {event.status === "pending" && (
                                                    <>
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
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
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
