import React, { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { useCustomerCart } from '../context/CustomerCartContext';
import './CustomerTicketOrder.css';
import CustomerEnlargeQr from './Modal/CustomerEnlargeQr';
import CustomerRequestRefund from './Modal/CustomerRequestRefund';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const CustomerTicketOrder = () => {
    const { purchaseHistory } = useCustomerCart();
    
    const [qrModalShow, setQrModalShow] = useState(false);
    const [refundModalShow, setRefundModalShow] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [sortFilter, setSortFilter] = useState("Recently Buy");

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
            title: item.event.title,
            date: new Date(item.event.startDate).toLocaleDateString(),
            time: item.event.startTime || "TBA",
            location: item.event.venue?.name || "TBA",
            seat: `Row ${item.seat.row}, Seat ${item.seat.label}`,
            status: item.status || "Upcoming",
            image: item.event.image ? `${BACKEND_URL}/uploads/${item.event.image}` : "/assets/eventbg.jpg",
            purchasedAt: item.purchaseDate
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

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    const totalPages = Math.ceil(filteredAndSortedTickets.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedTickets = filteredAndSortedTickets.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

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
                                <option value="All">All Status</option>
                                <option value="Upcoming">Upcoming</option>
                                <option value="Live">Live</option>
                                <option value="Completed">Completed</option>
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

                <div className="ticket-order-list">
                    {paginatedTickets.length > 0 ? (
                        paginatedTickets.map(ticket => (
                            <div className="ticket-card-new" key={ticket.id}>
                                <div className="ticket-card-top">
                                    <h4 className="ticket-event-title">{ticket.title}</h4>
                                    <span className={`ticket-status-badge ${ticket.status.toLowerCase()}`}>
                                        {ticket.status}
                                    </span>
                                </div>
                                <div className="ticket-card-body">
                                    <div className="ticket-image-container">
                                        <img src={ticket.image} alt={ticket.title} />
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
                                        <Icon icon="mdi:qrcode" width="70" />
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
                        ))
                    ) : (
                        <div className="empty-state">
                            <Icon icon="mdi:ticket-outline" width="48" />
                            <p>No tickets found. Start by browsing events!</p>
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

