import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from '@iconify/react';
import SponsorEnlargeQR from './SponsorModal/SponsorEnlargeQR';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuthContext } from '../admincomponents/hooks/useAuthContext';
import axios from 'axios';
import './SponsorMyBooth.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function SponsorMyBooth() {
    const { user } = useAuthContext();
    const [reservations, setReservations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReservations = async () => {
            if (!user?.token) return;
            setIsLoading(true);
            try {
                const response = await axios.get(`${BACKEND_URL}/api/reservations/my-booths`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setReservations(response.data);
            } catch (err) {
                console.error("Fetch reservations error:", err);
                setError(err.response?.data?.error || "Failed to load reservations.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchReservations();
    }, [user?.token]);

    // Pagination Logic
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const totalPages = Math.ceil(reservations.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedBooths = reservations.slice(startIndex, startIndex + itemsPerPage);

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

    if (isLoading) {
        return (
            <div className="sponsor-my-booth-container">
                <div className="sed-loading-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                    <Icon icon="line-md:loading-twotone-loop" width="48" />
                </div>
            </div>
        );
    }

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
                {paginatedBooths.map(res => (
                    <div key={res._id} className="my-booth-card">
                        <div className="my-booth-image-container">
                            <img
                                src={res.event?.image ?
                                    (res.event.image.startsWith('http') ? res.event.image : `${BACKEND_URL}/uploads/${res.event.image}`)
                                    : "/assets/eventbg.jpg"}
                                alt={res.event?.title}
                                className="my-booth-image"
                            />
                        </div>
                        <div className="my-booth-content">
                            <div className="my-booth-details-top">
                                <div className="my-booth-title-row">
                                    <h3>{res.event?.title}</h3>
                                </div>
                                <div className="my-booth-info-row">
                                    <Icon icon="mdi:calendar-blank" width="20" />
                                    <span className="regular-body-text">
                                        {res.event?.startDate ? new Date(res.event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA'}
                                    </span>
                                </div>
                                <div className="my-booth-info-row">
                                    <Icon icon="mdi:map-marker-outline" width="20" />
                                    <span className="regular-body-text">{res.event?.venue?.name || res.event?.location || 'TBA'}</span>
                                </div>
                                <div className="button-label my-booth-type-pill">
                                    Booth #{res.boothCode}
                                </div>
                            </div>

                            <hr className="my-booth-divider" />

                            <div className="my-booth-actions">
                                <div className="my-booth-actions-left">
                                    <NavLink to="/sponsor/sponsor-booth-details" className="my-booth-dark-btn">
                                        <Icon icon="mdi:eye-outline" width="18" /> View Full Details
                                    </NavLink>
                                    <NavLink to={`/sponsor/sponsor-event-details/${res.event?._id}`} className="outlined-button my-booth-outlined-btn">
                                        <Icon icon="mdi:open-in-new" width="18" /> Event Page
                                    </NavLink>
                                </div>
                            </div>
                        </div>
                        <button className="my-booth-qr-section" onClick={() => handleOpenQR(res)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div className="my-booth-qr-code">
                                <QRCodeCanvas
                                    value={res._id}
                                    size={100}
                                    bgColor={"transparent"}
                                    fgColor={"#333"}
                                    level={"M"}
                                />
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
