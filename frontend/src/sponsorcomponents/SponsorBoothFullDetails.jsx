import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import './SponsorBoothFullDetails.css';

export default function SponsorBoothFullDetails() {
    const navigate = useNavigate();

    const exhibitors = [
        { id: 1, name: 'John Smith', role: 'Lead Representative', email: 'john.smith@techcorp.com', phone: '+1 (555) 123-4567', initial: 'J' },
        { id: 2, name: 'Sarah Johnson', role: 'Sales Manager', email: 'sarah.j@techcorp.com', phone: '+1 (555) 123-4568', initial: 'S' },
        { id: 3, name: 'Mike Chen', role: 'Technical Specialist', email: 'mike.chen@techcorp.com', phone: '+1 (555) 123-4569', initial: 'M' },
    ];

    const documents = [
        { id: 1, title: 'Sponsorship Contract', size: '2.4 MB' },
        { id: 2, title: 'Exhibitor Manual', size: '5.1 MB' },
        { id: 3, title: 'Floor Plan', size: '1.8 MB' },
        { id: 4, title: 'Setup Guidelines', size: '3.2 MB' },
    ];

    return (
        <div className="booth-details-container">
            <div className="booth-details-header">
                <div className="booth-details-title-area">
                    <button className="booth-details-back-btn" onClick={() => navigate(-1)}>
                        <Icon icon="mdi:arrow-left" width="24" />
                    </button>
                    <div>
                        <h2>Booth #102</h2>
                        <p className="regular-body-text text-secondary">TechInnovate Summit 2026</p>
                    </div>
                </div>
                <div className="button-label booth-details-status">
                    Confirmed
                </div>
            </div>

            <div className="booth-details-layout">
                {/* LEFT COLUMN */}
                <div className="booth-details-main">

                    {/* Cover Image */}
                    <div className="booth-details-cover">
                        <img src="/assets/eventbg.jpg" alt="Event Cover" />
                        <div className="booth-details-cover-overlay">
                            <h3>TechInnovate Summit 2026</h3>
                            <div className="booth-details-cover-info">
                                <span><Icon icon="mdi:calendar-blank" width="16" /> Jun 16, 2026</span>
                                <span><Icon icon="mdi:map-marker-outline" width="16" /> Starlight Arena, Los Angeles, CA</span>
                            </div>
                        </div>
                    </div>

                    {/* Booth Details Section */}
                    <div className="booth-section">
                        <h4>Booth Details</h4>
                        <div className="booth-info-grid">
                            <div className="booth-info-item">
                                <span className="small-body-text text-secondary">Booth Type</span>
                                <h5>Premium Island</h5>
                            </div>
                            <div className="booth-info-item">
                                <span className="small-body-text text-secondary">Dimensions</span>
                                <h5>20x20</h5>
                            </div>
                            <div className="booth-info-item">
                                <span className="small-body-text text-secondary">Confirmation Number</span>
                                <h5 >CONF-2024-001</h5>
                            </div>
                            <div className="booth-info-item">
                                <span className="small-body-text text-secondary">Booking Date</span>
                                <h5>Aug 10, 2026</h5>
                            </div>
                        </div>
                    </div>

                    {/* Included Features */}
                    <div className="booth-section">
                        <h4>Included Features</h4>
                        <div className="booth-features-grid">
                            {['High Visibility Location', 'Near Main Entrance', 'Dedicated 20A Power Circuit', 'Premium Carpet Included', 'WiFi Access', '8 Exhibitor Passes'].map((feature, idx) => (
                                <div key={idx} className="booth-feature-item">
                                    <Icon icon="mdi:check-circle" className="text-green" width="20" />
                                    <span className="regular-body-text">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Exhibitor Passes */}
                    <div className="booth-section">
                        <div className="booth-section-header">
                            <h4>Exhibitor Passes (3/6)</h4>
                            <button className="primary-button add-exhibitor-btn">
                                <Icon icon="mdi:plus" width="18" /> Add Exhibitor
                            </button>
                        </div>
                        <div className="exhibitors-list">
                            {exhibitors.map(ex => (
                                <div key={ex.id} className="exhibitor-card">
                                    <div className="exhibitor-avatar">
                                        {ex.initial}
                                    </div>
                                    <div className="exhibitor-info">
                                        <p className="exhibitor-name regular-body-text font-medium">{ex.name}</p>
                                        <p className="exhibitor-role small-body-text text-secondary">{ex.role}</p>
                                        <div className="exhibitor-contact">
                                            <span className="small-body-text text-secondary"><Icon icon="mdi:email-outline" /> {ex.email}</span>
                                            <span className="small-body-text text-secondary"><Icon icon="mdi:phone-outline" /> {ex.phone}</span>
                                        </div>
                                    </div>
                                    <div className="exhibitor-actions">
                                        <button className="icon-btn"><Icon icon="mdi:pencil-outline" width="20" /></button>
                                        <button className="icon-btn"><Icon icon="mdi:trash-can-outline" width="20" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="exhibitor-note">
                            <p className="small-body-text"><strong>Note:</strong> Each exhibitor will receive a digital pass via email 2 weeks before the event. Passes include access to all event areas and networking sessions.</p>
                        </div>
                    </div>

                    {/* Documents & Resources */}
                    <div className="booth-section">
                        <h4>Documents & Resources</h4>
                        <div className="documents-list">
                            {documents.map(doc => (
                                <div key={doc.id} className="document-card">
                                    <div className="document-icon-wrapper">
                                        <Icon icon="mdi:file-document-outline" className="text-red" width="24" />
                                    </div>
                                    <div className="document-info">
                                        <p className="regular-body-text font-medium">{doc.title}</p>
                                        <p className="small-body-text text-secondary">PDF • {doc.size}</p>
                                    </div>
                                    <div className="document-actions">
                                        <button className="doc-action-btn"><Icon icon="mdi:eye-outline" width="18" /> View</button>
                                        <button className="doc-action-btn"><Icon icon="mdi:download-outline" width="18" /> Download</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN - Sidebar */}
                <div className="booth-details-sidebar">
                    <div className="booth-payment-summary">
                        <h4>Payment Summary</h4>
                        <div className="payment-row">
                            <span className="regular-body-text text-secondary">Booth Price</span>
                            <h5>$5,000.00</h5>
                        </div>
                        <div className="payment-row">
                            <span className="regular-body-text text-secondary">Processing Fee</span>
                            <h5>$150.00</h5>
                        </div>
                        <div className="payment-row">
                            <span className="regular-body-text text-secondary">Tax</span>
                            <h5 className="regular-body-text font-medium">$425.00</h5>
                        </div>
                        <hr className="payment-divider" />
                        <div className="payment-total-row">
                            <h4>Total Paid</h4>
                            <h4 className="text-red">$5,575</h4>
                        </div>

                        <div className="payment-actions">
                            <button className="outlined-button full-width-btn">View Event Details</button>
                            <button className="outlined-button full-width-btn"><Icon icon="mdi:download-outline" width="18" /> Download Invoice</button>
                            <button className="primary-button cancel-reservation-btn">Cancel Reservation</button>
                        </div>
                        <p className="small-body-text cancellation-policy text-secondary">
                            <strong>Cancellation Policy:</strong> Cancellations made 60+ days before the event receive a 50% refund. Cancellations within 60 days are non-refundable.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
