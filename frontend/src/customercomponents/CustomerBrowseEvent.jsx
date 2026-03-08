import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import './CustomerBrowseEvent.css';

const CustomerBrowseEvent = () => {
    const navigate = useNavigate();

    // Mock data for events (6 per page)
    const allEvents = [
        { id: 1, title: 'Neon Dreams Tour', date: 'Jun 15 • 20:00', location: 'Starlight Arena, Los Angeles, CA', price: '$45 - $150', category: 'Concert', image: '/assets/eventbg.jpg' },
        { id: 2, title: 'Comedy All-Stars', date: 'Jun 20 • 19:30', location: 'Gotham Comedy Club, New York, NY', price: '$30 - $80', category: 'Concert', image: '/assets/eventbg.jpg' },
        { id: 3, title: 'Hamlet', date: 'Jul 1 • 19:00', location: 'Royal Globe Theatre, London, UK', price: '$50 - $200', category: 'Theater', image: '/assets/eventbg.jpg' },
        { id: 4, title: 'Summer Jazz Festival', date: 'Jul 15 • 14:00', location: 'Millennium Park, Chicago, IL', price: '$60 - $120', category: 'Concert', image: '/assets/eventbg.jpg' },
        { id: 5, title: 'Championship Finals', date: 'Aug 10 • 18:00', location: 'Ocean Stadium, Miami, FL', price: '$100 - $500', category: 'Sports', image: '/assets/eventbg.jpg' },
        { id: 6, title: 'Indie Rock Showcase', date: 'Jun 25 • 21:00', location: 'The Red Room, Austin, TX', price: '$25 - $50', category: 'Concert', image: '/assets/eventbg.jpg' },
        { id: 7, title: 'Symphony Under the Stars', date: 'Jul 22 • 20:00', location: 'Central Park, NY', price: '$20 - $100', category: 'Concert', image: '/assets/eventbg.jpg' },
        { id: 8, title: 'Tech Startup Conference', date: 'Sep 05 • 09:00', location: 'Silicon Valley Center', price: '$150 - $300', category: 'Concert', image: '/assets/eventbg.jpg' },
        { id: 9, title: 'Broadway Nights', date: 'Aug 10 • 19:00', location: 'City Arts Center, NY', price: '$75 - $250', category: 'Theater', image: '/assets/eventbg.jpg' },
        { id: 10, title: 'Summer Vibe Fest', date: 'Aug 20 • 12:00', location: 'Open Grounds, Miami, FL', price: '$120 - $400', category: 'Concert', image: '/assets/eventbg.jpg' },
    ];

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    const totalPages = Math.ceil(allEvents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedEvents = allEvents.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleEventClick = (eventId) => {
        // Implement navigation if details page created
        navigate(`/customer/event-details/${eventId}`);
    };

    return (
        <div className="cbe-page-wrapper">
            <div className="cbe-container">
                <div className="cbe-header">
                    <h2>Browse Events</h2>
                    <p className="regular-body-text">Discover the best events happening around you.</p>
                </div>

                <div className="cbe-controls">
                    <div className="cbe-search">
                        <Icon icon="mdi:magnify" width="20" className="search-icon" />
                        <input type="text" placeholder="Search events, artist or venue" className="small-body-text" />
                    </div>

                    <div className="cbe-filters">
                        <button className="cbe-filter-btn small-body-text" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Icon icon="mdi:calendar-blank-outline" width="18" /> Date
                            <Icon icon="mdi:chevron-down" />
                        </button>
                    </div>
                </div>

                <div className="cbe-grid">
                    {paginatedEvents.map((event) => (
                        <div key={event.id} className="cbe-card" onClick={() => handleEventClick(event.id)}>
                            <div className="cbe-card-image-wrapper">
                                <span className={`cbe-category-pill button-label tag-${event.category.toLowerCase()}`}>
                                    {event.category}
                                </span>
                                <img src={event.image} alt={event.title} />
                            </div>
                            <div className="cbe-card-content">
                                <h4 className="cbe-card-title">{event.title}</h4>

                                <div className="cbe-card-info">
                                    <Icon icon="mdi:calendar-blank-outline" />
                                    <span className="small-body-text">{event.date}</span>
                                </div>
                                <div className="cbe-card-info">
                                    <Icon icon="mdi:map-marker-outline" />
                                    <span className="small-body-text">{event.location}</span>
                                </div>

                                <hr className="cbe-card-divider" />

                                <div className="cbe-card-footer">
                                    <div className="cbe-price-section">
                                        <span className="smaller-body-text">From</span>
                                        <h6 className="cbe-price-text">{event.price}</h6>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
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
