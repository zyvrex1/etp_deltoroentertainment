import React from 'react';
import { Icon } from '@iconify/react';
import { QRCodeCanvas } from 'qrcode.react';
import './CustomerOrderQrModal.css';

const CustomerOrderQrModal = ({ show, onClose, orderData }) => {
    if (!show) return null;

    return (
        <div className="coqr-modal-overlay">
            <div className="coqr-modal-container">
                <div className="coqr-modal-header">
                    <h3 className="coqr-modal-title">Order QR Scan</h3>
                    <button className="coqr-close-btn" onClick={onClose}>
                        <Icon icon="mdi:close" width="24" />
                    </button>
                </div>

                <hr className="coqr-divider" />

                <div className="coqr-modal-body">
                    <div className="coqr-order-info">
                        <span className="coqr-order-id smaller-body-text">{orderData?.id}</span>
                        <h3 className="coqr-store-name">{orderData?.storeName || 'Store Name'}</h3>
                        <p className="coqr-booth-info regular-body-text">{orderData?.boothInfo || 'Booth Info'}</p>
                    </div>

                    <div className="coqr-qr-container">
                        <div className="coqr-qr-wrapper" style={{ background: '#fff', padding: '15px', borderRadius: '12px', display: 'inline-block' }}>
                            <QRCodeCanvas
                                value={orderData?.id || ''}
                                size={220}
                                bgColor={"#ffffff"}
                                fgColor={"#000000"}
                                level={"H"}
                            />
                        </div>
                    </div>

                    <div className="coqr-footer-info">
                        <p className="coqr-caption small-body-text">Show this code at the booth to claim your order.</p>
                        <div className="coqr-status-display">
                            <span className="label small-body-text">Payment:</span>
                            <span className={`value small-body-text ${orderData?.paymentStatus?.toLowerCase() || 'unpaid'}`}>
                                {orderData?.paymentStatus || 'Unpaid'}
                            </span>
                        </div>
                        <div className="coqr-status-display">
                            <span className="label small-body-text">Status:</span>
                            <span className={`value small-body-text ${orderData?.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                                {orderData?.status}
                            </span>
                        </div>
                    </div>

                    <button className="coqr-download-btn primary-button" onClick={() => window.print()}>
                        <Icon icon="mdi:download-outline" width="18" />
                        Save as PDF
                    </button>
                </div>

            </div>
        </div>
    );
};

export default CustomerOrderQrModal;
