import React, { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import './CustomerTicketOrder.css';
import CustomerEnlargeQr from './Modal/CustomerEnlargeQr';
import CustomerRequestRefund from './Modal/CustomerRequestRefund';

const CustomerTicketOrder = () => {
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

    // Mock active events/tickets mapping
    const [activeTickets] = useState([
        {
            id: 1,
            title: "Indie Rock Showcase",
            date: "6/25/2026",
            time: "19:00",
            location: "The Red Room, Austin, TX",
            seat: "Row A, Seat 12",
            status: "Live",
            image: "/assets/eventbg.jpg",
            purchasedAt: "2026-04-20T10:00:00Z"
        },
        {
            id: 2,
            title: "Hamlet",
            date: "7/1/2026",
            time: "20:00",
            location: "Royal Globe Theatre, London, UK",
            seat: "Box 4, Seat 1",
            status: "Upcoming",
            image: "/assets/eventbg.jpg",
            purchasedAt: "2026-04-21T11:00:00Z"
        },
        {
            id: 3,
            title: "Indie Rock Showcase",
            date: "6/25/2026",
            time: "19:00",
            location: "The Red Room, Austin, TX",
            seat: "Row A, Seat 13",
            status: "Live",
            image: "/assets/eventbg.jpg",
            purchasedAt: "2026-04-20T10:05:00Z"
        },
        {
            id: 4,
            title: "Jazz Night",
            date: "4/15/2026",
            time: "21:00",
            location: "Blue Note, New York, NY",
            seat: "Table 5, Seat 2",
            status: "Completed",
            image: "/assets/eventbg.jpg",
            purchasedAt: "2026-04-10T09:00:00Z"
        }
    ]);

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
                    {filteredAndSortedTickets.length > 0 ? (
                        filteredAndSortedTickets.map(ticket => (
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
                                            <Icon icon="mdi:calendar-blank-outline" />
                                            <span>{ticket.date}</span>
                                            <Icon icon="mdi:clock-outline" className="ml-3" />
                                            <span>{ticket.time}</span>
                                        </div>
                                        <div className="ticket-info-row">
                                            <Icon icon="mdi:map-marker-outline" />
                                            <span>{ticket.location}</span>
                                        </div>
                                    </div>
                                    <div className="ticket-qr-section" onClick={() => handleEnlargeQr(ticket)}>
                                        <Icon icon="mdi:qrcode" width="70" />
                                    </div>
                                </div>
                                <div className="ticket-card-footer">
                                    <button className="view-details-btn">
                                        <Icon icon="mdi:eye-outline" />
                                        View Full Details
                                    </button>
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
                            <p>No tickets found matching your search.</p>
                        </div>
                    )}
                </div>
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

