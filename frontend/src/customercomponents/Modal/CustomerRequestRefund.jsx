import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { showErrorAlert, showQuestionAlert, showSuccessAlert } from '../../admincomponents/utils/sweetAlert';
import './CustomerRequestRefund.css';

const CustomerRequestRefund = ({ show, onClose, ticketData }) => {
    const [subject, setSubject] = useState('');
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (show) {
            // Determine the subject based on ticket type (e.g., Ticket, Food, Merch, Drinks)
            // Currently defaults to 'Ticket' if no type is specified.
            const itemType = ticketData?.type || 'Ticket';
            setSubject(`${itemType} Refund Request`);

            setReason('');
        }
    }, [show, ticketData]);

    const handleSubmit = async () => {
        if (!reason.trim()) {
            showErrorAlert('Error', 'Please provide a reason for the refund.');
            return;
        }
        
        const result = await showQuestionAlert(
            'Submit Request?',
            'Are you sure you want to submit this refund request?',
            'Yes, submit it'
        );

        if (result.isConfirmed) {
            onClose();
            showSuccessAlert('Request Submitted!', 'Your refund request has been successfully submitted.');
        }
    };

    if (!show) return null;

    return (
        <div className="crr-modal-overlay">
            <div className="crr-modal-container">
                <div className="crr-modal-header">
                    <div className="crr-header-left">
                        <h2 className="crr-modal-title">Request Refund</h2>
                    </div>
                    <button className="crr-close-btn" onClick={onClose}>
                        <Icon icon="mdi:close" width="24" />
                    </button>
                </div>

                <div className="crr-modal-body">
                    <div className="crr-policy-alert">
                        <Icon icon="mdi:information-outline" width="20" className="crr-alert-icon" />
                        <div className="crr-alert-content">
                            <h5 className="crr-alert-title">Refund Policy</h5>
                            <p className="crr-alert-text small-body-text">
                                Refunds are only processed if requested at least 48 hours before the event start time.
                                Approved refunds will be credited to your original payment method within 5-7 business days.
                            </p>
                        </div>
                    </div>

                    <div className="crr-form">
                        <div className="crr-form-row">
                            <div className="crr-form-group">
                                <label className="small-body-text">Subject</label>
                                <input
                                    type="text"
                                    className="crr-input"
                                    value={subject}
                                    readOnly
                                    disabled
                                />
                            </div>
                        </div>

                        <div className="crr-form-row">
                            <div className="crr-form-group">
                                <label className="small-body-text">Event Name</label>
                                <input type="text" className="crr-input" value={ticketData?.title || ''} readOnly disabled />
                            </div>
                            <div className="crr-form-group">
                                <label className="small-body-text">Ticket Location</label>
                                <input type="text" className="crr-input" value={ticketData?.seat || ''} readOnly disabled />
                            </div>
                        </div>

                        <div className="crr-form-row">
                            <div className="crr-form-group">
                                <label className="small-body-text">Quantity</label>
                                <input type="number" className="crr-input" value="1" readOnly disabled />
                            </div>
                            <div className="crr-form-group">
                                <label className="small-body-text">Total Paid</label>
                                <input type="text" className="crr-input" value="$200.00" readOnly disabled />
                            </div>
                        </div>

                        <div className="crr-form-group">
                            <label className="small-body-text">Reason for Refund <span className="crr-required">*</span></label>
                            <textarea
                                className="crr-textarea"
                                placeholder="Please explain why you are requesting a refund..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            ></textarea>
                        </div>
                    </div>

                    <hr className="crr-divider" />

                    <div className="crr-form-actions">
                        <button className="outlined-button crr-cancel-btn" onClick={onClose}>Cancel</button>
                        <button className="primary-button crr-submit-btn" onClick={handleSubmit}>Submit Request</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerRequestRefund;
