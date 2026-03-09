import React from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import './CustomerPaySuccess.css';

const CustomerPaySuccess = () => {
    const navigate = useNavigate();

    return (
        <div className="cps-page-wrapper">
            <div className="cps-main-container">
                <div className="cps-success-header">
                    <div className="cps-check-circle">
                        <Icon icon="mdi:check" className="cps-check-icon" />
                    </div>
                    <h2 className="cps-title">Order Confirmed!</h2>
                    <p className="regular-body-text cps-subtitle">Thank you for your purchase.</p>
                    <p className="small-body-text cps-order-id">
                        Order ID: <span className="cps-order-number">ORD-13858</span>
                    </p>
                </div>

                <div className="cps-card-container">
                    {/* Event Detail Card */}
                    <div className="cps-card">
                        <div className="cps-event-header">
                            <img src="/assets/eventbg.jpg" alt="Event" className="cps-event-img" />
                            <div className="cps-event-info">
                                <h4 className="cps-event-title">Indie Rock Showcase</h4>
                                <div className="cps-event-detail">
                                    <Icon icon="mdi:calendar-blank" className="cps-detail-icon" />
                                    <span className="smaller-body-text">Saturday, June 15, 2024</span>
                                </div>
                                <div className="cps-event-detail">
                                    <Icon icon="mdi:map-marker-outline" className="cps-detail-icon" />
                                    <span className="smaller-body-text">The Red Room, Austin, TX</span>
                                </div>
                            </div>
                        </div>

                        <hr className="cps-divider" />

                        <div className="cps-tickets-section">
                            <h5 className="cps-section-title">Your Tickets</h5>

                            <div className="cps-ticket-item">
                                <div className="cps-ticket-left">
                                    <p className="small-body-text cps-ticket-type">VIP Ticket</p>
                                    <p className="smaller-body-text cps-ticket-seat">Row A, Seat 12</p>
                                </div>
                                <div className="cps-ticket-right">
                                    <p className="small-body-text cps-ticket-price">$150</p>
                                </div>
                            </div>

                            <div className="cps-ticket-item">
                                <div className="cps-ticket-left">
                                    <p className="small-body-text cps-ticket-type">VIP Ticket</p>
                                    <p className="smaller-body-text cps-ticket-seat">Row A, Seat 13</p>
                                </div>
                                <div className="cps-ticket-right">
                                    <p className="small-body-text cps-ticket-price">$150</p>
                                </div>
                            </div>
                        </div>

                        <hr className="cps-divider-thick" />

                        <div className="cps-total-section">
                            <h4 className="cps-total-label">Total Paid</h4>
                            <h4 className="cps-total-amount">$310.00</h4>
                        </div>
                    </div>

                    {/* Next Steps Card */}
                    <div className="cps-card">
                        <h4 className="cps-section-title">What happens next?</h4>

                        <div className="cps-step-item">
                            <div className="cps-step-icon-wrapper light-red-bg">
                                <Icon icon="mdi:ticket-confirmation-outline" className="cps-step-icon" />
                            </div>
                            <div className="cps-step-text">
                                <h6 className="cps-step-title">Tickets are ready</h6>
                                <p className="smaller-body-text text-secondary m-0">Your digital tickets are available in your account instantly.</p>
                            </div>
                        </div>

                        <div className="cps-step-item">
                            <div className="cps-step-icon-wrapper light-red-bg">
                                <Icon icon="mdi:email-outline" className="cps-step-icon" />
                            </div>
                            <div className="cps-step-text">
                                <h6 className="cps-step-title">Confirmation email sent</h6>
                                <p className="smaller-body-text text-secondary m-0">Check your inbox for order details and calendar invite.</p>
                            </div>
                        </div>

                        <div className="cps-step-item">
                            <div className="cps-step-icon-wrapper light-red-bg">
                                <Icon icon="mdi:download-outline" className="cps-step-icon" />
                            </div>
                            <div className="cps-step-text">
                                <h6 className="cps-step-title">Download or print</h6>
                                <p className="smaller-body-text text-secondary m-0">Save your tickets to your phone or print them for entry.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="cps-action-buttons">
                    <button className="primary-button cps-btn-primary" onClick={() => navigate('/customer/history')}>
                        <Icon icon="mdi:basket-plus-outline" width="18" className="mr-2" />
                        Add 2 Tickets to Cart
                    </button>
                    <button className="outlined-button cps-btn-outline" onClick={() => navigate('/customer/browse-events')}>
                        Browse More Events
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerPaySuccess;
