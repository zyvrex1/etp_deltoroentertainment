import React from 'react';
import { Icon } from '@iconify/react';
import './CustomerTicketOrder.css';

const CustomerTicketOrder = () => {
    // Mock active events/tickets mapping
    const activeTickets = [
        {
            id: 1,
            title: "Indie Rock Showcase",
            date: "6/25/2026",
            time: "19:00",
            location: "The Red Room, Austin, TX",
            seat: "Row A, Seat 12",
            status: "Active"
        },
        {
            id: 2,
            title: "Hamlet",
            date: "7/1/2026",
            time: "20:00",
            location: "Royal Globe Theatre, London, UK",
            seat: "Box 4, Seat 1",
            status: "Active"
        },
        {
            id: 3,
            title: "Indie Rock Showcase",
            date: "6/25/2026",
            time: "19:00",
            location: "The Red Room, Austin, TX",
            seat: "Row A, Seat 13",
            status: "Active"
        },
        {
            id: 4,
            title: "Hamlet",
            date: "7/1/2026",
            time: "20:00",
            location: "Royal Globe Theatre, London, UK",
            seat: "Box 5, Seat 10",
            status: "Active"
        }
    ];

    return (
        <div className="customer-ticket-order-wrapper">
            <div className="customer-ticket-order-container">
                <div className="ticket-order-header">
                    <h2>My Tickets</h2>
                </div>

                <div className="ticket-order-grid">
                    {activeTickets.map(ticket => (
                        <div className="ticket-order-card" key={ticket.id}>
                            <div className="ticket-order-card-left">
                                <div className="ticket-order-card-header">
                                    <h4 className="ticket-order-title">{ticket.title}</h4>
                                    <span className="ticket-order-status-pill button-label">{ticket.status}</span>
                                </div>

                                <div className="ticket-order-info-row">
                                    <Icon icon="mdi:calendar-blank-outline" width="18" />
                                    <span className="small-body-text">{ticket.date}</span>
                                </div>
                                <div className="ticket-order-info-row">
                                    <Icon icon="mdi:clock-outline" width="18" />
                                    <span className="small-body-text">{ticket.time}</span>
                                </div>
                                <div className="ticket-order-info-row">
                                    <Icon icon="mdi:map-marker-outline" width="18" />
                                    <span className="small-body-text">{ticket.location}</span>
                                </div>

                                <div className="ticket-order-seat-section">
                                    <span className="smaller-body-text">Seat Location</span>
                                    <h5 className="ticket-order-seat-number">{ticket.seat}</h5>
                                </div>
                            </div>

                            <div className="ticket-order-card-right">
                                <div className="ticket-order-qr-container">
                                    <Icon icon="mdi:qrcode" width="80" className="ticket-order-qr" />
                                </div>
                                <span className="smaller-body-text">Tap to enlarge</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CustomerTicketOrder;
