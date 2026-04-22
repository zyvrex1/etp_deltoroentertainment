import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import DateRangePicker from '../admincomponents/DateRangePicker';
import './CustomerBrowseEvent.css';

const CustomerBrowseEvent = () => {
    const navigate = useNavigate();

    // Mock data for events
    const allEvents = [
        { id: 1, title: 'Neon Dreams Tour', date: 'Jun 15 • 20:00', location: 'Starlight Arena, Los Angeles, CA', price: '$45 - $150', category: 'Concert', image: '/assets/eventbg.jpg', time: '20:00 - 23:00', availability: 450 },
        { id: 2, title: 'Comedy All-Stars', date: 'Jun 20 • 19:30', location: 'Gotham Comedy Club, New York, NY', price: '$30 - $80', category: 'Concert', image: '/assets/eventbg.jpg', time: '19:30 - 21:30', availability: 120 },
        { id: 3, title: 'Hamlet', date: 'Jul 1 • 19:00', location: 'Royal Globe Theatre, London, UK', price: '$50 - $200', category: 'Theater', image: '/assets/eventbg.jpg', time: '19:00 - 22:30', availability: 85 },
        { id: 4, title: 'Summer Jazz Festival', date: 'Jul 15 • 14:00', location: 'Millennium Park, Chicago, IL', price: '$60 - $120', category: 'Concert', image: '/assets/eventbg.jpg', time: '14:00 - 22:00', availability: 1500 },
        { id: 5, title: 'Championship Finals', date: 'Aug 10 • 18:00', location: 'Ocean Stadium, Miami, FL', price: '$100 - $500', category: 'Sports', image: '/assets/eventbg.jpg', time: '18:00 - 21:00', availability: 300 },
        { id: 6, title: 'Indie Rock Showcase', date: 'Jun 25 • 21:00', location: 'The Red Room, Austin, TX', price: '$25 - $50', category: 'Concert', image: '/assets/eventbg.jpg', time: '21:00 - 00:00', availability: 200 },
        { id: 7, title: 'Symphony Under the Stars', date: 'Jul 22 • 20:00', location: 'Central Park, NY', price: '$20 - $100', category: 'Concert', image: '/assets/eventbg.jpg', time: '20:00 - 22:00', availability: 2500 },
        { id: 8, title: 'Tech Startup Conference', date: 'Sep 05 • 09:00', location: 'Silicon Valley Center', price: '$150 - $300', category: 'Concert', image: '/assets/eventbg.jpg', time: '09:00 - 17:00', availability: 500 },
        { id: 9, title: 'Broadway Nights', date: 'Aug 10 • 19:00', location: 'City Arts Center, NY', price: '$75 - $250', category: 'Theater', image: '/assets/eventbg.jpg', time: '19:00 - 21:30', availability: 400 },
        { id: 10, title: 'Summer Vibe Fest', date: 'Aug 20 • 12:00', location: 'Open Grounds, Miami, FL', price: '$120 - $400', category: 'Concert', image: '/assets/eventbg.jpg', time: '12:00 - 23:00', availability: 3000 },
    ];

    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const itemsPerPage = 8;

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
        
        // Date range filtering (simplified for mock data)
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
        navigate(`/customer/event-details/${eventId}`);
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
                    {paginatedEvents.length > 0 ? (
                        paginatedEvents.map((event) => (
                            <div key={event.id} className="cbe-event-card" onClick={() => handleEventClick(event.id)}>
                                <div className="cbe-card-image-wrap">
                                    <img src={event.image} alt={event.title} />
                                    <div className="cbe-category-badge button-label">
                                        {event.category}
                                    </div>
                                </div>
                                <div className="cbe-card-details">
                                    <h5 className="cbe-event-title">{event.title}</h5>

                                    <div className="cbe-card-info small-body-text">
                                        <Icon icon="mdi:calendar-blank-outline" />
                                        <span>{event.date}</span>
                                    </div>
                                    <div className="cbe-card-info small-body-text">
                                        <Icon icon="mdi:map-marker-outline" />
                                        <span>{event.location}</span>
                                    </div>

                                    <div className="cbe-stats-row">
                                        <div className="cbe-stat-item">
                                            <span className="smaller-body-text stat-label">Time</span>
                                            <span className="large-body-text stat-value">{event.time}</span>
                                        </div>
                                        <div className="cbe-stat-item">
                                            <span className="smaller-body-text stat-label">Starting Price</span>
                                            <span className="large-body-text stat-value">{event.price.split('-')[0].trim()}</span>
                                        </div>
                                    </div>

                                    <button className="primary-button cbe-view-btn">
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
        </div>
    );
};

export default CustomerBrowseEvent;
