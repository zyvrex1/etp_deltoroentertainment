import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { showConfirmAlert, showSuccessAlert } from '../admincomponents/utils/sweetAlert';
import './CustomerCheckout.css';

const CustomerCheckout = () => {
    const navigate = useNavigate();
    const [paymentMethod, setPaymentMethod] = useState('card');

    const handlePay = async () => {
        const result = await showConfirmAlert(
            "Confirm Payment",
            "Are you sure you want to proceed with the payment of $215.00?",
            "Yes, Pay Now"
        );
        if (result.isConfirmed) {
            navigate('/customer/success');
        }
    };

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
                            Purchasing 1 event(s)
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
                                    <input type="text" placeholder="John" className="cc-input" />
                                </div>
                                <div className="cc-form-group">
                                    <label>Last Name</label>
                                    <input type="text" placeholder="Doe" className="cc-input" />
                                </div>
                            </div>

                            <div className="cc-form-group mt-3">
                                <label>Email Address</label>
                                <input type="email" placeholder="john@example.com" className="cc-input" />
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
                                            <input type="text" placeholder="John Doe" className="cc-input" />
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

                                    {paymentMethod !== 'invoice' && (
                                        <Icon icon="mdi:information-outline" className="text-red icon-font-size" />
                                    )}
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
                                            <input type="email" placeholder="sample@company.com" className="cc-input" />
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

                            <h5 className="mb-3 text-black">Comedy All-Stars</h5>

                            <div className="cc-summary-row mb-2">
                                <span className="small-body-text text-secondary">Row B, Seat 8</span>
                                <h5 className="text-secondary">$150.00</h5>
                            </div>
                            <div className="cc-summary-row mb-4">
                                <span className="small-body-text text-secondary">Row G, Seat 5</span>
                                <h5 className="text-secondary">$55.00</h5>
                            </div>

                            <hr className="cc-divider mb-3" />

                            <div className="cc-summary-row mb-2">
                                <span className="small-body-text text-secondary">Subtotal</span>
                                <h5 className="text-secondary">$205.00</h5>
                            </div>
                            <div className="cc-summary-row mb-3">
                                <span className="small-body-text text-secondary">Service Fees</span>
                                <h5 className="text-secondary">$10.00</h5>
                            </div>

                            <hr className="cc-divider mb-3" />

                            <div className="cc-summary-row mt-3">
                                <h4 className="m-0 text-black">Total</h4>
                                <h4 className="text-red m-0">$215.00</h4>
                            </div>

                            <button className="primary-button cc-pay-btn mt-4 w-100" onClick={handlePay}>
                                Pay $215.00
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerCheckout;
