import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import SponsorKit from './SponsorModal/SponsorKit';
import './SponsorEventDetails.css';

const SponsorEventDetails = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Overview');
    const [isSponsorKitModalOpen, setIsSponsorKitModalOpen] = useState(false);

    const tabs = ['Overview', 'Sponsorship Benefits', 'Pricing'];

    const handleViewMap = () => {
        navigate('/sponsor/sponsor-venue-layout');
    };

    return (
        <div className="sed-page-wrapper">
            <div className="sed-hero-banner">
                <div className="sed-hero-overlay"></div>
                <div className="sed-hero-content">
                    <span className="sed-open-pill button-label">SPONSORSHIP OPEN</span>
                    <h1 className="sed-hero-title">TechInnovate Summit 2024</h1>

                    <div className="sed-hero-info">
                        <div className="sed-hero-info-item">
                            <Icon icon="mdi:calendar" />
                            <span className="regular-body-text">Jun 16, 2026</span>
                        </div>
                        <div className="sed-hero-info-item">
                            <Icon icon="mdi:map-marker" />
                            <span className="regular-body-text">Starlight Arena, Los Angeles, CA</span>
                        </div>
                        <div className="sed-hero-info-item">
                            <Icon icon="mdi:account-group" />
                            <span className="regular-body-text">5,000+ Expected Attendees</span>
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
                                    The premier technology conference bringing together industry leaders, startups, and investors for three days of innovation and networking
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

            <SponsorKit isOpen={isSponsorKitModalOpen} onClose={() => setIsSponsorKitModalOpen(false)} />
        </div>
    );
};

export default SponsorEventDetails;
