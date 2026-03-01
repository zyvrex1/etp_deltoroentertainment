import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import './SponsorBrowseEvents.css';

const SponsorBrowseEvents = () => {
    const navigate = useNavigate();

    // Mock data for 12 events to demonstrate pagination (6 per page)
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
        navigate(`/sponsor/sponsor-event/${eventId}`);
    };

    return (
        <div className="sbe-page-wrapper">
            <div className="sbe-container">
                <div className="sbe-header">
                    <h1>Browse Events</h1>
                    <p className="regular-body-text">Discover upcoming sponsorship opportunities and find the perfect event for your brand.</p>
                </div>

                <div className="sbe-controls">
                    <div className="sbe-search">
                        <Icon icon="mdi:magnify" />
                        <input type="text" placeholder="Search events, artist or venue" className="small-body-text" />
                    </div>

                    <div className="sbe-filters">
                        <select className="sbe-filter-select small-body-text" defaultValue="Category">
                            <option value="Category" disabled hidden>Category</option>
                            <option value="Concert">Concert</option>
                            <option value="Sports">Sports</option>
                            <option value="Theater">Theater</option>
                            <option value="Festival">Festival</option>
                        </select>

                        <select className="sbe-filter-select small-body-text" defaultValue="Location">
                            <option value="Location" disabled hidden>Location</option>
                            <option value="Los Angeles">Los Angeles, CA</option>
                            <option value="New York">New York, NY</option>
                            <option value="Chicago">Chicago, IL</option>
                        </select>
                    </div>
                </div>

                <div className="sbe-grid">
                    {paginatedEvents.map((event) => (
                        <div key={event.id} className="sbe-card" onClick={() => handleEventClick(event.id)}>
                            <div className="sbe-card-image-wrapper">
                                <span className="sbe-category-pill button-label">{event.category}</span>
                                <img src={event.image} alt={event.title} />
                            </div>
                            <div className="sbe-card-content">
                                <h3 className="sbe-card-title">{event.title}</h3>

                                <div className="sbe-card-info">
                                    <Icon icon="mdi:calendar" />
                                    <span className="small-body-text">{event.date}</span>
                                </div>
                                <div className="sbe-card-info">
                                    <Icon icon="mdi:map-marker" />
                                    <span className="small-body-text">{event.location}</span>
                                </div>
                                <div className="sbe-card-info">
                                    <Icon icon="mdi:account-group" />
                                    <span className="small-body-text">{event.attendees} Expected Attendees</span>
                                </div>

                                <hr className="sbe-card-divider" />

                                <div className="sbe-card-footer">
                                    <span className="sbe-booth-label smaller-body-text">Booths Available</span>
                                    <h6 className="sbe-booth-spots">{event.spotsLeft} Spot Left</h6>
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

export default SponsorBrowseEvents;
