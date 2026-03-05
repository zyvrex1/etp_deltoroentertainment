import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { showConfirmAlert, showSuccessAlert } from '../admincomponents/utils/sweetAlert';
import './SponsorVenueBilling.css';

const SponsorVenueBilling = () => {
    const navigate = useNavigate();
    const [paymentMethod, setPaymentMethod] = useState('saved'); // 'saved', 'card' or 'invoice'

    const handlePay = async () => {
        const result = await showConfirmAlert(
            "Confirm Payment",
            "Are you sure you want to proceed with the payment of $5,575.00?",
            "Yes, Pay Now"
        );
        if (result.isConfirmed) {
            await showSuccessAlert("Payment Successful", "Your transaction has been completed.");
            // Optional routing after payment
            // navigate('/dashboard');
        }
    };

    return (
        <div className="svb-page-wrapper">
            <div className="svb-header-top">
                <div className="svb-header-content">
                    <div className="svb-header-left">
                        <button className="svb-back-btn" onClick={() => navigate(-1)}>
                            <Icon icon="mdi:arrow-left" />
                        </button>
                        <div>
                            <h2 className="text-primary m-0">Complete Your Sponsorship</h2>
                            <div className="svb-subtitle mt-1">
                                <span className="small-body-text">
                                    Secure your payment
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="svb-header-right">
                        <div className="svb-step-info">
                            <span className="small-body-text font-bold text-primary mr-4">
                                Complete Payment
                            </span>

                            <div className="svb-step-progress">
                                <span className="smaller-body-text text-secondary mb-1 block text-right">
                                    Step 4 of 4
                                </span>

                                <div className="svb-progress-bar-container">
                                    <div
                                        className="svb-progress-bar"
                                        style={{ width: '100%' }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="svb-main-container">
                <div className="svb-content-left">
                    <div className="svb-card mb-4">
                        <div className="svb-card-body">
                            <h4 className="mb-4">Company Information</h4>

                            <div className="svb-form-grid">
                                <div className="svb-form-group">
                                    <label>Company Name</label>
                                    <input type="text" placeholder="TechCorp Inc." className="svb-input" />
                                </div>
                                <div className="svb-form-group">
                                    <label>Tax ID / VAT</label>
                                    <input type="text" placeholder="" className="svb-input" />
                                </div>
                            </div>

                            <h4 className="svb-form-grid">Billing Address</h4>
                            <div className="svb-form-group mb-3">
                                <label>Street Address</label>
                                <input type="text" placeholder="123 sample address" className="svb-input" />
                            </div>

                            <div className="svb-form-grid">
                                <div className="svb-form-group">
                                    <label>City</label>
                                    <input type="text" placeholder="" className="svb-input" />
                                </div>
                                <div className="svb-form-group">
                                    <label>Postal Code</label>
                                    <input type="text" placeholder="" className="svb-input" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="svb-card mb-4">
                        <div className="svb-card-body">
                            <h4 className="mb-4">Payment Method</h4>

                            {/* Saved Payment Option */}
                            <div
                                className={`svb-payment-option mb-3 ${paymentMethod === 'saved' ? 'selected' : ''}`}
                                onClick={() => setPaymentMethod('saved')}
                            >
                                <div className="svb-payment-header">
                                    <div className="svb-radio-group">
                                        <input
                                            type="radio"
                                            checked={paymentMethod === 'saved'}
                                            readOnly
                                            className="svb-radio"
                                        />
                                        <div>
                                            <div className="d-flex align-items-center mb-1">
                                                <Icon icon="mdi:credit-card" className="mr-2" style={{ fontSize: '1.2rem' }} />
                                                <h5 className="h6 m-0">Visa •••• 4242</h5>
                                            </div>
                                            <span className="smaller-body-text text-secondary block">Expires 12/25 &bull; Default</span>
                                        </div>
                                    </div>
                                    <div className="svb-card-badges">
                                        <span className="svb-badge button-label blue">VISA</span>
                                    </div>
                                </div>
                            </div>

                            {/* Credit Card Option */}
                            <div
                                className={`svb-payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}
                                onClick={() => setPaymentMethod('card')}
                            >
                                <div className="svb-payment-header">
                                    <div className="svb-radio-group">
                                        <input
                                            type="radio"
                                            checked={paymentMethod === 'card'}
                                            readOnly
                                            className="svb-radio"
                                        />
                                        <h5>Credit Card</h5>
                                    </div>
                                    <div className="svb-card-badges">
                                        <span className="svb-badge button-label blue">VISA</span>
                                        <span className="svb-badge button-label orange">MC</span>
                                        <span className="svb-badge  button-label light-blue">AMEX</span>
                                    </div>
                                </div>

                                {paymentMethod === 'card' && (
                                    <div className="svb-payment-body mt-3">
                                        <div className="svb-form-group mb-3">
                                            <label>Card Number</label>
                                            <div className="svb-input-icon-wrapper">
                                                <Icon icon="mdi:credit-card-outline" className="svb-input-icon text-secondary" />
                                                <input type="text" placeholder="0000 0000 0000 0000" className="svb-input with-icon" />
                                            </div>
                                        </div>

                                        <div className="svb-form-grid">
                                            <div className="svb-form-group">
                                                <label>Expiration</label>
                                                <input type="text" placeholder="MM/YY" className="svb-input" />
                                            </div>
                                            <div className="svb-form-group">
                                                <label>CVC</label>
                                                <input type="text" placeholder="123" className="svb-input" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Invoice Option */}
                            <div
                                className={`svb-payment-option mt-3 ${paymentMethod === 'invoice' ? 'selected' : ''}`}
                                onClick={() => setPaymentMethod('invoice')}
                            >
                                <div className="svb-payment-header">
                                    <div className="svb-radio-group">
                                        <input
                                            type="radio"
                                            checked={paymentMethod === 'invoice'}
                                            readOnly
                                            className="svb-radio"
                                        />
                                        <div>
                                            <div className="d-flex align-items-center mb-1">
                                                <Icon icon="mdi:domain" className="mr-2" style={{ fontSize: '1.2rem' }} />
                                                <h5 className="h6 m-0">Invoice / Bank Transfer</h5>
                                            </div>
                                            <span className="smaller-body-text text-secondary block">Net 30 payment terms available for qualified businesses</span>
                                        </div>
                                    </div>

                                    {paymentMethod !== 'invoice' && (
                                        <Icon icon="mdi:information-outline" className="text-red" style={{ fontSize: '1.2rem' }} />
                                    )}
                                </div>

                                {paymentMethod === 'invoice' && (
                                    <div className="svb-payment-body mt-3">
                                        <div className="svb-info-alert mb-3">
                                            <Icon icon="mdi:information-outline" className="svb-info-icon" />
                                            <span className="smaller-body-text">
                                                <strong>How it works:</strong> After submitting this form, we'll send an invoice to your company email within 1 business day. Payment is due within 30 days of invoice date.
                                            </span>
                                        </div>

                                        <div className="svb-form-group mb-3">
                                            <label>Purchase Order Number (Optional)</label>
                                            <input type="text" placeholder="PO-2026-001" className="svb-input" />
                                        </div>

                                        <div className="svb-form-group">
                                            <label>Accounts Payable Email</label>
                                            <input type="email" placeholder="sample@company.com" className="svb-input" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="svb-content-right">
                    <div className="svb-card p-4">
                        <div className="svb-card-body">
                            <h4 className="mb-4">Order Summary</h4>

                            <div className="mb-4">
                                <span className="smaller-body-text text-secondary block mb-1">Event</span>
                                <h5>TechInnovate Summit 2026</h5>
                            </div>

                            <div className="mb-4">
                                <span className="smaller-body-text text-secondary block mb-1">Item</span>
                                <div className="svb-item-row">
                                    <div>
                                        <h5 className="m-0">Premium Island Booth</h5>
                                        <span className="smaller-body-text text-secondary">Booth #102 • 20×20</span>
                                    </div>
                                    <span className="small-body-text text-secondary">$5,000.00</span>
                                </div>
                            </div>

                            <hr className="svb-divider my-3" />

                            <div className="svb-price-row mb-2">
                                <span className="small-body-text text-secondary">Subtotal</span>
                                <span className="small-body-text text-secondary">$5,000.00</span>
                            </div>

                            <div className="svb-price-row mb-2">
                                <span className="small-body-text text-secondary">Processing Fees</span>
                                <span className="small-body-text text-secondary">$150.00</span>
                            </div>

                            <div className="svb-price-row mb-4">
                                <span className="small-body-text text-secondary">Tax</span>
                                <span className="small-body-text text-secondary">$425.00</span>
                            </div>

                            <hr className="svb-divider mb-3 mt-0" />

                            <div className="svb-price-row">
                                <h5 className="m-0">Total</h5>
                                <h4 className="text-red m-0">$5,575.00</h4>
                            </div>

                            <button className="primary-button svb-pay-btn mb-2 w-100 p-3" onClick={handlePay}>
                                Pay $5,575.00
                            </button>
                            <p className="text-center smaller-body-text text-secondary m-0 pb-4">
                                Payments are secure and encrypted with 256-bit SSL.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SponsorVenueBilling;
