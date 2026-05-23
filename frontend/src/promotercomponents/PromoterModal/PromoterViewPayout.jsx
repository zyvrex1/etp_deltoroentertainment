import React from 'react';
import { Icon } from '@iconify/react';
import './PromoterViewPayout.css';

const PromoterViewPayout = ({ isOpen, onClose, payout, onDownloadInvoice }) => {
    if (!isOpen || !payout) return null;

    const renderStatusPill = (status) => {
        let pillClass = 'pvp-pill-bg-orange';
        if (status === 'Paid') pillClass = 'button-label pvp-pill-bg-green';
        if (status === 'Reject') pillClass = 'button-label pvp-pill-bg-red';
        
        return (
            <span className={`button-label pvp-status-pill ${pillClass}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="pvp-modal-overlay" onClick={onClose}>
            <div className="pvp-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="pvp-header">
                    <h4 className="pvp-title text-black m-0">Withdrawal Details</h4>
                    <button className="pvp-close-btn text-secondary" onClick={onClose}>
                        <Icon icon="mdi:close" width="24" />
                    </button>
                </div>

                <div className="pvp-modal-body">
                    <div className="pvp-modal-row">
                        <span className="regular-body-text font-medium text-secondary">Status</span>
                        {renderStatusPill(payout.status)}
                    </div>
                    <div className="pvp-modal-row">
                        <span className="regular-body-text font-medium text-secondary">Date Requested</span>
                        <span className="regular-body-text text-black font-medium">{payout.date}</span>
                    </div>
                    <div className="pvp-modal-row">
                        <span className="regular-body-text font-medium text-secondary">Withdrawal Method</span>
                        <span className="regular-body-text text-black font-medium">{payout.method}</span>
                    </div>
                    <div className="pvp-modal-row">
                        <span className="regular-body-text font-medium text-secondary">Reference Number</span>
                        <span className="regular-body-text text-black font-medium">{payout.reference}</span>
                    </div>

                    <div className="pvp-modal-divider"></div>

                    <div className="pvp-modal-row">
                        <span className="regular-body-text font-medium text-secondary">Amount Requested</span>
                        <span className="regular-body-text text-black font-medium">
                            ${(payout.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className="pvp-modal-row">
                        <span className="regular-body-text font-medium text-secondary">Processing Fee</span>
                        <span className="regular-body-text text-black font-medium">-$0.00</span>
                    </div>
                    <div className="pvp-modal-row pvp-modal-total">
                        <span className="large-body-text text-black font-medium">Total Amount</span>
                        <span className="large-body-text text-black font-medium pvp-amount-text">
                            ${(payout.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>

                    {(payout.status === 'Reject' || payout.status === 'Paid') && (
                        <>
                            <div className="pvp-modal-divider"></div>
                            <div className="pvp-modal-column">
                                <span className="regular-body-text font-medium text-secondary pvp-comment-label">Admin's Comment</span>
                                <div className="pvp-comment-box regular-body-text text-black">
                                    {payout.comment || (payout.status === 'Reject' ? "Your payout has been rejected due to invalid bank details. Please update your payout method." : "Your payout has been successfully processed.")}
                                </div>
                            </div>
                        </>
                    )}
                </div>
                
                <div className="pvp-modal-footer">
                    <button className="primary-button pvp-download-btn" onClick={() => onDownloadInvoice(payout)}>
                        <Icon icon="mdi:tray-arrow-down" width="20" />
                        Download Receipt
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PromoterViewPayout;
