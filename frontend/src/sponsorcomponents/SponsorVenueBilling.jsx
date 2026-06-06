import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { showConfirmAlert, showSuccessAlert, showErrorAlert } from '../utils/sweetAlert';
import { useAuthContext } from '../hooks/useAuthContext';
import { useSponsorCartContext } from '../context/SponsorCartContext';
import * as authService from '../services/authService';
import digitalgiftsService from '../services/digitalgiftsService';
import axios from 'axios';
import './SponsorVenueBilling.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

// Maps HTTP status codes and known error strings to user-friendly messages
const getPaymentErrorMessage = (error) => {
    if (!error.response) {
        // Network error — no response received at all
        return "Unable to reach the server. Please check your internet connection and try again.";
    }

    const status = error.response?.status;
    const serverMessage = error.response?.data?.error || error.response?.data?.message;

    switch (status) {
        case 400:
            return serverMessage || "Invalid reservation details. Please review your information and try again.";
        case 401:
            return "Your session has expired. Please log in again and retry.";
        case 403:
            return "You don't have permission to reserve this booth.";
        case 404:
            return "The event or booth could not be found. It may have been removed.";
        case 409:
            return serverMessage || "This booth has already been reserved by someone else.";
        case 422:
            return serverMessage || "Some required fields are missing or invalid.";
        case 429:
            return "Too many requests. Please wait a moment before trying again.";
        case 500:
        case 502:
        case 503:
            return "A server error occurred. Please try again in a few minutes.";
        default:
            return serverMessage || "An unexpected error occurred. Please try again.";
    }
};

// Validates required billing fields before submission
const validateBillingInfo = (billingInfo, paymentMethod) => {
    const errors = [];

    if (!billingInfo.companyName.trim()) {
        errors.push("Company Name is required.");
    }
    if (!billingInfo.streetAddress.trim()) {
        errors.push("Street Address is required.");
    }
    if (!billingInfo.city.trim()) {
        errors.push("City is required.");
    }
    if (!billingInfo.postalCode.trim()) {
        errors.push("Postal Code is required.");
    }
    if (paymentMethod === 'invoice' && !billingInfo.apEmail.trim()) {
        errors.push("Accounts Payable Email is required for invoice payments.");
    }
    if (paymentMethod === 'invoice' && billingInfo.apEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingInfo.apEmail)) {
        errors.push("Please enter a valid Accounts Payable Email address.");
    }

    return errors;
};

const SponsorVenueBilling = () => {
    const { user } = useAuthContext();
    const { removeFromCart } = useSponsorCartContext();
    const navigate = useNavigate();
    const location = useLocation();

    const state = location.state || {};
    const selectedItems = state.selectedItems || (state.event && state.booth ? [state] : []);

    const [paymentMethod, setPaymentMethod] = useState('invoice');
    const [savedMethods, setSavedMethods] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState([]);

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
                setSavedMethods(p.paymentMethods || []);
                setBillingInfo(prev => ({
                    ...prev,
                    companyName: p.companyName || '',
                    streetAddress: p.streetAddress || '',
                    city: p.city || '',
                    postalCode: p.zipCode || '',
                    apEmail: p.email || '',
                    poNumber: prev.poNumber || generatePONumber()
                }));
                // Set default payment method if available
                if (p.paymentMethods && p.paymentMethods.length > 0) {
                    const defaultMethod = p.paymentMethods.find(m => m.isDefault) || p.paymentMethods[0];
                    setPaymentMethod(defaultMethod._id || defaultMethod.id);
                }
            } catch (error) {
                // Non-fatal: autofill failed, user can still fill manually
                console.warn("Could not autofill billing info from profile:", error);
                setBillingInfo(prev => ({
                    ...prev,
                    poNumber: prev.poNumber || generatePONumber()
                }));
            }
        };

        fetchProfile();
    }, [user]);

    // Clear validation errors when the user edits any field
    const handleInputChange = (field, value) => {
        setValidationErrors([]);
        setBillingInfo(prev => ({ ...prev, [field]: value }));
    };

    if (!selectedItems || selectedItems.length === 0) {
        return (
            <div className="sed-error-container">
                <Icon icon="mdi:alert-circle-outline" width="48" />
                <h3>No items found in checkout</h3>
                <p className="small-body-text text-secondary mb-4">
                    Please return to your cart and complete your selection.
                </p>
                <button className="primary-button" onClick={() => navigate('/sponsor/cart')}>
                    Go to Cart
                </button>
            </div>
        );
    }

    const subtotalGrand = selectedItems.reduce((sum, item) => sum + (item.facePrice || 0), 0);
    const processingFeeGrand = selectedItems.reduce((sum, item) => sum + (item.processingFee || 0), 0);
    const estimatedTaxGrand = selectedItems.reduce((sum, item) => sum + (item.estimatedTax || 0), 0);

    const [availableGifts, setAvailableGifts] = useState([]);
    const [selectedGift, setSelectedGift] = useState(null);

    useEffect(() => {
        const fetchGifts = async () => {
            if (!user?.token) return;
            try {
                const gifts = await digitalgiftsService.getMyGifts(user.token);
                // Filter for pending/unused assignments only
                const activeGifts = gifts.filter(g => g.assignmentStatus === 'pending');
                setAvailableGifts(activeGifts);
            } catch (error) {
                console.error("Error fetching my gifts:", error);
            }
        };
        fetchGifts();
    }, [user]);

    const discount = useMemo(() => {
        if (!selectedGift) return 0;
        if (selectedGift.valueType === 'fixed') {
            return Math.min(selectedGift.value, subtotalGrand);
        } else if (selectedGift.valueType === 'percent') {
            return (subtotalGrand * selectedGift.value) / 100;
        } else if (selectedGift.valueType === 'bxgy') {
            // Buy 1 Get 1 Free: discount = price of cheapest item
            if (selectedItems.length < 2) return 0;
            const prices = selectedItems.map(i => i.facePrice || 0).sort((a, b) => a - b);
            return prices[0];
        }
        return 0;
    }, [selectedGift, subtotalGrand, selectedItems]);

    const totalGrand = useMemo(() => {
        return Math.max(0, subtotalGrand - discount + processingFeeGrand + estimatedTaxGrand);
    }, [subtotalGrand, discount, processingFeeGrand, estimatedTaxGrand]);

    const firstEvent = selectedItems[0].event;
    const isMultipleEvents = new Set(selectedItems.map(i => i.event._id || i.event.id)).size > 1;
    const headerTitle = isMultipleEvents ? 'Multiple Events' : firstEvent.title;

    // Resolve payment method string for the API
    const resolveApiPaymentMethod = () => {
        if (paymentMethod === 'invoice') return 'Invoice / Bank Transfer';
        if (paymentMethod === 'card') return 'Credit Card';
        const m = savedMethods.find(x => (x._id || x.id) === paymentMethod);
        if (!m) return 'Credit Card';
        if (m.methodType === 'PayPal') return `PayPal (${m.paypalEmail})`;
        if (m.methodType === 'UPI') return `UPI (${m.accountNumber})`;
        return `${m.type || 'Card'} \u2022\u2022\u2022\u2022 ${m.last4}`;
    };

    const handlePay = async () => {
        if (isSubmitting) return;

        // 1. Client-side validation
        const errors = validateBillingInfo(billingInfo, paymentMethod);
        if (errors.length > 0) {
            setValidationErrors(errors);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        setValidationErrors([]);

        // 2. Confirm dialog
        const result = await showConfirmAlert(
            "Confirm Reservation",
            `Are you sure you want to reserve ${selectedItems.length} booth(s) for $${totalGrand.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}?`,
            "Yes, Reserve Now"
        );

        if (!result.isConfirmed) return;

        setIsSubmitting(true);

        const successfulItems = [];
        const failedItems = [];   // { item, reason }

        try {
            const sharedBatchId = crypto.randomUUID(); // ← one ID for this entire checkout
            let remainingDiscount = discount;
            const itemCount = selectedItems.length;

            for (let idx = 0; idx < itemCount; idx++) {
                const item = selectedItems[idx];
                const eventId = item.event?._id || item.event?.id;
                const boothId = item.booth?._id || item.booth?.id;
                const boothLabel = item.booth?.label || item.booth?.code || boothId;

                // Guard: skip items missing IDs and record as failed
                if (!eventId || !boothId) {
                    console.error("Missing event or booth ID for item:", item);
                    failedItems.push({ item, reason: `Booth #${boothLabel}: Missing event or booth identifier.` });
                    continue;
                }

                // Distribute discount proportionally
                let itemDiscount = 0;
                if (discount > 0) {
                    if (idx === itemCount - 1) {
                        itemDiscount = remainingDiscount;
                    } else {
                        itemDiscount = Math.round(((item.facePrice / subtotalGrand) * discount) * 100) / 100;
                        remainingDiscount -= itemDiscount;
                    }
                }

                const itemSubtotal = Math.max(0, item.facePrice - itemDiscount);
                const itemTotal = Math.max(0, itemSubtotal + (item.processingFee || 0) + (item.estimatedTax || 0));

                try {
                    const response = await axios.post(
                        `${BACKEND_URL}/api/events/${eventId}/reserve-booth`,
                        {
                            boothId,
                            batchId: sharedBatchId,   // ← same ID for every booth in this order
                            billingAddress: {
                                companyName: billingInfo.companyName,
                                address: billingInfo.streetAddress,
                                city: billingInfo.city,
                                zipCode: billingInfo.postalCode,
                                email: billingInfo.apEmail || user.email
                            },
                            amount: {
                                total: itemTotal,
                                subtotal: itemSubtotal,
                                fee: item.processingFee || 0,
                                tax: item.estimatedTax || 0
                            },
                            paymentMethod: resolveApiPaymentMethod(),
                            poNumber: billingInfo.poNumber,
                            appliedGift: selectedGift ? selectedGift.giftId : null,
                            giftCode: selectedGift ? selectedGift.code : ""
                        },
                        {
                            headers: { Authorization: `Bearer ${user.token}` }
                        }
                    );

                    if (response.status === 201) {
                        successfulItems.push(item);
                        if (item.cartId) removeFromCart(item.cartId);
                    } else {
                        // Unexpected 2xx that isn't 201
                        failedItems.push({
                            item,
                            reason: `Booth #${boothLabel}: Unexpected response (status ${response.status}).`
                        });
                    }
                } catch (itemError) {
                    const friendlyMessage = getPaymentErrorMessage(itemError);
                    failedItems.push({ item, reason: `Booth #${boothLabel}: ${friendlyMessage}` });

                    // Stop immediately on auth errors — retrying the loop won't help
                    if (itemError.response?.status === 401 || itemError.response?.status === 403) {
                        break;
                    }
                }
            }

            // Redeem the gift card assignment upon successful purchase
            if (successfulItems.length > 0 && selectedGift) {
                try {
                    await digitalgiftsService.redeemAssignment(
                        selectedGift.giftId,
                        selectedGift.assignmentId,
                        user.token
                    );
                } catch (redeemError) {
                    console.error("Failed to redeem assignment post-booth-billing:", redeemError);
                }
            }

            // 3. Show outcome based on success/failure mix
            if (successfulItems.length > 0 && failedItems.length === 0) {
                // All succeeded
                await showSuccessAlert(
                    "Reservation Successful",
                    `Successfully reserved ${successfulItems.length} booth(s). You can find your tickets and QR codes in 'My Booths'.`
                );
                navigate('/sponsor/sponsor-my-booths');

            } else if (successfulItems.length > 0 && failedItems.length > 0) {
                // Partial success
                const failedReasons = failedItems.map(f => `• ${f.reason}`).join('\n');
                await showErrorAlert(
                    `Partially Reserved (${successfulItems.length} of ${selectedItems.length})`,
                    `${successfulItems.length} booth(s) were reserved successfully.\n\nThe following could not be reserved:\n${failedReasons}\n\nSuccessfully reserved booths are in 'My Booths'.`
                );
                navigate('/sponsor/sponsor-my-booths');

            } else {
                // All failed
                const isSingleItem = failedItems.length === 1;
                const errorDetail = isSingleItem
                    ? failedItems[0].reason
                    : `Multiple booths could not be reserved:\n${failedItems.map(f => `• ${f.reason}`).join('\n')}`;

                await showErrorAlert("Reservation Failed", errorDetail);
            }

        } catch (unexpectedError) {
            // Catches anything that escaped the per-item try/catch (e.g. removeFromCart throwing)
            console.error("Unexpected reservation error:", unexpectedError);
            await showErrorAlert(
                "Reservation Failed",
                "An unexpected error occurred while processing your reservation. Please try again or contact support."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="svb-page-wrapper">
            <div className="svb-header-top">
                <div className="svb-header-content">
                    <div className="svb-header-left">
                        <button className="svb-back-btn" onClick={() => navigate(-1)} disabled={isSubmitting}>
                            <Icon icon="mdi:arrow-left" />
                        </button>
                        <div>
                            <h2 className="text-primary m-0">Complete Your Sponsorship</h2>
                            <div className="svb-subtitle mt-1">
                                <span className="small-body-text">
                                    Finalize payment for {headerTitle}
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
                                    <div className="svb-progress-bar" style={{ width: '100%' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="svb-main-container">
                <div className="svb-content-left">

                    {/* Validation error banner */}
                    {validationErrors.length > 0 && (
                        <div className="svb-validation-banner mb-4">
                            <Icon icon="mdi:alert-circle-outline" className="svb-validation-icon" />
                            <div>
                                <strong>Please fix the following before continuing:</strong>
                                <ul className="svb-validation-list mt-1 mb-0">
                                    {validationErrors.map((err, i) => (
                                        <li key={i}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    <div className="svb-card mb-4">
                        <div className="svb-card-body">
                            <h4 className="mb-4">Company Information</h4>
                            <div className="svb-form-grid">
                                <div className="svb-form-group">
                                    <label>Company Name <span className="text-red">*</span></label>
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
                                <label>Street Address <span className="text-red">*</span></label>
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
                                    <label>City <span className="text-red">*</span></label>
                                    <input
                                        type="text"
                                        placeholder=""
                                        className="svb-input"
                                        value={billingInfo.city}
                                        onChange={(e) => handleInputChange('city', e.target.value)}
                                    />
                                </div>
                                <div className="svb-form-group">
                                    <label>Postal Code <span className="text-red">*</span></label>
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
                            <h4 className="mb-4">Gift Cards & Promos</h4>
                            {availableGifts.length === 0 ? (
                                <p className="small-body-text text-secondary">No available gift cards or promos found.</p>
                            ) : (
                                <div className="svb-form-group">
                                    <label htmlFor="gift-select">Select a promo or gift card to apply:</label>
                                    <select
                                        id="gift-select"
                                        className="svb-input"
                                        value={selectedGift ? selectedGift.giftId : ''}
                                        onChange={(e) => {
                                            const gift = availableGifts.find(g => g.giftId === e.target.value);
                                            setSelectedGift(gift || null);
                                        }}
                                        style={{ marginTop: '8px' }}
                                    >
                                        <option value="">-- No Promo / Gift Card --</option>
                                        {availableGifts.map(g => (
                                            <option key={g.giftId} value={g.giftId}>
                                                {g.code} - {g.name} ({
                                                    g.valueType === 'fixed' ? `$${g.value.toFixed(2)} off` :
                                                        g.valueType === 'percent' ? `${g.value}% off` :
                                                            g.valueType === 'bxgy' ? 'Buy 1 Get 1 Free' :
                                                                'Promo'
                                                })                                            </option>
                                        ))}
                                    </select>
                                    {selectedGift && (
                                        <div className="mt-2 text-success small-body-text" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-green-primary)' }}>
                                            <Icon icon="mdi:check-circle" /> {
                                                selectedGift.valueType === 'bxgy'
                                                    ? `Buy 1 Get 1 Free applied — $${discount.toFixed(2)} off`
                                                    : selectedGift.valueType === 'fixed'
                                                        ? `Applied discount of $${discount.toFixed(2)}`
                                                        : `Applied discount of ${selectedGift.value}%`
                                            }.                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="svb-card mb-4">
                        <div className="svb-card-body">
                            <h4 className="mb-4">Payment Method</h4>
                            {savedMethods.map((method) => {
                                const methodId = method._id || method.id;
                                const isSelected = paymentMethod === methodId;
                                return (
                                    <div
                                        key={methodId}
                                        className={`svb-payment-option mb-3 ${isSelected ? 'selected' : ''}`}
                                        onClick={() => { setValidationErrors([]); setPaymentMethod(methodId); }}
                                    >
                                        <div className="svb-payment-header">
                                            <div className="svb-radio-group">
                                                <input type="radio" checked={isSelected} readOnly className="svb-radio" />
                                                <div>
                                                    <div className="svb-flex-align-center mb-1">
                                                        <Icon icon={method.icon || "mdi:credit-card"} className="mr-2 svb-icon-size" />
                                                        <h5 className="m-0 text-black">
                                                            {method.methodType === 'PayPal' ? method.paypalEmail :
                                                                method.methodType === 'UPI' ? method.accountNumber :
                                                                    `${method.type || 'Card'} •••• ${method.last4}`}
                                                        </h5>
                                                    </div>
                                                    <span className="smaller-body-text text-secondary svb-block">
                                                        {method.expires ? `Expires ${method.expires}` : ''} {method.isDefault ? '• Default' : ''}
                                                    </span>
                                                </div>
                                            </div>
                                            {method.methodType === 'Credit Card' && (
                                                <div className="svb-card-badges">
                                                    <span className="svb-badge button-label blue">{method.type || 'Card'}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Credit Card Option */}
                            <div
                                className={`svb-payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}
                                onClick={() => { setValidationErrors([]); setPaymentMethod('card'); }}
                            >
                                <div className="svb-payment-header">
                                    <div className="svb-radio-group">
                                        <input type="radio" checked={paymentMethod === 'card'} readOnly className="svb-radio" />
                                        <h5 className="m-0 text-black">Credit Card</h5>
                                    </div>
                                    <div className="svb-card-badges hidden-mobile">
                                        <span className="svb-badge button-label blue">VISA</span>
                                        <span className="svb-badge button-label orange">MC</span>
                                        <span className="svb-badge button-label light-blue">AMEX</span>
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
                                        <div className="svb-form-group mt-3">
                                            <label>Name on Card</label>
                                            <input type="text" placeholder={`${user?.firstName} ${user?.lastName}`} className="svb-input" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Invoice Option */}
                            <div
                                className={`svb-payment-option mt-3 ${paymentMethod === 'invoice' ? 'selected' : ''}`}
                                onClick={() => { setValidationErrors([]); setPaymentMethod('invoice'); }}
                            >
                                <div className="svb-payment-header">
                                    <div className="svb-radio-group">
                                        <input type="radio" checked={paymentMethod === 'invoice'} readOnly className="svb-radio" />
                                        <div>
                                            <div className="svb-flex-align-center mb-1">
                                                <Icon icon="mdi:domain" className="mr-2 svb-icon-size" />
                                                <h5 className="m-0 text-black">Invoice / Bank Transfer</h5>
                                            </div>
                                            <span className="smaller-body-text text-secondary svb-block">
                                                Net 30 payment terms available for qualified businesses
                                            </span>
                                        </div>
                                    </div>
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
                                            <label>Accounts Payable Email <span className="text-red">*</span></label>
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
                                <h5>{headerTitle}</h5>
                            </div>

                            <div className="mb-4">
                                <span className="smaller-body-text text-secondary block mb-1">Items ({selectedItems.length})</span>
                                <div style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '8px' }}>
                                    {selectedItems.map((item, index) => (
                                        <div className="svb-item-row mb-3" key={item.cartId || index}>
                                            <div>
                                                <h5 className="m-0" style={{ fontSize: '1rem' }}>
                                                    {item.category?.priceName || 'Booth'} #{item.booth?.label || item.booth?.code}
                                                </h5>
                                                <span className="smaller-body-text text-secondary">
                                                    {item.category?.boothSize || 'Standard'} • {item.event?.venue?.name}
                                                </span>
                                            </div>
                                            <span className="small-body-text text-secondary">
                                                ${(item.facePrice || 0).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <hr className="svb-divider my-3" />

                            <div className="svb-price-row mb-2">
                                <span className="small-body-text text-secondary">Subtotal</span>
                                <span className="small-body-text text-secondary">${subtotalGrand.toLocaleString()}</span>
                            </div>
                            {selectedGift && (
                                <div className="svb-price-row mb-2" style={{ color: 'var(--color-green-primary)' }}>
                                    <span className="small-body-text" style={{ color: 'var(--color-green-primary)' }}>Discount ({selectedGift.code})</span>
                                    <span className="small-body-text" style={{ color: 'var(--color-green-primary)' }}>-${discount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="svb-price-row mb-2">
                                <span className="small-body-text text-secondary">Processing Fees</span>
                                <span className="small-body-text text-secondary">
                                    ${processingFeeGrand.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="svb-price-row mb-4">
                                <span className="small-body-text text-secondary">Tax</span>
                                <span className="small-body-text text-secondary">
                                    ${estimatedTaxGrand.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            <hr className="svb-divider mb-3 mt-0" />

                            <div className="svb-price-row">
                                <h5 className="m-0">Total</h5>
                                <h4 className="text-red m-0">
                                    ${totalGrand.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                </h4>
                            </div>

                            <button
                                className="primary-button svb-pay-btn mb-2 w-100 p-3"
                                onClick={handlePay}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Icon icon="line-md:loading-twotone-loop" width="24" />
                                ) : (
                                    `Reserve Now - $${totalGrand.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`
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