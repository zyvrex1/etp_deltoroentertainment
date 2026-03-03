import React from 'react';
import { Icon } from '@iconify/react';
import './SponsorKit.css';

const SponsorKit = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="sponsor-kit-overlay">
            <div className="sponsor-kit-modal">
                <div className="sponsor-kit-header-sticky">
                    <div className="sponsor-kit-header-title">
                        <h3>Sponsorship Kit</h3>
                        <p className="small-body-text text-secondary" style={{ margin: 0 }}>TechInnovate Summit 2024</p>
                    </div>
                    <button className="kit-close-btn" onClick={onClose}>
                        <Icon icon="mdi:close" />
                    </button>
                </div>

                <div className="sponsor-kit-body">
                    <div className="sk-hero">
                        <div className="button-label sk-sponsored-by bg-red-primary text-white">Sponsored by Q1 2024</div>
                        <h2>TechInnovate Summit 2024</h2>
                        <div className="sk-hero-details">
                            <span><Icon icon="mdi:calendar" /> Oct 15-17, 2024</span>
                            <span><Icon icon="mdi:map-marker" /> Moscone Center, SF</span>
                            <span><Icon icon="mdi:account-group" /> 5,000+ Attendees</span>
                        </div>
                    </div>

                    <div className="sk-section">
                        <h3 className="sk-section-title">About the Event</h3>
                        <p className="regular-body-text text-secondary mb-3">
                            TechInnovate Summit is the West Coast's most influential technology conference, bringing together the brightest minds in software, hardware, AI, and venture capital. Now in its 8th year, the Summit has grown into a must-attend event for anyone shaping the future of technology.
                        </p>
                        <div className="sk-stats-grid">
                            <div className="sk-stat-card sk-stat-red">
                                <h3 className="text-red">5,000+</h3>
                                <p className="smaller-body-text text-secondary">Attendees</p>
                            </div>
                            <div className="sk-stat-card sk-stat-blue">
                                <h3 className="text-blue">3 Days</h3>
                                <p className="smaller-body-text text-secondary">Of Programming</p>
                            </div>
                            <div className="sk-stat-card sk-stat-green">
                                <h3 className="text-green">150+</h3>
                                <p className="smaller-body-text text-secondary">Speakers</p>
                            </div>
                            <div className="sk-stat-card sk-stat-purple">
                                <h3 className="text-purple">8th</h3>
                                <p className="smaller-body-text text-secondary">Annual Edition</p>
                            </div>
                        </div>
                    </div>

                    <div className="sk-section">
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
                    </div>

                    <div className="sk-section">
                        <h4 className="sk-section-title">Sponsorship Packages</h4>
                        <div className="sk-packages-grid">
                            <div className="sk-package-card">
                                <div className="sk-pkg-header sk-pkg-standard-header">
                                    <h6>Standard</h6>
                                </div>
                                <div className="sk-pkg-price">
                                    <h2>$2,500 <span className="smaller-body-text text-secondary">+ tax</span></h2>
                                    <p className="smaller-body-text">10x10 ft booth space</p>
                                </div>
                                <ul className="sk-pkg-features">
                                    <li><Icon icon="mdi:check-circle-outline" className="text-green" /> 3 Exhibitor Passes</li>
                                    <li><Icon icon="mdi:check-circle-outline" className="text-green" /> Basic WiFi</li>
                                    <li><Icon icon="mdi:check-circle-outline" className="text-green" /> 1 Power Outlet</li>
                                    <li><Icon icon="mdi:check-circle-outline" className="text-green" /> Company listing in directory</li>
                                    <li><Icon icon="mdi:check-circle-outline" className="text-green" /> Logo on event website</li>
                                </ul>
                            </div>
                            <div className="sk-package-card sk-pkg-highlight">
                                <div className="sk-pkg-header bg-blue-primary text-white">
                                    <h6>Corner</h6>
                                    <span className="button-label sk-popular-label">Popular</span>
                                </div>
                                <div className="sk-pkg-price">
                                    <h2>$3,000 <span className="smaller-body-text text-secondary">+ tax</span></h2>
                                    <p className="smaller-body-text">10x10 ft booth space</p>
                                </div>
                                <ul className="sk-pkg-features">
                                    <li><Icon icon="mdi:check-circle-outline" className="text-green" /> 3 Exhibitor Passes</li>
                                    <li><Icon icon="mdi:check-circle-outline" className="text-green" /> Premium WiFi</li>
                                    <li><Icon icon="mdi:check-circle-outline" className="text-green" /> 2 Power Outlets</li>
                                    <li><Icon icon="mdi:check-circle-outline" className="text-green" /> Corner visibility</li>
                                    <li><Icon icon="mdi:check-circle-outline" className="text-green" /> Priority directory listing</li>
                                    <li><Icon icon="mdi:check-circle-outline" className="text-green" /> Social media mention</li>
                                </ul>
                            </div>
                            <div className="sk-package-card sk-pkg-premium">
                                <div className="sk-pkg-header bg-red-primary text-white">
                                    <div className="sk-pkg-header-left">
                                        <h6>VIP</h6>
                                    </div>
                                    <span className="button-label sk-best-value-label text-right">Best Value</span>
                                </div>
                                <div className="sk-pkg-price">
                                    <h2>$8,000 <span className="smaller-body-text text-secondary">+ tax</span></h2>
                                    <p className="smaller-body-text">20x20 ft booth space</p>
                                </div>
                                <ul className="sk-pkg-features">
                                    <li><Icon icon="mdi:check-circle-outline" className="text-green" /> 6 Exhibitor Passes</li>
                                    <li><Icon icon="mdi:check-circle-outline" className="text-green" /> Dedicated WiFi circuit</li>
                                    <li><Icon icon="mdi:check-circle-outline" className="text-green" /> Multiple power drops</li>
                                    <li><Icon icon="mdi:check-circle-outline" className="text-green" /> Premium floor location</li>
                                    <li><Icon icon="mdi:check-circle-outline" className="text-green" /> Custom carpet included</li>
                                    <li><Icon icon="mdi:check-circle-outline" className="text-green" /> Featured in keynote slides</li>
                                    <li><Icon icon="mdi:check-circle-outline" className="text-green" /> Post-event lead report</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="sk-section">
                        <h4 className="sk-section-title">Why Sponsor TechInnovate?</h4>
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
                            <p className="regular-body-text text-blue sk-mb-2">"TechInnovate Summit delivered more qualified leads in 2 days than our entire trade show calendar last year. The audience quality is unmatched."</p>
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
                            <button className="primary-button sk-mb-3 sk-w-100 sk-flex-center sk-gap-2">Reserve a Booth <Icon icon="mdi:arrow-right" /></button>
                            <button className="outlined-button sk-w-100 sk-btn-outline-white">Contact Sales Team</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SponsorKit;
