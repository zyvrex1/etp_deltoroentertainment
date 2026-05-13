import React, { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Icon } from "@iconify/react";
import "./QRScannerModal.css";

const QRScannerModal = ({ show, onClose, onScanSuccess }) => {
  useEffect(() => {
    if (!show) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      /* verbose= */ false
    );

    const onScanResult = (decodedText, decodedResult) => {
      // Successfully scanned a code
      console.log(`Scan Result: ${decodedText}`);
      onScanSuccess(decodedText);
      scanner.clear(); // Stop scanning
    };

    const onScanError = (errorMessage) => {
      // This is called for every frame where no QR code is found
      // We usually don't want to log this to avoid console spam
    };

    scanner.render(onScanResult, onScanError);

    // Cleanup on unmount or when modal closes
    return () => {
      scanner.clear().catch((error) => {
        console.error("Failed to clear html5QrcodeScanner", error);
      });
    };
  }, [show, onScanSuccess]);

  if (!show) return null;

  return (
    <div className="qrs-modal-overlay">
      <div className="qrs-modal-container">
        <div className="qrs-modal-header">
          <div className="qrs-header-title">
            <Icon icon="mdi:qrcode-scan" width="24" />
            <h3>Scan Attendee Ticket</h3>
          </div>
          <button className="qrs-close-btn" onClick={onClose}>
            <Icon icon="mdi:close" width="24" />
          </button>
        </div>

        <div className="qrs-modal-body">
          <div id="qr-reader"></div>
          <div className="qrs-instructions">
            <p className="small-body-text">
              Align the QR code within the frame to scan automatically.
            </p>
          </div>
        </div>

        <div className="qrs-modal-footer">
          <button className="outlined-button qrs-cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
