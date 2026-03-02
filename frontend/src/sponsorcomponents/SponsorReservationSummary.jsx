import React from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import './SponsorReservationSummary.css';

const SponsorReservationSummary = () => {
    const navigate = useNavigate();

    return (
        <div className="srs-page-wrapper">
            <div className="srs-header-top">
                <div className="srs-header-content">
                    <div className="srs-header-left">
                        <button className="srs-back-btn" onClick={() => navigate(-1)}>
                            <Icon icon="mdi:arrow-left" />
                        </button>
                        <div>
                            <h2 className="text-primary">Confirm Your Selection</h2>
                            <div className="srs-subtitle mt-1">
                                <span className="small-body-text text-secondary">
                                    Review your booth details and accept terms to proceed to reservation.
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="srs-header-right">
                        <div className="srs-step-info">
                            <span className="small-body-text font-bold text-primary mr-4">
                                Confirmation Summary
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
                            <h5>11:10</h5>
                        </div>
                    </div>

                    <div className="srs-card-content">
                        <div className="srs-success-icon-container">
                            <div className="srs-success-circle">
                                <Icon icon="mdi:check-circle" className="srs-check-icon" />
                            </div>
                        </div>
                        <h3 className="text-center mt-3 mb-1">Reservation Summary</h3>
                        <p className="text-secondary text-center small-body-text mb-4">Your booth #102 is reserved pending payment.</p>

                        <div className="srs-order-details-box">
                            <div className="srs-order-section pb-2">
                                <h5 className="text-primary mb-3">Order Details</h5>
                                <div className="srs-order-row">
                                    <div className="srs-order-col">
                                        <span className="smaller-body-text text-secondary">Event</span>
                                        <h6 className="mt-1">TechInnovate Summit 2026</h6>
                                    </div>
                                    <div className="srs-order-col text-right">
                                        <span className="smaller-body-text text-secondary">Date</span>
                                        <h6 className="mt-1">Oct 15-17, 2026</h6>
                                    </div>
                                </div>
                            </div>

                            <div className="srs-order-section srs-bg-light">
                                <div className="srs-order-row mb-2">
                                    <div>
                                        <h6>Premium Island Booth #102</h6>
                                        <span className="smaller-body-text">20x20 • Near Main Entrance</span>
                                    </div>
                                    <h5>$5,000.00</h5>
                                </div>
                                <hr className="srs-divider mx-0 my-0" />

                                <div className="srs-order-row mb-2">
                                    <span className="small-body-text text-secondary">Processing Fee</span>
                                    <h5 >$150.00</h5>
                                </div>
                                <div className="srs-order-row">
                                    <span className="small-body-text text-secondary">Tax</span>
                                    <h5>$425.00</h5>
                                </div>
                            </div>
                        </div>

                        <div className="srs-total-row my-4">
                            <h6>Total Due Now</h6>
                            <h5>$5,575.00</h5>
                        </div>

                        <div className="srs-buttons-row">
                            <button className="primary-button srs-reserve-btn" onClick={() => navigate('/sponsor/sponsor-venue-billing')}>
                                Reserve Booth <Icon icon="mdi:arrow-right" className="ml-2" />
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
