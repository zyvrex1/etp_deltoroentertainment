import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';
import eventsService from '../services/eventsService';
import './CustomerEventDetails.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const CustomerEventDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthContext();
    const [event, setEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Overview');

    useEffect(() => {
        const fetchEvent = async () => {
            setIsLoading(true);
            try {
                const data = await eventsService.getEvent(id, user?.token);
                setEvent(data);
            } catch (error) {
                console.error("Error fetching event details:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchEvent();
    }, [id, user?.token]);

    const handleViewMap = () => {
        setActiveTab('Venue Map');
    };

    const formatFullDate = (startDate) => {
        if (!startDate) return "TBA";
        return new Date(startDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getPriceRange = () => {
        if (!event?.priceLevels || event.priceLevels.length === 0) return "TBA";
        const prices = event.priceLevels.map(p => p.facePrice).filter(p => p > 0);
        if (prices.length === 0) return "TBA";
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return min === max ? `$${min}` : `$${min} - $${max}`;
    };

    if (isLoading) {
        return (
            <div className="ced-page-wrapper">
                <div className="ced-hero-banner skeleton" style={{ height: '400px', background: '#eee' }}></div>
                <div className="ced-main-container">
                    <div className="ced-content-left">
                        <div className="skeleton-box" style={{ height: '40px', width: '300px', marginBottom: '24px' }}></div>
                        <div className="skeleton-box" style={{ height: '200px', width: '100%' }}></div>
                    </div>
                </div>
                <style>{`
                    .skeleton-box {
                        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                        background-size: 200% 100%;
                        animation: skeleton-loading 1.5s infinite;
                        border-radius: 4px;
                    }
                    @keyframes skeleton-loading {
                        0% { background-position: 200% 0; }
                        100% { background-position: -200% 0; }
                    }
                `}</style>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="ced-page-wrapper">
                <div className="ced-empty-state" style={{ padding: '100px', textAlign: 'center' }}>
                    <Icon icon="mdi:alert-circle-outline" width="48" />
                    <h3>Event not found</h3>
                    <button className="primary-button mt-4" onClick={() => navigate('/customer/browse-events')}>Back to Browse</button>
                </div>
            </div>
        );
    }

    return (
        <div className="ced-page-wrapper">
            <div className="ced-hero-banner" style={{ 
                backgroundImage: event.image ? `url(${BACKEND_URL}/uploads/${event.image})` : 'url(/assets/eventbg.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}>
                <div className="ced-hero-overlay"></div>
                <div className="ced-hero-content">
                    <span className="ced-open-pill button-label">{event.category || "Event"}</span>
                    <h1 className="ced-hero-title">{event.title}</h1>

                    <div className="ced-hero-info">
                        <div className="ced-hero-info-item">
                            <Icon icon="mdi:calendar" />
                            <span className="regular-body-text">{formatFullDate(event.startDate)}</span>
                        </div>
                        <div className="ced-hero-info-item">
                            <Icon icon="mdi:clock-time-three-outline" />
                            <span className="regular-body-text">{event.startTime || "TBA"}</span>
                        </div>
                        <div className="ced-hero-info-item">
                            <Icon icon="mdi:map-marker" />
                            <span className="regular-body-text">
                                {event.venue?.name}, {event.venue?.city}, {event.venue?.state || ""}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="ced-main-container">
                <div className="ced-content-left">
                    <div className="ced-tabs">
                        <button className={`ced-tab h6 ${activeTab === 'Overview' ? 'active' : ''}`} onClick={() => setActiveTab('Overview')}>Overview</button>
                        <button className={`ced-tab h6 ${activeTab === 'Tickets' ? 'active' : ''}`} onClick={() => setActiveTab('Tickets')}>Tickets</button>
                        <button className={`ced-tab h6 ${activeTab === 'Venue Map' ? 'active' : ''}`} onClick={() => setActiveTab('Venue Map')}>Venue Map</button>
                    </div>

                    <div className="ced-tab-content">
                        {activeTab === 'Overview' && (
                            <div className="ced-tab-pane">
                                <h3>About the Event</h3>
                                <p className="regular-body-text text-secondary ced-desc">
                                    {event.description}
                                </p>

                                <h4>Venue Information</h4>
                                <div className="ced-venue-card">
                                    <h6 className="text-primary mb-2">{event.venue?.name}</h6>
                                    <p className="small-body-text text-secondary mb-3">
                                        {event.venue?.address}, {event.venue?.city}, {event.venue?.zipCode}
                                    </p>
                                    <div className="ced-venue-amenities">
                                        <div className="ced-amenity-item">
                                            <Icon icon="mdi:information-outline" />
                                            <span className="smaller-body-text">Accessible Seating</span>
                                        </div>
                                        <div className="ced-amenity-item">
                                            <Icon icon="mdi:information-outline" />
                                            <span className="smaller-body-text">Parking Available</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Tickets' && (
                            <div className="ced-tab-pane">
                                <h3>Available Tickets</h3>
                                <div className="ced-tickets-list">
                                    {event.priceLevels?.map((pl) => (
                                        <div key={pl._id} className={`ced-ticket-item ${pl.name?.toLowerCase().includes('vip') ? 'ced-vip-ticket' : ''}`}>
                                            <div className="ced-ticket-top">
                                                <div className="ced-ticket-info">
                                                    <h6 className="text-primary">{pl.name}</h6>
                                                    <p className="smaller-body-text text-secondary">
                                                        {pl.description || "Admission ticket"}
                                                    </p>
                                                </div>
                                                <h6 className="ced-ticket-price">${pl.facePrice}</h6>
                                            </div>
                                            <button
                                                className="primary-button ced-full-btn"
                                                onClick={() => navigate(`/customer/seats/${event._id}`)}
                                                disabled={pl.quantityAvailable <= pl.quantitySold}
                                            >
                                                {pl.quantityAvailable <= pl.quantitySold ? "Sold Out" : "Select Seats"}
                                            </button>
                                        </div>
                                    ))}
                                    {(!event.priceLevels || event.priceLevels.length === 0) && (
                                        <p className="text-secondary">No tickets available yet.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'Venue Map' && (
                            <div className="ced-tab-pane">
                                <h3>Venue Layout</h3>
                                <div className="ced-venue-map-card">
                                    <div className="ced-venue-map-placeholder">
                                        <Icon icon="mdi:map-marker-outline" width="48" className="text-secondary" />
                                        <h6 className="text-primary mt-2">Interactive Venue Map</h6>
                                        <p className="smaller-body-text text-secondary mt-1">Showing entrances, vendors, and facilities</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="ced-content-right">
                    <div className="ced-right-card">
                        <span className="smaller-body-text text-secondary">Ticket Prices</span>
                        <h2 className="text-primary mt-1 mb-3">{getPriceRange()}</h2>

                        <button 
                            className="primary-button ced-full-btn mb-4" 
                            onClick={() => navigate(`/customer/seats/${event._id}`)}
                        >
                            Buy Tickets
                        </button>

                        <div className="ced-guarantee">
                            <Icon icon="mdi:shield-check-outline" className="text-green" />
                            <p className="smaller-body-text text-secondary m-0">
                                100% Buyer Guarantee. Get valid tickets to any event or your money back.
                            </p>
                        </div>
                    </div>

                    <div className="ced-help-support-card mt-l">
                        <span className="smaller-body-text text-secondary">Need help with this event?</span>
                        <button 
                            className="link-btn text-red smaller-body-text" 
                            onClick={() => navigate('/customer/support', { 
                                state: { prefill: { event: event.title } } 
                            })}
                        >
                            Contact Support
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerEventDetails;
