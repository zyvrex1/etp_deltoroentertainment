import React from 'react';
import { Icon } from '@iconify/react';
import { QRCodeCanvas } from 'qrcode.react';
import './CustomerEnlargeQr.css';

const CustomerEnlargeQr = ({ show, onClose, ticketData }) => {
    if (!show) return null;

    return (
        <div className="ceq-modal-overlay">
            <div className="ceq-modal-container">
                <div className="ceq-modal-header">
                    <h3 className="ceq-modal-title">Ticket Scan</h3>
                    <button className="ceq-close-btn" onClick={onClose}>
                        <Icon icon="mdi:close" width="24" />
                    </button>
                </div>

                <hr className="ceq-divider" />

                <div className="ceq-modal-body">
                    <h2 className="ceq-event-name">{ticketData?.title || 'Event Name'}</h2>
                    <p className="ceq-seat-location large-body-text">{ticketData?.seat || 'Location'}</p>

                    <div className="ceq-qr-container">
                        <div className="ceq-qr-wrapper" style={{ background: '#fff', padding: '15px', borderRadius: '12px', display: 'inline-block' }}>
                            <QRCodeCanvas 
                                value={ticketData?.id || ''}
                                size={200}
                                bgColor={"#ffffff"}
                                fgColor={"#000000"}
                                level={"H"}
                            />
                        </div>
                    </div>

                    <p className="ceq-caption small-body-text">Show this code at the entrance to be scanned.</p>

                    <button className="outlined-button ceq-save-btn">
                        <Icon icon="mdi:download-outline" width="18" className="mr-2" />
                        Save to Photos
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerEnlargeQr;
