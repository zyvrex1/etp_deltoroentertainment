import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { showConfirmAlert, showSuccessAlert } from '../../utils/sweetAlert';
import './CustomerAddPaymentMethod.css';

const CustomerAddPaymentMethod = ({ isOpen, onClose }) => {
    const [selectedMethod, setSelectedMethod] = useState('credit_card');

    const handleAddMethod = async () => {
        let methodName = selectedMethod === 'credit_card' ? 'Card' : selectedMethod === 'upi' ? 'UPI' : 'PayPal';
        const result = await showConfirmAlert(
            `Add ${methodName}?`,
            `Are you sure you want to add this ${methodName} payment method?`,
            "Yes, Add It"
        );
        if (result.isConfirmed) {
            await showSuccessAlert("Success", `${methodName} has been added successfully.`);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="capm-modal-overlay">
            <div className="capm-modal-container">
                <div className="capm-header d-flex justify-content-between align-items-center mb-4">
                    <h4 className="capm-title text-black m-0">Add New Payment Method</h4>
                    <button className="capm-close-btn bg-transparent border-0 text-secondary" onClick={onClose} style={{ cursor: 'pointer' }}>
                        <Icon icon="mdi:close" width="24" />
                    </button>
                </div>

                <div className="capm-methods-list">
                    <label className={`capm-method-option ${selectedMethod === 'credit_card' ? 'selected' : ''}`}>
                        <div className="capm-method-left">
                            <Icon icon="logos:visa" width="32" />
                            <span className="regular-body-text text-black font-medium">Credit Card</span>
                        </div>
                        <input
                            type="radio"
                            name="payment_method"
                            value="credit_card"
                            className="capm-custom-radio"
                            checked={selectedMethod === 'credit_card'}
                            onChange={() => setSelectedMethod('credit_card')}
                        />
                    </label>

                    <label className={`capm-method-option ${selectedMethod === 'upi' ? 'selected' : ''}`}>
                        <div className="capm-method-left">
                            <Icon icon="arcticons:bhim-upi" width="32" />
                            <span className="regular-body-text text-black font-medium">UPI</span>
                        </div>
                        <input
                            type="radio"
                            name="payment_method"
                            value="upi"
                            className="capm-custom-radio"
                            checked={selectedMethod === 'upi'}
                            onChange={() => setSelectedMethod('upi')}
                        />
                    </label>

                    <label className={`capm-method-option ${selectedMethod === 'paypal' ? 'selected' : ''}`}>
                        <div className="capm-method-left">
                            <Icon icon="logos:paypal" width="32" />
                            <span className="regular-body-text text-black font-medium">PayPal</span>
                        </div>
                        <input
                            type="radio"
                            name="payment_method"
                            value="paypal"
                            className="capm-custom-radio"
                            checked={selectedMethod === 'paypal'}
                            onChange={() => setSelectedMethod('paypal')}
                        />
                    </label>
                </div>

                <div className="capm-form-content">
                    {selectedMethod === 'credit_card' && (
                        <>
                            <div className="capm-input-group">
                                <label className="regular-body-text font-medium text-black">Card Holder Name</label>
                                <input type="text" className="capm-input regular-body-text" placeholder="Enter name here" />
                            </div>
                            <div className="capm-input-group">
                                <label className="regular-body-text font-medium text-black">Card Number</label>
                                <input
                                    type="text"
                                    name="cardNumber"
                                    inputMode="numeric"
                                    autoComplete="cc-number"
                                    maxLength="19"
                                    placeholder="1234 5678 9012 3456"
                                    onChange={(e) => {
                                        const value = e.target.value
                                            .replace(/\D/g, "") // remove non-digits
                                            .replace(/(.{4})/g, "$1 ")
                                            .trim();
                                        e.target.value = value;
                                    }} className="capm-input regular-body-text" />
                            </div>
                            <div className="capm-row">
                                <div className="capm-input-group flex-1">
                                    <label className="regular-body-text font-medium text-black">Expiration Date</label>
                                    <input type="date" className="capm-input regular-body-text" placeholder="--/--" />
                                </div>
                                <div className="capm-input-group flex-1">
                                    <label className="regular-body-text font-medium text-black">CVV</label>
                                    <div className="capm-input-icon-wrapper">
                                        <input type="text" className="capm-input regular-body-text pr-icon" placeholder="•••" />
                                        <Icon icon="mdi:shield-check-outline" className="capm-input-icon text-secondary" width="20" />
                                    </div>
                                </div>
                            </div>
                            <label className="capm-checkbox-container mt-8">
                                <input type="checkbox" className="capm-checkbox" />
                                <span className="regular-body-text text-black">Save card securely for future payments</span>
                            </label>
                        </>
                    )}

                    {selectedMethod === 'upi' && (
                        <>
                            <div className="capm-input-group">
                                <label className="regular-body-text font-medium text-black">UPI ID</label>
                                <input type="text" className="capm-input regular-body-text" placeholder="username@bank" />
                            </div>
                        </>
                    )}

                    {selectedMethod === 'paypal' && (
                        <>
                            <div className="capm-input-group">
                                <label className="regular-body-text font-medium text-black">PayPal Email</label>
                                <input type="email" className="capm-input regular-body-text" placeholder="Enter PayPal email address" />
                            </div>
                        </>
                    )}

                    <label className="capm-checkbox-container mt-12">
                        <input type="checkbox" className="capm-checkbox" />
                        <span className="regular-body-text text-black">Set as default payment method</span>
                    </label>
                </div>

                <div className="capm-form-actions">
                    <button className="capm-cancel-btn regular-body-text font-medium" onClick={onClose}>Cancel</button>
                    <button className="capm-submit-btn regular-body-text font-medium" onClick={handleAddMethod}>Add {selectedMethod === 'credit_card' ? 'Card' : selectedMethod === 'upi' ? 'UPI' : 'PayPal'}</button>
                </div>
            </div>
        </div>
    );
};

export default CustomerAddPaymentMethod;
