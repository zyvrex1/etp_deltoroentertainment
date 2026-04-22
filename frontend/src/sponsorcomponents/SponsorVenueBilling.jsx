import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { showConfirmAlert, showSuccessAlert, showErrorAlert } from '../admincomponents/utils/sweetAlert';
import { useAuthContext } from '../admincomponents/hooks/useAuthContext';
import * as authService from '../services/authService';
import axios from 'axios';
import './SponsorVenueBilling.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const SponsorVenueBilling = () => {
    const { user } = useAuthContext();
    const navigate = useNavigate();
    const location = useLocation();
    const { event, booth, category, total } = location.state || {};
    const [paymentMethod, setPaymentMethod] = useState('invoice'); // Default to invoice for now
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [billingInfo, setBillingInfo] = useState({
        companyName: '',
        taxId: '',
        streetAddress: '',
        city: '',
        postalCode: '',
        apEmail: '',
        poNumber: ''
    });
    useEffect(() => {
        const generatePONumber = () => {
            const year = new Date().getFullYear();
            const random = Math.floor(1000 + Math.random() * 9000);
            return `PO-${year}-${random}`;
        };

        const fetchProfile = async () => {
            if (!user?.token) return;
            try {
                const response = await authService.getProfile(user.token);
                const p = response.data;
                setBillingInfo(prev => ({
                    ...prev,
                    companyName: p.companyName || '',
                    streetAddress: p.billingAddress || '',
                    city: p.city || '',
                    postalCode: p.postalCode || '',
                    apEmail: p.email || '',
                    poNumber: prev.poNumber || generatePONumber()
                }));
            } catch (error) {
                console.error("Error fetching profile for billing autofill:", error);
                setBillingInfo(prev => ({ ...prev, poNumber: prev.poNumber || generatePONumber() }));
            }
        };
        fetchProfile();
    }, [user]);

    if (!event || !booth) {
        return (
            <div className="sed-error-container">
                <Icon icon="mdi:alert-circle-outline" width="48" />
                <h3>No billing data found</h3>
                <p className="small-body-text text-secondary mb-4">Please return to the map and complete your selection.</p>
                <button className="primary-button" onClick={() => navigate('/sponsor/sponsor-events')}>Browse Events</button>
            </div>
        );
    }

    const facePrice = category?.facePrice || 0;
    const processingFee = facePrice * 0.03;
    const estimatedTax = facePrice * 0.08;

    const handlePay = async () => {
        const eventId = event?._id || event?.id;
        const boothId = booth?._id || booth?.id;

        if (!eventId || !boothId) {
            console.error("Missing IDs:", { eventId, boothId, event, booth });
            await showErrorAlert("Error", "Missing event or booth selection data.");
            return;
        }

        const result = await showConfirmAlert(
            "Confirm Reservation",
            `Are you sure you want to reserve ${booth.label || booth.code} for $${total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}?`,
            "Yes, Reserve Now"
        );

        if (result.isConfirmed) {
            setIsSubmitting(true);
            try {
                const response = await axios.post(`${BACKEND_URL}/api/events/${eventId}/reserve-booth`, {
                    boothId: boothId,
                    billingAddress: {
                        companyName: billingInfo.companyName,
                        address: billingInfo.streetAddress,
                        city: billingInfo.city,
                        zipCode: billingInfo.postalCode,
                        email: billingInfo.apEmail || user.email
                    },
                    amount: {
                        total: total,
                        subtotal: (total / 1.11), // Rough estimation if actuals not passed
                        fee: (total * 0.03),
                        tax: (total * 0.08)
                    },
                    paymentMethod: paymentMethod === 'invoice' ? 'invoice' : 'card',
                    poNumber: billingInfo.poNumber
                }, {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                });

                if (response.status === 201) {
                    await showSuccessAlert("Reservation Successful", "Your booth has been reserved. You can find your ticket and QR code in 'My Booths'.");
                    navigate('/sponsor/sponsor-my-booths');
                }
            } catch (error) {
                console.error("Reservation Error:", error);
                await showErrorAlert("Reservation Failed", error.response?.data?.error || "An unexpected error occurred.");
            } finally {
                setIsSubmitting(false);
            }
        }
    };


    const handleInputChange = (field, value) => {
        setBillingInfo(prev => ({ ...prev, [field]: value }));
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
                                    Finalize payment for {event.title}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="svb-header-right">
                        <div className="svb-step-info">
                            <span className="small-body-text font-bold text-primary mr-4" style={{ whiteSpace: 'nowrap' }}>
                                Secure Checkout
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
                                    <input
                                        type="text"
                                        placeholder="Your Company Name"
                                        className="svb-input"
                                        value={billingInfo.companyName}
                                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                                    />
                                </div>
                                <div className="svb-form-group">
                                    <label>Tax ID / VAT</label>
                                    <input
                                        type="text"
                                        placeholder="Optional"
                                        className="svb-input"
                                        value={billingInfo.taxId}
                                        onChange={(e) => handleInputChange('taxId', e.target.value)}
                                    />
                                </div>
                            </div>

                            <h4 className="svb-form-grid">Billing Address</h4>
                            <div className="svb-form-group mb-3">
                                <label>Street Address</label>
                                <input
                                    type="text"
                                    placeholder="123 Business St"
                                    className="svb-input"
                                    value={billingInfo.streetAddress}
                                    onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                                />
                            </div>

                            <div className="svb-form-grid">
                                <div className="svb-form-group">
                                    <label>City</label>
                                    <input
                                        type="text"
                                        placeholder=""
                                        className="svb-input"
                                        value={billingInfo.city}
                                        onChange={(e) => handleInputChange('city', e.target.value)}
                                    />
                                </div>
                                <div className="svb-form-group">
                                    <label>Postal Code</label>
                                    <input
                                        type="text"
                                        placeholder=""
                                        className="svb-input"
                                        value={billingInfo.postalCode}
                                        onChange={(e) => handleInputChange('postalCode', e.target.value)}
                                    />
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
                                                <h5 className="h6 m-0">Visa •••• {booth.last4 || '4242'}</h5>
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
                                            <input
                                                type="text"
                                                placeholder="PO-2026-001"
                                                className="svb-input"
                                                value={billingInfo.poNumber}
                                                onChange={(e) => handleInputChange('poNumber', e.target.value)}
                                            />
                                        </div>

                                        <div className="svb-form-group">
                                            <label>Accounts Payable Email</label>
                                            <input
                                                type="email"
                                                placeholder="billing@yourcompany.com"
                                                className="svb-input"
                                                value={billingInfo.apEmail}
                                                onChange={(e) => handleInputChange('apEmail', e.target.value)}
                                            />
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
                                <h5>{event.title}</h5>
                            </div>

                            <div className="mb-4">
                                <span className="smaller-body-text text-secondary block mb-1">Item</span>
                                <div className="svb-item-row">
                                    <div>
                                        <h5 className="m-0">{category?.priceName || 'Booth'} #{booth.label || booth.code}</h5>
                                        <span className="smaller-body-text text-secondary">{category?.boothSize || 'Standard'} • {event.venue?.name}</span>
                                    </div>
                                    <span className="small-body-text text-secondary">${facePrice.toLocaleString()}</span>
                                </div>
                            </div>

                            <hr className="svb-divider my-3" />

                            <div className="svb-price-row mb-2">
                                <span className="small-body-text text-secondary">Subtotal</span>
                                <span className="small-body-text text-secondary">${facePrice.toLocaleString()}</span>
                            </div>

                            <div className="svb-price-row mb-2">
                                <span className="small-body-text text-secondary">Processing Fees</span>
                                <span className="small-body-text text-secondary">${processingFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>

                            <div className="svb-price-row mb-4">
                                <span className="small-body-text text-secondary">Tax</span>
                                <span className="small-body-text text-secondary">${estimatedTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>

                            <hr className="svb-divider mb-3 mt-0" />

                            <div className="svb-price-row">
                                <h5 className="m-0">Total</h5>
                                <h4 className="text-red m-0">${total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</h4>
                            </div>

                            <button
                                className="primary-button svb-pay-btn mb-2 w-100 p-3"
                                onClick={handlePay}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Icon icon="line-md:loading-twotone-loop" width="24" />
                                ) : (
                                    `Reserve Now - $${total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`
                                )}
                            </button>
                            <p className="text-center smaller-body-text text-secondary m-0 pb-4">
                                Payments are secure and encrypted.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SponsorVenueBilling;
