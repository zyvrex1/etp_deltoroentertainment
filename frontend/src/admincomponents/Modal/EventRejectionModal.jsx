import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { showConfirmAlert } from '../utils/sweetAlert';
import './EventRejectionModal.css';

const EventRejectionModal = ({ event, onClose, onConfirm }) => {
    const [rejectionReason, setRejectionReason] = useState('');

    const handleConfirm = async () => {
        if (!rejectionReason.trim()) {
            return;
        }

        const result = await showConfirmAlert(
            'Reject Event',
            `Are you sure you want to reject "${event.title}"?`,
            'Yes, Reject It',
            'Cancel'
        );

        if (result.isConfirmed) {
            onConfirm(rejectionReason);
        }
    };

    return (
        <div className="general-modal-overlay" onClick={onClose}>
            <div className="general-eventrejection-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="general-modal-header">
                    <h3>Reject Event</h3>
                    <button className="close-btn" onClick={onClose}>
                        <Icon icon="mdi:close" width="24" />
                    </button>
                </div>

                <div className="event-rejection-modal-body">
                    <p className="regular-body-text rejection-instruction">
                        Please provide a reason for rejecting <strong>{event.title}</strong>.
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
                        The promoter will be notified with this reason and can resubmit after making changes.
                    </p>
                </div>

                <div className="general-eventrejection-modal-footer">
                    <button className="button cancel-btn" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="primary-button save-btn"
                        onClick={handleConfirm}
                        disabled={!rejectionReason.trim()}
                    >
                        Reject Event
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EventRejectionModal;
