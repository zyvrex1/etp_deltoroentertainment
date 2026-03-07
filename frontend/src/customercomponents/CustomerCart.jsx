import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import './CustomerCart.css';

export default function CustomerCart() {
    const navigate = useNavigate();

    return (
        <div className="customer-cart-container">
            <div className="cart-header-nav">
                <span className="breadcrumb" onClick={() => navigate('/customer/browse-events')}>Browse Events</span> &gt; <span className="breadcrumb-current">Cart</span>
            </div>

            <div className="cart-title-section flex-between">
                <div className="cart-title-left">
                    <button className="action-icon-btn back-btn" onClick={() => navigate(-1)}>
                        <Icon icon="mdi:arrow-left" width="24" />
                    </button>
                    <div>
                        <h2 className="cart-page-title">Your Cart</h2>
                        <p className="small-body-text text-muted">4 tickets • 4 selected for checkout</p>
                    </div>
                </div>
                <div className="timer-section">
                    <Icon icon="mdi:clock-outline" width="20" color="var(--color-red-primary)" />
                    <span className="small-body-text red-text">Seat lock expires in 08:07</span>
                </div>
            </div>

            <div className="cart-tip-card">
                <p className="small-body-text">
                    <span className="font-bold">Tip:</span> Select which tickets you want to purchase by checking the boxes. You can keep exploring other events and add more tickets before checking out.
                </p>
            </div>

            <div className="cart-content-layout">
                <div className="cart-items-column">
                    {/* Event 1 */}
                    <div className="cart-event-card">
                        <div className="event-card-header flex-between">
                            <div className="event-info-left">
                                <img src="/assets/eventbg.jpg" alt="Neon Dreams Tour" className="event-thumbnail" onError={(e) => { e.target.src = "https://via.placeholder.com/80" }} />
                                <div className="event-details">
                                    <h4 className="event-title">Neon Dreams Tour</h4>
                                    <p className="small-body-text text-muted mt-1">
                                        2024-06-15 • 20:00<br />Starlight Arena
                                    </p>
                                </div>
                            </div>
                            <div className="event-info-right text-right">
                                <p className="smaller-body-text text-muted">Tickets</p>
                                <h4 className="ticket-count">2</h4>
                            </div>
                        </div>
                        <div className="ticket-list">
                            <div className="ticket-item checked">
                                <label className="custom-checkbox">
                                    <input type="checkbox" defaultChecked />
                                    <span className="checkmark"></span>
                                </label>
                                <div className="ticket-main">
                                    <div className="ticket-info">
                                        <h5 className="ticket-type">VIP Ticket</h5>
                                        <p className="smaller-body-text text-muted mt-1">Row B, Seat 8</p>
                                    </div>

                                    <div className="ticket-price-right">
                                        <h5 className="ticket-price">$150</h5>
                                        <button className="action-icon-btn del-btn">
                                            <Icon icon="mdi:trash-can-outline" width="20" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="ticket-item checked">
                                <label className="custom-checkbox">
                                    <input type="checkbox" defaultChecked />
                                    <span className="checkmark"></span>
                                </label>
                                <div className="ticket-main">
                                    <div className="ticket-info">
                                        <h5 className="ticket-type">Standard Ticket</h5>
                                        <p className="smaller-body-text text-muted mt-1">Row E, Seat 5</p>
                                    </div>
                                    <div className="ticket-price-right flex-between">
                                        <h5 className="ticket-price">$65</h5>
                                        <button className="action-icon-btn del-btn"><Icon icon="mdi:trash-can-outline" width="20" /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Event 2 */}
                    <div className="cart-event-card">
                        <div className="event-card-header flex-between">
                            <div className="event-info-left">
                                <img src="/assets/eventbg.jpg" alt="Comedy All-Stars" className="event-thumbnail" onError={(e) => { e.target.src = "https://via.placeholder.com/80" }} />
                                <div className="event-details">
                                    <h4 className="event-title">Comedy All-Stars</h4>
                                    <p className="small-body-text text-muted mt-1">
                                        2024-06-20 • 19:30<br />Gotham Comedy Club
                                    </p>
                                </div>
                            </div>
                            <div className="event-info-right text-right">
                                <p className="smaller-body-text text-muted">Tickets</p>
                                <h4 className="ticket-count">2</h4>
                            </div>
                        </div>
                        <div className="ticket-list">
                            <div className="ticket-item checked">
                                <label className="custom-checkbox">
                                    <input type="checkbox" defaultChecked />
                                    <span className="checkmark"></span>
                                </label>
                                <div className="ticket-main">
                                    <div className="ticket-info">
                                        <h5 className="ticket-type">VIP Ticket</h5>
                                        <p className="smaller-body-text text-muted mt-1">Row A, Seat 1</p>
                                    </div>
                                    <div className="ticket-price-right flex-between">
                                        <h5 className="ticket-price">$150</h5>
                                        <button className="action-icon-btn del-btn"><Icon icon="mdi:trash-can-outline" width="20" /></button>
                                    </div>
                                </div>
                            </div>
                            <div className="ticket-item checked">
                                <label className="custom-checkbox">
                                    <input type="checkbox" defaultChecked />
                                    <span className="checkmark"></span>
                                </label>
                                <div className="ticket-main">
                                    <div className="ticket-info">
                                        <h5 className="ticket-type">VIP Ticket</h5>
                                        <p className="smaller-body-text text-muted mt-1">Row A, Seat 2</p>
                                    </div>
                                    <div className="ticket-price-right flex-between">
                                        <h5 className="ticket-price">$150</h5>
                                        <button className="action-icon-btn del-btn"><Icon icon="mdi:trash-can-outline" width="20" /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="cart-summary-column">
                    <div className="summary-card">
                        <h4 className="summary-title">Checkout Summary</h4>
                        <div className="summary-row flex-between mt-l">
                            <span className="small-body-text text-muted">Selected Tickets (4)</span>
                            <h5 className="text-black">$515.00</h5>
                        </div>
                        <div className="summary-row flex-between mt-m">
                            <span className="small-body-text text-muted">Service Fees</span>
                            <h5 className="text-black">$20.00</h5>
                        </div>
                        <div className="summary-row flex-between mt-m">
                            <span className="small-body-text text-muted">Delivery</span>
                            <h5 className="green-text">Free</h5>
                        </div>

                        <hr className="summary-divider" />

                        <div className="summary-total-row flex-between">
                            <h4>Total</h4>
                            <h4 className="red-text">$535.00</h4>
                        </div>

                        <button className="primary-button checkout-btn full-width mt-xl" onClick={() => navigate('/customer/checkout')}>
                            Checkout (4) <Icon icon="mdi:arrow-right" width="20" />
                        </button>

                        <button className="outline-button continue-btn full-width mt-m" onClick={() => navigate('/customer/browse-events')}>
                            Continue Shopping
                        </button>

                        <p className="smaller-body-text text-muted text-center mt-xl">Unselected tickets will remain in your cart</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
