import React, { useMemo } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { useCustomerCart } from '../context/CustomerCartContext';
import './CustomerPaySuccess.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const CustomerPaySuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { purchaseHistory } = useCustomerCart();

    /**
     * Merge context + localStorage, preferring whichever copy has discount data.
     * Also accept discount/gift passed directly via navigation state as a last resort.
     */
    const allHistory = useMemo(() => {
        const fromContext = purchaseHistory || [];

        let fromStorage = [];
        try {
            const raw = localStorage.getItem('customerPurchaseHistory');
            if (raw) {
                const parsed = JSON.parse(raw);
                fromStorage = Array.isArray(parsed) ? parsed.filter(i => i?.purchaseDate) : [];
            }
        } catch (_) {}

        const merged = new Map();
        // Seed with storage first (has fresh completePurchase data)
        fromStorage.forEach(item => merged.set(item.cartId, item));
        // Overlay context — keep storage version if it has discount data the context lost
        fromContext.forEach(item => {
            const existing = merged.get(item.cartId);
            if (!existing) {
                merged.set(item.cartId, item);
            } else {
                // Prefer whichever version has discount data
                if (!existing.appliedGift && !existing.discountAmount && (item.appliedGift || item.discountAmount)) {
                    merged.set(item.cartId, item);
                }
            }
        });

        return Array.from(merged.values());
    }, [purchaseHistory]);

    const latestPurchases = useMemo(() => {
        if (allHistory.length === 0) return [];
        const sorted = [...allHistory].sort((a, b) =>
            new Date(b.purchaseDate) - new Date(a.purchaseDate)
        );
        const latestTime = new Date(sorted[0].purchaseDate).getTime();
        return sorted.filter(item => {
            const itemTime = new Date(item.purchaseDate).getTime();
            return Math.abs(latestTime - itemTime) < 10000;
        });
    }, [allHistory]);

    /**
     * Discount resolution order:
     *   1. From latestPurchases items (set by completePurchase or fetchHistory)
     *   2. From navigation state (passed directly from CustomerCheckout as fallback)
     */
    const navState = location.state || {};

    const appliedGift = useMemo(() => {
        return latestPurchases.find(i => i.appliedGift)?.appliedGift
            || navState.selectedGift
            || null;
    }, [latestPurchases, navState.selectedGift]);

    const discountAmount = useMemo(() => {
        const fromItems = latestPurchases.reduce((sum, i) => sum + (i.discountAmount || 0), 0);
        if (fromItems > 0) return fromItems;
        return navState.discount || 0;
    }, [latestPurchases, navState.discount]);

    const discountLabel = useMemo(() => {
        if (!appliedGift) return discountAmount > 0 ? 'Gift Card Discount' : '';
        if (appliedGift.valueType === 'fixed') return `Gift Card Discount (${appliedGift.code}) — $${appliedGift.value.toFixed(2)} off`;
        if (appliedGift.valueType === 'percent') return `Gift Card Discount (${appliedGift.code}) — ${appliedGift.value}% off`;
        if (appliedGift.valueType === 'bxgy') return `Gift Card Discount (${appliedGift.code}) — Buy 1 Get 1`;
        return `Gift Card Discount (${appliedGift.code})`;
    }, [appliedGift, discountAmount]);

    if (latestPurchases.length === 0) {
        return (
            <div className="cps-page-wrapper">
                <div className="cps-main-container">
                    <div className="cps-success-header">
                        <Icon icon="mdi:alert-circle-outline" width="60" color="var(--color-red-primary)" />
                        <h2 className="cps-title">No recent orders found</h2>
                        <button className="primary-button mt-l" onClick={() => navigate('/customer/browse-events')}>
                            Browse Events
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const firstItem = latestPurchases[0];
    const event = firstItem.event;

    // Subtotal = sum of ALL original face prices (never discount-adjusted)
    const subtotal = latestPurchases.reduce((sum, item) => sum + item.facePrice, 0);
    const totalServiceFee = latestPurchases.reduce((sum, item) => sum + (item.serviceFee || 0), 0);
    const totalAmount = Math.max(0, subtotal - discountAmount + totalServiceFee);

    // For BXGY: identify the cheapest item to mark as "Free"
    const bxgyFreeItemId = (() => {
        if (appliedGift?.valueType !== 'bxgy' || latestPurchases.length < 2) return null;
        const sorted = [...latestPurchases]
            .filter(i => !i.seat?.id?.startsWith("GA-"))
            .sort((a, b) => a.facePrice - b.facePrice);
        return sorted[0]?.cartId || null;
    })();

    return (
        <div className="cps-page-wrapper">
            <div className="cps-main-container">
                <div className="cps-success-header">
                    <div className="cps-check-circle">
                        <Icon icon="mdi:check" className="cps-check-icon" />
                    </div>
                    <h2 className="cps-title">Order Confirmed!</h2>
                    <p className="regular-body-text cps-subtitle">Thank you for your purchase. Your tickets are now available.</p>
                    <p className="small-body-text cps-order-id">
                        Transaction ID: <span className="cps-order-number">{firstItem.cartId.toUpperCase()}</span>
                    </p>
                </div>

                <div className="cps-card-container">
                    <div className="cps-card">
                        <div className="cps-event-header">
                            <img
                                src={event.image ? `/uploads/${event.image}` : "/assets/eventbg.jpg"}
                                alt={event.title}
                                className="cps-event-img"
                                onError={(e) => { e.target.src = "/assets/eventbg.jpg"; }}
                            />
                            <div className="cps-event-info">
                                <h4 className="cps-event-title">{event.title}</h4>
                                <div className="cps-event-detail">
                                    <Icon icon="mdi:calendar-blank" className="cps-detail-icon" />
                                    <span className="smaller-body-text">{new Date(event.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                                <div className="cps-event-detail">
                                    <Icon icon="mdi:map-marker" className="cps-detail-icon" />
                                    <span className="smaller-body-text">{event.venue?.name}</span>
                                </div>
                            </div>
                        </div>

                        <hr className="cps-divider" />

                        <div className="cps-tickets-section">
                            <h5 className="cps-section-title">Your Tickets</h5>

                            {(() => {
                                const physicalSeats = latestPurchases.filter(i => !i.seat?.id?.startsWith("GA-"));
                                const gaItems = latestPurchases.filter(i => i.seat?.id?.startsWith("GA-"));

                                const gaGroups = {};
                                gaItems.forEach(item => {
                                    const catKey = item.categoryId || item.categoryName;
                                    if (!gaGroups[catKey]) gaGroups[catKey] = [];
                                    gaGroups[catKey].push(item);
                                });

                                const elements = [];

                                physicalSeats.forEach((item, index) => {
                                    const catName = item.categoryName === 'Seated Ticket' ? 'Seat Ticket' : item.categoryName;
                                    const isFree = item.isBXGYFree === true || bxgyFreeItemId === item.cartId;
                                    elements.push(
                                        <div className="cps-ticket-item" key={`phys-${index}`}>
                                            <div className="cps-ticket-left">
                                                <p className="small-body-text cps-ticket-type">{catName}</p>
                                                <p className="smaller-body-text cps-ticket-seat mb-1">Seat {item.seat.label}</p>
                                                {isFree
                                                    ? <p className="small-body-text" style={{ color: 'var(--color-green-primary)', fontWeight: 600 }}>Free</p>
                                                    : <p className="small-body-text cps-ticket-price">${item.facePrice.toFixed(2)}</p>
                                                }
                                            </div>
                                            <div className="cps-ticket-right cps-qr-container">
                                                <div className="cps-qr-wrapper" style={{ background: '#fff', padding: '5px', borderRadius: '4px' }}>
                                                    <QRCodeCanvas
                                                        value={item.qrData || item.cartId}
                                                        size={60}
                                                        bgColor={"#ffffff"}
                                                        fgColor={"#000000"}
                                                        level={"M"}
                                                    />
                                                </div>
                                                <p className="smaller-body-text mt-1 text-secondary">Seat - {item.cartId.toUpperCase().slice(0, 8)}</p>
                                            </div>
                                        </div>
                                    );
                                });

                                Object.entries(gaGroups).forEach(([catKey, group]) => {
                                    const first = group[0];
                                    const totalFace = group.reduce((sum, i) => sum + i.facePrice, 0);
                                    const catName = first.categoryName === 'Seated Ticket' ? 'Ticket' : first.categoryName;
                                    elements.push(
                                        <div className="cps-ticket-item" key={`ga-${catKey}`}>
                                            <div className="cps-ticket-left">
                                                <p className="small-body-text cps-ticket-type">{catName} x {group.length}</p>
                                                <p className="smaller-body-text cps-ticket-seat mb-1">General Entry</p>
                                                <p className="small-body-text cps-ticket-price">${totalFace.toFixed(2)}</p>
                                            </div>
                                            <div className="cps-ticket-right cps-qr-container">
                                                <div className="cps-qr-wrapper" style={{ background: '#fff', padding: '5px', borderRadius: '4px' }}>
                                                    <QRCodeCanvas
                                                        value={first.qrData || first.cartId}
                                                        size={60}
                                                        bgColor={"#ffffff"}
                                                        fgColor={"#000000"}
                                                        level={"M"}
                                                    />
                                                </div>
                                                <p className="smaller-body-text mt-1 text-secondary">Qty: {group.length}</p>
                                            </div>
                                        </div>
                                    );
                                });

                                return elements;
                            })()}
                        </div>

                        <hr className="cps-divider" />

                        {/* ── Order Summary ── */}
                        <div className="cps-summary-section" style={{ padding: '0 4px' }}>

                            {/* Subtotal — always original face prices before any discount */}
                            <div className="cps-summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span className="small-body-text text-secondary">Subtotal (before discount)</span>
                                <span className="small-body-text text-secondary">${subtotal.toFixed(2)}</span>
                            </div>

                            {/* Discount — only shown when a gift/promo was applied */}
                            {discountAmount > 0 && (
                                <div className="cps-summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span className="small-body-text" style={{ color: 'var(--color-green-primary)' }}>
                                        {discountLabel || 'Gift Card Discount'}
                                    </span>
                                    <span className="small-body-text" style={{ color: 'var(--color-green-primary)' }}>
                                        -${discountAmount.toFixed(2)}
                                    </span>
                                </div>
                            )}

                            {/* Service Fee */}
                            <div className="cps-summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span className="small-body-text text-secondary">Service Fee</span>
                                <span className="small-body-text text-secondary">${totalServiceFee.toFixed(2)}</span>
                            </div>
                        </div>

                        <hr className="cps-divider-thick" />

                        <div className="cps-total-section">
                            <h4 className="cps-total-label">Total Paid</h4>
                            <h4 className="cps-total-amount">${totalAmount.toFixed(2)}</h4>
                        </div>
                    </div>

                    <div className="cps-card">
                        <h4 className="cps-section-title">What happens next?</h4>

                        <div className="cps-step-item">
                            <div className="cps-step-icon-wrapper light-red-bg">
                                <Icon icon="mdi:ticket-confirmation-outline" className="cps-step-icon" />
                            </div>
                            <div className="cps-step-text">
                                <h6 className="cps-step-title">Tickets are ready</h6>
                                <p className="smaller-body-text text-secondary m-0">Your digital tickets are available in your account instantly.</p>
                            </div>
                        </div>

                        <div className="cps-step-item">
                            <div className="cps-step-icon-wrapper light-red-bg">
                                <Icon icon="mdi:email-outline" className="cps-step-icon" />
                            </div>
                            <div className="cps-step-text">
                                <h6 className="cps-step-title">Confirmation email sent</h6>
                                <p className="smaller-body-text text-secondary m-0">Check your inbox for order details and calendar invite.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="cps-action-buttons">
                    <button className="primary-button cps-btn-primary" onClick={() => navigate('/customer/my-ticketsorder')}>
                        <Icon icon="mdi:ticket-confirmation-outline" width="18" className="mr-2" />
                        View My Tickets
                    </button>
                    <button className="outlined-button cps-btn-outline" onClick={() => navigate('/customer/browse-events')}>
                        Browse More Events
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerPaySuccess;