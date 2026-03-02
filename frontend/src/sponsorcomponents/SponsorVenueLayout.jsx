import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import './SponsorVenueLayout.css';

const SponsorVenueLayout = () => {
    const navigate = useNavigate();
    const [selectedBooth, setSelectedBooth] = useState('102');
    const [detailPopup, setDetailPopup] = useState(null);

    const handleConfirm = () => {
        navigate('/sponsor/sponsor-confirm-selection'); // Or wherever it routes
    };

    const handleBoothClick = (booth) => {
        setSelectedBooth(booth.id);
        setDetailPopup(booth);
    };

    const booths = [
        // Top Row (Premium Island), gridRow: 1
        { id: '101', class: 'red', style: { gridColumn: '1 / span 5', gridRow: '1' }, name: 'Booth #101', status: 'Unavailable', type: 'Premium Island', price: '$5,000', dimensions: '20x20', position: 'Row 1, Col 1' },
        { id: '102', class: 'blue', style: { gridColumn: '6 / span 5', gridRow: '1' }, name: 'Booth #102', status: 'Available', type: 'Premium Island', price: '$5,000', dimensions: '20x20', position: 'Row 1, Col 2' },
        { id: '103', class: 'purple', style: { gridColumn: '11 / span 5', gridRow: '1' }, name: 'Booth #103', status: 'VIP', type: 'Premium Island', price: '$8,000', dimensions: '20x20', position: 'Row 1, Col 3' },
        { id: '104', class: 'purple', style: { gridColumn: '16 / span 5', gridRow: '1' }, name: 'Booth #104', status: 'VIP', type: 'Premium Island', price: '$8,000', dimensions: '20x20', position: 'Row 1, Col 4' },

        // Middle Row 1 (Standard/Corner), gridRow: 3
        { id: '201', class: 'yellow', style: { gridColumn: '1 / span 2', gridRow: '3' }, name: 'Booth #201', status: 'Corner Location', type: 'Corner Booth', price: '$3,000', dimensions: '10x10', position: 'Row 2, Col 1' },
        { id: '202', class: 'green', style: { gridColumn: '3 / span 2', gridRow: '3' }, name: 'Booth #202', status: 'Available', type: 'Standard Booth', price: '$2,500', dimensions: '10x10', position: 'Row 2, Col 2' },
        // Aisle: Col 5, 6
        { id: '301', class: 'yellow', style: { gridColumn: '7 / span 2', gridRow: '3' }, name: 'Booth #301', status: 'Corner Location', type: 'Corner Booth', price: '$3,000', dimensions: '10x10', position: 'Row 2, Col 3' },
        { id: '302', class: 'green', style: { gridColumn: '9 / span 2', gridRow: '3' }, name: 'Booth #302', status: 'Available', type: 'Standard Booth', price: '$2,500', dimensions: '10x10', position: 'Row 2, Col 4' },
        { id: '303', class: 'green', style: { gridColumn: '11 / span 2', gridRow: '3' }, name: 'Booth #303', status: 'Available', type: 'Standard Booth', price: '$2,500', dimensions: '10x10', position: 'Row 2, Col 5' },
        { id: '304', class: 'red', style: { gridColumn: '13 / span 2', gridRow: '3' }, name: 'Booth #304', status: 'Unavailable', type: 'Standard Booth', price: '$2,500', dimensions: '10x10', position: 'Row 2, Col 6' },
        // Aisle: Col 15, 16
        { id: '401', class: 'green', style: { gridColumn: '17 / span 2', gridRow: '3' }, name: 'Booth #401', status: 'Available', type: 'Standard Booth', price: '$2,500', dimensions: '10x10', position: 'Row 2, Col 7' },
        { id: '402', class: 'yellow', style: { gridColumn: '19 / span 2', gridRow: '3' }, name: 'Booth #402', status: 'Corner Location', type: 'Corner Booth', price: '$3,000', dimensions: '10x10', position: 'Row 2, Col 8' },

        // Middle Row 2 (Standard/Corner), gridRow: 4
        { id: '203', class: 'red', style: { gridColumn: '1 / span 2', gridRow: '4' }, name: 'Booth #203', status: 'Unavailable', type: 'Standard Booth', price: '$2,500', dimensions: '10x10', position: 'Row 3, Col 1' },
        { id: '204', class: 'green', style: { gridColumn: '3 / span 2', gridRow: '4' }, name: 'Booth #204', status: 'Available', type: 'Standard Booth', price: '$2,500', dimensions: '10x10', position: 'Row 3, Col 2' },

        { id: '305', class: 'yellow', style: { gridColumn: '7 / span 2', gridRow: '4' }, name: 'Booth #305', status: 'Corner Location', type: 'Corner Booth', price: '$3,000', dimensions: '10x10', position: 'Row 3, Col 3' },
        { id: '306', class: 'green', style: { gridColumn: '9 / span 2', gridRow: '4' }, name: 'Booth #306', status: 'Available', type: 'Standard Booth', price: '$2,500', dimensions: '10x10', position: 'Row 3, Col 4' },
        { id: '307', class: 'green', style: { gridColumn: '11 / span 2', gridRow: '4' }, name: 'Booth #307', status: 'Available', type: 'Standard Booth', price: '$2,500', dimensions: '10x10', position: 'Row 3, Col 5' },
        { id: '308', class: 'yellow', style: { gridColumn: '13 / span 2', gridRow: '4' }, name: 'Booth #308', status: 'Corner Location', type: 'Corner Booth', price: '$3,000', dimensions: '10x10', position: 'Row 3, Col 6' },

        { id: '403', class: 'red', style: { gridColumn: '17 / span 2', gridRow: '4' }, name: 'Booth #403', status: 'Unavailable', type: 'Standard Booth', price: '$2,500', dimensions: '10x10', position: 'Row 3, Col 7' },
        { id: '404', class: 'yellow', style: { gridColumn: '19 / span 2', gridRow: '4' }, name: 'Booth #404', status: 'Corner Location', type: 'Corner Booth', price: '$3,000', dimensions: '10x10', position: 'Row 3, Col 8' },

        // Bottom Row (VIP), gridRow: 6
        { id: '501', class: 'purple', style: { gridColumn: '5 / span 4', gridRow: '6' }, name: 'Booth #501', status: 'VIP', type: 'VIP Booth', price: '$8,000', dimensions: '30x20', position: 'Row 4, Col 1' },
        { id: '502', class: 'purple', style: { gridColumn: '9 / span 4', gridRow: '6' }, name: 'Booth #502', status: 'VIP', type: 'VIP Booth', price: '$8,000', dimensions: '30x20', position: 'Row 4, Col 2' },
        { id: '503', class: 'purple', style: { gridColumn: '13 / span 4', gridRow: '6' }, name: 'Booth #503', status: 'VIP', type: 'VIP Booth', price: '$8,000', dimensions: '30x20', position: 'Row 4, Col 3' },
    ];

    const currentSelectedBoothData = booths.find(b => b.id === selectedBooth) || booths[1];

    return (
        <div className="svl-page-wrapper">
            <div className="svl-header-top">
                <div className="svl-header-content">
                    <div className="svl-header-left">
                        <button className="svl-back-btn" onClick={() => navigate(-1)}>
                            <Icon icon="mdi:arrow-left" />
                        </button>
                        <div>
                            <h2 className="text-primary">Select Your Booth</h2>
                            <div className="svl-subtitle mt-1">
                                <span className="small-body-text text-secondary">TechInnovate Summit 2024</span>
                                <span className="svl-dot mx-2 text-secondary">•</span>
                                <div className="calendar-row">
                                    <Icon icon="mdi:calendar-blank-outline" className="text-secondary" />
                                    <span className="small-body-text text-secondary">Jun 16, 2026</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="svl-header-right">
                        <div className="svl-step-info">
                            <span className="small-body-text font-bold text-primary mr-4">Booth Selection</span>
                            <div className="svl-step-progress">
                                <span className="smaller-body-text text-secondary mb-1 block text-right">Step 1 of 4</span>
                                <div className="svl-progress-bar-container">
                                    <div className="svl-progress-bar" style={{ width: '25%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="svl-main-container">
                <div className="svl-content-left">
                    <div className="svl-info-box mb-4">
                        <Icon icon="mdi:information-outline" className="text-blue" />
                        <span className="small-body-text text-primary">
                            Click on any except for <span className="text-red font-bold">red</span> booth to select it. Use the zoom controls to explore the floor plan in detail.
                        </span>
                    </div>

                    <div className="svl-map-container">
                        <div className="svl-zoom-controls">
                            <button><Icon icon="mdi:magnify-plus-outline" /></button>
                            <button><Icon icon="mdi:magnify-minus-outline" /></button>
                            <button><Icon icon="mdi:fullscreen" /></button>
                        </div>

                        <div className="svl-map-wrapper">
                            <div className="svl-map-grid">
                                {booths.map((booth) => (
                                    <div
                                        key={booth.id}
                                        className={`svl-booth ${booth.class} ${selectedBooth === booth.id ? 'selected' : ''}`}
                                        style={booth.style}
                                        onClick={() => handleBoothClick(booth)}
                                    >
                                        {booth.id}
                                    </div>
                                ))}
                            </div>
                        </div>


                        <div className="svl-legend">
                            <div className="svl-legend-item"><span className="svl-dot-icon green"></span>Available</div>
                            <div className="svl-legend-item"><span className="svl-dot-icon red"></span>Unavailable</div>
                            <div className="svl-legend-item"><span className="svl-dot-icon blue"></span>Selected</div>
                            <div className="svl-legend-item"><span className="svl-dot-icon yellow"></span>Corner Location</div>
                            <div className="svl-legend-item"><span className="svl-dot-icon purple"></span>VIP</div>
                        </div>
                    </div>
                </div>

                <div className="svl-content-right">
                    <div className="svl-summary-card">
                        <h4 className="text-primary mb-4 block">Selection Summary</h4>

                        <div className="svl-summary-header">
                            <span className="blue-pill button-label">Selected</span>
                            <h4 className="text-red">{currentSelectedBoothData?.price || '$5,000'}</h4>
                        </div>

                        <div className="svl-booth-title">
                            <h3 className="text-primary">{currentSelectedBoothData?.name || 'Booth #102'}</h3>
                            <p className="smaller-body-text text-secondary mt-1">{currentSelectedBoothData?.type || 'Premium Island'}</p>
                        </div>

                        <hr className="svl-divider" />

                        <div className="svl-dim-row">
                            <span className="smaller-body-text text-secondary">Dimensions</span>
                            <span className="smaller-body-text text-secondary">{currentSelectedBoothData?.dimensions || '20x20'}</span>
                        </div>

                        <div className="svl-features">
                            <span className="smaller-body-text font-bold text-secondary">KEY FEATURES</span>
                            <ul className="svl-feature-list">
                                <li><span className="svl-dot-icon small-green small"></span><span className="smaller-body-text text-secondary">High Visibility</span></li>
                                <li><span className="svl-dot-icon small-green small"></span><span className="smaller-body-text text-secondary">Near Entrance</span></li>
                                <li><span className="svl-dot-icon small-green small"></span><span className="smaller-body-text text-secondary">Power Included</span></li>
                            </ul>
                        </div>

                        <button className="primary-button svl-confirm-btn" onClick={handleConfirm}>
                            Confirm Selection
                        </button>
                        <p className="smaller-body-text text-secondary text-center">You can review details in the next step</p>
                    </div>
                </div>
            </div>

            {detailPopup &&
                createPortal(
                    <div
                        className="svl-detail-popup-overlay"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="svl-detail-popup-title"
                        onClick={() => setDetailPopup(null)}
                    >
                        <div className="svl-detail-popup-box" onClick={(e) => e.stopPropagation()}>
                            <button
                                type="button"
                                className="svl-detail-popup-close"
                                onClick={() => setDetailPopup(null)}
                                aria-label="Close"
                            >
                                <Icon icon="mdi:close" />
                            </button>
                            <div className="svl-detail-popup-content">
                                <strong id="svl-detail-popup-title" className="h5 text-primary svl-popup-title">{detailPopup.name}</strong>
                                <span className="svl-popup-status"><span className={`svl-dot-icon ${detailPopup.class}`}></span> {detailPopup.status}</span>
                                <span><strong className="text-black">Type:</strong> {detailPopup.type}</span>
                                <span><strong className="text-black">Dimensions:</strong> {detailPopup.dimensions}</span>
                                <span><strong className="text-black">Price:</strong> {detailPopup.price}</span>
                                <span><strong className="text-black">Position:</strong> {detailPopup.position}</span>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

        </div>
    );
};

export default SponsorVenueLayout;
