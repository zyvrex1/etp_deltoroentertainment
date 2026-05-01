import React from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';

import './SponsorKit.css';

const SponsorKit = ({ isOpen, onClose, event }) => {
    const navigate = useNavigate();
    if (!isOpen) return null;

    const handleReserveBooth = () => {
        navigate(`/sponsor/sponsor-venue-layout/${event?._id || event?.id}`);
    };

    const handleContact = () => {
        navigate('/sponsor/support');
    };

    const calculateDays = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays + 1;
    };

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return "TBA";
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const boothPrices = event?.priceLevels?.filter(pl => pl.type?.toLowerCase().includes("booth")) || [];

    const sortedBooths = [...boothPrices].sort((a, b) => (a.facePrice || 0) - (b.facePrice || 0));

    const getPackageDisplay = (booth, index, total) => {
        const name = booth.priceName?.toLowerCase() || "";
        
        // Style defaults
        let headerClass = 'sk-pkg-standard-header';
        let cardClass = '';
        let badge = null;

        // Exclusive Role Assignment
        const isCheapest = index === 0;
        const isBestDeal = index === total - 1;
        const middleIndex = Math.floor(total / 2);
        const isStandard = index === middleIndex && total >= 3;
        const isRecommended = total >= 5 && index === total - 2;
        
        // Priority logic for unique and repeating colors
        if (isBestDeal) {
            headerClass = 'bg-red-primary text-white';
            cardClass = 'sk-pkg-premium';
            badge = { text: 'Best Deal', class: 'sk-best-value-label' };
        } else if (isCheapest) {
            headerClass = 'bg-green-primary text-white';
            cardClass = 'sk-pkg-green';
            badge = { text: 'Cheapest', class: 'sk-cheapest-label' };
        } else if (isStandard) {
            headerClass = 'bg-blue-primary text-white';
            cardClass = 'sk-pkg-highlight';
            badge = { text: 'Standard', class: 'sk-standard-label' };
        } else if (isRecommended) {
            headerClass = 'bg-purple-primary text-white';
            cardClass = 'sk-pkg-purple';
        } else if (index < middleIndex) {
            // All packages between Cheapest and Standard use Yellow
            headerClass = 'bg-yellow-primary text-black';
            cardClass = 'sk-pkg-yellow';
            if (index === 1 || total < 6);
        } else {
            // All other packages (between Standard and Recommended/Best Deal) use Dark
            headerClass = 'sk-pkg-standard-header';
            cardClass = 'sk-pkg-dark';
            if (index === total - 3 || total < 6) ;
        }

        return { headerClass, cardClass, badge };
    };

    return (
        <div className="sponsor-kit-overlay">
            <div className="sponsor-kit-modal">
                <div className="sponsor-kit-header-sticky">
                    <div className="sponsor-kit-header-title">
                        <h3>Sponsorship Kit</h3>
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>{event?.title}</p>
                    </div>
                    <button className="kit-close-btn" onClick={onClose}>
                        <Icon icon="mdi:close" />
                    </button>
                </div>

                <div className="sponsor-kit-body">
                    <div className="sk-hero">
                        <div className="button-label sk-sponsored-by bg-red-primary text-white"> {event?.category}</div>
                        <h2>{event?.title}</h2>
                        <div className="sk-hero-details">
                            <span><Icon icon="mdi:calendar" /> {event?.startDate ? new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ""}</span>
                            <span><Icon icon="mdi:map-marker" /> {event?.venue?.name}, {event?.venue?.city}</span>
                            <span><Icon icon="mdi:clock-outline" /> {event?.startTime || "TBA"} - {event?.endTime || "TBA"}</span>
                        </div>
                    </div>

                    <div className="sk-section">
                        <h3 className="sk-section-title">About the Event</h3>
                        <p className="regular-body-text text-secondary mb-3">
                            {event?.description || "No description available for this event."}
                        </p>
                        <div className="sk-stats-grid">
                            <div className="sk-stat-card sk-stat-red">
                                <h4 className="text-red">{event?.startTime} - {event?.endTime}</h4>
                                <p className="smaller-body-text text-secondary">Event Time</p>
                            </div>
                            <div className="sk-stat-card sk-stat-blue">
                                <h3 className="text-blue">{calculateDays(event?.startDate, event?.endDate)} Day(s)</h3>
                                <p className="smaller-body-text text-secondary">Of Event</p>
                            </div>
                        </div>
                    </div>

                    {/* <div className="sk-section">
                        <h4 className="sk-section-title">Who Attends</h4>
                        <div className="sk-attends-grid">
                            <div className="sk-attends-bars">
                                <div className="sk-bar-item">
                                    <div className="sk-bar-label"><h6>CTOs & CIOs</h6><h6>30%</h6></div>
                                    <div className="sk-bar-track"><div className="sk-bar-fill bg-blue-primary" style={{ width: '30%' }}></div></div>
                                </div>
                                <div className="sk-bar-item">
                                    <div className="sk-bar-label"><h6>Software Developers</h6><h6>40%</h6></div>
                                    <div className="sk-bar-track"><div className="sk-bar-fill bg-green-primary" style={{ width: '40%' }}></div></div>
                                </div>
                                <div className="sk-bar-item">
                                    <div className="sk-bar-label"><h6>Investors & VCs</h6><h6>15%</h6></div>
                                    <div className="sk-bar-track"><div className="sk-bar-fill bg-purple-primary" style={{ width: '15%' }}></div></div>
                                </div>
                                <div className="sk-bar-item">
                                    <div className="sk-bar-label"><h6>Press & Media</h6><h6>15%</h6></div>
                                    <div className="sk-bar-track"><div className="sk-bar-fill bg-yellow-primary" style={{ width: '15%' }}></div></div>
                                </div>
                            </div>
                            <div className="sk-attends-profile">
                                <h6>Attendee Profile</h6>
                                <ul className="sk-profile-list">
                                    <li><Icon icon="mdi:check-circle" className="text-green" /> 75% hold director-level or above titles</li>
                                    <li><Icon icon="mdi:check-circle" className="text-green" /> Average company size: 500+ employees</li>
                                    <li><Icon icon="mdi:check-circle" className="text-green" /> 45% have budget authority over $1M+</li>
                                    <li><Icon icon="mdi:check-circle" className="text-green" /> Representing 40+ countries worldwide</li>
                                    <li><Icon icon="mdi:check-circle" className="text-green" /> 90% plan to return next year</li>
                                </ul>
                            </div>
                        </div>
                    </div> */}

                    <div className="sk-section">
                        <h4 className="sk-section-title">Sponsorship Packages</h4>
                        <div className="sk-packages-grid">
                            {sortedBooths.length > 0 ? (
                                sortedBooths.map((booth, index) => {
                                    const { headerClass, cardClass, badge } = getPackageDisplay(booth, index, sortedBooths.length);
                                    return (
                                        <div key={booth._id || booth.id || index} className={`sk-package-card ${cardClass}`}>
                                            <div className={`sk-pkg-header ${headerClass}`}>
                                                <h6>{booth.priceName}</h6>
                                                {badge && <span className={`button-label ${badge.class}`}>{badge.text}</span>}
                                            </div>
                                            <div className="sk-pkg-price">
                                                <h2>{formatCurrency(booth.facePrice)} {index > 0 && <span className="smaller-body-text text-secondary">+ tax</span>}</h2>
                                                <p className="smaller-body-text">{booth.boothSize || "Booth Space"}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="sk-empty-packages text-secondary">
                                    <p>No sponsorship packages available for this event yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="sk-section">
                        <h4 className="sk-section-title">Why Sponsor {event.title}?</h4>
                        <div className="sk-why-grid">
                            <div className="sk-why-card">
                                <div className="sk-why-header">
                                    <div className="sk-why-icon sk-bg-red-light text-red">
                                        <Icon icon="mdi:chart-line" />
                                    </div>
                                    <h5>Proven ROI</h5>
                                </div>
                                <p className="smaller-body-text text-secondary">
                                    Sponsors report an average of 127 qualified leads and 3.2x return on investment from booth participation.
                                </p>
                            </div>
                            <div className="sk-why-card">
                                <div className="sk-why-header">
                                    <div className="sk-why-icon sk-bg-blue-light text-blue"><Icon icon="mdi:earth" /></div>
                                    <h5>Global Reach</h5>
                                </div>
                                <p className="smaller-body-text text-secondary">Gain exposure to attendees from 40+ countries and media coverage reaching 500,000+ industry professionals.</p>
                            </div>
                            <div className="sk-why-card">
                                <div className="sk-why-header">
                                    <div className="sk-why-icon sk-bg-green-light text-green"><Icon icon="mdi:flash-outline" /></div>
                                    <h5>Instant Impact</h5>
                                </div>
                                <p className="smaller-body-text text-secondary">From day one, your brand is front and center — in the app, on signage, and in the hands of decision-makers.</p>
                            </div>
                        </div>
                    </div>

                    <div className="sk-section">
                        <div className="sk-quote border-blue-light">
                            <p className="regular-body-text text-blue sk-mb-2">"{event.title} delivered more qualified leads in 2 days than our entire trade show calendar last year. The audience quality is unmatched."</p>
                            <p className="smaller-body-text text-secondary">— VP of Marketing, Fortune 500 Tech Company</p>
                        </div>
                    </div>

                    <div className="sk-cta bg-dark text-white">
                        <div className="sk-cta-content">
                            <h3 className="sk-mb-2">Ready to Sponsor?</h3>
                            <p className="small-body-text">Booths are filling up fast. Reserve your space today or reach out to our sponsorship team for a custom package.</p>
                            <div className="sk-cta-contact">
                                <span><Icon icon="mdi:email-outline" /> sponsor@techinnovate.com</span>
                                <span><Icon icon="mdi:phone-outline" /> +1 (555) 123-4567</span>
                            </div>
                        </div>
                        <div className="sk-cta-actions">
                            <button className="primary-button sk-mb-3 sk-w-100 sk-flex-center sk-gap-2" onClick={handleReserveBooth}>Reserve a Booth <Icon icon="mdi:arrow-right" /></button>
                            <button className="outlined-button sk-w-100 sk-btn-outline-white" onClick={handleContact}>Contact Sales Team</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SponsorKit;
