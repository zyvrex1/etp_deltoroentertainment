import React from 'react';
import { Icon } from '@iconify/react';
import './SponsorEnlargeQR.css';

const SponsorEnlargeQR = ({ isOpen, onClose, booth }) => {
    if (!isOpen || !booth) return null;

    return (
        <div className="sponsor-enlarge-qr-overlay">
            <div className="sponsor-enlarge-qr-modal">
                <div className="sponsor-enlarge-qr-header">
                    <h3>Ticket Scan</h3>
                    <button className="enlarge-qr-close-btn" onClick={onClose}>
                        <Icon icon="mdi:close" width="24" />
                    </button>
                </div>
                <div className="sponsor-enlarge-qr-body">
                    <h2 className="enlarge-qr-title">{booth.title}</h2>
                    <p className="small-body-text text-secondary enlarge-qr-subtitle">VIP - Booth {booth.id}02</p>

                    <div className="enlarge-qr-code-container">
                        <Icon icon="mdi:qrcode" className="enlarge-qr-icon" />
                    </div>

                    <p className="smaller-body-text text-secondary enlarge-qr-instruction">
                        Show this code at the entrance to be scanned.
                    </p>

                    <button className="outlined-button enlarge-qr-download-btn">
                        <Icon icon="mdi:download-outline" width="20" /> Save to photos
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SponsorEnlargeQR;
