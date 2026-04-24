import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { showConfirmAlert } from '../../utils/sweetAlert';
import './EventRejectionModal.css'; // Reuse same styles

const EventCancellationModal = ({ event, onClose, onConfirm }) => {
    const [cancellationReason, setCancellationReason] = useState('');

    const handleConfirm = async () => {
        if (!cancellationReason.trim()) {
            return;
        }

        const result = await showConfirmAlert(
            'Cancel Event',
            `Are you sure you want to cancel "${event.title}"? This will notify all relevant parties.`,
            'Yes, Cancel It',
            'No, Keep It'
        );

        if (result.isConfirmed) {
            onConfirm(cancellationReason);
        }
    };

    return (
        <div className="general-modal-overlay" onClick={onClose}>
            <div className="general-eventrejection-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="general-modal-header">
                    <h3>Cancel Event</h3>
                    <button className="close-btn" onClick={onClose}>
                        <Icon icon="mdi:close" width="24" />
                    </button>
                </div>

                <div className="event-rejection-modal-body">
                    <p className="regular-body-text rejection-instruction">
                        Please provide a reason for cancelling <strong>{event.title}</strong>.
                    </p>
                    <div className="rejection-form-group">
                        <textarea
                            id="cancellation-reason"
                            className="rejection-textarea"
                            placeholder="Enter the reason for cancellation..."
                            value={cancellationReason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                            rows="4"
                        />
                    </div>
                    <p className="smaller-body-text rejection-info">
                        The promoter and any assigned users will be notified of this cancellation reason.
                    </p>
                </div>

                <div className="general-eventrejection-modal-footer">
                    <button className="button cancel-btn" onClick={onClose}>
                        Close
                    </button>
                    <button
                        className="primary-button cancel-btn"
                        style={{ backgroundColor: '#f44336', color: 'white' }}
                        onClick={handleConfirm}
                        disabled={!cancellationReason.trim()}
                    >
                        Confirm Cancellation
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EventCancellationModal;
