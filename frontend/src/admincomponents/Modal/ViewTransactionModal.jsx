import React from 'react';
import { Icon } from '@iconify/react';
import './ViewTransactionModal.css';
import { showRefundConfirmAlert, showSuccessAlert } from '../utils/sweetAlert';

const ViewTransactionModal = ({ isOpen, onClose, transaction, onRefund }) => {
    if (!isOpen || !transaction) return null;

    const handleProcessRefund = async () => {
        const result = await showRefundConfirmAlert(transaction.id, transaction.amount);
        
        if (result.isConfirmed) {
            if (onRefund) {
                onRefund(transaction.id);
            }
            onClose();
            showSuccessAlert('Refund Processed', `The refund for order #${transaction.id} has been successfully processed.`);
        }
    };

    const getStatusClass = (status) => {
        if (status === 'completed') return 'button-label transac-completed';
        if (status === 'pending') return 'button-label transac-pending';
        if (status === 'refunded') return 'button-label transac-refunded';
        return 'status-pill';
    };

    const getCategoryClass = (category) => {
        if (!category) return 'button-label';

        const cat = category.toLowerCase();
        if (cat.includes('vip')) return 'button-label vip';
        if (cat.includes('general') || cat.includes('standard')) return 'button-label standard';
        if (cat.includes('corner')) return 'button-label corner';
        if (cat.includes('inline')) return 'button-label inline';

        return 'button-label';
    };

    return (
        <div className="tx-modal-overlay" onClick={onClose}>
            <div className="tx-modal-container" onClick={e => e.stopPropagation()}>
                <div className="tx-modal-header">
                    <h3>Transaction Details</h3>
                    <button className="close-btn" onClick={onClose}>
                        <Icon icon="mdi:close" width="24" height="24" />
                    </button>
                </div>

                <div className="tx-modal-body">
                    {/* Amount Card */}
                    <div className="amount-card">
                        <div className="amount-left">
                            <span className="small-body-text amount-label">Amount</span>
                            <h1 className="amount-value">{transaction.amount}</h1>
                        </div>
                        <div className="amount-right">
                            <span className={getStatusClass(transaction.status)}>
                                {transaction.status.toUpperCase()}
                            </span>
                            <span className="small-body-text amount-date">{transaction.date}</span>
                        </div>
                    </div>

                    {/* Info Columns */}
                    <div className="info-columns">
                        <div className="info-column">
                            <h4 className="column-title">Transaction Info</h4>

                            <div className="info-item">
                                <span className="small-body-text info-label">Transaction ID</span>
                                <h5 className="info-value">#{transaction.id.toString().padStart(2, '0')}{/* Mocking t1 format from design if needed, but keeping ID */}</h5>
                            </div>

                            <div className="info-item">
                                <span className="small-body-text info-label">Type</span>
                                <h5 className="info-value">{transaction.type}</h5>
                            </div>

                            <div className="info-item">
                                <span className="small-body-text info-label">Payment Method</span>
                                <h5 className="info-value">Credit Card</h5>
                            </div>
                        </div>

                        {/* Right Column: Item Details */}
                        <div className="info-column">
                            <h4 className="column-title">Item Details</h4>

                            <div className="info-item">
                                <span className="small-body-text info-label">Event</span>
                                <h5 className="info-value">{transaction.event || 'N/A'}</h5>
                            </div>

                            <div className="info-item">
                                <span className="small-body-text info-label">Category / Tier</span>
                                <h5 className="info-value-wrapper">
                                    <span className={getCategoryClass(transaction.category)}>
                                        {transaction.category || 'N/A'}
                                    </span>
                                </h5>
                            </div>

                            <div className="info-item">
                                <span className="small-body-text info-label">Quantity</span>
                                <h5 className="info-value">1</h5>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="tx-modal-footer">
                    {(transaction.type === 'Ticket Purchase' || transaction.type === 'Booth Rental') && transaction.status !== 'refunded' && (
                        <button className="process-refund-btn" onClick={handleProcessRefund}>Process Refund</button>
                    )}
                    <button className="primary-button close-button-main" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default ViewTransactionModal;
