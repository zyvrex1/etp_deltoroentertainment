import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import './PaymentDetailsModal.css';

const PaymentDetailsModal = ({ isOpen, onClose, paymentMethods, onSuccess, amount }) => {
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

    useEffect(() => {
        if (!isOpen) return;
        
        setTimeLeft(300); // Reset timer when modal opens
        
        const timerId = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerId);
                    onSuccess(); // Redirect on timeout
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerId);
    }, [isOpen, onSuccess]);

    if (!isOpen) return null;

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="pdm-modal-overlay">
            <div className="pdm-modal-container">
                <div className="pdm-header d-flex justify-content-between align-items-center mb-4">
                    <h4 className="pdm-title text-black m-0">Complete Your Payment</h4>
                    <button className="pdm-close-btn bg-transparent border-0 text-secondary" onClick={onClose} style={{ cursor: 'pointer' }}>
                        <Icon icon="mdi:close" width="24" />
                    </button>
                </div>

                <div className="pdm-body">
                    <p className="pdm-instruction regular-body-text mb-4">
                        Please send your payment of <strong>${amount?.toFixed(2) || '0.00'}</strong> to one of the following methods. Once completed, click the button below or wait for the timer.
                    </p>

                    <div className="pdm-methods-list mb-4">
                        {paymentMethods && paymentMethods.length > 0 ? (
                            paymentMethods.map(method => (
                                <div key={method.id || method._id} className="pdm-method-item">
                                    <div className="pdm-method-icon">
                                        <Icon icon={method.icon || "mdi:credit-card"} width="32" color="#475569" />
                                    </div>
                                    <div className="pdm-method-info">
                                        <h5 className="pdm-method-type">{method.type}</h5>
                                        {method.type === 'Bank Account' || method.type === 'Visa' ? (
                                            <>
                                                {(method.accountHolder || method.cardHolder) && <div className="pdm-method-detail"><strong>Name:</strong> {method.accountHolder || method.cardHolder}</div>}
                                                {(method.accountNumber || method.cardNumber) && <div className="pdm-method-detail"><strong>{method.type === 'Visa' ? 'Card Number' : 'Account Number'}:</strong> {method.accountNumber || method.cardNumber}</div>}
                                                {method.routingNumber && <div className="pdm-method-detail"><strong>Routing:</strong> {method.routingNumber}</div>}
                                            </>
                                        ) : method.type === 'PayPal' ? (
                                            <div className="pdm-method-detail"><strong>Email:</strong> {method.paypalEmail}</div>
                                        ) : (
                                            <div className="pdm-method-detail"><strong>Details:</strong> {method.accountNumber || method.cardNumber || method.paypalEmail}</div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-secondary smaller-body-text">No payment methods available. Please contact support.</p>
                        )}
                    </div>

                    <div className="pdm-timer-section text-center mb-4">
                        <p className="smaller-body-text text-secondary mb-1">Time remaining to complete payment:</p>
                        <h3 className="pdm-timer text-primary">{formatTime(timeLeft)}</h3>
                    </div>

                    <button className="primary-button pdm-confirm-btn w-100 py-3" onClick={onSuccess}>
                        I have completed my payment
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentDetailsModal;
