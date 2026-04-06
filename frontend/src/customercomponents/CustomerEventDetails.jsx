import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import './CustomerEventDetails.css';

const CustomerEventDetails = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Overview');

    const handleViewMap = () => {
        setActiveTab('Venue Map');
    };

    return (
        <div className="ced-page-wrapper">
            <div className="ced-hero-banner">
                <div className="ced-hero-overlay"></div>
                <div className="ced-hero-content">
                    <span className="ced-open-pill button-label">Concert</span>
                    <h1 className="ced-hero-title">Neon Dreams Tour</h1>

                    <div className="ced-hero-info">
                        <div className="ced-hero-info-item">
                            <Icon icon="mdi:calendar" />
                            <span className="regular-body-text">Saturday, June 15, 2024</span>
                        </div>
                        <div className="ced-hero-info-item">
                            <Icon icon="mdi:clock-time-three-outline" />
                            <span className="regular-body-text">20:00</span>
                        </div>
                        <div className="ced-hero-info-item">
                            <Icon icon="mdi:map-marker" />
                            <span className="regular-body-text">Starlight Arena, Los Angeles, CA</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="ced-main-container">
                <div className="ced-content-left">
                    <div className="ced-tabs">
                        <button className={`ced-tab h6 ${activeTab === 'Overview' ? 'active' : ''}`} onClick={() => setActiveTab('Overview')}>Overview</button>
                        <button className={`ced-tab h6 ${activeTab === 'Tickets' ? 'active' : ''}`} onClick={() => setActiveTab('Tickets')}>Tickets</button>
                        {/* <button className={`ced-tab h6 ${activeTab === 'Marketplace' ? 'active' : ''}`} onClick={() => setActiveTab('Marketplace')}><Icon icon="mdi:storefront-outline" /> Marketplace <span className="ced-live-badge">LIVE</span></button> */}
                        <button className={`ced-tab h6 ${activeTab === 'Venue Map' ? 'active' : ''}`} onClick={() => setActiveTab('Venue Map')}>Venue Map</button>
                    </div>

                    <div className="ced-tab-content">
                        {activeTab === 'Overview' && (
                            <div className="ced-tab-pane">
                                <h3>About the Event</h3>
                                <p className="regular-body-text text-secondary ced-desc">
                                    Experience the synth-wave sensation of the year with spectacular visuals and sound. Join us for an unforgettable experience at Starlight Arena. This event promises to be a highlight of the year, featuring spectacular performances and an electric atmosphere. Don't miss your chance to be part of the magic.
                                </p>

                                <h4>Venue Information</h4>
                                <div className="ced-venue-card">
                                    <h6 className="text-primary mb-2">Starlight Arena</h6>
                                    <p className="small-body-text text-secondary mb-3">
                                        Located in the heart of Los Angeles, CA, Starlight Arena is a premier destination for live entertainment. The venue features state-of-the-art acoustics, comfortable seating, and excellent sightlines from every angle.
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
                                    {/* Standard Ticket */}
                                    <div className="ced-ticket-item">
                                        <div className="ced-ticket-top">
                                            <div className="ced-ticket-info">
                                                <h6 className="text-primary">Standard Admission</h6>
                                                <p className="smaller-body-text text-secondary">
                                                    General seating access
                                                </p>
                                            </div>
                                            <h6 className="ced-ticket-price">From $45</h6>
                                        </div>
                                        <button
                                            className="primary-button ced-full-btn"
                                            onClick={() => navigate('/customer/seats')}
                                        >
                                            Select Seats
                                        </button>
                                    </div>
                                    {/* VIP Ticket */}
                                    <div className="ced-ticket-item ced-vip-ticket">

                                        <div className="ced-ticket-top">
                                            <div className="ced-ticket-info">
                                                <h6 className="text-primary">VIP Experience</h6>
                                                <p className="smaller-body-text text-secondary">
                                                    Premium seating, early access, exclusive lounge
                                                </p>
                                            </div>

                                            <h6 className="ced-ticket-price">From $150</h6>
                                        </div>

                                        <button
                                            className="primary-button ced-full-btn"
                                            onClick={() => navigate('/customer/seats')}
                                        >
                                            Select VIP Seats
                                        </button>

                                    </div>

                                </div>
                            </div>
                        )}

                        {/* {activeTab === 'Marketplace' && (
                            <div className="ced-tab-pane">
                                <div className="ced-marketplace-header">
                                    <h3>Event Marketplace</h3>
                                    <span className="ced-live-pill button-label">LIVE NOW</span>
                                </div>
                                <div className="ced-warning-alert">
                                    <Icon icon="mdi:alert-circle-outline" />
                                    <span className="smaller-body-text text-orange"><b>Order now, skip the line!</b> Purchase items here and pick them up at the vendor booths using your digital Pickup Ticket.</span>
                                </div>

                                <div className="ced-marketplace-grid">
                                    <div className="ced-store-card">
                                        <div className="ced-store-icon merch-icon">
                                            <Icon icon="mdi:tshirt-crew-outline" alt="Merch" />
                                        </div>
                                        <h6 className="text-primary mt-2">Official Merch Store</h6>
                                        <span className="ced-store-badge mt-2 border-red text-red">MERCH</span>
                                        <p className="smaller-body-text text-secondary mt-2">Exclusive event merchandise and apparel.</p>
                                        <button className="outlined-button ced-store-btn mt-3"><Icon icon="mdi:storefront-outline" /> View Store</button>
                                    </div>
                                    <div className="ced-store-card">
                                        <div className="ced-store-icon burger-icon">
                                            <Icon icon="mdi:hamburger" alt="Burger" />
                                        </div>
                                        <h6 className="text-primary mt-2">Burger Stand</h6>
                                        <span className="ced-store-badge mt-2 bg-red-quaternary text-red">FOOD</span>
                                        <p className="smaller-body-text text-secondary mt-2">Gourmet burgers and fries.</p>
                                        <button className="outlined-button ced-store-btn mt-3"><Icon icon="mdi:storefront-outline" /> View Store</button>
                                    </div>
                                    <div className="ced-store-card">
                                        <div className="ced-store-icon coffee-icon">
                                            <Icon icon="mdi:coffee-outline" alt="Drinks" />
                                        </div>
                                        <h6 className="text-primary mt-2">Coffee Store</h6>
                                        <span className="ced-store-badge mt-2 bg-red-quaternary text-red">DRINKS</span>
                                        <p className="smaller-body-text text-secondary mt-2">Freshly brewed coffee and pastries.</p>
                                        <button className="outlined-button ced-store-btn mt-3"><Icon icon="mdi:storefront-outline" /> View Store</button>
                                    </div>
                                    <div className="ced-store-card">
                                        <div className="ced-store-icon pizza-icon">
                                            <Icon icon="mdi:pizza" alt="Pizza" />
                                        </div>
                                        <h6 className="text-primary mt-2">Pizza Stall</h6>
                                        <span className="ced-store-badge mt-2 bg-red-quaternary text-red">FOOD</span>
                                        <p className="smaller-body-text text-secondary mt-2">Wood-fired pizza by the slice.</p>
                                        <button className="outlined-button ced-store-btn mt-3"><Icon icon="mdi:storefront-outline" /> View Store</button>
                                    </div>
                                </div>
                            </div>
                        )} */}

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
                        <h2 className="text-primary mt-1 mb-3">$45 - $150</h2>

                        <button className="primary-button ced-full-btn mb-4" onClick={() => navigate('/customer/seats')}>Buy Tickets</button>

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
                                state: { prefill: { event: 'Neon Dreams Tour' } } 
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
