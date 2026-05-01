import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import DateRangePicker from '../utils/DateRangePicker';
import { useAuthContext } from '../hooks/useAuthContext';
import eventsService from '../services/eventsService';
import './SponsorBrowseEvents.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const SponsorBrowseEvents = () => {
    const navigate = useNavigate();
    const { user } = useAuthContext();

    const [allEvents, setAllEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const [searchQuery, setSearchQuery] = useState("");

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
                const data = await eventsService.getEvents(user?.token);
                // Only show approved events
                const approvedEvents = data.filter(evt => evt.status === 'approved');
                setAllEvents(approvedEvents);
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
        navigate(`/sponsor/sponsor-event/${eventId}`);
    };

    return (
        <div className="sponsor-browse-container">
            <div className="sbe-header-section">
                <div className="sbe-header-title">
                    <Icon icon="mdi:calendar-search-outline" className="sbe-title-icon" />
                    <h1>Browse Events</h1>
                </div>
                <p className="regular-body-text sbe-title-desc">
                    Discover upcoming sponsorship opportunities and find the perfect event for your brand.
                </p>
            </div>

            <div className="sponsor-browse-content-card">
                <div className="sbe-toolbar">
                    <div className="sbe-toolbar-left">
                        <div className="sbe-search">
                            <Icon icon="mdi:magnify" />
                            <input
                                type="text"
                                placeholder="Search events, artist or venue"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="small-body-text sbe-search-input"
                            />
                        </div>
                    </div>

                    <div className="sbe-toolbar-right">
                        <div className="sbe-filters">
                            <DateRangePicker
                                value={dateRange}
                                onChange={handleDateRangeChange}
                                buttonClassName="sbe-filter-dropdown-btn small-body-text"
                                placeholder="Date Range"
                            />
                        </div>
                    </div>
                </div>

                <div className="sbe-events-grid">
                    {isLoading ? (
                        [...Array(8)].map((_, i) => (
                            <div key={i} className="sbe-skeleton-card">
                                <div className="sbe-skeleton-image"></div>
                                <div className="sbe-skeleton-details">
                                    <div className="sbe-skeleton-text sbe-skeleton-title"></div>
                                    <div className="sbe-skeleton-text sbe-skeleton-meta"></div>
                                    <div className="sbe-skeleton-text sbe-skeleton-meta"></div>
                                    <div className="sbe-skeleton-stats">
                                        <div className="sbe-skeleton-stat-box"></div>
                                        <div className="sbe-skeleton-stat-box"></div>
                                    </div>
                                    <div className="sbe-skeleton-button"></div>
                                </div>
                            </div>
                        ))
                    ) : paginatedEvents.length > 0 ? (
                        paginatedEvents.map((event) => (
                            <div key={event._id} className="sbe-event-card" onClick={() => handleEventClick(event._id)}>
                                <div className="sbe-card-image-wrap">
                                    <img
                                        src={event.image ? `${BACKEND_URL}/uploads/${event.image}` : '/assets/eventbg.jpg'}
                                        alt={event.title}
                                    />
                                    <div className="sbe-category-badge button-label">
                                        {event.category || "Event"}
                                    </div>
                                </div>
                                <div className="sbe-card-details">
                                    <h5 className="sbe-event-title">{event.title}</h5>

                                    <div className="sbe-card-info small-body-text">
                                        <Icon icon="mdi:calendar-blank-outline" />
                                        <span>
                                            {(() => {
                                                const start = new Date(event.startDate);
                                                const end = event.endDate ? new Date(event.endDate) : null;
                                                const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                                
                                                if (!end || start.toDateString() === end.toDateString()) {
                                                    return startStr;
                                                }
                                                
                                                const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                                return `${startStr} - ${endStr}`;
                                            })()}
                                        </span>
                                    </div>
                                    <div className="sbe-card-info small-body-text">
                                        <Icon icon="mdi:map-marker-outline" />
                                        <span>{event.venue?.name || "TBA"}</span>
                                    </div>

                                    <div className="sbe-stats-row">
                                        <div className="sbe-stat-item">
                                            <span className="smaller-body-text stat-label">Time</span>
                                            <span className="large-body-text stat-value">{event.startTime || "TBA"} - {event.endTime || "TBA"}</span>
                                        </div>
                                        <div className="sbe-stat-item">
                                            <span className="smaller-body-text stat-label">Booths Available</span>
                                            <span className="large-body-text stat-value">{event.booths?.filter(b => b.status === "available").length || 0}</span>
                                        </div>
                                    </div>

                                    <button className="primary-button sbe-view-btn">
                                        View Details <Icon icon="mdi:arrow-right" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="sbe-empty-state">
                            <Icon icon="mdi:magnify-close" width="48" />
                            <h4>No events found</h4>
                            <p className="small-body-text">
                                {searchQuery ? (
                                    <>No events match "<strong>{searchQuery}</strong>".</>
                                ) : (
                                    <>No events available for the selected dates.</>
                                )}
                            </p>
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
        </div>
    );
};

export default SponsorBrowseEvents;
