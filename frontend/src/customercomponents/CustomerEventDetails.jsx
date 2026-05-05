import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';
import eventsService from '../services/eventsService';
import './CustomerEventDetails.css';

const CustomerEventDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuthContext();
    const [activeTab, setActiveTab] = useState('Overview');
    const [event, setEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const tabs = ['Overview', 'Pricing'];

    useEffect(() => {
        const fetchEvent = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const data = await eventsService.getEvent(id, user?.token);
                setEvent(data);
            } catch (error) {
                console.error("Error fetching event:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEvent();
    }, [id, user?.token]);

    const handleBuyTickets = () => {
        navigate(`/customer/seats/${id}`);
    };

    const handleBack = () => {
        navigate('/customer/browse-events');
    };

    if (isLoading) {
        return (
            <div className="sed-page-wrapper">
                <div className="sed-top-header">
                    <div className="sed-header-left">
                        <div className="skeleton" style={{width: '40px', height: '40px', borderRadius: '50%'}}></div>
                        <div className="skeleton skeleton-text title" style={{width: '300px', margin: '0 0 0 20px'}}></div>
                    </div>
                </div>
                <div className="sed-hero-banner skeleton" style={{background: '#eee'}}></div>
                <div className="sed-main-container">
                    <div className="sed-content-left">
                        <div className="sed-tabs" style={{gap: '20px'}}>
                            <div className="skeleton" style={{width: '100px', height: '40px', borderRadius: '8px'}}></div>
                            <div className="skeleton" style={{width: '150px', height: '40px', borderRadius: '8px'}}></div>
                        </div>
                        <div className="sed-tab-content">
                            <div className="skeleton skeleton-text title" style={{width: '40%'}}></div>
                            <div className="skeleton skeleton-text" style={{width: '100%'}}></div>
                            <div className="sed-summary-grid" style={{marginTop: '30px'}}>
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="skeleton" style={{height: '80px', borderRadius: '12px'}}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="sed-content-right">
                        <div className="sed-reserve-card skeleton" style={{height: '350px', borderRadius: '16px'}}></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="sed-error-container">
                <Icon icon="mdi:alert-circle-outline" width="48" />
                <h3>Event not found</h3>
                <button className="primary-button" onClick={handleBack}>Go Back</button>
            </div>
        );
    }

    const calculateDays = (startDate, endDate) => {
        if (!startDate || !endDate) return 1;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays + 1;
    };

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

    return (
        <div className="sed-page-wrapper">
            <div className="sed-top-header">
                <div className="sed-header-left">
                    <button className="sed-back-btn" onClick={handleBack}>
                        <Icon icon="mdi:arrow-left" width="24" />
                    </button>
                    <h1>{event.title}</h1>
                </div>
            </div>

            <div
                className="sed-hero-banner"
                style={{
                    backgroundImage: event.image
                        ? `url(${BACKEND_URL}/uploads/${event.image})`
                        : "url('/assets/eventbg.jpg')"
                }}
            >
                <div className="sed-hero-overlay"></div>
                <div className="sed-hero-content">
                    <span className="sed-open-pill button-label">
                        {event.category?.toUpperCase() || "EVENT OPEN"}
                    </span>
                    <h1 className="sed-hero-title">{event.title}</h1>

                    <div className="sed-hero-info">
                        <div className="sed-hero-info-item">
                            <Icon icon="mdi:calendar" />
                            <span className="regular-body-text">
                                {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                        <div className="sed-hero-info-item">
                            <Icon icon="mdi:map-marker" />
                            <span className="regular-body-text">{event.venue?.name || "TBA"}, {event.venue?.city || ""}, {event.venue?.state || ""}</span>
                        </div>
                        <div className="sed-hero-info-item">
                            <Icon icon="mdi:clock-outline" />
                            <span className="regular-body-text">{event.startTime || "TBA"} - {event.endTime || "TBA"}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="sed-main-container">
                <div className="sed-content-left">
                    <div className="sed-tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                className={`sed-tab h6 ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="sed-tab-content">
                        {activeTab === 'Overview' && (
                            <div className="sed-tab-pane">
                                <h3>About the Event</h3>
                                <p className="regular-body-text text-secondary sed-desc">
                                    {event.description || "No description available for this event."}
                                </p>

                                <h4>Event Highlights</h4>
                                <div className="sed-summary-grid">
                                    <div className="sed-summary-card">
                                        <div className="sed-summary-icon bg-red-light text-red">
                                            <Icon icon="mdi:calendar-clock" />
                                        </div>
                                        <div className="sed-summary-text">
                                            <p className="smaller-body-text text-secondary">Duration</p>
                                            <h6>{calculateDays(event.startDate, event.endDate)} Days</h6>
                                        </div>
                                    </div>
                                    <div className="sed-summary-card">
                                        <div className="sed-summary-icon bg-blue-light text-blue">
                                            <Icon icon="mdi:ticket-outline" />
                                        </div>
                                        <div className="sed-summary-text">
                                            <p className="smaller-body-text text-secondary">Total Seats</p>
                                            <h6>{event.totalTickets || 0} Capacity</h6>
                                        </div>
                                    </div>
                                    <div className="sed-summary-card">
                                        <div className="sed-summary-icon bg-green-light text-green">
                                            <Icon icon="mdi:tag-outline" />
                                        </div>
                                        <div className="sed-summary-text">
                                            <p className="smaller-body-text text-secondary">Category</p>
                                            <h6>{event.category}</h6>
                                        </div>
                                    </div>
                                    <div className="sed-summary-card">
                                        <div className="sed-summary-icon bg-purple-light text-purple">
                                            <Icon icon="mdi:map-marker-radius" />
                                        </div>
                                        <div className="sed-summary-text">
                                            <p className="smaller-body-text text-secondary">Location</p>
                                            <h6>{event.venue?.city || "TBA"}</h6>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Pricing' && (
                            <div className="sed-tab-pane">
                                <h3>Ticket Pricing</h3>

                                <div className="sed-pricing-grid">
                                    {(event.priceLevels || [])
                                        .filter(pl => (pl.type || '').toLowerCase().includes("seat") || (pl.type || '').toLowerCase().includes("circle"))
                                        .map((pl, idx) => {
                                            const totalAvailable = pl.quantityAvailable - (pl.quantitySold || 0);

                                            return (
                                                <div className="sed-pricing-card" key={idx}>
                                                    <h6 className="text-primary text-center">{pl.priceName}</h6>
                                                    <p className="small-body-text text-primary text-center font-bold">{pl.description || "General Entry"}</p>
                                                    <h3 className="text-red text-center mt-2">${(pl.facePrice || 0).toLocaleString()}</h3>
                                                    <div className="text-center mt-2">
                                                        <span className={`smaller-body-text ${totalAvailable > 0 ? 'text-green' : 'text-red'}`}>
                                                            {totalAvailable > 0 ? `${totalAvailable} Seats Available` : 'Sold Out'}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    }
                                    {(!event.priceLevels || event.priceLevels.filter(pl => (pl.type || '').toLowerCase().includes("seat") || (pl.type || '').toLowerCase().includes("circle")).length === 0) && (
                                        <p className="text-secondary">No ticket pricing available yet.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="sed-content-right">
                    <div className="sed-reserve-card">
                        <h4 className="text-primary">Get your Tickets</h4>
                        <p className="small-body-text text-secondary mb-4">
                            Tickets are selling fast! Secure your seats now and enjoy the event from the best location.
                        </p>

                        {(event.priceLevels || [])
                            .filter(pl => (pl.type || '').toLowerCase().includes("seat") || (pl.type || '').toLowerCase().includes("circle"))
                            .slice(0, 3)
                            .map((pl, idx) => {
                                const totalAvailable = pl.quantityAvailable - (pl.quantitySold || 0);

                                return (
                                    <div className="sed-availability-row" key={idx}>
                                        <span className="small-body-text text-secondary font-medium">{pl.priceName}</span>
                                        <span className={`small-body-text font-bold ${totalAvailable > 0 ? 'text-green' : 'text-red'}`}>
                                            {totalAvailable > 0 ? `${totalAvailable} Avail` : 'Sold Out'}
                                        </span>
                                    </div>
                                );
                            })
                        }

                        {(() => {
                            const totalCapacity = event.totalTickets || 0;
                            const sold = event.ticketsSold || 0;
                            const percent = totalCapacity > 0 ? Math.round((sold / totalCapacity) * 100) : 0;

                            return (
                                <>
                                    <div className="sed-progress-bar-container">
                                        <div className="sed-progress-bar" style={{ width: `${percent}%` }}></div>
                                    </div>
                                    <div className="sed-progress-text">
                                        <span className="smaller-body-text text-secondary">{percent}% Sold</span>
                                    </div>
                                </>
                            );
                        })()}

                        <button className="primary-button sed-full-btn" onClick={handleBuyTickets}>Buy Tickets Now</button>

                        <div className="sed-help-link mt-4">
                            <span className="smaller-body-text text-secondary">Need help with this event? </span>
                            <button
                                className="link-btn text-red smaller-body-text"
                                onClick={() => navigate('/customer/support', {
                                    state: {
                                        tab: 'Submit a Concern',
                                        prefill: { event: event.title }
                                    }
                                })}
                            >
                                Contact Support
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerEventDetails;
