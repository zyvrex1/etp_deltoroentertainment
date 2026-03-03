import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from '@iconify/react';
import SponsorEnlargeQR from './SponsorModal/SponsorEnlargeQR';
import './SponsorMyBooth.css';

export default function SponsorMyBooth() {
    const mockData = [
        {
            id: 1,
            image: '/assets/eventbg.jpg',
            title: 'TechInnovate Summit 2026',
            date: 'Jun 16, 2026',
            location: 'Starlight Arena, Los Angeles, CA',
            type: 'Premium Island',
        },
        {
            id: 2,
            image: '/assets/eventbg.jpg',
            title: 'Global Healthcare Expo 2024',
            date: 'Aug 10, 2024',
            location: 'McCormick Place, Chicago, IL',
            type: 'Standard Inline',
        },
        {
            id: 3,
            image: '/assets/eventbg.jpg',
            title: 'Global Healthcare Expo 2023',
            date: 'Sep 15, 2023',
            location: 'Javits Center, New York, NY',
            type: 'Corner Booth',
        }
    ];

    const myBooths = Array.from({ length: 12 }, (_, i) => ({
        ...mockData[i % 3],
        id: i + 1,
    }));

    // Pagination Logic
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const totalPages = Math.ceil(myBooths.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedBooths = myBooths.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const [isQROpen, setIsQROpen] = useState(false);
    const [selectedBooth, setSelectedBooth] = useState(null);

    const handleOpenQR = (booth) => {
        setSelectedBooth(booth);
        setIsQROpen(true);
    };

    const handleCloseQR = () => {
        setIsQROpen(false);
        setSelectedBooth(null);
    };

    return (
        <div className="sponsor-my-booth-container">
            <div className="my-booth-header">
                <div>
                    <h2>My Reserved Booths</h2>
                    <p className="regular-body-text text-secondary">Manage your event sponsorships and exhibitor details</p>
                </div>
                <NavLink to="/sponsor/sponsor-events" className="primary-button sponsor-events-btn">
                    Find more Events
                </NavLink>
            </div>

            <div className="my-booth-list">
                {paginatedBooths.map(booth => (
                    <div key={booth.id} className="my-booth-card">
                        <div className="my-booth-image-container">
                            <img src={booth.image} alt={booth.title} className="my-booth-image" />
                        </div>
                        <div className="my-booth-content">
                            <div className="my-booth-details-top">
                                <div className="my-booth-title-row">
                                    <h3>{booth.title}</h3>
                                </div>
                                <div className="my-booth-info-row">
                                    <Icon icon="mdi:calendar-blank" width="20" />
                                    <span className="regular-body-text">{booth.date}</span>
                                </div>
                                <div className="my-booth-info-row">
                                    <Icon icon="mdi:map-marker-outline" width="20" />
                                    <span className="regular-body-text">{booth.location}</span>
                                </div>
                                <div className="button-label my-booth-type-pill">
                                    {booth.type}
                                </div>
                            </div>

                            <hr className="my-booth-divider" />

                            <div className="my-booth-actions">
                                <div className="my-booth-actions-left">
                                    <NavLink to="/sponsor/sponsor-booth-details" className="my-booth-dark-btn">
                                        <Icon icon="mdi:eye-outline" width="18" /> View Full Details
                                    </NavLink>
                                    <NavLink to={`/sponsor/sponsor-event/${booth.id}`} className="outlined-button my-booth-outlined-btn">
                                        <Icon icon="mdi:open-in-new" width="18" /> Event Page
                                    </NavLink>
                                </div>
                            </div>
                        </div>
                        <button className="my-booth-qr-section" onClick={() => handleOpenQR(booth)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div className="my-booth-qr-code">
                                <Icon icon="mdi:qrcode" width="100" color="var(--color-black-secondary)" />
                            </div>
                            <span className="small-body-text text-secondary">Tap to enlarge</span>
                        </button>
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

            <SponsorEnlargeQR
                isOpen={isQROpen}
                onClose={handleCloseQR}
                booth={selectedBooth}
            />
        </div>
    );
}
