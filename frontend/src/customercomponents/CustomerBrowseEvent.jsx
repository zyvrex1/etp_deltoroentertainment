import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import DateRangePicker from '../utils/DateRangePicker';
import './CustomerBrowseEvent.css';

const CustomerBrowseEvent = () => {
    const navigate = useNavigate();

    // Mock data for events
    const allEvents = [
        { id: 1, title: 'Texas Home Show', date: 'Aug 7', location: 'Bert Ogden Arena', price: '$45 - $150', category: 'Concert', image: '/uploads/monday-content-post-1-0429260249.jpg', time: '14:00 - 18:00', availability: 450, },
        { id: 2, title: 'Guey Funny Comedy Show', date: 'May 1', location: 'La Villa', price: '$30 - $80', category: 'Concert', image: '/uploads/guey-funny-comedy-show-march-20-0429260231.jpg', time: '10:00 - 15:00', availability: 120, },
        { id: 3, title: 'Siggno Solido Secretto', date: 'Apr 30', location: 'Magnolia Halle', price: '$50 - $200', category: 'Theater', image: '/uploads/grupo-siggno,-solido-and-secretto-flyers-2026-mock-up-0429260228.jpg', time: '16:00 - 20:00', availability: 85,  },
        { id: 4, title: 'Weslaco Texas OnionFest', date: 'Aug 1', location: 'Greet & Gather Downtown Weslaco', price: '$60 - $120', category: 'Concert', image: '/uploads/weslaco-texas-onion-fest-0429260226.jpg', time: '11:00 - 16:00', availability: 1500,  },
        { id: 5, title: 'Tejano Music Awards Fanfair', date: 'Jul 25', location: 'Henry B. Gonzales Convention Center', price: '$100 - $500', category: 'Sports', image: '/uploads/siggno-advertising-poster-0429260219.jpg', time: '10:00 - 18:00', availability: 300,  },
        { id: 6, title: 'Your Health Matters', date: 'Aug 25', location: 'Creative Arts Studio (Texas)', price: '$25 - $50', category: 'Concert', image: '/uploads/yhm-event-page-cover-pharr-1777152601031.jpg', time: '10:00 - 18:00', availability: 200, },
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
