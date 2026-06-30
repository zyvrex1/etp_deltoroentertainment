import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { showConfirmAlert, showSuccessAlert } from '../../utils/sweetAlert';
import './PromoterPayoutMethodModal.css';

const PromoterPayoutMethodModal = ({ isOpen, onClose, onAdd }) => {
    const [selectedMethod, setSelectedMethod] = useState('paypal');
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
            methodType: 'paypal'
        };

        if (!formData.paypalEmail) {
            return alert("Please fill in PayPal email");
        }
        newMethod.type = 'PayPal';
        newMethod.last4 = formData.paypalEmail.split('@')[0].slice(-4);
        newMethod.paypalEmail = formData.paypalEmail;
        newMethod.expires = 'N/A';
        newMethod.icon = 'logos:paypal';

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
                    <button className="ppmm-submit-btn regular-body-text font-medium" onClick={handleAddMethod}>Add PayPal</button>
                </div>
            </div>
        </div>
    );
};

export default PromoterPayoutMethodModal;
