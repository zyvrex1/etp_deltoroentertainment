import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { showConfirmAlert, showSuccessAlert } from '../../utils/sweetAlert';
import { useAuthContext } from '../../hooks/useAuthContext';
import * as authService from '../../services/authService';
import './SponsorAddPaymentMethod.css';

const SponsorAddPaymentMethod = ({ isOpen, onClose, onMethodAdded }) => {
    const { user } = useAuthContext();
    const [selectedMethod, setSelectedMethod] = useState('credit_card');
    
    // Form States
    const [cardHolder, setCardHolder] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expires, setExpires] = useState('');
    const [cvv, setCvv] = useState('');
    const [upiId, setUpiId] = useState('');
    const [paypalEmail, setPaypalEmail] = useState('');
    const [isDefault, setIsDefault] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddMethod = async () => {
        let methodName = selectedMethod === 'credit_card' ? 'Card' : selectedMethod === 'upi' ? 'UPI' : 'PayPal';
        
        // Basic validation
        if (selectedMethod === 'credit_card' && (!cardHolder || !cardNumber || !expires || !cvv)) {
            return showErrorAlert("Required Fields", "Please fill all credit card fields");
        }
        if (selectedMethod === 'upi' && !upiId) {
            return showErrorAlert("Required Fields", "Please enter UPI ID");
        }
        if (selectedMethod === 'paypal' && !paypalEmail) {
            return showErrorAlert("Required Fields", "Please enter PayPal Email");
        }

        const result = await showConfirmAlert(
            `Add ${methodName}?`,
            `Are you sure you want to add this ${methodName} payment method?`,
            "Yes, Add It"
        );
        if (result.isConfirmed) {
            setIsSubmitting(true);
            try {
                const payload = {
                    methodType: methodName,
                    isDefault,
                    icon: selectedMethod === 'credit_card' ? 'logos:visa' : selectedMethod === 'upi' ? 'arcticons:bhim-upi' : 'logos:paypal'
                };

                if (selectedMethod === 'credit_card') {
                    payload.type = 'Visa'; // Simplified for now, could be derived from number
                    payload.last4 = cardNumber.slice(-4);
                    payload.expires = expires;
                    payload.cardHolder = cardHolder;
                    payload.cardNumber = cardNumber.replace(/\s/g, '');
                } else if (selectedMethod === 'upi') {
                    payload.accountNumber = upiId;
                } else if (selectedMethod === 'paypal') {
                    payload.paypalEmail = paypalEmail;
                }

                await authService.addPaymentMethod(payload, user.token);
                await showSuccessAlert("Success", `${methodName} has been added successfully.`);
                if (onMethodAdded) onMethodAdded();
                
                // Reset form
                setCardHolder(''); setCardNumber(''); setExpires(''); setCvv(''); setUpiId(''); setPaypalEmail(''); setIsDefault(false);
                onClose();
            } catch (err) {
                showErrorAlert("Error", err.response?.data?.error || "Failed to add payment method");
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="sapm-modal-overlay">
            <div className="sapm-modal-container">
                <div className="sapm-header d-flex justify-content-between align-items-center mb-4">
                    <h4 className="sapm-title text-black m-0">Add New Payment Method</h4>
                    <button className="sapm-close-btn bg-transparent border-0 text-secondary" onClick={onClose} style={{ cursor: 'pointer' }}>
                        <Icon icon="mdi:close" width="24" />
                    </button>
                </div>

                <div className="sapm-methods-list">
                    <label className={`sapm-method-option ${selectedMethod === 'credit_card' ? 'selected' : ''}`}>
                        <div className="sapm-method-left">
                            <Icon icon="logos:visa" width="32" />
                            <span className="regular-body-text text-black font-medium">Credit Card</span>
                        </div>
                        <input
                            type="radio"
                            name="payment_method"
                            value="credit_card"
                            className="sapm-custom-radio"
                            checked={selectedMethod === 'credit_card'}
                            onChange={() => setSelectedMethod('credit_card')}
                        />
                    </label>

                    <label className={`sapm-method-option ${selectedMethod === 'upi' ? 'selected' : ''}`}>
                        <div className="sapm-method-left">
                            <Icon icon="arcticons:bhim-upi" width="32" />
                            <span className="regular-body-text text-black font-medium">UPI</span>
                        </div>
                        <input
                            type="radio"
                            name="payment_method"
                            value="upi"
                            className="sapm-custom-radio"
                            checked={selectedMethod === 'upi'}
                            onChange={() => setSelectedMethod('upi')}
                        />
                    </label>

                    <label className={`sapm-method-option ${selectedMethod === 'paypal' ? 'selected' : ''}`}>
                        <div className="sapm-method-left">
                            <Icon icon="logos:paypal" width="32" />
                            <span className="regular-body-text text-black font-medium">PayPal</span>
                        </div>
                        <input
                            type="radio"
                            name="payment_method"
                            value="paypal"
                            className="sapm-custom-radio"
                            checked={selectedMethod === 'paypal'}
                            onChange={() => setSelectedMethod('paypal')}
                        />
                    </label>
                </div>

                <div className="sapm-form-content">
                    {selectedMethod === 'credit_card' && (
                        <>
                            <div className="sapm-input-group">
                                <label className="regular-body-text font-medium text-black">Card Holder Name</label>
                                <input type="text" className="sapm-input regular-body-text" placeholder="Enter name here" value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} />
                            </div>
                            <div className="sapm-input-group">
                                <label className="regular-body-text font-medium text-black">Card Number</label>
                                <input
                                    type="text"
                                    name="cardNumber"
                                    inputMode="numeric"
                                    autoComplete="cc-number"
                                    maxLength="19"
                                    placeholder="1234 5678 9012 3456"
                                    value={cardNumber}
                                    onChange={(e) => {
                                        const value = e.target.value
                                            .replace(/\D/g, "") // remove non-digits
                                            .replace(/(.{4})/g, "$1 ")
                                            .trim();
                                        setCardNumber(value);
                                    }} className="sapm-input regular-body-text" />
                            </div>
                            <div className="sapm-row">
                                <div className="sapm-input-group flex-1">
                                    <label className="regular-body-text font-medium text-black">Expiration Date</label>
                                    <input type="text" className="sapm-input regular-body-text" placeholder="MM/YY" maxLength="5" value={expires} onChange={(e) => {
                                        let val = e.target.value.replace(/\D/g, "");
                                        if (val.length >= 3) {
                                            val = val.slice(0,2) + "/" + val.slice(2,4);
                                        }
                                        setExpires(val);
                                    }} />
                                </div>
                                <div className="sapm-input-group flex-1">
                                    <label className="regular-body-text font-medium text-black">CVV</label>
                                    <div className="sapm-input-icon-wrapper">
                                        <input type="password" maxLength="4" className="sapm-input regular-body-text pr-icon" placeholder="•••" value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))} />
                                        <Icon icon="mdi:shield-check-outline" className="sapm-input-icon text-secondary" width="20" />
                                    </div>
                                </div>
                            </div>
                            <label className="sapm-checkbox-container mt-8">
                                <input type="checkbox" className="sapm-checkbox" />
                                <span className="regular-body-text text-black">Save card securely for future payments</span>
                            </label>
                        </>
                    )}

                    {selectedMethod === 'upi' && (
                        <>
                            <div className="sapm-input-group">
                                <label className="regular-body-text font-medium text-black">UPI ID</label>
                                <input type="text" className="sapm-input regular-body-text" placeholder="username@bank" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
                            </div>
                        </>
                    )}

                    {selectedMethod === 'paypal' && (
                        <>
                            <div className="sapm-input-group">
                                <label className="regular-body-text font-medium text-black">PayPal Email</label>
                                <input type="email" className="sapm-input regular-body-text" placeholder="Enter PayPal email address" value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)} />
                            </div>
                        </>
                    )}

                    <label className="sapm-checkbox-container mt-12">
                        <input type="checkbox" className="sapm-checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
                        <span className="regular-body-text text-black">Set as default payment method</span>
                    </label>
                </div>

                <div className="sapm-form-actions">
                    <button className="sapm-cancel-btn regular-body-text font-medium" onClick={onClose}>Cancel</button>
                    <button className="sapm-submit-btn regular-body-text font-medium" onClick={handleAddMethod} disabled={isSubmitting}>
                        {isSubmitting ? 'Adding...' : `Add ${selectedMethod === 'credit_card' ? 'Card' : selectedMethod === 'upi' ? 'UPI' : 'PayPal'}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SponsorAddPaymentMethod;
