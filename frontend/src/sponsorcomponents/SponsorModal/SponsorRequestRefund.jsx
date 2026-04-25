import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { showErrorAlert, showQuestionAlert, showSuccessAlert } from '../../utils/sweetAlert';
import { useAuthContext } from '../../hooks/useAuthContext';
import concernService from '../../services/concernService';
import './SponsorRequestRefund.css';

const SponsorRequestRefund = ({ show, onClose, boothData }) => {
    const { user } = useAuthContext();
    const [subject, setSubject] = useState('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (show) {
            setSubject(`Refund Request: Booth #${boothData?._id.toString().slice(-6).toUpperCase() || 'N/A'}`);
            setReason('');
        }
    }, [show, boothData]);

    const handleSubmit = async () => {
        if (!reason.trim()) {
            showErrorAlert('Error', 'Please provide a reason for the refund.');
            return;
        }
        
        const result = await showQuestionAlert(
            'Submit Request?',
            'Are you sure you want to submit this refund request? This will create a support concern for our team to review.',
            'Yes, submit it'
        );

        if (result.isConfirmed) {
            if (!user?.token) {
                showErrorAlert('Error', 'You must be logged in to submit a request.');
                return;
            }

            setIsSubmitting(true);
            try {
                const submitData = new FormData();
                submitData.append('subject', subject);
                submitData.append('category', 'Booth/Event Issue');
                submitData.append('priority', 'High');
                submitData.append('description', `Refund request for Booth #${boothData?.boothCode} at event "${boothData?.event?.title}".\n\nReason:\n${reason}`);
                submitData.append('event', boothData?.event?.title || '');
                
                await concernService.createConcern(submitData, user.token);
                
                showSuccessAlert('Request Submitted!', 'Your refund request has been successfully submitted as a support concern.');
                onClose();
            } catch (error) {
                console.error("Submission error:", error);
                showErrorAlert('Error', error.message || 'Failed to submit refund request.');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    if (!show) return null;

    return (
        <div className="srr-modal-overlay">
            <div className="srr-modal-container">
                <div className="srr-modal-header">
                    <div className="srr-header-left">
                        <h2 className="srr-modal-title">Request Refund</h2>
                    </div>
                    <button className="srr-close-btn" onClick={onClose} disabled={isSubmitting}>
                        <Icon icon="mdi:close" width="24" />
                    </button>
                </div>

                <div className="srr-modal-body">
                    <div className="srr-policy-alert">
                        <Icon icon="mdi:information-outline" width="20" className="srr-alert-icon" />
                        <div className="srr-alert-content">
                            <h5 className="srr-alert-title">Refund Policy</h5>
                            <p className="srr-alert-text small-body-text">
                                Booth refunds are subject to the event's cancellation policy. 
                                Submitting this request will create a support ticket for our team to review.
                            </p>
                        </div>
                    </div>

                    <div className="srr-form">
                        <div className="srr-form-row">
                            <div className="srr-form-group">
                                <label className="small-body-text">Subject</label>
                                <input
                                    type="text"
                                    className="srr-input"
                                    value={subject}
                                    readOnly
                                    disabled
                                />
                            </div>
                        </div>

                        <div className="srr-form-row">
                            <div className="srr-form-group">
                                <label className="small-body-text">Event Name</label>
                                <input type="text" className="srr-input" value={boothData?.event?.title || ''} readOnly disabled />
                            </div>
                            <div className="srr-form-group">
                                <label className="small-body-text">Booth Code</label>
                                <input type="text" className="srr-input" value={boothData?.boothCode || ''} readOnly disabled />
                            </div>
                        </div>

                        <div className="srr-form-group">
                            <label className="small-body-text">Reason for Refund <span className="srr-required">*</span></label>
                            <textarea
                                className="srr-textarea"
                                placeholder="Please explain why you are requesting a refund..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                disabled={isSubmitting}
                            ></textarea>
                        </div>
                    </div>

                    <hr className="srr-divider" />

                    <div className="srr-form-actions">
                        <button className="outlined-button srr-cancel-btn" onClick={onClose} disabled={isSubmitting}>Cancel</button>
                        <button className="primary-button srr-submit-btn" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <><Icon icon="mdi:loading" className="spin" style={{ marginRight: '8px' }} /> Submitting...</>
                            ) : (
                                "Submit Request"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SponsorRequestRefund;
