import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { showConfirmAlert, showSuccessAlert } from '../../utils/sweetAlert';
import './PromoterPayoutMethodModal.css';

const PromoterPayoutMethodModal = ({ isOpen, onClose, onAdd }) => {
    const [selectedMethod, setSelectedMethod] = useState('credit_card');
    const [isDefault, setIsDefault] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        cardHolder: '',
        cardNumber: '',
        expiry: '',
        cvv: '',
        accountHolder: '',
        accountNumber: '',
        routingNumber: '',
        paypalEmail: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddMethod = async () => {
        let newMethod = {
            isDefault,
            methodType: selectedMethod === 'credit_card' ? 'card' : 'bank'
        };

        if (selectedMethod === 'credit_card') {
            if (!formData.cardNumber || !formData.expiry) {
                return alert("Please fill in card details");
            }
            newMethod.type = 'Visa'; // Dummy detection
            newMethod.last4 = formData.cardNumber.replace(/\s/g, '').slice(-4);
            newMethod.expires = formData.expiry;
            newMethod.icon = 'mdi:credit-card';
        } else if (selectedMethod === 'bank_transfer') {
            if (!formData.accountNumber) {
                return alert("Please fill in account details");
            }
            newMethod.type = 'Bank Account';
            newMethod.last4 = formData.accountNumber.slice(-4);
            newMethod.expires = 'N/A';
            newMethod.icon = 'mdi:bank';
        } else {
            if (!formData.paypalEmail) {
                return alert("Please fill in PayPal email");
            }
            newMethod.type = 'PayPal';
            newMethod.last4 = formData.paypalEmail.split('@')[0].slice(-4);
            newMethod.expires = 'N/A';
            newMethod.icon = 'logos:paypal';
        }

        const result = await showConfirmAlert(
            `Add ${newMethod.type}?`,
            `Are you sure you want to add this ${newMethod.type} payout method?`,
            "Yes, Add It"
        );

        if (result.isConfirmed) {
            onAdd(newMethod);
            onClose();
            // Reset form
            setFormData({
                cardHolder: '',
                cardNumber: '',
                expiry: '',
                cvv: '',
                accountHolder: '',
                accountNumber: '',
                routingNumber: '',
                paypalEmail: ''
            });
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
                                <input
                                    type="text"
                                    name="cardHolder"
                                    className="ppmm-input regular-body-text"
                                    placeholder="Enter name here"
                                    value={formData.cardHolder}
                                    onChange={handleInputChange}
                                />
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
                                    value={formData.cardNumber}
                                    onChange={(e) => {
                                        const value = e.target.value
                                            .replace(/\D/g, "")
                                            .replace(/(.{4})/g, "$1 ")
                                            .trim();
                                        setFormData(prev => ({ ...prev, cardNumber: value }));
                                    }}
                                    className="ppmm-input regular-body-text"
                                />
                            </div>
                            <div className="ppmm-row">
                                <div className="ppmm-input-group flex-1">
                                    <label className="regular-body-text font-medium text-black">Expiration Date</label>
                                    <input
                                        type="text"
                                        name="expiry"
                                        className="ppmm-input regular-body-text"
                                        placeholder="MM/YY"
                                        value={formData.expiry}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="ppmm-input-group flex-1">
                                    <label className="regular-body-text font-medium text-black">CVV</label>
                                    <div className="ppmm-input-icon-wrapper">
                                        <input
                                            type="text"
                                            name="cvv"
                                            className="ppmm-input regular-body-text pr-icon"
                                            placeholder="•••"
                                            value={formData.cvv}
                                            onChange={handleInputChange}
                                        />
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
                                <input
                                    type="text"
                                    name="accountHolder"
                                    className="ppmm-input regular-body-text"
                                    placeholder="Enter name here"
                                    value={formData.accountHolder}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="ppmm-input-group">
                                <label className="regular-body-text font-medium text-black">Account Number</label>
                                <input
                                    type="text"
                                    name="accountNumber"
                                    className="ppmm-input regular-body-text"
                                    placeholder="Enter account number"
                                    value={formData.accountNumber}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="ppmm-input-group">
                                <label className="regular-body-text font-medium text-black">Routing Number</label>
                                <input
                                    type="text"
                                    name="routingNumber"
                                    className="ppmm-input regular-body-text"
                                    placeholder="Enter routing number"
                                    value={formData.routingNumber}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </>
                    )}

                    {selectedMethod === 'paypal' && (
                        <>
                            <div className="ppmm-input-group">
                                <label className="regular-body-text font-medium text-black">PayPal Email</label>
                                <input
                                    type="email"
                                    name="paypalEmail"
                                    className="ppmm-input regular-body-text"
                                    placeholder="Enter PayPal email address"
                                    value={formData.paypalEmail}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </>
                    )}

                    <label className="ppmm-checkbox-container mt-12">
                        <input
                            type="checkbox"
                            className="ppmm-checkbox"
                            checked={isDefault}
                            onChange={(e) => setIsDefault(e.target.checked)}
                        />
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
