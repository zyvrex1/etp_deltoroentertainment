import React from 'react';
import { Icon } from '@iconify/react';
import './PromoterViewPayout.css';

const PromoterViewPayout = ({ isOpen, onClose, payout, pdfUrl, onDownloadInvoice }) => {
    if (!isOpen || !payout) return null;

    return (
        <div className="pvp-modal-overlay" onClick={onClose}>
            <div className="pvp-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="pvp-header">
                    <h4 className="pvp-title text-black m-0">Withdrawal Details</h4>
                    <button className="pvp-close-btn text-secondary" onClick={onClose}>
                        <Icon icon="mdi:close" width="24" />
                    </button>
                </div>

                <div className="pvp-modal-body pvp-pdf-body">
                    {pdfUrl ? (
                        <embed 
                            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                            type="application/pdf"
                            className="pvp-pdf-iframe"
                        />
                    ) : (
                        <div className="pvp-loading-container">
                            <div className="pvp-skeleton skeleton-rect"></div>
                            <span className="small-body-text text-secondary mt-2">Generating preview...</span>
                        </div>
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
