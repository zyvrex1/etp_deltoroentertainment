import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { showConfirmAlert, showSuccessAlert, showErrorAlert } from '../utils/sweetAlert';
import './PromoterPayoutBilling.css';
import { useAuthContext } from '../hooks/useAuthContext';
import payoutService from '../services/payoutService';

const PromoterPayoutBilling = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthContext();
    const [paymentMethod, setPaymentMethod] = useState(() => {
        const defaultMethod = user?.paymentMethods?.find(m => m.isDefault);
        return defaultMethod ? defaultMethod._id : (user?.paymentMethods?.length > 0 ? user.paymentMethods[0]._id : 'card');
    });
    const [submitting, setSubmitting] = useState(false);

    const withdrawAmount = location.state?.amount || 0;
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

    const handleWithdraw = async () => {
        if (withdrawAmount <= 0) {
            showErrorAlert("Invalid Amount", "You cannot withdraw $0.00");
            return;
        }

        const result = await showConfirmAlert(
            "Confirm Withdrawal",
            `Are you sure you want to proceed with the withdrawal of $${withdrawAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}?`,
            "Yes, Withdraw Now"
        );

        if (result.isConfirmed) {
            setSubmitting(true);
            try {
                // Get method details
                let methodType = 'Credit Card';
                let methodDetails = {};

                const savedMethod = user.paymentMethods?.find(m => m._id === paymentMethod);
                if (savedMethod) {
                    methodType = savedMethod.type || 'Card';
                    methodDetails = { last4: savedMethod.last4 };
                } else if (paymentMethod === 'card') {
                    methodType = 'Credit Card';
                    // In a real app, collect card details here or use stripe token
                } else {
                    methodType = 'Invoice / Bank Transfer';
                }

                await payoutService.createPayout({
                    amount: withdrawAmount,
                    method: methodType,
                    methodDetails: methodDetails,
                }, user.token);

                await showSuccessAlert("Withdrawal Successful", "Your transaction has been processed.");
                navigate('/promoter/promoter-payouts');
            } catch (err) {
                console.error("WITHDRAWAL ERROR:", err);
                showErrorAlert("Withdrawal Failed", err.message || "Failed to process withdrawal.");
            } finally {
                setSubmitting(false);
            }
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
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h4 className="m-0">Payout Method</h4>

                            </div>

                            {user?.paymentMethods && user.paymentMethods.length > 0 ? (
                                user.paymentMethods.map((method) => (
                                    <div
                                        key={method._id || method.id}
                                        className={`ppb-payment-option mb-4 ${paymentMethod === (method._id || method.id) ? 'selected' : ''}`}
                                        onClick={() => setPaymentMethod(method._id || method.id)}
                                    >
                                        <div className="ppb-radio-wrapper">
                                            <input
                                                type="radio"
                                                checked={paymentMethod === (method._id || method.id)}
                                                readOnly
                                                className="ppb-radio"
                                            />
                                        </div>
                                        <div className="ppb-payment-item-inner">
                                            <div className="ppb-payment-icon">
                                                <Icon icon={method.icon || "mdi:credit-card"} />
                                            </div>
                                            <div className="ppb-payment-info">
                                                <h5 className="ppb-payment-name">{method.type}</h5>
                                                <span className="smaller-body-text ppb-payment-num">
                                                    •••• {method.last4}
                                                </span>
                                            </div>
                                            {method.isDefault && <span className="button-label ppb-default-pill">Default</span>}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="smaller-body-text text-secondary text-center py-4">
                                    No payment methods added yet. Add one in <Link to="/promoter/settings" style={{ color: 'var(--color-blue)', textDecoration: 'underline' }}>Settings</Link>.
                                </p>
                            )}

                            {/* Credit Card Option */}
                            <div
                                className={`ppb-payment-option mt-4 ${paymentMethod === 'card' ? 'selected' : ''}`}
                                onClick={() => setPaymentMethod('card')}
                                style={{ flexDirection: 'column', alignItems: 'stretch' }}
                            >
                                <div className="d-flex align-items-center gap-3">
                                    <div className="ppb-radio-wrapper">
                                        <input
                                            type="radio"
                                            checked={paymentMethod === 'card'}
                                            readOnly
                                            className="ppb-radio"
                                        />
                                    </div>
                                    <div className="ppb-payment-item-inner">
                                        <div className="ppb-payment-icon">
                                            <Icon icon="mdi:credit-card-outline" />
                                        </div>
                                        <div className="ppb-payment-info">
                                            <h5 className="ppb-payment-name">Credit Card</h5>
                                            <span className="smaller-body-text ppb-payment-num">Pay with a new card</span>
                                        </div>
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
                                className={`ppb-payment-option mt-4 ${paymentMethod === 'invoice' ? 'selected' : ''}`}
                                onClick={() => setPaymentMethod('invoice')}
                                style={{ flexDirection: 'column', alignItems: 'stretch' }}
                            >
                                <div className="d-flex align-items-center gap-3">
                                    <div className="ppb-radio-wrapper">
                                        <input
                                            type="radio"
                                            checked={paymentMethod === 'invoice'}
                                            readOnly
                                            className="ppb-radio"
                                        />
                                    </div>
                                    <div className="ppb-payment-item-inner">
                                        <div className="ppb-payment-icon">
                                            <Icon icon="mdi:file-document-outline" />
                                        </div>
                                        <div className="ppb-payment-info">
                                            <h5 className="ppb-payment-name">Invoice / Bank Transfer</h5>
                                            <span className="smaller-body-text ppb-payment-num">Pay via bank transfer</span>
                                        </div>
                                    </div>
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
                                <h5 className="m-0">{todayStr}</h5>
                            </div>

                            <hr className="ppb-divider my-3" />

                            <div className="ppb-price-row mb-2">
                                <span className="small-body-text ppb-text-secondary">Subtotal</span>
                                <span className="small-body-text ppb-text-secondary">${withdrawAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                                <h5 className="ppb-text-red m-0">${withdrawAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h5>
                            </div>

                            <button
                                className="primary-button ppb-pay-btn w-100"
                                onClick={handleWithdraw}
                                disabled={submitting}
                            >
                                {submitting ? "Processing..." : `Withdraw $${withdrawAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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
