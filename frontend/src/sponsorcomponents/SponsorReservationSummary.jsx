import React from 'react';
import { Icon } from '@iconify/react';
import { useNavigate, useLocation } from 'react-router-dom';
import './SponsorReservationSummary.css';

const SponsorReservationSummary = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { event, booth, category, total } = location.state || {};

    if (!event || !booth) {
        return (
            <div className="sed-error-container">
                <Icon icon="mdi:alert-circle-outline" width="48" />
                <h3>No reservation data found</h3>
                <p className="small-body-text text-secondary mb-4">Please return to the map to select a booth.</p>
                <button className="primary-button" onClick={() => navigate('/sponsor/sponsor-events')}>Browse Events</button>
            </div>
        );
    }

    const facePrice = category?.facePrice || 0;
    const processingFee = facePrice * 0.03;
    const estimatedTax = facePrice * 0.08;

    return (
        <div className="srs-page-wrapper">
            <div className="srs-header-top">
                <div className="srs-header-content">
                    <div className="srs-header-left">
                        <button className="srs-back-btn" onClick={() => navigate(-1)}>
                            <Icon icon="mdi:arrow-left" />
                        </button>
                        <div>
                            <h2 className="text-primary">Reservation Summary</h2>
                            <div className="srs-subtitle mt-1">
                                <span className="small-body-text text-secondary">
                                    Review your booth details and proceed to secure your reservation.
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="srs-header-right">
                        <div className="srs-step-info">
                            <span className="small-body-text font-bold text-primary mr-4">
                                Summary
                            </span>

                            <div className="srs-step-progress">
                                <span className="smaller-body-text text-secondary mb-1 block text-right">
                                    Step 3 of 4
                                </span>

                                <div className="srs-progress-bar-container">
                                    <div
                                        className="srs-progress-bar"
                                        style={{ width: '75%' }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="srs-main-container">
                <div className="srs-card">
                    <div className="srs-timer-banner">
                        <div className="srs-timer-banner-left">
                            <Icon icon="mdi:clock-outline" className="srs-clock-icon text-red" />
                            <div>
                                <h5 className="text-white m-0">Booth Temporarily Locked</h5>
                                <span className="smaller-body-text text-white">Please complete payment to secure your reservation.</span>
                            </div>
                        </div>
                        <div className="srs-timer-banner-right">
                            <h5>15:00</h5>
                        </div>
                    </div>

                    <div className="srs-card-content">
                        <div className="srs-success-icon-container">
                            <div className="srs-success-circle">
                                <Icon icon="mdi:check-circle" className="srs-check-icon" />
                            </div>
                        </div>
                        <h3 className="text-center mt-3 mb-1">Reservation Summary</h3>
                        <p className="text-secondary text-center small-body-text mb-4">Your booth #{booth.label || booth.code} is selected ready for reservation.</p>

                        <div className="srs-order-details-box">
                            <div className="srs-order-section pb-2">
                                <h5 className="text-primary mb-3">Order Details</h5>
                                <div className="srs-order-row">
                                    <div className="srs-order-col">
                                        <span className="smaller-body-text text-secondary">Event</span>
                                        <h6 className="mt-1">{event.title}</h6>
                                    </div>
                                    <div className="srs-order-col text-right">
                                        <span className="smaller-body-text text-secondary">Date</span>
                                        <h6 className="mt-1">{new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</h6>
                                    </div>
                                </div>
                            </div>

                            <div className="srs-order-section srs-bg-light">
                                <div className="srs-order-row mb-2">
                                    <div>
                                        <h6>{category?.priceName || 'Booth'} #{booth.label || booth.code}</h6>
                                        <span className="smaller-body-text">{category?.boothSize || 'Standard'} • {event.venue?.name}</span>
                                    </div>
                                    <h5>${facePrice.toLocaleString()}</h5>
                                </div>
                                <hr className="srs-divider mx-0 my-0" />

                                <div className="srs-order-row mb-2">
                                    <span className="small-body-text text-secondary">Processing Fee</span>
                                    <h5 >${processingFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h5>
                                </div>
                                <div className="srs-order-row">
                                    <span className="small-body-text text-secondary">Tax</span>
                                    <h5>${estimatedTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h5>
                                </div>
                            </div>
                        </div>

                        <div className="srs-total-row my-4">
                            <h6>Total Due Now</h6>
                            <h5>${total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</h5>
                        </div>

                        <div className="srs-buttons-row">
                            <button
                                className="primary-button srs-reserve-btn"
                                onClick={() => navigate('/sponsor/sponsor-venue-billing', { state: { event, booth, category, total } })}
                            >
                                Proceed to Billing <Icon icon="mdi:arrow-right" className="ml-2" />
                            </button>
                            <button className="button srs-cancel-btn" onClick={() => navigate(-1)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>

                <div className="srs-info-box mt-4">
                    <Icon icon="mdi:information-outline" className="srs-info-icon" />
                    <span className="small-body-text text-blue">
                        <strong>Note:</strong> If payment is not completed within the time limit, the booth will be released back to the available pool for other sponsors.
                    </span>
                </div>
            </div>
        </div>
    );
};

export default SponsorReservationSummary;
