import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { getImageUrl } from '../utils/imageUrl';
import { QRCodeCanvas } from 'qrcode.react';
import { useCustomerCart } from '../context/CustomerCartContext';
import usePagination from '../hooks/usePagination';
import PaginationBar from '../components/PaginationBar';
import './CustomerTicketOrder.css';
import CustomerEnlargeQr from './Modal/CustomerEnlargeQr';
import CustomerRequestRefund from './Modal/CustomerRequestRefund';
import GiftRestoredNotice from '../components/GiftRestoredNotice';
import { shouldShowGiftRestoredNotice } from '../utils/giftNoticeUtils';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const CustomerTicketOrder = () => {
    const { purchaseHistory } = useCustomerCart();

    const [loading, setLoading] = useState(true);
    const [qrModalShow, setQrModalShow] = useState(false);
    const [refundModalShow, setRefundModalShow] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [sortFilter, setSortFilter] = useState("Recently Buy");

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    const handleEnlargeQr = (ticket) => {
        setSelectedTicket(ticket);
        setQrModalShow(true);
    };

    const handleRequestRefund = (ticket) => {
        setSelectedTicket(ticket);
        setRefundModalShow(true);
    };

    // Map purchaseHistory to the UI structure
    const activeTickets = useMemo(() => {
        return purchaseHistory.map(item => ({
            id: item.cartId,
            title: item.event?.title || "Unknown Event",
            date: item.event?.startDate ? new Date(item.event.startDate).toLocaleDateString() : "TBA",
            time: item.event?.startTime || "TBA",
            location: item.event?.venue?.name || "TBA",
            seat: `Seat ${item.seat?.label || 'N/A'}`,
            status: (() => {
                const rawStatus = item.status?.toLowerCase();
                if (rawStatus === 'confirmed') return 'Paid';
                if (rawStatus === 'rejected') return 'Rejected';
                if (rawStatus === 'refunded') return 'Refunded';
                if (rawStatus === 'pending') return 'Pending';
                if (item.paymentMethod && item.paymentMethod.toLowerCase() === 'invoice') {
                    return 'Pending';
                }
                return 'Paid';
            })(),
            image: item.event?.image ? getImageUrl(item.event.image) : "/assets/eventbg.jpg",
            purchasedAt: item.purchaseDate,
            qrData: item.qrData || item.cartId,
            orderGift: item.orderGift || null,
            orderGiftCode: item.orderGiftCode || null,
            showGiftRestored: shouldShowGiftRestoredNotice(
                (() => {
                    const rawStatus = item.status?.toLowerCase();
                    if (rawStatus === 'rejected') return 'Rejected';
                    if (rawStatus === 'refunded') return 'Refunded';
                    return item.status;
                })(),
                item.orderGift,
                item.orderGiftCode
            ),
        }));
    }, [purchaseHistory]);

    const filteredAndSortedTickets = useMemo(() => {
        let result = [...activeTickets];

        // Search Filter
        if (searchQuery) {
            result = result.filter(ticket =>
                ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ticket.seat.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Status Filter
        if (statusFilter !== "All") {
            result = result.filter(ticket => ticket.status === statusFilter);
        }

        // Sort
        if (sortFilter === "Recently Buy") {
            result.sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt));
        } else if (sortFilter === "A-Z") {
            result.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sortFilter === "Z-A") {
            result.sort((a, b) => b.title.localeCompare(a.title));
        }

        return result;
    }, [activeTickets, searchQuery, statusFilter, sortFilter]);

    const itemsPerPage = 6;
    const {
        page, totalPages, total,
        setTotal, goTo, next, prev,
        reset: resetPage,
    } = usePagination({ limit: itemsPerPage });

    useEffect(() => {
        setTotal({
            total: filteredAndSortedTickets.length,
            totalPages: Math.ceil(filteredAndSortedTickets.length / itemsPerPage) || 1,
        });
    }, [filteredAndSortedTickets.length, setTotal]);

    useEffect(() => {
        resetPage();
    }, [searchQuery, statusFilter, sortFilter, resetPage]);

    const startIndex = (page - 1) * itemsPerPage;
    const paginatedTickets = filteredAndSortedTickets.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="customer-ticket-order-wrapper">
            <div className="customer-ticket-order-container">
                <div className="ticket-order-header">
                    <h2>My Tickets</h2>
                    <p className="regular-body-text text-secondary">View and manage your event tickets</p>
                </div>

                <div className="ticket-order-toolbar">
                    <div className="search-box">
                        <Icon icon="mdi:magnify" width="20" />
                        <input
                            type="text"
                            placeholder="Search by event title, seat..."
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

                {loading ? (
                    <div className="ticket-order-list">
                        {[1, 2, 3, 4].map((n) => (
                            <div className="ticket-card-new skeleton" key={n}>
                                <div className="ticket-card-top">
                                    <div className="skeleton-box ticket-skeleton-title" />
                                    <div className="skeleton-box ticket-skeleton-badge" />
                                </div>
                                <div className="ticket-card-body">
                                    <div className="skeleton-box ticket-skeleton-img" />
                                    <div className="ticket-details">
                                        <div className="skeleton-box ticket-skeleton-text-lg" />
                                        <div className="skeleton-box ticket-skeleton-text-sm" />
                                        <div className="skeleton-box ticket-skeleton-text-sm" style={{ width: '55%' }} />
                                    </div>
                                    <div className="skeleton-box ticket-skeleton-qr" />
                                </div>
                                <div className="ticket-card-footer">
                                    <div className="skeleton-box ticket-skeleton-btn" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : paginatedTickets.length > 0 ? (
                    <div className="ticket-order-list">
                        {paginatedTickets.map(ticket => (
                            <div className="ticket-card-new" key={ticket.id}>
                                <div className="ticket-card-top">
                                    <h4 className="ticket-event-title">{ticket.title}</h4>
                                    <span className={`ticket-status-badge ${ticket.status.toLowerCase()}`}>
                                        {ticket.status}
                                    </span>
                                </div>
                                <div className="ticket-card-body">
                                    <div className="ticket-image-container">
                                        <img 
                                            src={ticket.image} 
                                            alt={ticket.title} 
                                            onError={(e) => { e.target.src = "/assets/eventbg.jpg" }}
                                        />
                                    </div>
                                    <div className="ticket-details">
                                        <h5 className="ticket-seat-info">{ticket.seat}</h5>
                                        <div className="ticket-info-row">
                                            <span>{ticket.date}</span>
                                        </div>
                                        <div className="ticket-info-row">
                                            <span>{ticket.location}</span>
                                        </div>
                                    </div>
                                    <div className="ticket-qr-section" onClick={() => handleEnlargeQr(ticket)}>
                                        <div className="ticket-qr-wrapper" style={{ background: '#fff', padding: '5px', borderRadius: '4px', cursor: 'pointer' }}>
                                            <QRCodeCanvas
                                                value={ticket.qrData}
                                                size={70}
                                                bgColor={"#ffffff"}
                                                fgColor={"#000000"}
                                                level={"M"}
                                            />
                                        </div>
                                    </div>
                                </div>
                             
                                <div className="ticket-card-footer">
                                     <button
                                         className="request-refund-btn"
                                         onClick={() => handleRequestRefund(ticket)}
                                     >
                                         Request Refund
                                     </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <Icon icon="mdi:ticket-outline" width="48" />
                        <p>No tickets found. Start by browsing events!</p>
                    </div>
                )}

                {!loading && (
                    <PaginationBar
                        page={page}
                        totalPages={totalPages}
                        total={total}
                        onPrev={prev}
                        onNext={next}
                        onGoTo={goTo}
                    />
                )}
            </div>

            <CustomerEnlargeQr
                show={qrModalShow}
                onClose={() => setQrModalShow(false)}
                ticketData={selectedTicket}
            />
            <CustomerRequestRefund
                show={refundModalShow}
                onClose={() => setRefundModalShow(false)}
                ticketData={selectedTicket}
            />
        </div>
    );
};

export default CustomerTicketOrder;

