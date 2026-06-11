import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import './CustomerViewEventFullDetails.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const CustomerViewEventFullDetails = ({ show, onClose, eventData }) => {
    const navigate = useNavigate();

    const [heroImage, setHeroImage] = React.useState('/assets/eventbg.jpg');

    React.useEffect(() => {
        if (eventData?.image) {
            const imgUrl = `/uploads/${eventData.image}`;
            setHeroImage(imgUrl);
            const img = new Image();
            img.src = imgUrl;
            img.onerror = () => setHeroImage('/assets/eventbg.jpg');
        } else {
            setHeroImage('/assets/eventbg.jpg');
        }
    }, [eventData, BACKEND_URL]);

    if (!show) return null;

    const handleRequestRefund = () => {
        onClose();
        navigate('/customer/support', { 
            state: { 
                prefill: { 
                    subject: 'Refund Booth',
                    event: eventData?.title || 'Neon Dreams Tour'
                } 
            } 
        });
    };

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
                    <div 
                        className="cved-banner" 
                        style={{ 
                            backgroundImage: `url(${heroImage})` 
                        }}
                    >
                        <div className="cved-banner-text">
                            <span className={`button-label ${
                                eventData?.tag === "Concert" ? "event-tag-red" : 
                                eventData?.tag === "Sports" ? "event-tag-green" : "event-tag-blue"
                            }`}>{eventData?.tag || 'Event'}</span>
                            <h2 className="cved-event-title">{eventData?.title || 'Untitled Event'}</h2>
                        </div>
                    </div>

                    <div className="cved-info-row">
                        <div className="cved-info-col">
                            <div className="cved-info-icon-wrapper">
                                <Icon icon="mdi:calendar-blank-outline" width="24" />
                            </div>
                            <div className="cved-info-text">
                                <span className="smaller-body-text label-text">DATE</span>
                                <span className="small-body-text value-text">{eventData?.date ? eventData.date.split(' • ')[0] : 'TBA'}</span>
                            </div>
                        </div>
                        <div className="cved-info-col">
                            <div className="cved-info-icon-wrapper">
                                <Icon icon="mdi:clock-outline" width="24" />
                            </div>
                            <div className="cved-info-text">
                                <span className="smaller-body-text label-text">TIME</span>
                                <span className="small-body-text value-text">{eventData?.date && eventData.date.includes(' • ') ? eventData.date.split(' • ')[1] : 'TBA'}</span>
                            </div>
                        </div>
                        <div className="cved-info-col">
                            <div className="cved-info-icon-wrapper">
                                <Icon icon="mdi:map-marker-outline" width="24" />
                            </div>
                            <div className="cved-info-text">
                                <span className="smaller-body-text label-text">VENUE</span>
                                <span className="small-body-text value-text">{eventData?.venue?.name || 'TBA'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="cved-section">
                        <h3>About the Event</h3>
                        <p className="small-body-text">
                            {eventData?.description || "Join us for an unforgettable experience. This event promises to be a highlight of the season featuring spectacular performances and an electric atmosphere. Don't miss your chance to be part of the magic."}
                        </p>
                    </div>

                    <div className="cved-section cved-bg-gray">
                        <h4>Venue Information</h4>
                        <p className="small-body-text">
                            {eventData?.venue 
                                ? `${eventData.venue.name} is located at ${eventData.venue.address}, ${eventData.venue.city}, ${eventData.venue.zipCode || ""}. The venue is a premier destination for ${eventData?.tag?.toLowerCase() || 'live events'}, providing a world-class environment designed to ensure an exceptional experience for every attendee.` 
                                : "Venue information is currently being finalized. Please check back soon for more details about the location."}
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
                                <h3 className="cved-price">{eventData?.price || 'TBA'}</h3>
                            </div>
                        </div>

                        <div className="cved-ticket-actions">
                            <NavLink to="/customer/browse-events" className="outlined-button cved-seatmap-btn" onClick={onClose}>
                                <Icon icon="mdi:eye-outline" width="20" /> View Seatmap
                            </NavLink>
                            <NavLink to="/customer/event-details" className="primary-button cved-buy-btn" onClick={onClose}>
                                <Icon icon="mdi:cart-outline" width="20" /> Buy Tickets
                            </NavLink>
                        </div>
                        
                        {/* <div className="cved-refund-action" style={{ marginTop: '12px' }}>
                            <button className="outlined-button" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={handleRequestRefund}>
                                <Icon icon="mdi:cash-refund" width="20" /> Request Refund
                            </button>
                        </div> */}

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
