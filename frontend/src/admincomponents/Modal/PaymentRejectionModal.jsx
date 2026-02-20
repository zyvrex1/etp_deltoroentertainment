import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { showRejectConfirmAlert } from '../utils/sweetAlert';
import './PaymentRejectionModal.css';

const PaymentRejectionModal = ({ payout, onClose, onConfirm }) => {
    const [rejectionReason, setRejectionReason] = useState('');

    const handleConfirm = async () => {
        if (!rejectionReason.trim()) {
            return;
        }

        const result = await showRejectConfirmAlert(payout.promoter, payout.amount);
        
        if (result.isConfirmed) {
            onConfirm(rejectionReason);
        }
    };

    return (
        <div className="payment-rejection-modal-overlay" onClick={onClose}>
            <div className="payment-rejection-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="payment-rejection-modal-header">
                    <h3>Reject Payment Request</h3>
                    <button className="close-btn" onClick={onClose}>
                        <Icon icon="mdi:close" width="24" />
                    </button>
                </div>

                <div className="payment-rejection-modal-body">
                    <p className="rejection-instruction">
                        Please provide a reason for rejecting the payment request from <strong>{payout.promoter}</strong> ({payout.amount}).
                    </p>
                    <div className="rejection-form-group">
                        <label htmlFor="rejection-reason">Rejection Reason</label>
                        <textarea
                            id="rejection-reason"
                            className="rejection-textarea"
                            placeholder="Enter the reason for rejection..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows="4"
                        />
                    </div>
                    <p className="rejection-info">
                        The promoter will be notified with this reason.
                    </p>
                </div>

                <div className="payment-rejection-modal-footer">
                    <button className="btn-cancel" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="btn-reject-payment"
                        onClick={handleConfirm}
                        disabled={!rejectionReason.trim()}
                    >
                        Reject Payment
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentRejectionModal;
