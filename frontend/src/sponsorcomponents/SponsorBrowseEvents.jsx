import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import DateRangePicker from '../admincomponents/DateRangePicker';
import './SponsorBrowseEvents.css';

const SponsorBrowseEvents = () => {
    const navigate = useNavigate();

    // Mock data for 12 events to demonstrate pagination (8 per page like SponsorStore)
    const allEvents = Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        title: 'TechInnovate Summit 2026',
        date: 'Jun 16, 2026',
        location: 'Starlight Arena, Los Angeles, CA',
        attendees: '5,000+',
        spotsLeft: 12,
        category: 'Concert',
        image: '/assets/eventbg.jpg'
    }));

    // Pagination Logic
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const [searchQuery, setSearchQuery] = useState("");

    const [dateRange, setDateRange] = useState(() => ({
        preset: 'all',
        presetLabel: 'All time',
        start: new Date(2000, 0, 1),
        end: new Date(2100, 11, 31),
    }));

    const handleDateRangeChange = (newRange) => {
        setDateRange(newRange);
        setCurrentPage(1);
    };

    const filteredEvents = allEvents.filter((event) => {
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              event.location.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
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
                    {paginatedEvents.length > 0 ? (
                        paginatedEvents.map((event) => (
                            <div key={event.id} className="sbe-event-card" onClick={() => handleEventClick(event.id)}>
                                <div className="sbe-card-image-wrap">
                                    <img src={event.image} alt={event.title} />
                                    <div className="sbe-category-badge button-label">
                                        {event.category}
                                    </div>
                                </div>
                                <div className="sbe-card-details">
                                    <h3 className="sbe-event-title">{event.title}</h3>
                                    
                                    <div className="sbe-card-info small-body-text">
                                        <Icon icon="mdi:calendar-blank-outline" />
                                        <span>{event.date}</span>
                                    </div>
                                    <div className="sbe-card-info small-body-text">
                                        <Icon icon="mdi:map-marker-outline" />
                                        <span>{event.location}</span>
                                    </div>

                                    <div className="sbe-stats-row">
                                        <div className="sbe-stat-item">
                                            <span className="smaller-body-text stat-label">Expected Attendees</span>
                                            <span className="large-body-text stat-value">{event.attendees}</span>
                                        </div>
                                        <div className="sbe-stat-item">
                                            <span className="smaller-body-text stat-label">Booths Available</span>
                                            <span className="large-body-text stat-value">{event.spotsLeft}</span>
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
                                No events match "<strong>{searchQuery}</strong>".
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
