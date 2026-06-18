import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { useNavigate, useLocation } from 'react-router-dom';
import { useCustomerStoreCart } from '../context/CustomerStoreCartContext';
import { useAuthContext } from '../hooks/useAuthContext';
import orderService from '../services/orderService';
import * as authService from '../services/authService';
import digitalgiftsService from '../services/digitalgiftsService';
import { showConfirmAlert, showSuccessAlert, showErrorAlert } from '../utils/sweetAlert';
import reservationService from '../services/reservationService';
import './CustomerCheckout.css'; // Reusing the same CSS

const CustomerStoreCheckout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { cartItems, getTotalAmount, clearCart } = useCustomerStoreCart();
    const { user } = useAuthContext();
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [poNumber, setPoNumber] = useState(`PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    const [apEmail, setApEmail] = useState(user?.email || "");

    // Store/booth information passed from state
    const { storeName, boothName } = location.state || { storeName: "Store", boothName: "Booth" };
    const [sponsorPaymentMethods, setSponsorPaymentMethods] = useState([]);

    // Pull and format phone number
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
                let phone = response.data.phone || "";
                if (phone && !phone.startsWith('+')) {
                    if (phone.startsWith('0')) {
                        phone = `+63${phone.substring(1)}`;
                    } else {
                        phone = `+${phone}`;
                    }
                }
                if (phone) setPhoneNumber(phone);
            } catch (error) {
                console.error("Error fetching phone:", error);
            }
        };
        fetchPhone();
    }, [user]);

    useEffect(() => {
        const fetchSponsorSettings = async () => {
            const eventId = cartItems[0]?.eventId?._id || cartItems[0]?.eventId;
            if (!eventId || !user?.token || !boothName) return;
            try {
                const booths = await reservationService.getEventBooths(eventId, user.token);
                // getEventBooths might return { data: booths } or just booths
                const boothList = Array.isArray(booths) ? booths : booths.data || [];
                const booth = boothList.find(b => b.boothNumber === boothName || b.boothCode === boothName || b._id === boothName);
                if (booth) {
                    let methods = [];
                    // Get from Store Settings
                    if (booth.storeSettings && booth.storeSettings.paymentMethods) {
                        methods = [...methods, ...booth.storeSettings.paymentMethods];
                    }
                    // Get from User Profile
                    if (booth.user && booth.user.paymentMethods) {
                        const userMethods = booth.user.paymentMethods.map(pm => ({
                            provider: pm.methodType === 'PayPal' ? 'PayPal' : pm.methodType === 'UPI' ? 'UPI' : (pm.type || 'Card'),
                            accountName: pm.cardHolder || pm.accountHolder || booth.user.firstName + ' ' + booth.user.lastName,
                            accountNumber: pm.cardNumber || pm.accountNumber || pm.paypalEmail || pm.last4 || ''
                        }));
                        methods = [...methods, ...userMethods];
                    }
                    setSponsorPaymentMethods(methods);
                }
            } catch (error) {
                console.error("Error fetching sponsor payment methods:", error);
            }
        };
        fetchSponsorSettings();
    }, [cartItems, user, boothName]);

    const subtotal = getTotalAmount();

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
            return Math.min(selectedGift.value, subtotal);
        } else if (selectedGift.valueType === 'percent') {
            return (subtotal * selectedGift.value) / 100;
        }
        return 0;
    }, [selectedGift, subtotal]);

    const total = useMemo(() => {
        return Math.max(0, subtotal - discount);
    }, [subtotal, discount]);

    const handlePay = async () => {
        const result = await showConfirmAlert(
            "Confirm Payment",
            `Are you sure you want to proceed with the payment of $${total.toFixed(2)}?`,
            "Yes, Pay Now"
        );

        if (result.isConfirmed) {
            try {
                const orderData = {
                    items: cartItems.map(item => ({
                        productId: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        image: item.image
                    })),
                    sponsorId: cartItems[0]?.sponsorId?._id || cartItems[0]?.sponsorId,
                    eventId: cartItems[0]?.eventId?._id || cartItems[0]?.eventId,
                    boothCode: cartItems[0]?.boothName || boothName,
                    storeName: storeName,
                    totalAmount: total,
                    paymentMethod: paymentMethod === 'card' ? 'Credit Card' : paymentMethod === 'saved' ? 'Saved Card' : paymentMethod === 'invoice' ? 'Invoice / Bank Transfer' : 'Direct to Sponsor',
                    appliedGift: selectedGift ? selectedGift.giftId : null,
                    giftCode: selectedGift ? selectedGift.code : ""
                };

                await orderService.createOrder(orderData);

                // Redeem the gift card assignment upon successful purchase
                if (selectedGift) {
                    try {
                        await digitalgiftsService.redeemAssignment(
                            selectedGift.giftId,
                            selectedGift.assignmentId,
                            user.token
                        );
                    } catch (redeemError) {
                        console.error("Failed to redeem assignment post-store-checkout:", redeemError);
                    }
                }

                showSuccessAlert('Payment Successful', 'Your order has been sent to the booth sponsor.');
                clearCart();
                navigate('/customer/my-orders');
            } catch (error) {
                console.error("Payment Error:", error);
                showErrorAlert('Payment Failed', error.message || 'There was an error processing your payment.');
            }
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="cc-page-wrapper">
                <div className="cc-main-container" style={{ textAlign: 'center', padding: '100px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Icon icon="mdi:cart-outline" width="60" color="var(--color-black-tertiary)" />
                    <h3 style={{ marginTop: '16px' }}>Your cart is empty</h3>
                    <button className="primary-button mt-4" onClick={() => navigate(-1)}>
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="cc-page-wrapper">
            <div className="cc-header-nav">
                <span className="cc-breadcrumb" onClick={() => navigate(-1)}>Store Products</span> &gt;{' '}
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
                            Placing order for {cartItems.length} item(s) from {storeName}
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
                                                {g.code} - {g.name} ({g.valueType === 'fixed' ? `$${g.value.toFixed(2)}` : `${g.value}%`} off)
                                            </option>
                                        ))}
                                    </select>
                                    {selectedGift && (
                                        <div className="mt-2 text-success small-body-text" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-green-primary)' }}>
                                            <Icon icon="mdi:check-circle" /> Applied discount of {selectedGift.valueType === 'fixed' ? `$${discount.toFixed(2)}` : `${selectedGift.value}%`}.
                                        </div>
                                    )}
                                </div>
                            )}
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

                            {/* Direct to Sponsor Option */}
                            {sponsorPaymentMethods.length > 0 && (
                                <div
                                    className={`cc-payment-option mb-3 ${paymentMethod === 'direct' ? 'selected' : ''}`}
                                    onClick={() => setPaymentMethod('direct')}
                                >
                                    <div className="cc-payment-header">
                                        <div className="cc-radio-group">
                                            <input
                                                type="radio"
                                                checked={paymentMethod === 'direct'}
                                                readOnly
                                                className="cc-radio"
                                            />
                                            <div>
                                                <div className="cc-flex-align-center mb-1">
                                                    <Icon icon="mdi:bank-transfer" className="mr-2 icon-font-size" />
                                                    <h5 className="m-0 text-black">Direct Payment to Sponsor</h5>
                                                </div>
                                                <span className="smaller-body-text text-secondary cc-block">Pay using sponsor's payment methods</span>
                                            </div>
                                        </div>
                                    </div>
                                    {paymentMethod === 'direct' && (
                                        <div className="cc-payment-body mt-3">
                                            <div className="cc-info-alert mb-3">
                                                <Icon icon="mdi:information-outline" className="cc-info-icon" />
                                                <span className="smaller-body-text">
                                                    <strong>Instructions:</strong> Please send the payment of ${total.toFixed(2)} to one of the following accounts. The sponsor will confirm your payment.
                                                </span>
                                            </div>
                                            {sponsorPaymentMethods.map((pm, idx) => (
                                                <div key={idx} className="mb-3 p-3" style={{ border: '1px solid var(--color-black-tertiary)', borderRadius: '8px', background: '#f8f9fa' }}>
                                                    <h6 className="mb-2 text-black">{pm.provider}</h6>
                                                    <div className="smaller-body-text"><strong>Account Name:</strong> {pm.accountName}</div>
                                                    <div className="smaller-body-text"><strong>Account Number:</strong> {pm.accountNumber}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

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
                                            <input
                                                type="text"
                                                value={poNumber}
                                                onChange={(e) => setPoNumber(e.target.value)}
                                                className="cc-input"
                                            />
                                        </div>

                                        <div className="cc-form-group">
                                            <label>Accounts Payable Email</label>
                                            <input
                                                type="email"
                                                value={apEmail}
                                                onChange={(e) => setApEmail(e.target.value)}
                                                className="cc-input"
                                            />
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

                            <div className="mb-4">
                                <h5 className="mb-2 text-black">{storeName}</h5>
                                {cartItems.map((item, idx) => (
                                    <div key={idx} className="cc-summary-row mb-1">
                                        <span className="small-body-text text-secondary">{item.name} (x{item.quantity})</span>
                                        <h6 className="text-secondary m-0">${(item.price * item.quantity).toFixed(2)}</h6>
                                    </div>
                                ))}
                            </div>

                            <div className="cc-summary-row mb-2">
                                <span className="small-body-text text-secondary">Subtotal</span>
                                <h5 className="text-secondary">${subtotal.toFixed(2)}</h5>
                            </div>
                            {selectedGift && (
                                <div className="cc-summary-row mb-2" style={{ color: 'var(--color-green-primary)' }}>
                                    <span className="small-body-text" style={{ color: 'var(--color-green-primary)' }}>Discount ({selectedGift.code})</span>
                                    <h5 style={{ color: 'var(--color-green-primary)' }}>-${discount.toFixed(2)}</h5>
                                </div>
                            )}

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

export default CustomerStoreCheckout;
