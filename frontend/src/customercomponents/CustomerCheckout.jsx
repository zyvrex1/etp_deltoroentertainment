import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { useNavigate, useLocation } from 'react-router-dom';
import { useCustomerCart } from '../context/CustomerCartContext';
import { useAuthContext } from '../hooks/useAuthContext';
import eventsService from '../services/eventsService';
import * as authService from '../services/authService';
import digitalgiftsService from '../services/digitalgiftsService';
import { showConfirmAlert, showSuccessAlert, showErrorAlert } from '../utils/sweetAlert';
import './CustomerCheckout.css';

const CustomerCheckout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { cartItems, completePurchase } = useCustomerCart();
    const { user } = useAuthContext();
    const [paymentMethod, setPaymentMethod] = useState('invoice');
    const [savedMethods, setSavedMethods] = useState([]);
    const [poNumber, setPoNumber] = useState(`PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    const [apEmail, setApEmail] = useState(user?.email || "");

    const [phoneNumber, setPhoneNumber] = useState(() => {
        let phone = user?.phone || "";
        if (phone && !phone.startsWith('+')) {
            if (phone.startsWith('0')) {
                phone = `+63${phone.substring(1)}`;
            } else {
                phone = `+${phone}`;
            }
        }
        return phone;
    });

    useEffect(() => {
        const fetchPhone = async () => {
            if (!user?.token) return;
            try {
                const response = await authService.getProfile(user.token);
                const p = response.data;
                let phone = p.phone || "";
                if (phone && !phone.startsWith('+')) {
                    if (phone.startsWith('0')) {
                        phone = `+63${phone.substring(1)}`;
                    } else {
                        phone = `+${phone}`;
                    }
                }
                if (phone) setPhoneNumber(phone);
                setSavedMethods(p.paymentMethods || []);
                if (p.paymentMethods && p.paymentMethods.length > 0) {
                    const defaultMethod = p.paymentMethods.find(m => m.isDefault) || p.paymentMethods[0];
                    setPaymentMethod(defaultMethod._id || defaultMethod.id);
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            }
        };
        fetchPhone();
    }, [user]);

    const selectedIds = location.state?.selectedItems || [];

    const checkoutItems = useMemo(() => {
        return cartItems.filter(item => selectedIds.includes(item.cartId));
    }, [cartItems, selectedIds]);

    const subtotal = useMemo(() => {
        return checkoutItems.reduce((sum, item) => sum + item.facePrice, 0);
    }, [checkoutItems]);

    const serviceFees = useMemo(() => {
        return subtotal >= 1 ? 0.50 : 0;
    }, [subtotal]);

    const [availableGifts, setAvailableGifts] = useState([]);
    const [selectedGift, setSelectedGift] = useState(null);

    useEffect(() => {
        const fetchGifts = async () => {
            if (!user?.token) return;
            try {
                const gifts = await digitalgiftsService.getMyGifts(user.token);
                // Only show gifts that haven't been redeemed yet
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
            return Math.min(selectedGift.value, subtotal);
        } else if (selectedGift.valueType === 'percent') {
            return (subtotal * selectedGift.value) / 100;
        } else if (selectedGift.valueType === 'bxgy') {
            if (checkoutItems.length < 2) return 0;
            const prices = checkoutItems.map(i => i.facePrice).sort((a, b) => a - b);
            return prices[0];
        }
        return 0;
    }, [selectedGift, subtotal, checkoutItems]);

    const discountLabel = useMemo(() => {
        if (!selectedGift) return '';
        if (selectedGift.valueType === 'fixed') return `Gift Card Discount — $${selectedGift.value.toFixed(2)} off`;
        if (selectedGift.valueType === 'percent') return `Gift Card Discount — ${selectedGift.value}% off`;
        if (selectedGift.valueType === 'bxgy') return `Gift Card Discount — Buy 1 Get 1`;
        return `Discount (${selectedGift.code})`;
    }, [selectedGift]);

    const total = useMemo(() => {
        return Math.max(0, subtotal - discount + serviceFees);
    }, [subtotal, discount, serviceFees]);

    const resolvePaymentMethodLabel = () => {
        if (paymentMethod === 'invoice') return 'Invoice / Bank Transfer';
        if (paymentMethod === 'card') return 'Credit Card';
        const m = savedMethods.find(x => (x._id || x.id) === paymentMethod);
        if (!m) return 'Credit Card';
        if (m.methodType === 'PayPal') return `PayPal (${m.paypalEmail})`;
        if (m.methodType === 'UPI') return `UPI (${m.accountNumber})`;
        return `${m.type || 'Card'} •••• ${m.last4}`;
    };

    const handlePay = async () => {
        const result = await showConfirmAlert(
            "Confirm Payment",
            `Are you sure you want to proceed with the payment of $${total.toFixed(2)}?`,
            "Yes, Pay Now"
        );

        if (result.isConfirmed) {
            try {
                const itemsByEvent = checkoutItems.reduce((acc, item) => {
                    const eventId = item.event._id || item.event.id;
                    if (!acc[eventId]) acc[eventId] = [];
                    acc[eventId].push(item);
                    return acc;
                }, {});

                let remainingFee = serviceFees;

                for (const eventId in itemsByEvent) {
                    const eventItems = itemsByEvent[eventId];
                    const seatIds = eventItems.map(item => item.seat.id);
                    const eventSubtotal = eventItems.reduce((sum, item) => sum + item.facePrice, 0);
                    const eventFees = eventItems.reduce((sum, item) => sum + item.serviceFee, 0) + remainingFee;
                    remainingFee = 0;
                    const eventTotal = eventSubtotal + eventFees;

                    try {
                        await eventsService.buySeats(
                            eventId,
                            seatIds,
                            { total: eventTotal, subtotal: eventSubtotal, fee: eventFees },
                            { email: apEmail, poNumber: poNumber },
                            resolvePaymentMethodLabel(),
                            user.token
                        );
                    } catch (seatError) {
                        const status = seatError?.response?.status;
                        if (status === 500) {
                            console.warn(`Event ${eventId}: server returned 500 but reservation likely saved. Continuing.`);
                        } else {
                            throw seatError;
                        }
                    }
                }

                // Mark the gift as redeemed on the backend so it disappears from future checkouts
                if (selectedGift?.giftId && selectedGift?.assignmentId) {
                    try {
                        await digitalgiftsService.redeemAssignment(
                            selectedGift.giftId,
                            selectedGift.assignmentId,
                            user.token
                        );
                    } catch (giftError) {
                        // Non-fatal — don't block the purchase if redemption call fails
                        console.warn("Failed to mark gift as redeemed:", giftError);
                    }
                }

                completePurchase(
                    selectedIds,
                    resolvePaymentMethodLabel(),
                    paymentMethod === 'invoice' ? poNumber : '',
                    serviceFees,
                    selectedGift,
                    discount
                );
                showSuccessAlert('Payment Successful', 'Your tickets have been confirmed.');
                navigate('/customer/success', { state: { selectedGift, discount } });
            } catch (error) {
                console.error("Payment Error:", error);
                const status = error?.response?.status;
                if (status === 409) {
                    showErrorAlert('Seats Unavailable', 'One or more selected seats were just taken. Please go back and choose different seats.');
                } else if (status === 403) {
                    showErrorAlert('Access Denied', 'You are not authorized to complete this purchase.');
                } else if (status === 400) {
                    showErrorAlert('Invalid Request', error.response?.data?.error || 'Please check your details and try again.');
                } else {
                    showErrorAlert('Payment Failed', error.message || 'There was an error processing your payment.');
                }
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

    const bxgyFreeItemId = useMemo(() => {
        if (selectedGift?.valueType !== 'bxgy' || checkoutItems.length < 2) return null;
        const sorted = [...checkoutItems].sort((a, b) => a.facePrice - b.facePrice);
        return sorted[0].cartId;
    }, [selectedGift, checkoutItems]);

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
                                <PhoneInput
                                    defaultCountry="ph"
                                    value={phoneNumber}
                                    onChange={(phone) => setPhoneNumber(phone)}
                                    inputClassName="cc-input"
                                    className="phone-input-container"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0',
                                        border: '1px solid var(--color-black-secondary)',
                                        borderRadius: '6px',
                                        marginTop: '4px'
                                    }}
                                    inputStyle={{
                                        border: 'none',
                                        padding: '10px 12px',
                                        outline: 'none',
                                        borderRadius: '0',
                                        flex: 1,
                                        color: 'var(--color-black-secondary)'
                                    }}
                                    buttonStyle={{
                                        border: 'none',
                                        backgroundColor: 'transparent',
                                        boxShadow: 'none',
                                        color: 'var(--color-black-secondary)'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="cc-card mb-4">
                        <div className="cc-card-body">
                            <h4 className="mb-4 text-black">Gift Cards & Promos</h4>
                            {availableGifts.length === 0 ? (
                                <p className="small-body-text text-secondary">No available gift cards or promos found.</p>
                            ) : (
                                <div className="cc-form-group">
                                    <label htmlFor="gift-select">Select a promo or gift card to apply:</label>
                                    <select
                                        id="gift-select"
                                        className="cc-input"
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
                                                {g.code} - {g.name} ({g.valueType === 'fixed' ? `$${g.value.toFixed(2)}` : g.valueType === 'bxgy' ? 'Buy 1 Get 1' : `${g.value}%`} off)
                                            </option>
                                        ))}
                                    </select>
                                    {selectedGift && (
                                        <div className="mt-2 text-success small-body-text" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-green-primary)' }}>
                                            <Icon icon="mdi:check-circle" /> {discountLabel} applied — saving ${discount.toFixed(2)}.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="cc-card mb-4">
                        <div className="cc-card-body">
                            <h4 className="mb-4 text-black">Payment Details</h4>

                            {savedMethods.map((method) => {
                                const methodId = method._id || method.id;
                                const isSelected = paymentMethod === methodId;
                                return (
                                    <div
                                        key={methodId}
                                        className={`cc-payment-option mb-3 ${isSelected ? 'selected' : ''}`}
                                        onClick={() => setPaymentMethod(methodId)}
                                    >
                                        <div className="cc-payment-header">
                                            <div className="cc-radio-group">
                                                <input type="radio" checked={isSelected} readOnly className="cc-radio" />
                                                <div>
                                                    <div className="cc-flex-align-center mb-1">
                                                        <Icon icon={method.icon || "mdi:credit-card"} className="mr-2 icon-font-size" />
                                                        <h5 className="m-0 text-black">
                                                            {method.methodType === 'PayPal' ? method.paypalEmail :
                                                                method.methodType === 'UPI' ? method.accountNumber :
                                                                    `${method.type || 'Card'} •••• ${method.last4}`}
                                                        </h5>
                                                    </div>
                                                    <span className="smaller-body-text text-secondary cc-block">
                                                        {method.expires ? `Expires ${method.expires}` : ''} {method.isDefault ? '• Default' : ''}
                                                    </span>
                                                </div>
                                            </div>
                                            {method.methodType === 'Credit Card' && (
                                                <div className="cc-card-badges">
                                                    <span className="cc-badge button-label blue">{method.type || 'Card'}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            <div
                                className={`cc-payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}
                                onClick={() => setPaymentMethod('card')}
                            >
                                <div className="cc-payment-header">
                                    <div className="cc-radio-group">
                                        <input type="radio" checked={paymentMethod === 'card'} readOnly className="cc-radio" />
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

                            <div
                                className={`cc-payment-option mt-3 ${paymentMethod === 'invoice' ? 'selected' : ''}`}
                                onClick={() => setPaymentMethod('invoice')}
                            >
                                <div className="cc-payment-header">
                                    <div className="cc-radio-group">
                                        <input type="radio" checked={paymentMethod === 'invoice'} readOnly className="cc-radio" />
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
                                            <input type="text" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} className="cc-input" />
                                        </div>
                                        <div className="cc-form-group">
                                            <label>Accounts Payable Email</label>
                                            <input type="email" value={apEmail} onChange={(e) => setApEmail(e.target.value)} className="cc-input" />
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

                                const physicalSeats = eventItems.filter(i => !i.seat?.id?.startsWith("GA-"));
                                const gaItems = eventItems.filter(i => i.seat?.id?.startsWith("GA-"));

                                const gaGroups = {};
                                gaItems.forEach(item => {
                                    const catKey = item.categoryId || item.categoryName;
                                    if (!gaGroups[catKey]) gaGroups[catKey] = [];
                                    gaGroups[catKey].push(item);
                                });

                                return (
                                    <div key={eventId} className="mb-4">
                                        <h5 className="mb-2 text-black">{event.title}</h5>
                                        {physicalSeats.map((item, idx) => {
                                            const catName = item.categoryName === 'Seated Ticket' ? 'Seat Ticket' : item.categoryName;
                                            const isFree = bxgyFreeItemId === item.cartId;
                                            return (
                                                <div key={`phys-${idx}`} className="cc-summary-row mb-1">
                                                    <span className="small-body-text text-secondary">{catName} - Seat {item.seat.label}</span>
                                                    {isFree
                                                        ? <h6 style={{ color: 'var(--color-green-primary)', margin: 0 }}>Free</h6>
                                                        : <h6 className="text-secondary m-0">${item.facePrice.toFixed(2)}</h6>
                                                    }
                                                </div>
                                            );
                                        })}
                                        {Object.entries(gaGroups).map(([catKey, group]) => {
                                            const first = group[0];
                                            const totalFace = group.reduce((sum, i) => sum + i.facePrice, 0);
                                            const catName = first.categoryName === 'Seated Ticket' ? 'Ticket' : first.categoryName;
                                            return (
                                                <div key={`ga-${catKey}`} className="cc-summary-row mb-1">
                                                    <span className="small-body-text text-secondary">{catName} x {group.length}</span>
                                                    <h6 className="text-secondary m-0">${totalFace.toFixed(2)}</h6>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}

                            <hr className="cc-divider mb-3" />

                            <div className="cc-summary-row mb-2">
                                <span className="small-body-text text-secondary">Subtotal (before discount)</span>
                                <h5 className="text-secondary">${subtotal.toFixed(2)}</h5>
                            </div>
                            {selectedGift && (
                                <div className="cc-summary-row mb-2" style={{ color: 'var(--color-green-primary)' }}>
                                    <span className="small-body-text" style={{ color: 'var(--color-green-primary)' }}>{discountLabel}</span>
                                    <h5 style={{ color: 'var(--color-green-primary)' }}>-${discount.toFixed(2)}</h5>
                                </div>
                            )}
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