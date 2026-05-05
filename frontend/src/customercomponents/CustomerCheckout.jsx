import React, { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCustomerCart } from '../context/CustomerCartContext';
import { useAuthContext } from '../hooks/useAuthContext';
import eventsService from '../services/eventsService';
import { showConfirmAlert, showSuccessAlert, showErrorAlert } from '../utils/sweetAlert';
import './CustomerCheckout.css';

const CustomerCheckout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { cartItems, completePurchase } = useCustomerCart();
    const { user } = useAuthContext();
    const [paymentMethod, setPaymentMethod] = useState('card');

    const selectedIds = location.state?.selectedItems || [];
    
    const checkoutItems = useMemo(() => {
        return cartItems.filter(item => selectedIds.includes(item.cartId));
    }, [cartItems, selectedIds]);

    const subtotal = useMemo(() => {
        return checkoutItems.reduce((sum, item) => sum + item.facePrice, 0);
    }, [checkoutItems]);

    const serviceFees = useMemo(() => {
        return checkoutItems.reduce((sum, item) => sum + item.serviceFee, 0);
    }, [checkoutItems]);

    const total = subtotal + serviceFees;

    const handlePay = async () => {
        const result = await showConfirmAlert(
            "Confirm Payment",
            `Are you sure you want to proceed with the payment of $${total.toFixed(2)}?`,
            "Yes, Pay Now"
        );

        if (result.isConfirmed) {
            try {
                // Group selected items by event ID
                const itemsByEvent = checkoutItems.reduce((acc, item) => {
                    const eventId = item.event._id || item.event.id;
                    if (!acc[eventId]) acc[eventId] = [];
                    acc[eventId].push(item);
                    return acc;
                }, {});

                // Process each event purchase
                for (const eventId in itemsByEvent) {
                    const eventItems = itemsByEvent[eventId];
                    const seatIds = eventItems.map(item => item.seat.id);
                    const eventTotal = eventItems.reduce((sum, item) => sum + item.facePrice + item.serviceFee, 0);
                    const eventSubtotal = eventItems.reduce((sum, item) => sum + item.facePrice, 0);
                    const eventFees = eventItems.reduce((sum, item) => sum + item.serviceFee, 0);
                    
                    await eventsService.buySeats(
                        eventId, 
                        seatIds, 
                        { total: eventTotal, subtotal: eventSubtotal, fee: eventFees },
                        user.token
                    );
                }

                completePurchase(selectedIds);
                showSuccessAlert('Payment Successful', 'Your tickets have been confirmed.');
                navigate('/customer/success');
            } catch (error) {
                console.error("Payment Error:", error);
                showErrorAlert('Payment Failed', error.message || 'There was an error processing your payment.');
            }
        }
    };

    if (checkoutItems.length === 0) {
        return (
            <div className="cc-page-wrapper">
                <div className="cc-main-container" style={{ textAlign: 'center', padding: '100px 20px' }}>
                    <Icon icon="mdi:cart-outline" width="60" color="var(--color-black-tertiary)" />
                    <h3>No items selected for checkout</h3>
                    <button className="primary-button mt-4" onClick={() => navigate('/customer/cart')}>
                        Back to Cart
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="cc-page-wrapper">
            <div className="cc-header-nav">
                <span className="cc-breadcrumb" onClick={() => navigate('/customer/browse-events')}>Browse Events</span> &gt;{' '}
                <span className="cc-breadcrumb" onClick={() => navigate('/customer/cart')}>Cart</span> &gt;{' '}
                <span className="cc-breadcrumb-current">Secure Checkout</span>
            </div>

            <div className="cc-header-title">
                <div className="cc-header-left">
                    <button className="cc-back-btn" onClick={() => navigate(-1)}>
                        <Icon icon="mdi:arrow-left" width="24" />
                    </button>
                    <div>
                        <h2 className="text-black m-0">Secure Checkout</h2>
                        <span className="small-body-text text-secondary mt-1">
                            Purchasing tickets for {new Set(checkoutItems.map(i => i.event._id)).size} event(s)
                        </span>
                    </div>
                </div>
            </div>

            <div className="cc-main-container mt-4">
                <div className="cc-content-left">
                    <div className="cc-card mb-4">
                        <div className="cc-card-body">
                            <h4 className="mb-4 text-black">Contact Information</h4>

                            <div className="cc-form-grid">
                                <div className="cc-form-group">
                                    <label>First Name</label>
                                    <input type="text" defaultValue={user?.firstName} className="cc-input" readOnly />
                                </div>
                                <div className="cc-form-group">
                                    <label>Last Name</label>
                                    <input type="text" defaultValue={user?.lastName} className="cc-input" readOnly />
                                </div>
                            </div>

                            <div className="cc-form-group mt-3">
                                <label>Email Address</label>
                                <input type="email" defaultValue={user?.email} className="cc-input" readOnly />
                            </div>

                            <div className="cc-form-group mt-3">
                                <label>Phone Number</label>
                                <input type="text" placeholder="(555) 123-4567" className="cc-input" />
                            </div>
                        </div>
                    </div>

                    <div className="cc-card mb-4">
                        <div className="cc-card-body">
                            <h4 className="mb-4 text-black">Payment Details</h4>

                            {/* Saved Payment Option */}
                            <div
                                className={`cc-payment-option mb-3 ${paymentMethod === 'saved' ? 'selected' : ''}`}
                                onClick={() => setPaymentMethod('saved')}
                            >
                                <div className="cc-payment-header">
                                    <div className="cc-radio-group">
                                        <input
                                            type="radio"
                                            checked={paymentMethod === 'saved'}
                                            readOnly
                                            className="cc-radio"
                                        />
                                        <div>
                                            <div className="cc-flex-align-center mb-1">
                                                <Icon icon="mdi:credit-card" className="mr-2 icon-font-size" />
                                                <h5 className="m-0 text-black">Visa •••• 4242</h5>
                                            </div>
                                            <span className="smaller-body-text text-secondary cc-block">Expires 12/25 &bull; Default</span>
                                        </div>
                                    </div>
                                    <div className="cc-card-badges">
                                        <span className="cc-badge button-label blue">VISA</span>
                                    </div>
                                </div>
                            </div>

                            {/* Credit Card Option */}
                            <div
                                className={`cc-payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}
                                onClick={() => setPaymentMethod('card')}
                            >
                                <div className="cc-payment-header">
                                    <div className="cc-radio-group">
                                        <input
                                            type="radio"
                                            checked={paymentMethod === 'card'}
                                            readOnly
                                            className="cc-radio"
                                        />
                                        <h5 className="text-black">Credit Card</h5>
                                    </div>
                                    <div className="cc-card-badges hidden-mobile">
                                        <span className="cc-badge button-label blue">VISA</span>
                                        <span className="cc-badge button-label orange">MC</span>
                                        <span className="cc-badge button-label light-blue">AMEX</span>
                                    </div>
                                </div>

                                {paymentMethod === 'card' && (
                                    <div className="cc-payment-body mt-3">
                                        <div className="cc-form-group mb-3">
                                            <label>Card Number</label>
                                            <div className="cc-input-icon-wrapper">
                                                <Icon icon="mdi:credit-card-outline" className="cc-input-icon text-secondary" />
                                                <input type="text" placeholder="0000 0000 0000 0000" className="cc-input with-icon" />
                                            </div>
                                        </div>

                                        <div className="cc-form-grid">
                                            <div className="cc-form-group">
                                                <label>Expiration</label>
                                                <input type="text" placeholder="MM/YY" className="cc-input" />
                                            </div>
                                            <div className="cc-form-group">
                                                <label>CVC</label>
                                                <input type="text" placeholder="123" className="cc-input" />
                                            </div>
                                        </div>

                                        <div className="cc-form-group mt-3">
                                            <label>Name on Card</label>
                                            <input type="text" placeholder={`${user?.firstName} ${user?.lastName}`} className="cc-input" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Invoice Option */}
                            <div
                                className={`cc-payment-option mt-3 ${paymentMethod === 'invoice' ? 'selected' : ''}`}
                                onClick={() => setPaymentMethod('invoice')}
                            >
                                <div className="cc-payment-header">
                                    <div className="cc-radio-group">
                                        <input
                                            type="radio"
                                            checked={paymentMethod === 'invoice'}
                                            readOnly
                                            className="cc-radio"
                                        />
                                        <div>
                                            <div className="cc-flex-align-center mb-1">
                                                <Icon icon="mdi:domain" className="mr-2 icon-font-size" />
                                                <h5 className="m-0 text-black">Invoice / Bank Transfer</h5>
                                            </div>
                                            <span className="smaller-body-text text-secondary cc-block">Net 30 payment terms available for qualified businesses</span>
                                        </div>
                                    </div>
                                </div>

                                {paymentMethod === 'invoice' && (
                                    <div className="cc-payment-body mt-3">
                                        <div className="cc-info-alert mb-3">
                                            <Icon icon="mdi:information-outline" className="cc-info-icon" />
                                            <span className="smaller-body-text">
                                                <strong>How it works:</strong> After submitting this form, we'll send an invoice to your company email within 1 business day. Payment is due within 30 days of invoice date.
                                            </span>
                                        </div>

                                        <div className="cc-form-group mb-3">
                                            <label>Purchase Order Number (Optional)</label>
                                            <input type="text" placeholder="PO-2026-001" className="cc-input" />
                                        </div>

                                        <div className="cc-form-group">
                                            <label>Accounts Payable Email</label>
                                            <input type="email" placeholder={user?.email} className="cc-input" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="cc-content-right">
                    <div className="cc-card">
                        <div className="cc-card-body">
                            <h4 className="mb-4 text-black">Order Summary</h4>

                            {Array.from(new Set(checkoutItems.map(i => i.event._id))).map(eventId => {
                                const eventItems = checkoutItems.filter(i => i.event._id === eventId);
                                const event = eventItems[0].event;
                                return (
                                    <div key={eventId} className="mb-4">
                                        <h5 className="mb-2 text-black">{event.title}</h5>
                                        {eventItems.map((item, idx) => (
                                            <div key={idx} className="cc-summary-row mb-1">
                                                <span className="small-body-text text-secondary">{item.categoryName} - Row {item.seat.row}, Seat {item.seat.label}</span>
                                                <h6 className="text-secondary m-0">${item.facePrice.toFixed(2)}</h6>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}

                            <hr className="cc-divider mb-3" />

                            <div className="cc-summary-row mb-2">
                                <span className="small-body-text text-secondary">Subtotal</span>
                                <h5 className="text-secondary">${subtotal.toFixed(2)}</h5>
                            </div>
                            <div className="cc-summary-row mb-3">
                                <span className="small-body-text text-secondary">Service Fees</span>
                                <h5 className="text-secondary">${serviceFees.toFixed(2)}</h5>
                            </div>

                            <hr className="cc-divider mb-3" />

                            <div className="cc-summary-row mt-3">
                                <h4 className="m-0 text-black">Total</h4>
                                <h4 className="text-red m-0">${total.toFixed(2)}</h4>
                            </div>

                            <button className="primary-button cc-pay-btn mt-4 w-100" onClick={handlePay}>
                                Pay ${total.toFixed(2)}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerCheckout;
