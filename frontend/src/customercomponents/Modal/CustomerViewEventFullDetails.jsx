import React from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from '@iconify/react';
import './CustomerViewEventFullDetails.css';

const CustomerViewEventFullDetails = ({ show, onClose, eventData }) => {
    if (!show) return null;

    return (
        <div className="cved-modal-overlay" onClick={onClose}>
            <div className="cved-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="cved-modal-header">
                    <h2 className="cved-modal-title">Event Details</h2>
                    <button className="cved-close-btn" onClick={onClose}>
                        <Icon icon="mdi:close" width="24" />
                    </button>
                </div>

                <div className="cved-modal-body">
                    <div className="cved-banner" style={{ backgroundImage: `url('/assets/eventbg.jpg')` }}>
                        <div className="cved-banner-text">
                            <span className="button-label event-tag-red">{eventData?.tag || 'Concert'}</span>
                            <h2 className="cved-event-title">{eventData?.title || 'Neon Dreams Tour'}</h2>
                        </div>
                    </div>

                    <div className="cved-info-row">
                        <div className="cved-info-col">
                            <div className="cved-info-icon-wrapper">
                                <Icon icon="mdi:calendar-blank-outline" width="24" />
                            </div>
                            <div className="cved-info-text">
                                <span className="smaller-body-text label-text">DATE</span>
                                <span className="small-body-text value-text">{eventData?.date ? eventData.date.split(' • ')[0] : 'Saturday, June 15, 2024'}</span>
                            </div>
                        </div>
                        <div className="cved-info-col">
                            <div className="cved-info-icon-wrapper">
                                <Icon icon="mdi:clock-outline" width="24" />
                            </div>
                            <div className="cved-info-text">
                                <span className="smaller-body-text label-text">TIME</span>
                                <span className="small-body-text value-text">{eventData?.date && eventData.date.includes(' • ') ? eventData.date.split(' • ')[1] : '20:00'}</span>
                            </div>
                        </div>
                        <div className="cved-info-col">
                            <div className="cved-info-icon-wrapper">
                                <Icon icon="mdi:map-marker-outline" width="24" />
                            </div>
                            <div className="cved-info-text">
                                <span className="smaller-body-text label-text">VENUE</span>
                                <span className="small-body-text value-text">{eventData?.location || 'Starlight Arena, Los Angeles, CA'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="cved-section">
                        <h3>About the Event</h3>
                        <p className="small-body-text">
                            Experience the synth-wave sensation of the year with spectacular visuals and sound. Join us for an unforgettable experience at Starlight Arena. This event promises to be a highlight of the year, featuring spectacular performances and an electric atmosphere. Don't miss your chance to be part of the magic.
                        </p>
                    </div>

                    <div className="cved-section cved-bg-gray">
                        <h4>Venue Information</h4>
                        <p className="small-body-text">
                            Located in the heart of Los Angeles, CA, Starlight Arena is a premier destination for live entertainment. The venue features state-of-the-art acoustics, comfortable seating, and excellent sightlines from every angle.
                        </p>
                        <div className="cved-venue-amenities">
                            <span className="smaller-body-text"><Icon icon="mdi:wheelchair-accessibility" /> Accessible Seating</span>
                            <span className="smaller-body-text"><Icon icon="mdi:parking" /> Parking Available</span>
                        </div>
                    </div>

                    <div className="cved-ticket-block">
                        <div className="cved-ticket-block-header">
                            <div>
                                <span className="smaller-body-text">Ticket Prices</span>
                                <h3 className="cved-price">{eventData?.price || '$45 - $150'}</h3>
                            </div>
                        </div>

                        <div className="cved-ticket-actions">
                            <NavLink to="/sponsor/sponsor-events" className="outlined-button cved-seatmap-btn" onClick={onClose}>
                                <Icon icon="mdi:eye-outline" width="20" /> View Seatmap
                            </NavLink>
                            <NavLink to="/sponsor/sponsor-events" className="primary-button cved-buy-btn" onClick={onClose}>
                                <Icon icon="mdi:cart-outline" width="20" /> Buy Tickets
                            </NavLink>
                        </div>
                        <p className="smaller-body-text cved-ticket-note">
                            Browse available seats and pricing before committing to purchase
                        </p>
                    </div>

                    <div className="cved-guarantee-alert">
                        <Icon icon="mdi:shield-check-outline" width="20" className="cved-guarantee-icon" />
                        <span className="smaller-body-text">100% Buyer Guarantee. Get valid tickets to any event or your money back.</span>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CustomerViewEventFullDetails;
