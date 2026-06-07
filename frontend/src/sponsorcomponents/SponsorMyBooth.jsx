import React, { useState, useEffect, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from '@iconify/react';
import SponsorEnlargeQR from './SponsorModal/SponsorEnlargeQR';
import SponsorRequestRefund from './SponsorModal/SponsorRequestRefund';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuthContext } from '../hooks/useAuthContext';
import axios from 'axios';
import GiftRestoredNotice from '../components/GiftRestoredNotice';
import { shouldShowGiftRestoredNotice } from '../utils/giftNoticeUtils';
import './SponsorMyBooth.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function SponsorMyBooth() {
    const { user } = useAuthContext();
    const [reservations, setReservations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [sortFilter, setSortFilter] = useState("Recently Buy");

    const [isQROpen, setIsQROpen] = useState(false);
    const [isRefundOpen, setIsRefundOpen] = useState(false);
    const [selectedBooth, setSelectedBooth] = useState(null);

    useEffect(() => {
        const fetchReservations = async () => {
            if (!user?.token) return;
            setIsLoading(true);
            try {
                const response = await axios.get(`${BACKEND_URL}/api/reservations/my-booths`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                // Expand seat type reservations to display one card per seat
                const expanded = [];
                response.data.forEach((res) => {
                    if (res.type === 'seat' && res.seatIds) {
                        const isBXGY = res.appliedGift?.valueType === 'bxgy' && res.seatIds.length > 1;
                        res.seatIds.forEach((sid, idx) => {
                            let itemPrice = 0;
                            if (isBXGY) {
                                if (idx < res.seatIds.length - 1) {
                                    itemPrice = res.amount.subtotal / (res.seatIds.length - 1);
                                } else {
                                    itemPrice = 0;
                                }
                            } else {
                                itemPrice = res.amount.subtotal / res.seatIds.length;
                            }
                            expanded.push({
                                ...res,
                                _id: `${res._id}-${idx}`, // unique React key
                                isSeatTicket: true,
                                seatLabel: res.seatLabels?.[idx] || sid,
                                calculatedPrice: itemPrice,
                                qrData: res.qrData || res._id.toString()
                            });
                        });
                    } else {
                        expanded.push(res);
                    }
                });
                setReservations(expanded);
            } catch (err) {
                console.error("Fetch reservations error:", err);
                setError(err.response?.data?.error || "Failed to load reservations.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchReservations();
    }, [user?.token]);

    const getStatus = (event) => {
        if (!event) return "Upcoming";
        const now = new Date();
        const start = new Date(event.startDate);
        const end = new Date(event.endDate || event.startDate);

        if (now < start) return "Upcoming";
        if (now >= start && now <= end) return "Live";
        return "Completed";
    };

    const filteredAndSortedReservations = useMemo(() => {
        let result = [...reservations];

        if (searchQuery) {
            result = result.filter(res => 
                res.event?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                res.boothCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                res.seatLabel?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (statusFilter !== "All") {
            result = result.filter(res => {
                const payStatus = res.status === 'confirmed' ? 'Paid' : (res.status === 'pending' ? 'Pending' : (res.status === 'rejected' ? 'Rejected' : (res.status === 'refunded' ? 'Refunded' : 'Pending')));
                return payStatus === statusFilter;
            });
        }

        if (sortFilter === "Recently Buy") {
            result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortFilter === "A-Z") {
            result.sort((a, b) => (a.event?.title || "").localeCompare(b.event?.title || ""));
        } else if (sortFilter === "Z-A") {
            result.sort((a, b) => (b.event?.title || "").localeCompare(a.event?.title || ""));
        }

        return result;
    }, [reservations, searchQuery, statusFilter, sortFilter]);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    const totalPages = Math.ceil(filteredAndSortedReservations.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedBooths = filteredAndSortedReservations.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleOpenQR = (booth) => {
        setSelectedBooth(booth);
        setIsQROpen(true);
    };

    const handleCloseQR = () => {
        setIsQROpen(false);
        setSelectedBooth(null);
    };

    const handleOpenRefund = (booth) => {
        setSelectedBooth(booth);
        setIsRefundOpen(true);
    };

    const handleCloseRefund = () => {
        setIsRefundOpen(false);
        setSelectedBooth(null);
    };



    return (
        <div className="sponsor-my-booth-wrapper">
            <div className="sponsor-my-booth-container">
                <div className="my-booth-header">
                    <div style={{ textAlign: 'left' }}>
                        <h2>My Reserved Booths</h2>
                        <p className="regular-body-text text-secondary">Manage your event sponsorships and exhibitor details</p>
                    </div>
                    <NavLink to="/sponsor/sponsor-events" className="primary-button sponsor-events-btn">
                        Find more Events
                    </NavLink>
                </div>

                <div className="my-booth-toolbar">
                    <div className="search-box">
                        <Icon icon="mdi:magnify" width="20" />
                        <input 
                            type="text" 
                            placeholder="Search by event title, booth code..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="toolbar-filters">
                        <div className="filter-dropdown-wrapper">
                            <Icon icon="mdi:filter-variant" className="filter-icon" />
                            <select 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="status-dropdown"
                            >
                                <option value="All">All</option>
                                <option value="Paid">Paid</option>
                                <option value="Pending">Pending</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Refunded">Refunded</option>
                            </select>
                        </div>
                        <div className="filter-dropdown-wrapper">
                            <Icon icon="mdi:sort-variant" className="filter-icon" />
                            <select 
                                value={sortFilter} 
                                onChange={(e) => setSortFilter(e.target.value)}
                                className="status-dropdown"
                            >
                                <option value="Recently Buy">Recently Buy</option>
                                <option value="A-Z">A-Z</option>
                                <option value="Z-A">Z-A</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="my-booth-list-new">
                    {isLoading ? (
                        [...Array(6)].map((_, i) => (
                            <div key={i} className="booth-card-new">
                                <div className="booth-card-top">
                                    <div className="skeleton skeleton-text title"></div>
                                </div>
                                <div className="booth-card-body">
                                    <div className="skeleton" style={{ width: '80px', height: '80px', borderRadius: '8px', flexShrink: 0 }}></div>
                                    <div className="booth-details" style={{ flex: 1 }}>
                                        <div className="skeleton skeleton-text" style={{ width: '80%', height: '18px', marginBottom: '12px' }}></div>
                                        <div className="skeleton skeleton-text" style={{ width: '60%', height: '14px', marginBottom: '8px' }}></div>
                                        <div className="skeleton skeleton-text" style={{ width: '50%', height: '14px', marginBottom: '8px' }}></div>
                                        <div className="skeleton skeleton-text" style={{ width: '40%', height: '14px' }}></div>
                                    </div>
                                </div>
                                <div className="booth-card-footer">
                                    <div className="skeleton skeleton-button" style={{ width: '120px' }}></div>
                                </div>
                            </div>
                        ))
                    ) : paginatedBooths.length > 0 ? (
                        paginatedBooths.map(res => {
                            const payStatusLabel = res.status === 'confirmed' ? 'Paid' : (res.status?.charAt(0).toUpperCase() + res.status?.slice(1) || 'Pending');
                            const payStatusClass = res.status === 'confirmed' ? 'live' : (res.status === 'pending' ? 'upcoming' : (res.status === 'rejected' || res.status === 'refunded' ? 'rejected' : 'upcoming'));
                            return (
                                <div key={res._id} className="booth-card-new">
                                    <div className="booth-card-top">
                                        <h4 className="booth-event-title">{res.event?.title}</h4>
                                        <span className={`booth-status-badge ${payStatusClass}`}>
                                            {payStatusLabel}
                                        </span>
                                    </div>
                                    <div className="booth-card-body">
                                        <div className="booth-image-container">
                                            <img
                                                src={res.event?.image ?
                                                    (res.event.image.startsWith('http') ? res.event.image : `${BACKEND_URL}/uploads/${res.event.image}`)
                                                    : "/assets/eventbg.jpg"}
                                                alt={res.event?.title}
                                                onError={(e) => { e.target.src = "/assets/eventbg.jpg" }}
                                            />
                                        </div>
                                        <div className="booth-details">
                                            <h5 className="booth-info-title">{res.isSeatTicket ? `Seat ${res.seatLabel}` : `Booth #${res.boothCode}`}</h5>
                                            <div className="booth-info-row">
                                                <Icon icon="mdi:calendar-blank-outline" />
                                                <span>
                                                    {res.event?.startDate ? new Date(res.event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA'}
                                                </span>
                                            </div>
                                            <div className="booth-info-row">
                                                <Icon icon="mdi:map-marker-outline" />
                                                <span>{res.event?.venue?.name || res.event?.location || 'TBA'}</span>
                                            </div>
                                        </div>
                                        <div className="booth-qr-section" onClick={() => handleOpenQR(res)}>
                                            <div className="booth-qr-wrapper">
                                                <QRCodeCanvas
                                                    value={res._id}
                                                    size={70}
                                                    bgColor={"transparent"}
                                                    fgColor={"#333"}
                                                    level={"M"}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {shouldShowGiftRestoredNotice(
                                        payStatusLabel,
                                        res.appliedGift,
                                        res.giftCode
                                    ) && (
                                        <GiftRestoredNotice
                                            paymentStatus={payStatusLabel}
                                            appliedGift={res.appliedGift}
                                            giftCode={res.giftCode}
                                            compact
                                        />
                                    )}
                                    <div className="booth-card-footer">
                                        <NavLink to={`/sponsor/sponsor-booth-details/${res._id}`} className="view-details-btn">
                                            <Icon icon="mdi:eye-outline" /> View Full Details
                                        </NavLink>
                                        {(res.user?._id === user?._id || res.user === user?._id) && res.status === 'confirmed' && (
                                            <button 
                                                className="request-refund-btn"
                                                onClick={() => handleOpenRefund(res)}
                                            >
                                                Request Refund
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="empty-state">
                            <Icon icon="mdi:store-outline" width="48" />
                            <p>No booths found matching your search.</p>
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

            <SponsorEnlargeQR
                isOpen={isQROpen}
                onClose={handleCloseQR}
                booth={selectedBooth}
            />
            <SponsorRequestRefund 
                show={isRefundOpen}
                onClose={handleCloseRefund}
                boothData={selectedBooth}
            />
        </div>
    );
}


