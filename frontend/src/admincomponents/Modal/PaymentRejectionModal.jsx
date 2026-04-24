import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { showRejectConfirmAlert } from '../../utils/sweetAlert';
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
        <div className="general-modal-overlay" onClick={onClose}>
            <div className="general-payment-rejection-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="general-modal-header">
                    <h3>Reject Payout Request</h3>
                    <button className="close-btn" onClick={onClose}>
                        <Icon icon="mdi:close" width="24" />
                    </button>
                </div>

                <div className="payment-rejection-modal-body">
                    <p className="regular-body-text rejection-instruction">
                        Please provide a reason for rejecting the payout request from <strong>{payout.promoter}</strong> ({payout.amount}).
                    </p>
                    <div className="rejection-form-group">
                        <textarea
                            id="rejection-reason"
                            className="rejection-textarea"
                            placeholder="Enter the reason for rejection..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows="4"
                        />
                    </div>
                    <p className="smaller-body-text rejection-info">
                        The promoter will be notified with this reason.
                    </p>
                </div>

                <div className="general-payment-rejection-modal-footer">
                    <button className="button cancel-btn" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="primary-button save-btnt"
                        onClick={handleConfirm}
                        disabled={!rejectionReason.trim()}
                    >
                        Reject Payout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentRejectionModal;
