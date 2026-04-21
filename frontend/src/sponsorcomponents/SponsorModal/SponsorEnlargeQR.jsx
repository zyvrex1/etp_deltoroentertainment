import { Icon } from '@iconify/react';
import { QRCodeCanvas } from 'qrcode.react';
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
                    <h2 className="enlarge-qr-title">{booth.event?.title}</h2>
                    <p className="small-body-text text-secondary enlarge-qr-subtitle">
                        Reservation #{booth._id?.substring(0, 8).toUpperCase()} • Booth {booth.boothCode}
                    </p>

                    <div className="enlarge-qr-code-container" style={{ padding: '20px', background: 'white', borderRadius: '12px' }}>
                        <QRCodeCanvas
                            value={booth._id || "No ID"}
                            size={200}
                            level={"H"}
                            includeMargin={false}
                        />
                    </div>

                    <p className="smaller-body-text text-secondary enlarge-qr-instruction">
                        Show this code at the entrance to be scanned for attendance.
                    </p>

                    <button className="outlined-button enlarge-qr-download-btn">
                        <Icon icon="mdi:download-outline" width="20" /> Download QR
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SponsorEnlargeQR;
