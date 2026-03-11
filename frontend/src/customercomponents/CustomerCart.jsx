import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './CustomerCart.css';

export default function CustomerCart() {
    const navigate = useNavigate();

    const [selectedTickets, setSelectedTickets] = useState([false, true, true, true]);
    const [isCartEmpty, setIsCartEmpty] = useState(true);

    const countSelected = selectedTickets.filter(Boolean).length;
    const subtotal = (selectedTickets[0] ? 150 : 0) + (selectedTickets[1] ? 65 : 0) + (selectedTickets[2] ? 150 : 0) + (selectedTickets[3] ? 150 : 0);
    const serviceFees = countSelected > 0 ? countSelected * 5 : 0;
    const total = subtotal + serviceFees;

    const toggleTicket = (index) => {
        const newSelected = [...selectedTickets];
        newSelected[index] = !newSelected[index];
        setSelectedTickets(newSelected);
    };

    const handleDeleteTicket = () => {
        Swal.fire({
            title: 'Remove Ticket?',
            text: 'Are you sure you want to remove this ticket from your cart?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#9A212E',
            cancelButtonColor: '#aaa',
            confirmButtonText: 'Yes, remove it'
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Removed!',
                    text: 'The ticket has been removed.',
                    icon: 'success',
                    confirmButtonColor: '#9A212E'
                });
            }
        });
    };

    const handleCheckout = () => {
        if (countSelected === 0) return;
        Swal.fire({
            title: 'Proceed to Checkout?',
            text: `Are you sure you want to proceed to checkout with ${countSelected} ticket(s)?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#9A212E',
            cancelButtonColor: '#aaa',
            confirmButtonText: 'Yes, proceed'
        }).then((result) => {
            if (result.isConfirmed) {
                navigate('/customer/checkout');
            }
        });
    };

    const handleContinueShopping = () => {
        Swal.fire({
            title: 'Continue Shopping?',
            text: 'Are you sure you want to continue shopping? Your current cart will be saved.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#9A212E',
            cancelButtonColor: '#aaa',
            confirmButtonText: 'Yes, continue'
        }).then((result) => {
            if (result.isConfirmed) {
                navigate('/customer/browse-events');
            }
        });
    };

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
                        {!isCartEmpty && (
                            <p className="small-body-text text-muted">4 tickets • {countSelected} selected for checkout</p>
                        )}
                    </div>
                </div>
                {/* {!isCartEmpty && (
                    <div className="timer-section">
                        <Icon icon="mdi:clock-outline" width="20" color="var(--color-red-primary)" />
                        <span className="small-body-text red-text">Seat lock expires in 08:07</span>
                    </div>
                )} */}
            </div>

            {isCartEmpty ? (
                <div className="empty-cart-state">
                    <Icon icon="mdi:cart-outline" width="60" className="empty-cart-icon" />
                    <h3>Your cart is empty</h3>
                    <p className="small-body-text text-muted mt-s">Start browsing events to add tickets to your cart.</p>
                    <button className="primary-button empty-browse-btn mt-l" onClick={() => navigate('/customer/browse-events')}>
                        Browse Events
                    </button>
                </div>
            ) 
            : 
            (
                <>
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
                            <div className={`ticket-item ${selectedTickets[0] ? 'checked' : ''}`}>
                                <label className="custom-checkbox">
                                    <input type="checkbox" checked={selectedTickets[0]} onChange={() => toggleTicket(0)} />
                                    <span className="checkmark"></span>
                                </label>
                                <div className="ticket-main">
                                    <div className="ticket-info">
                                        <h5 className="ticket-type">VIP Ticket</h5>
                                        <p className="smaller-body-text text-muted mt-1">Row B, Seat 8</p>
                                    </div>

                                    <div className="ticket-price-right">
                                        <h5 className="ticket-price">$150</h5>
                                        <button className="action-icon-btn del-btn" onClick={handleDeleteTicket}>
                                            <Icon icon="mdi:trash-can-outline" width="20" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className={`ticket-item ${selectedTickets[1] ? 'checked' : ''}`}>
                                <label className="custom-checkbox">
                                    <input type="checkbox" checked={selectedTickets[1]} onChange={() => toggleTicket(1)} />
                                    <span className="checkmark"></span>
                                </label>
                                <div className="ticket-main">
                                    <div className="ticket-info">
                                        <h5 className="ticket-type">Standard Ticket</h5>
                                        <p className="smaller-body-text text-muted mt-1">Row E, Seat 5</p>
                                    </div>
                                    <div className="ticket-price-right flex-between">
                                        <h5 className="ticket-price">$65</h5>
                                        <button className="action-icon-btn del-btn" onClick={handleDeleteTicket}><Icon icon="mdi:trash-can-outline" width="20" /></button>
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
                            <div className={`ticket-item ${selectedTickets[2] ? 'checked' : ''}`}>
                                <label className="custom-checkbox">
                                    <input type="checkbox" checked={selectedTickets[2]} onChange={() => toggleTicket(2)} />
                                    <span className="checkmark"></span>
                                </label>
                                <div className="ticket-main">
                                    <div className="ticket-info">
                                        <h5 className="ticket-type">VIP Ticket</h5>
                                        <p className="smaller-body-text text-muted mt-1">Row A, Seat 1</p>
                                    </div>
                                    <div className="ticket-price-right flex-between">
                                        <h5 className="ticket-price">$150</h5>
                                        <button className="action-icon-btn del-btn" onClick={handleDeleteTicket}><Icon icon="mdi:trash-can-outline" width="20" /></button>
                                    </div>
                                </div>
                            </div>
                            <div className={`ticket-item ${selectedTickets[3] ? 'checked' : ''}`}>
                                <label className="custom-checkbox">
                                    <input type="checkbox" checked={selectedTickets[3]} onChange={() => toggleTicket(3)} />
                                    <span className="checkmark"></span>
                                </label>
                                <div className="ticket-main">
                                    <div className="ticket-info">
                                        <h5 className="ticket-type">VIP Ticket</h5>
                                        <p className="smaller-body-text text-muted mt-1">Row A, Seat 2</p>
                                    </div>
                                    <div className="ticket-price-right flex-between">
                                        <h5 className="ticket-price">$150</h5>
                                        <button className="action-icon-btn del-btn" onClick={handleDeleteTicket}><Icon icon="mdi:trash-can-outline" width="20" /></button>
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
                            <span className="small-body-text text-muted">Selected Tickets ({countSelected})</span>
                            <h5 className="text-black">${subtotal.toFixed(2)}</h5>
                        </div>
                        <div className="summary-row flex-between mt-m">
                            <span className="small-body-text text-muted">Service Fees</span>
                            <h5 className="text-black">${serviceFees.toFixed(2)}</h5>
                        </div>
                        <div className="summary-row flex-between mt-m">
                            <span className="small-body-text text-muted">Delivery</span>
                            <h5 className="green-text">Free</h5>
                        </div>

                        <hr className="summary-divider" />

                        <div className="summary-total-row flex-between">
                            <h4>Total</h4>
                            <h4 className="red-text">${total.toFixed(2)}</h4>
                        </div>

                        <button className="primary-button checkout-btn full-width mt-xl" onClick={handleCheckout}>
                            Checkout ({countSelected}) <Icon icon="mdi:arrow-right" width="20" />
                        </button>

                        <button className="outline-button continue-btn full-width mt-m" onClick={handleContinueShopping}>
                            Continue Shopping
                        </button>

                        <p className="smaller-body-text text-muted text-center mt-xl">Unselected tickets will remain in your cart</p>
                    </div>
                </div>
            </div>
            </>
            )}
        </div>
    );
}
