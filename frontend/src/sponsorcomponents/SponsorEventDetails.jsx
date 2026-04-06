import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate, useParams } from 'react-router-dom';
import SponsorKit from './SponsorModal/SponsorKit';
import { useAuthContext } from '../admincomponents/hooks/useAuthContext';
import eventsService from '../services/eventsService';
import './SponsorEventDetails.css';

const SponsorEventDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuthContext();
    const [activeTab, setActiveTab] = useState('Overview');
    const [isSponsorKitModalOpen, setIsSponsorKitModalOpen] = useState(false);
    const [event, setEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const tabs = ['Overview', 'Sponsorship Benefits', 'Pricing'];

    useEffect(() => {
        const fetchEvent = async () => {
            if (!id || !user?.token) return;
            setIsLoading(true);
            try {
                const data = await eventsService.getEvent(id, user.token);
                setEvent(data);
            } catch (error) {
                console.error("Error fetching event:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEvent();
    }, [id, user?.token]);

    const handleViewMap = () => {
        navigate('/sponsor/sponsor-venue-layout');
    };

    const handleBack = () => {
        navigate('/sponsor/sponsor-events');
    };

    if (isLoading) {
        return (
            <div className="sed-loading-container">
                <Icon icon="line-md:loading-twotone-loop" width="48" />
                <p>Loading event details...</p>
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
                        {event.category?.toUpperCase() || "SPONSORSHIP OPEN"}
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

                                <h4>Attendee Demographics</h4>
                                <div className="sed-demographics-grid">
                                    <div className="sed-demo-card">
                                        <h4 className="h6">CTOs & CIOs (30%)</h4>
                                    </div>
                                    <div className="sed-demo-card">
                                        <h4 className="h6">Developers (40%)</h4>
                                    </div>
                                    <div className="sed-demo-card">
                                        <h4 className="h6">Investors (15%)</h4>
                                    </div>
                                    <div className="sed-demo-card">
                                        <h4 className="h6">Media (15%)</h4>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Sponsorship Benefits' && (
                            <div className="sed-tab-pane">
                                <h3>Why Sponsor?</h3>

                                <div className="sed-benefits-list">
                                    <div className="sed-benefit-item">
                                        <div className="sed-benefit-icon bg-red-light text-red">
                                            <Icon icon="mdi:account-group" />
                                        </div>
                                        <div className="sed-benefit-text">
                                            <h6 className="text-primary">Direct Access to Decision Makers</h6>
                                            <p className="small-body-text text-secondary">Over 70% of our attendees are C-level executives or directors with purchasing power.</p>
                                        </div>
                                    </div>

                                    <div className="sed-benefit-item">
                                        <div className="sed-benefit-icon bg-blue-light text-blue">
                                            <Icon icon="mdi:shield-check-outline" />
                                        </div>
                                        <div className="sed-benefit-text">
                                            <h6 className="text-primary">Brand Visibility</h6>
                                            <p className="small-body-text text-secondary">Get featured in our event app, website, and signage throughout the venue.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Pricing' && (
                            <div className="sed-tab-pane">
                                <h3>Booth Pricing</h3>

                                <div className="sed-pricing-grid">
                                    <div className="sed-pricing-card">
                                        <h6 className="text-primary text-center">Standard Booth</h6>
                                        <p className="small-body-text text-primary text-center font-bold">10×10</p>
                                        <h3 className="text-red text-center mt-2">$2,500</h3>
                                    </div>

                                    <div className="sed-pricing-card">
                                        <h6 className="text-primary text-center">Corner Booth</h6>
                                        <p className="small-body-text text-primary text-center font-bold">10×10</p>
                                        <h3 className="text-red text-center mt-2">$3,000</h3>
                                    </div>

                                    <div className="sed-pricing-card">
                                        <h6 className="text-primary text-center">Premium Island</h6>
                                        <p className="small-body-text text-primary text-center font-bold">20×20</p>
                                        <h3 className="text-red text-center mt-2">$8,000</h3>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="sed-content-right">
                    <div className="sed-reserve-card">
                        <h4 className="text-primary">Reserve your Spot</h4>
                        <p className="small-body-text text-secondary mb-4">
                            Booths are selling fast! View the live map to see available locations and secure your preferred spot.
                        </p>

                        <div className="sed-availability-row">
                            <span className="small-body-text text-secondary font-medium">Standard Booths</span>
                            <span className="small-body-text text-green font-bold">8 Available</span>
                        </div>

                        <div className="sed-availability-row">
                            <span className="small-body-text text-secondary font-medium">Premium Islands</span>
                            <span className="small-body-text text-red font-bold">2 Left</span>
                        </div>

                        <div className="sed-progress-bar-container">
                            <div className="sed-progress-bar" style={{ width: '75%' }}></div>
                        </div>
                        <div className="sed-progress-text">
                            <span className="smaller-body-text text-secondary">75% Sold Out</span>
                        </div>

                        <button className="primary-button sed-full-btn" onClick={handleViewMap}>View Booth Map</button>

                        <button className="outlined-button sed-view-kit mt-3" onClick={() => setIsSponsorKitModalOpen(true)}>View Sponsorship Kit</button>
                    </div>
                </div>
            </div>

            <SponsorKit 
                isOpen={isSponsorKitModalOpen} 
                onClose={() => setIsSponsorKitModalOpen(false)} 
                event={event}
            />
        </div>
    );
};

export default SponsorEventDetails;
