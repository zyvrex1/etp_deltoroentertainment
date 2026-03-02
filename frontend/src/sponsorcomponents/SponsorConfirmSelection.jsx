import React from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import './SponsorConfirmSelection.css';

const SponsorConfirmSelection = () => {
    const navigate = useNavigate();

    return (
        <div className="scs-page-wrapper">
            <div className="scs-header-top">
                <div className="scs-header-content">
                    <div className="scs-header-left">
                        <button className="scs-back-btn" onClick={() => navigate(-1)}>
                            <Icon icon="mdi:arrow-left" />
                        </button>
                        <div>
                            <h2 className="text-primary">Confirm Your Selection</h2>

                            <div className="scs-subtitle mt-1">
                                <span className="small-body-text text-secondary">
                                    TechInnovate Summit 2026
                                </span>

                                <span className="scs-dot mx-2 text-secondary">•</span>

                                <div className="calendar-row">
                                    <Icon icon="mdi:calendar-blank-outline" className="text-secondary" />
                                    <span className="small-body-text text-secondary">
                                        Jun 16, 2026
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="scs-header-right">
                        <div className="scs-step-info">
                            <span className="small-body-text font-bold text-primary mr-4">
                                Confirmation
                            </span>

                            <div className="scs-step-progress">
                                <span className="smaller-body-text text-secondary mb-1 block text-right">
                                    Step 2 of 4
                                </span>

                                <div className="scs-progress-bar-container">
                                    <div
                                        className="scs-progress-bar"
                                        style={{ width: '50%' }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="scs-main-container">
                <div className="scs-content-left">
                    <div className="scs-card mb-4">
                        <div className="scs-card-header dark-header">
                            <h5 className="font-bold text-white block">Selected Booth</h5>
                            <span className="button-label dark-pill">#102</span>
                        </div>
                        <div className="scs-card-body">
                            <div className="scs-grid-2">
                                <div className="scs-detail-item">
                                    <span className="small-body-text block mb-1">Booth Type</span>
                                    <h5 className="block m-0">Premium Island</h5>
                                </div>
                                <div className="scs-detail-item">
                                    <span className="small-body-text block mb-1">Dimensions</span>
                                    <h5 className="block m-0">20×20</h5>
                                </div>
                                <div className="scs-detail-item mt-4">
                                    <span className="small-body-text block mb-1">Location</span>
                                    <h5 className="block m-0">Near Main Entrance</h5>
                                </div>
                                <div className="scs-detail-item mt-4">
                                    <span className="small-body-text text-secondary block mb-1">Base Price</span>
                                    <h5 className="block m-0">$5,000</h5>
                                </div>
                            </div>

                            <div className="scs-guarantee-box mt-4">
                                <Icon icon="mdi:shield-check-outline" className="scs-shield-icon mx-2" />
                                <div>
                                    <h5 className="block mb-1">Reservation Guarantee</h5>
                                    <span className="small-body-text block">Your booth selection will be held for 15 minutes once you proceed to the reservation step.</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="scs-card mt-4">
                        <div className="scs-card-body pb-0 pt-4">
                            <h4 className="block">Event Details</h4>
                        </div>
                        <hr className="scs-divider mx-0 my-0" />
                        <div className="scs-event-details">
                            <img src="/assets/eventbg.jpg" alt="Event Thumbnail" className="scs-event-thumb" />
                            <div className="scs-event-info">
                                <h5 className="p font-bold text-primary block mb-2">TechInnovate Summit 2026</h5>
                                <div className="scs-event-meta mb-1">
                                    <Icon icon="mdi:calendar-blank-outline" className="mr-2" />
                                    <span className="smaller-body-text">Jun 16, 2026</span>
                                </div>
                                <div className="scs-event-meta">
                                    <Icon icon="mdi:map-marker-outline" className="mr-2" />
                                    <span className="smaller-body-text">Starlight Arena, Los Angeles, CA</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="scs-content-right">
                    <div className="scs-card">
                        <div className="scs-card-body">
                            <h4 className="mb-4 block">Price Breakdown</h4>

                            <div className="scs-price-row mb-3">
                                <span className="small-body-text">Booth Price</span>
                                <h5>$5,000</h5>
                            </div>
                            <div className="scs-price-row mb-3">
                                <span className="small-body-text">Processing Fee</span>
                                <h5>$150</h5>
                            </div>
                            <div className="scs-price-row mb-4">
                                <span className="small-body-text ">Estimated Tax</span>
                                <h5>$425</h5>
                            </div>

                            <hr className="scs-divider mb-4" />

                            <div className="scs-price-row mb-4">
                                <h6 className="text-red">Total</h6>
                                <h5>$5,575</h5>
                            </div>

                            <div className="scs-terms-wrapper mb-4">
                                <input type="checkbox" id="scs-terms" className="scs-checkbox" />
                                <label htmlFor="scs-terms" className="h6">
                                    I agree to the <a href="#" className="text-red">Sponsorship Terms & Conditions</a> and <a href="#" className="text-red">Cancellation Policy</a>.
                                </label>
                            </div>

                            <button className="primary-button scs-reserve-btn">
                                Reserve Booth <Icon icon="mdi:arrow-right" className="ml-2" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SponsorConfirmSelection;
