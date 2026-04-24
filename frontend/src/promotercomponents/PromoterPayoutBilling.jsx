import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { showConfirmAlert, showSuccessAlert } from '../utils/sweetAlert';
import './PromoterPayoutBilling.css';

const PromoterPayoutBilling = () => {
    const navigate = useNavigate();
    const [paymentMethod, setPaymentMethod] = useState('saved');

    const handleWithdraw = async () => {
        const result = await showConfirmAlert(
            "Confirm Withdrawal",
            "Are you sure you want to proceed with the withdrawal of $15,240.00?",
            "Yes, Withdraw Now"
        );
        if (result.isConfirmed) {
            await showSuccessAlert("Withdrawal Successful", "Your transaction has been processed.");
            navigate('/promoter/promoter-payouts');
        }
    };

    return (
        <div className="ppb-page-wrapper">
            <div className="ppb-header-top">
                <div className="ppb-header-content">
                    <div className="ppb-header-left">
                        <button className="ppb-back-btn" onClick={() => navigate(-1)}>
                            <Icon icon="mdi:arrow-left" />
                        </button>
                        <div className="ppb-title-wrapper">
                            <div className="ppb-breadcrumbs">
                                <span className="smaller-body-text ppb-breadcrumb-text" onClick={() => navigate(-1)}>Payouts</span>
                                <Icon icon="mdi:chevron-right" className="ppb-breadcrumb-icon" />
                                <span className="smaller-body-text ppb-breadcrumb-active">Withdraw Funds</span>
                            </div>
                            <h2 className="ppb-title m-0">Complete Withdrawal</h2>
                        </div>
                    </div>

                    <div className="ppb-header-right">
                        <div className="ppb-step-info">
                            <span className="small-body-text font-bold ppb-text-primary mr-4">
                                Complete Process
                            </span>
                            <div className="ppb-step-progress">
                                <span className="smaller-body-text ppb-text-secondary mb-1 block text-right">
                                    Step 2 of 2
                                </span>
                                <div className="ppb-progress-bar-container">
                                    <div className="ppb-progress-bar" style={{ width: '100%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="ppb-main-container">
                <div className="ppb-content-left">
                    <div className="ppb-card">
                        <div className="ppb-card-body">
                            <h4 className="mb-4">Payout Method</h4>

                            {/* Saved Payment Option */}
                            <div
                                className={`ppb-payment-option mb-3 ${paymentMethod === 'saved' ? 'selected' : ''}`}
                                onClick={() => setPaymentMethod('saved')}
                            >
                                <div className="ppb-payment-header">
                                    <div className="ppb-radio-group">
                                        <input
                                            type="radio"
                                            checked={paymentMethod === 'saved'}
                                            readOnly
                                            className="ppb-radio"
                                        />
                                        <div>
                                            <div className="ppb-d-flex align-items-center mb-1">
                                                <Icon icon="mdi:credit-card" className="mr-2" style={{ fontSize: '1.2rem' }} />
                                                <h5 className="h6 m-0">Visa •••• 4242</h5>
                                            </div>
                                            <span className="smaller-body-text ppb-text-secondary block">Expires 12/25 &bull; Default</span>
                                        </div>
                                    </div>
                                    <div className="ppb-card-badges">
                                        <span className="ppb-badge button-label blue">VISA</span>
                                    </div>
                                </div>
                            </div>

                            {/* Credit Card Option */}
                            <div
                                className={`ppb-payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}
                                onClick={() => setPaymentMethod('card')}
                            >
                                <div className="ppb-payment-header">
                                    <div className="ppb-radio-group">
                                        <input
                                            type="radio"
                                            checked={paymentMethod === 'card'}
                                            readOnly
                                            className="ppb-radio"
                                        />
                                        <h5>Credit Card</h5>
                                    </div>
                                    <div className="ppb-card-badges">
                                        <span className="ppb-badge button-label blue">VISA</span>
                                        <span className="ppb-badge button-label orange">MC</span>
                                        <span className="ppb-badge button-label light-blue">AMEX</span>
                                    </div>
                                </div>

                                {paymentMethod === 'card' && (
                                    <div className="ppb-payment-body mt-3">
                                        <div className="ppb-form-group mb-3">
                                            <label>Card Number</label>
                                            <div className="ppb-input-icon-wrapper">
                                                <Icon icon="mdi:credit-card-outline" className="ppb-input-icon ppb-text-secondary" />
                                                <input type="text" placeholder="0000 0000 0000 0000" className="ppb-input with-icon" />
                                            </div>
                                        </div>

                                        <div className="ppb-form-grid">
                                            <div className="ppb-form-group">
                                                <label>Expiration</label>
                                                <input type="text" placeholder="MM/YY" className="ppb-input" />
                                            </div>
                                            <div className="ppb-form-group">
                                                <label>CVC</label>
                                                <input type="text" placeholder="123" className="ppb-input" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Invoice Option */}
                            <div
                                className={`ppb-payment-option mt-3 ${paymentMethod === 'invoice' ? 'selected' : ''}`}
                                onClick={() => setPaymentMethod('invoice')}
                            >
                                <div className="ppb-payment-header">
                                    <div className="ppb-radio-group">
                                        <input
                                            type="radio"
                                            checked={paymentMethod === 'invoice'}
                                            readOnly
                                            className="ppb-radio"
                                        />
                                        <div>
                                            <div className="ppb-d-flex align-items-center mb-1">
                                                <Icon icon="mdi:domain" className="mr-2" style={{ fontSize: '1.2rem' }} />
                                                <h5 className="h6 m-0">Invoice / Bank Transfer</h5>
                                            </div>
                                            <span className="smaller-body-text ppb-text-secondary block">Net 30 payment terms available for qualified businesses</span>
                                        </div>
                                    </div>

                                    {paymentMethod !== 'invoice' && (
                                        <Icon icon="mdi:information-outline" className="text-red" style={{ fontSize: '1.2rem' }} />
                                    )}
                                </div>

                                {paymentMethod === 'invoice' && (
                                    <div className="ppb-payment-body mt-3">
                                        <div className="ppb-info-alert mb-3">
                                            <Icon icon="mdi:information-outline" className="ppb-info-icon" />
                                            <span className="smaller-body-text">
                                                <strong>How it works:</strong> After submitting this form, we'll send an invoice to your company email within 1 business day. Payment is due within 30 days of invoice date.
                                            </span>
                                        </div>

                                        <div className="ppb-form-group mb-3">
                                            <label>Purchase Order Number (Optional)</label>
                                            <input type="text" placeholder="PO-2026-001" className="ppb-input" />
                                        </div>

                                        <div className="ppb-form-group">
                                            <label>Accounts Payable Email</label>
                                            <input type="email" placeholder="sample@company.com" className="ppb-input" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="ppb-content-right">
                    <div className="ppb-card p-4">
                        <div className="ppb-card-body">
                            <h4 className="mb-4">Withdrawal Summary</h4>

                            <div className="mb-4">
                                <span className="smaller-body-text ppb-text-secondary block mb-1">Date</span>
                                <h5 className="m-0">Oct 15, 2024</h5>
                            </div>

                            <hr className="ppb-divider my-3" />

                            <div className="ppb-price-row mb-2">
                                <span className="small-body-text ppb-text-secondary">Subtotal</span>
                                <span className="small-body-text ppb-text-secondary">$15,240.00</span>
                            </div>

                            <div className="ppb-price-row mb-2">
                                <span className="small-body-text ppb-text-secondary">Processing Fees</span>
                                <span className="small-body-text ppb-text-secondary">$0.00</span>
                            </div>

                            <div className="ppb-price-row mb-4">
                                <span className="small-body-text ppb-text-secondary">Tax</span>
                                <span className="small-body-text ppb-text-secondary">$0.00</span>
                            </div>

                            <hr className="ppb-divider mb-3 mt-0" />

                            <div className="ppb-price-row">
                                <h6 className="m-0">Total</h6>
                                <h5 className="ppb-text-red m-0">$15,240.00</h5>
                            </div>

                            <button className="primary-button ppb-pay-btn w-100" onClick={handleWithdraw}>
                                Withdraw $15,240.00
                            </button>
                            <p className="text-center smaller-body-text ppb-text-secondary m-0 mt-4 ppb-secure-text">
                                Transactions are secure and encrypted.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromoterPayoutBilling;
