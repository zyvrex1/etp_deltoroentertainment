import React from 'react';
import { Icon } from '@iconify/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSponsorCartContext } from '../context/SponsorCartContext';
import { showSuccessAlert } from '../utils/sweetAlert';
import './SponsorConfirmSelection.css';

const SponsorConfirmSelection = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { event, booth, category } = location.state || {};
    const { addToCart } = useSponsorCartContext();

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

    if (!event || !booth) {
        return (
            <div className="sed-error-container">
                <Icon icon="mdi:alert-circle-outline" width="48" />
                <h3>No selection found</h3>
                <p className="small-body-text text-secondary mb-4">Please return to the map and select a booth first.</p>
                <button className="primary-button" onClick={() => navigate(-1)}>Go Back</button>
            </div>
        );
    }

    const facePrice = category?.facePrice || 0;
    const processingFee = facePrice * 0.03; // 3% fee
    const estimatedTax = facePrice * 0.08; // 8% tax
    const total = facePrice + processingFee + estimatedTax;

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
                                    {event.title}
                                </span>

                                <span className="scs-dot mx-2 text-secondary">•</span>

                                <div className="calendar-row">
                                    <Icon icon="mdi:calendar-blank-outline" className="text-secondary" />
                                    <span className="small-body-text text-secondary">
                                        {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
                            <span className="button-label dark-pill">{booth.label || booth.code}</span>
                        </div>
                        <div className="scs-card-body">
                            <div className="scs-grid-2">
                                <div className="scs-detail-item">
                                    <span className="small-body-text block mb-1">Booth Category</span>
                                    <h5 className="block m-0">{category?.priceName || 'Sponsorship Booth'}</h5>
                                </div>
                                <div className="scs-detail-item">
                                    <span className="small-body-text block mb-1">Dimensions</span>
                                    <h5 className="block m-0">{category?.boothSize || booth.boothSize || 'Standard'}</h5>
                                </div>
                                <div className="scs-detail-item mt-4">
                                    <span className="small-body-text block mb-1">Location</span>
                                    <h5 className="block m-0">{event.venue?.name || 'Venue Area'}</h5>
                                </div>
                                <div className="scs-detail-item mt-4">
                                    <span className="small-body-text text-secondary block mb-1">Base Price</span>
                                    <h5 className="block m-0">${facePrice.toLocaleString()}</h5>
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
                            <img
                                src={event.image ? `/uploads/${event.image}` : "/assets/eventbg.jpg"}
                                alt="Event Thumbnail"
                                className="scs-event-thumb"
                            />
                            <div className="scs-event-info">
                                <h5 className="p font-bold text-primary block mb-2">{event.title}</h5>
                                <div className="scs-event-meta mb-1">
                                    <Icon icon="mdi:calendar-blank-outline" className="mr-2" />
                                    <span className="smaller-body-text">
                                        {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                                <div className="scs-event-meta">
                                    <Icon icon="mdi:map-marker-outline" className="mr-2" />
                                    <span className="smaller-body-text">
                                        {event.venue?.name}, {event.venue?.city}, {event.venue?.state}
                                    </span>
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
                                <span className="regular-body-text">Booth Price</span>
                                <h5>${facePrice.toLocaleString()}</h5>
                            </div>
                            <div className="scs-price-row mb-3">
                                <span className="regular-body-text">Processing Fee (3%)</span>
                                <h5>${processingFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h5>
                            </div>
                            <div className="scs-price-row mb-4">
                                <span className="regular-body-text ">Estimated Tax (8%)</span>
                                <h5>${estimatedTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h5>
                            </div>

                            <hr className="scs-divider mb-4" />

                            <div className="scs-price-row mb-4">
                                <h6 className="text-red">Total</h6>
                                <h5>${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h5>
                            </div>

                            <div className="scs-terms-wrapper mb-4">
                                <input type="checkbox" id="scs-terms" className="scs-checkbox" />
                                <label htmlFor="scs-terms" className="h6">
                                    I agree to the <a href="#" className="text-red">Sponsorship Terms & Conditions</a> and <a href="#" className="text-red">Cancellation Policy</a>.
                                </label>
                            </div>

                            <button
                                className="primary-button scs-reserve-btn"
                                onClick={() => {
                                    addToCart({ event, booth, category, total, facePrice, processingFee, estimatedTax });
                                    showSuccessAlert('Added to Cart', `${booth.label || booth.code} has been added to your cart.`);
                                    navigate('/sponsor/cart');
                                }}
                            >
                                Add to Cart <Icon icon="mdi:cart-outline" className="ml-2" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SponsorConfirmSelection;
