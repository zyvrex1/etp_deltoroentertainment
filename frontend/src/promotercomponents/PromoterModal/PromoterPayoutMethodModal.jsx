import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { showConfirmAlert, showSuccessAlert } from '../../utils/sweetAlert';
import './PromoterPayoutMethodModal.css';

const PromoterPayoutMethodModal = ({ isOpen, onClose }) => {
    const [selectedMethod, setSelectedMethod] = useState('credit_card');

    const handleAddMethod = async () => {
        let methodName = selectedMethod === 'credit_card' ? 'Card' : selectedMethod === 'bank_transfer' ? 'Bank Transfer' : 'PayPal';
        const result = await showConfirmAlert(
            `Add ${methodName}?`,
            `Are you sure you want to add this ${methodName} payout method?`,
            "Yes, Add It"
        );
        if (result.isConfirmed) {
            await showSuccessAlert("Success", `${methodName} has been added successfully.`);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="ppmm-modal-overlay">
            <div className="ppmm-modal-container">
                <div className="ppmm-header d-flex justify-content-between align-items-center mb-4">
                    <h4 className="ppmm-title text-black m-0">Add New Payout Method</h4>
                    <button className="ppmm-close-btn bg-transparent border-0 text-secondary" onClick={onClose} style={{ cursor: 'pointer' }}>
                        <Icon icon="mdi:close" width="24" />
                    </button>
                </div>

                <div className="ppmm-methods-list">
                    <label className={`ppmm-method-option ${selectedMethod === 'credit_card' ? 'selected' : ''}`}>
                        <div className="ppmm-method-left">
                            <Icon icon="logos:visa" width="32" />
                            <span className="regular-body-text text-black font-medium">Credit/Debit Card</span>
                        </div>
                        <input
                            type="radio"
                            name="payout_method"
                            value="credit_card"
                            className="ppmm-custom-radio"
                            checked={selectedMethod === 'credit_card'}
                            onChange={() => setSelectedMethod('credit_card')}
                        />
                    </label>

                    <label className={`ppmm-method-option ${selectedMethod === 'bank_transfer' ? 'selected' : ''}`}>
                        <div className="ppmm-method-left">
                            <Icon icon="mdi:bank" width="32" color="#0059ff" />
                            <span className="regular-body-text text-black font-medium">Bank Transfer</span>
                        </div>
                        <input
                            type="radio"
                            name="payout_method"
                            value="bank_transfer"
                            className="ppmm-custom-radio"
                            checked={selectedMethod === 'bank_transfer'}
                            onChange={() => setSelectedMethod('bank_transfer')}
                        />
                    </label>

                    <label className={`ppmm-method-option ${selectedMethod === 'paypal' ? 'selected' : ''}`}>
                        <div className="ppmm-method-left">
                            <Icon icon="logos:paypal" width="32" />
                            <span className="regular-body-text text-black font-medium">PayPal</span>
                        </div>
                        <input
                            type="radio"
                            name="payout_method"
                            value="paypal"
                            className="ppmm-custom-radio"
                            checked={selectedMethod === 'paypal'}
                            onChange={() => setSelectedMethod('paypal')}
                        />
                    </label>
                </div>

                <div className="ppmm-form-content">
                    {selectedMethod === 'credit_card' && (
                        <>
                            <div className="ppmm-input-group">
                                <label className="regular-body-text font-medium text-black">Card Holder Name</label>
                                <input type="text" className="ppmm-input regular-body-text" placeholder="Enter name here" />
                            </div>
                            <div className="ppmm-input-group">
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
                                            .replace(/\D/g, "")
                                            .replace(/(.{4})/g, "$1 ")
                                            .trim();
                                        e.target.value = value;
                                    }} className="ppmm-input regular-body-text" />
                            </div>
                            <div className="ppmm-row">
                                <div className="ppmm-input-group flex-1">
                                    <label className="regular-body-text font-medium text-black">Expiration Date</label>
                                    <input type="text" className="ppmm-input regular-body-text" placeholder="MM/YY" />
                                </div>
                                <div className="ppmm-input-group flex-1">
                                    <label className="regular-body-text font-medium text-black">CVV</label>
                                    <div className="ppmm-input-icon-wrapper">
                                        <input type="text" className="ppmm-input regular-body-text pr-icon" placeholder="•••" />
                                        <Icon icon="mdi:shield-check-outline" className="ppmm-input-icon text-secondary" width="20" />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {selectedMethod === 'bank_transfer' && (
                        <>
                            <div className="ppmm-input-group">
                                <label className="regular-body-text font-medium text-black">Account Holder Name</label>
                                <input type="text" className="ppmm-input regular-body-text" placeholder="Enter name here" />
                            </div>
                            <div className="ppmm-input-group">
                                <label className="regular-body-text font-medium text-black">Account Number</label>
                                <input type="text" className="ppmm-input regular-body-text" placeholder="Enter account number" />
                            </div>
                            <div className="ppmm-input-group">
                                <label className="regular-body-text font-medium text-black">Routing Number</label>
                                <input type="text" className="ppmm-input regular-body-text" placeholder="Enter routing number" />
                            </div>
                        </>
                    )}

                    {selectedMethod === 'paypal' && (
                        <>
                            <div className="ppmm-input-group">
                                <label className="regular-body-text font-medium text-black">PayPal Email</label>
                                <input type="email" className="ppmm-input regular-body-text" placeholder="Enter PayPal email address" />
                            </div>
                        </>
                    )}

                    <label className="ppmm-checkbox-container mt-12">
                        <input type="checkbox" className="ppmm-checkbox" />
                        <span className="regular-body-text text-black">Set as default payout method</span>
                    </label>
                </div>

                <div className="ppmm-form-actions">
                    <button className="ppmm-cancel-btn regular-body-text font-medium" onClick={onClose}>Cancel</button>
                    <button className="ppmm-submit-btn regular-body-text font-medium" onClick={handleAddMethod}>Add {selectedMethod === 'credit_card' ? 'Card' : selectedMethod === 'bank_transfer' ? 'Bank Account' : 'PayPal'}</button>
                </div>
            </div>
        </div>
    );
};

export default PromoterPayoutMethodModal;
