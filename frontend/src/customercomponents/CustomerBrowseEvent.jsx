import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import DateRangePicker from '../utils/DateRangePicker';
import { useAuthContext } from '../hooks/useAuthContext';
import eventsService from '../services/eventsService';
import './CustomerBrowseEvent.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const CustomerBrowseEvent = () => {
    const navigate = useNavigate();
    const { user } = useAuthContext();

    const [allEvents, setAllEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const itemsPerPage = 8;

    const [dateRange, setDateRange] = useState(() => ({
        preset: 'all',
        presetLabel: 'All time',
        start: new Date(2000, 0, 1),
        end: new Date(2100, 11, 31),
    }));

    useEffect(() => {
        const fetchEvents = async () => {
            setIsLoading(true);
            try {
                // Backend handles role-based filtering, but we specify 'approved' to be sure
                const data = await eventsService.getEvents(user?.token, 'approved');
                setAllEvents(data || []);
            } catch (error) {
                console.error("Error fetching events:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEvents();
    }, [user?.token]);

    const handleDateRangeChange = (newRange) => {
        setDateRange(newRange);
        setCurrentPage(1);
    };

    const filteredEvents = allEvents.filter((event) => {
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (event.venue?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (event.venue?.city || "").toLowerCase().includes(searchQuery.toLowerCase());

        // Date range filtering
        const eventDate = new Date(event.startDate);
        const matchesDate = eventDate >= dateRange.start && eventDate <= dateRange.end;

        return matchesSearch && matchesDate;
    });

    const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleEventClick = (eventId) => {
        navigate(`/customer/event-details/${eventId}`);
    };

    const handleGetTickets = (eventId) => {
        navigate(`/customer/seats/${eventId}`);
    };

    const formatEventDate = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : null;
        const options = { month: 'short', day: 'numeric' };

        const startStr = start.toLocaleDateString('en-US', options);
        if (!end || start.toDateString() === end.toDateString()) {
            return startStr;
        }

        const endStr = end.toLocaleDateString('en-US', options);
        return `${startStr} - ${endStr}`;
    };

    const getAvailableSeats = (event) => {
        let availableCount = 0;

        if (event.layoutData && Array.isArray(event.layoutData.items)) {
            event.layoutData.items.forEach(item => {
                // Identify circle shapes (seats)
                const isCircle = item.type === 'seat' || item.isSeat || (!item.isBooth && !item.isElement && !item.isBackground && item.type !== 'booth');
                // Identify if it is available
                const isAvailable = !item.status || item.status === 'available';
                
                if (isCircle && isAvailable) {
                    availableCount++;
                }
            });
            return availableCount;
        } else if (event.seatMap && event.seatMap.sections) {
            event.seatMap.sections.forEach(sec => {
                (sec.seats || []).forEach(seat => {
                    const isAvailable = !seat.status || seat.status === 'available';
                    if (isAvailable) {
                        availableCount += seat.seatCount || 1;
                    }
                });
            });
            return availableCount;
        }

        return 0;
    };

    return (
        <div className="cbe-page-wrapper">
            <div className="cbe-header-section">
                <div className="cbe-header-title">
                    <Icon icon="mdi:calendar-search-outline" className="cbe-title-icon" />
                    <h1>Browse Events</h1>
                </div>
                <p className="regular-body-text cbe-title-desc">
                    Discover upcoming events, find your favorites, and get your tickets today.
                </p>
            </div>

            <div className="cbe-content-card">
                <div className="cbe-toolbar">
                    <div className="cbe-toolbar-left">
                        <div className="cbe-search">
                            <Icon icon="mdi:magnify" />
                            <input
                                type="text"
                                placeholder="Search events, artist or venue"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="small-body-text"
                            />
                        </div>
                    </div>

                    <div className="cbe-toolbar-right">
                        <div className="cbe-filters">
                            <DateRangePicker
                                value={dateRange}
                                onChange={handleDateRangeChange}
                                buttonClassName="cbe-filter-dropdown-btn small-body-text"
                                placeholder="Date Range"
                            />
                        </div>
                    </div>
                </div>

                <div className="cbe-grid">
                    {isLoading ? (
                        [...Array(4)].map((_, i) => (
                            <div key={i} className="cbe-event-card skeleton">
                                <div className="cbe-card-image-wrap skeleton-box" style={{ height: '160px' }}></div>
                                <div className="cbe-card-details">
                                    <div className="skeleton-box" style={{ height: '24px', width: '70%', marginBottom: '12px' }}></div>
                                    <div className="skeleton-box" style={{ height: '16px', width: '50%', marginBottom: '8px' }}></div>
                                    <div className="skeleton-box" style={{ height: '16px', width: '60%', marginBottom: '20px' }}></div>
                                    <div className="skeleton-box" style={{ height: '40px', width: '100%' }}></div>
                                </div>
                            </div>
                        ))
                    ) : paginatedEvents.length > 0 ? (
                        paginatedEvents.map((event) => (
                            <div key={event._id} className="cbe-event-card" onClick={() => handleEventClick(event._id)}>
                                <div className="cbe-card-image-wrap">
                                    <img
                                        src={event.image ? `${BACKEND_URL}/uploads/${event.image}` : '/assets/eventbg.jpg'}
                                        alt={event.title}
                                    />
                                    <div className="cbe-category-badge button-label">
                                        {event.category || "Event"}
                                    </div>
                                </div>
                                <div className="cbe-card-details">
                                    <h5 className="cbe-event-title">{event.title}</h5>

                                    <div className="cbe-card-info small-body-text">
                                        <Icon icon="mdi:calendar-blank-outline" />
                                        <span>{formatEventDate(event.startDate, event.endDate)}</span>
                                    </div>
                                    <div className="cbe-card-info small-body-text">
                                        <Icon icon="mdi:map-marker-outline" />
                                        <span>{event.venue?.name || "TBA"}</span>
                                    </div>

                                    <div className="cbe-stats-row">
                                        <div className="cbe-stat-item">
                                            <span className="smaller-body-text stat-label">Time</span>
                                            <span className="large-body-text stat-value">{event.startTime || "TBA"}</span>
                                        </div>
                                        <div className="cbe-stat-item">
                                            <span className="smaller-body-text stat-label">Available Seats</span>
                                            <span className="large-body-text stat-value">{getAvailableSeats(event)}</span>
                                        </div>
                                    </div>

                                    <button 
                                        className="primary-button cbe-view-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleGetTickets(event._id);
                                        }}
                                    >
                                        Get Tickets <Icon icon="mdi:arrow-right" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="cbe-empty-state">
                            <Icon icon="mdi:magnify-close" width="48" />
                            <h4>No events found</h4>
                            <p className="small-body-text">Try adjusting your search or filters.</p>
                        </div>
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
            <style>{`
                .skeleton-box {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: skeleton-loading 1.5s infinite;
                    border-radius: 4px;
                }
                @keyframes skeleton-loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
};

export default CustomerBrowseEvent;
