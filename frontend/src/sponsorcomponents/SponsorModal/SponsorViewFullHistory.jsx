import React from 'react';
import { Icon } from '@iconify/react';
import './SponsorViewFullHistory.css';

const SponsorViewFullHistory = ({ isOpen, onClose, historyItem }) => {
    if (!isOpen) return null;

    // Use default mock data if none provided
    const defaultData = {
        eventStatus: 'Upcoming',
        booth: 'Booth #205',
        title: 'TechInnovate Summit 2026',
        date: 'Jun 16, 2026',
        location: 'Starlight Arena, Los Angeles, CA',
        confirmation: 'CONF-2023-089',
        boothType: 'Standard • 10x10',
        bookingDate: 'May 15, 2026',
        paymentMethod: 'Visa ending in 4242',
        paymentDate: 'May 15, 2026',
        paymentStatus: 'Paid',
        exhibitors: [
            { initial: 'J', name: 'John Smith', role: 'Lead Representative' },
            { initial: 'S', name: 'Sarah Johnson', role: 'Sales Manager' },
            { initial: 'M', name: 'Mike Chen', role: 'Technical Specialist' }
        ],
        features: [
            'High Visibility Location', 'Near Main Entrance',
            'Dedicated 20A Power Circuit', 'Premium Carpet Included',
            'WiFi Access', '6 Exhibitor Passes'
        ],
        performance: {
            leads: '0',
            scans: '0',
            interactions: '0'
        },
        paymentInfo: {
            boothPrice: '$5,000.00',
            processingFee: '$150.00',
            tax: '$425.00',
            totalPaid: '$5,575'
        }
    };

    const item = { ...defaultData, ...historyItem };

    return (
        <div className="svfh-modal-overlay">
            <div className="svfh-modal-container">
                <div className="svfh-modal-header">
                    <h4 className="text-black m-0">View History Details</h4>
                    <button className="svfh-modal-close-icon" onClick={onClose}>
                        <Icon icon="mdi:close" width="24" />
                    </button>
                </div>

                <div className="svfh-modal-body">
                    {/* Hero Section */}
                    <div className="svfh-event-header">
                        <div className="svfh-event-labels">
                            <span
                                className={`button-label svfh-status-event ${item.eventStatus
                                    ? item.eventStatus.toLowerCase().replace(/\s/g, "-")
                                    : "upcoming"
                                    }`}
                            >
                                {item.eventStatus}
                            </span>                            <span className="button-label svfh-booth-label">{item.booth}</span>
                        </div>
                        <h2 className="svfh-event-title">{item.title}</h2>
                        <div className="svfh-event-details">
                            <span className="small-body-text"><Icon icon="mdi:calendar-blank-outline" width="18" /> {item.date}</span>
                            <span className="small-body-text"><Icon icon="mdi:map-marker-outline" width="18" /> {item.location}</span>
                        </div>
                    </div>

                    <div className="svfh-content-grid">
                        {/* Booking & Payment Info */}
                        <div className="svfh-info-section">
                            <h4 className="text-black m-0">Booking Information</h4>
                            <div className="svfh-info-item">
                                <span className="small-body-text text-secondary">Confirmation Number</span>
                                <h6 className="text-black m-0">{item.confirmation}</h6>
                            </div>
                            <div className="svfh-info-item">
                                <span className="small-body-text text-secondary">Booth Type</span>
                                <h6 className="text-black m-0">{item.boothType}</h6>
                            </div>
                            <div className="svfh-info-item">
                                <span className="small-body-text text-secondary">Booking Date</span>
                                <h6 className="text-black m-0">{item.bookingDate}</h6>
                            </div>
                        </div>

                        <div className="svfh-info-section">
                            <h4 className="text-black m-0">Payment Information</h4>
                            <div className="svfh-info-item">
                                <span className="small-body-text text-secondary">Payment Method</span>
                                <h6 className="text-black m-0">{item.paymentMethod}</h6>
                            </div>
                            <div className="svfh-info-item">
                                <span className="small-body-text text-secondary">Payment Date</span>
                                <h6 className="text-black m-0">{item.paymentDate}</h6>
                            </div>
                            <div className="svfh-info-item">
                                <span className="small-body-text text-secondary">Status</span>
                                <div><span className={`button-label svfh-status-label ${item.paymentStatus ? item.paymentStatus.toLowerCase() : 'paid'}`}>{item.paymentStatus}</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Exhibitors */}
                    <div className="svfh-section-block">
                        <h4 className="text-black m-0">Exhibitors</h4>
                        <div className="svfh-exhibitors-grid">
                            {item.exhibitors.map((ex, idx) => (
                                <div key={idx} className="svfh-exhibitor-card">
                                    <div className="svfh-exhibitor-avatar">
                                        <h6 className="m-0 text-black">{ex.initial}</h6>
                                    </div>
                                    <div className="svfh-exhibitor-info">
                                        <h6 className="text-black m-0">{ex.name}</h6>
                                        <p className="smaller-body-text text-secondary m-0">{ex.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Included Features */}
                    <div className="svfh-section-block">
                        <h4 className="text-black m-0">Included Features</h4>
                        <div className="svfh-features-grid">
                            {item.features.map((feature, idx) => (
                                <div key={idx} className="svfh-feature-item">
                                    <Icon icon="mdi:check-circle-outline" className="text-green" width="20" />
                                    <span className="small-body-text text-secondary">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Event Performance */}
                    <div className="svfh-section-block">
                        <h4 className="text-black m-0">Event Performance</h4>
                        <div className="svfh-performance-grid">
                            <div className="svfh-performance-card svfh-card-blue">
                                <h2 className="svfh-performance-number text-blue">{item.performance.leads}</h2>
                                <span className="smaller-body-text text-secondary">Leads Collected</span>
                            </div>
                            <div className="svfh-performance-card svfh-card-green">
                                <h2 className="svfh-performance-number text-green">{item.performance.scans}</h2>
                                <span className="smaller-body-text text-secondary">Badge Scans</span>
                            </div>
                            <div className="svfh-performance-card svfh-card-purple">
                                <h2 className="svfh-performance-number text-purple">{item.performance.interactions}</h2>
                                <span className="smaller-body-text text-secondary">Total Interactions</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="svfh-section-block">
                        <h4 className="text-black m-0">Payment Summary</h4>
                        <div className="svfh-summary-box">
                            <div className="svfh-summary-row">
                                <span className="small-body-text text-secondary">Booth Price</span>
                                <h6 className="text-black">{item.paymentInfo.boothPrice}</h6>
                            </div>
                            <div className="svfh-summary-row">
                                <span className="small-body-text text-secondary">Processing Fee</span>
                                <h6 className="text-black">{item.paymentInfo.processingFee}</h6>
                            </div>
                            <div className="svfh-summary-row">
                                <span className="small-body-text text-secondary">Tax</span>
                                <h6 className=" text-black">{item.paymentInfo.tax}</h6>
                            </div>
                            <div className="svfh-summary-divider"></div>
                            <div className="svfh-summary-row svfh-total-row">
                                <h4 className="text-black m-0">Total Paid</h4>
                                <h4 className="text-red m-0">{item.paymentInfo.totalPaid}</h4>
                            </div>
                        </div>
                        <button className="outlined-button svfh-receipt-btn">
                            <Icon icon="mdi:download-outline" width="18" /> Download Receipt
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SponsorViewFullHistory;
