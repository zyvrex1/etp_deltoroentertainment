import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import './SponsorPaymentInfo.css';

const SponsorPaymentInfo = () => {
    const [selectedMethod, setSelectedMethod] = useState('cash-only');

    return (
        <div className="sponsor-payment-info-container">
            {/* Top Banner */}
            <div className="spi-info-banner">
                <Icon icon="mdi:information-outline" className="spi-banner-icon" />
                <div className="spi-banner-content">
                    <h6>Walk-in / Pay On-Site Only</h6>
                    <p className="smaller-body-text">
                        All payments are processed on-site at your booth. Choose which payment methods you accept below. This will be displayed to customers browsing your store.
                    </p>
                </div>
            </div>
            <div className="spi-section-header">
                <h3>Payment Information</h3>
                <p className="small-body-text">Configure which payment methods your booth accepts on-site.</p>
            </div>
            <div className="spi-main-layout">
                {/* Left Side: Main Configuration */}
                <div className="spi-left-column">


                    <div className="spi-card spi-methods-card">
                        <h5>Accepted Payment Methods</h5>
                        <p className="smaller-body-text method-desc">Select which on-site payment methods your booth will accept</p>

                        <div className="spi-methods-grid">
                            <div
                                className={`spi-method-item ${selectedMethod === 'cash-card' ? 'active' : ''}`}
                                onClick={() => setSelectedMethod('cash-card')}
                            >
                                <div className="spi-method-icons">
                                    <Icon icon="mdi:cash" />
                                    <Icon icon="mdi:credit-card-outline" />
                                </div>
                                <div className="spi-method-info">
                                    <h6>Cash & Card</h6>
                                    <p className="smaller-body-text">Accept both cash and card payments via physical terminal at your booth</p>
                                </div>
                                {selectedMethod === 'cash-card' && (
                                    <Icon icon="mdi:check-circle" className="method-check-icon" />
                                )}
                            </div>

                            <div
                                className={`spi-method-item ${selectedMethod === 'cash-only' ? 'active' : ''}`}
                                onClick={() => setSelectedMethod('cash-only')}
                            >
                                <div className="spi-method-icons">
                                    <Icon icon="mdi:cash" />
                                </div>
                                <div className="spi-method-info">
                                    <h6 className="highlight-text">Cash Only</h6>
                                    <p className="smaller-body-text">Accept only cash payments at your booth — no card terminal needed</p>
                                </div>
                                {selectedMethod === 'cash-only' && (
                                    <Icon icon="mdi:check-circle" className="method-check-icon" />
                                )}
                            </div>
                        </div>

                        <button className="primary-button spi-save-button">
                            Save Payment Settings
                        </button>
                    </div>

                    <div className="spi-card spi-flow-card">
                        <h5>How the Payment Flow Works</h5>
                        <div className="spi-flow-steps">
                            <div className="spi-flow-step">
                                <div className="step-number step-1">1</div>
                                <div className="step-content">
                                    <h6>Customer Places Order</h6>
                                    <p className="small-body-text">Order is created with status Unpaid</p>
                                </div>
                            </div>
                            <div className="spi-flow-step">
                                <div className="step-number step-2">2</div>
                                <div className="step-content">
                                    <h6>Sponsor Prepares Order</h6>
                                    <p className="small-body-text">Food, drinks, or merch is prepared</p>
                                </div>
                            </div>
                            <div className="spi-flow-step">
                                <div className="step-number step-3">3</div>
                                <div className="step-content">
                                    <h6>Customer Arrives & Pays</h6>
                                    <p className="small-body-text">Payment collected via cash</p>
                                </div>
                            </div>
                            <div className="spi-flow-step">
                                <div className="step-number step-4">4</div>
                                <div className="step-content">
                                    <h6>Sponsor Marks as Paid</h6>
                                    <p className="small-body-text">Order updated to Paid, then Completed</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Sidebar/Preview */}
                <div className="spi-right-column">
                    {/* Preview Card */}


                    {/* Notice Card */}
                    <div className="spi-sidebar-card">
                        <div className="spi-sidebar-header">
                            <Icon icon="mdi:map-marker-outline" className="header-icon" />
                            <h6>Customer Notice</h6>
                        </div>
                        <div className="spi-notice-bubble">
                            <p className="small-body-text">
                                <em>"This store accepts walk-in purchases only. We accept cash payments on-site only."</em>
                            </p>
                        </div>
                        <p className="smaller-body-text sidebar-desc notice-footer">
                            This message is displayed to customers when they browse your store and place orders.
                        </p>
                    </div>

                    {/* Best Practices Card */}
                    <div className="spi-sidebar-card">
                        <div className="spi-sidebar-header">
                            <Icon icon="mdi:shield-check-outline" className="header-icon" />
                            <h6>Best Practices</h6>
                        </div>
                        <ul className="spi-best-practices">
                            <li className="small-body-text">Keep sufficient cash change available at your booth</li>
                            <li className="small-body-text">Mark orders as Paid immediately after receiving payment</li>
                            <li className="small-body-text">Use "Ready for Pickup" status to notify customers</li>
                        </ul>
                    </div>

                    {/* Processing Fees Card */}
                    <div className="spi-sidebar-card">
                        <div className="spi-sidebar-header">
                            <Icon icon="mdi:receipt-text-outline" className="header-icon" />
                            <h6>Processing Fees</h6>
                        </div>
                        <div className="spi-fees-box">
                            <h6>No online processing fees</h6>
                            <p className="smaller-body-text">Since all payments are handled on-site, there are no platform transaction fees.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SponsorPaymentInfo;
