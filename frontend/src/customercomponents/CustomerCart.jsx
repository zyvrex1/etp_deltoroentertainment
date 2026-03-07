import React from 'react';
import { Icon } from '@iconify/react';
import './CustomerCart.css';

const CustomerCart = () => {
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
        <div className="ccart-page-wrapper">
            <div className="ccart-container">
                <div className="ccart-header">
                    <h2>My Tickets</h2>
                </div>

                <div className="ccart-grid">
                    {activeTickets.map(ticket => (
                        <div className="ccart-card" key={ticket.id}>
                            <div className="ccart-card-left">
                                <div className="ccart-card-header">
                                    <h4 className="ccart-ticket-title">{ticket.title}</h4>
                                    <span className="ccart-status-pill button-label">{ticket.status}</span>
                                </div>

                                <div className="ccart-info-row">
                                    <Icon icon="mdi:calendar-blank-outline" width="18" />
                                    <span className="small-body-text">{ticket.date}</span>
                                </div>
                                <div className="ccart-info-row">
                                    <Icon icon="mdi:clock-outline" width="18" />
                                    <span className="small-body-text">{ticket.time}</span>
                                </div>
                                <div className="ccart-info-row">
                                    <Icon icon="mdi:map-marker-outline" width="18" />
                                    <span className="small-body-text">{ticket.location}</span>
                                </div>

                                <div className="ccart-seat-section">
                                    <span className="smaller-body-text">Seat Location</span>
                                    <h5 className="ccart-seat-number">{ticket.seat}</h5>
                                </div>
                            </div>

                            <div className="ccart-card-right">
                                <div className="ccart-qr-container">
                                    <Icon icon="mdi:qrcode" width="80" className="ccart-qr" />
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

export default CustomerCart;
