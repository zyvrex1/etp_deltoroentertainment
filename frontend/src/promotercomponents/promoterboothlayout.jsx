import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import './promoterboothlayout.css';

const PromoterBoothLayout = () => {
    const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState("techstart");
    const [detailPopup, setDetailPopup] = useState(null);
    const eventDropdownRef = useRef(null);

    // Booth Map: 5x5 grid (5 columns, 5 rows). Each cell: null (empty) or { code, type, status, dimensions, bookedBy? }
    const boothGrid = [
        [{ code: "V1", type: "vip", status: "booked", dimensions: "20x20", bookedBy: "Acme Corp" }, { code: "V2", type: "vip", status: "available", dimensions: "20x20" }, null, null, null],
        [null, { code: "C1", type: "corner", status: "available", dimensions: "10x10" }, { code: "I1", type: "inline", status: "available", dimensions: "10x10" }, null, null],
        [null, null, null, { code: "I2", type: "inline", status: "booked", dimensions: "10x10", bookedBy: "TechStart Inc" }, null],
        [null, null, null, null, null],
        [null, null, null, null, null],
    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (eventDropdownRef.current && !eventDropdownRef.current.contains(event.target)) {
                setIsEventDropdownOpen(false);
            }
        };

        if (isEventDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isEventDropdownOpen]);

    const eventOptions = [
        { value: "techstart", label: "TechStart Summit 2024" },
        { value: "techstart_creator", label: "TechStart Summit 2024 Creator Economy Expo SaaS Growth Meetup" },
    ];

    const getSelectedEventLabel = () => {
        const option = eventOptions.find(opt => opt.value === selectedEvent);
        return option ? option.label : "Select Event";
    };

    const handleEventChange = (val) => {
        setSelectedEvent(val);
        setIsEventDropdownOpen(false);
    };

    return (
        <div className="booth-layout-container">
            <div className="booth-layout-header">
                <div className="bl-header-left">
                    <h1 className="bl-title">Booth Layout</h1>
                    <p className="small-body-text bl-header-subtitle">Configure floor map and booth pricing</p>
                </div>
                <div className="bl-header-controls">
                    <div className="bl-filter-dropdown" ref={eventDropdownRef}>
                        <button
                            className="bl-filter-dropdown-btn"
                            onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
                        >
                            <span className="truncate-text">{getSelectedEventLabel()}</span>
                            <Icon
                                icon="mdi:chevron-down"
                                className={`dropdown-icon ${isEventDropdownOpen ? "open" : ""}`}
                            />
                        </button>
                        {isEventDropdownOpen && (
                            <div className="bl-filter-dropdown-menu">
                                {eventOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        className={`bl-filter-dropdown-item ${selectedEvent === option.value ? "active" : ""}`}
                                        onClick={() => handleEventChange(option.value)}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button className="outlined-button bl-action upload-btn">
                        <Icon icon="mdi:upload" /> Upload Map
                    </button>
                    <button className="primary-button bl-action save-btn">
                        <Icon icon="mdi:content-save" /> Save Changes
                    </button>
                </div>
            </div>

            <div className="bl-main-content">
                <div className="bl-event-banner">
                    <div className="bl-banner-info">
                        <h3>TechStart Summit 2024</h3>
                        <p className='small-body-text'>Oct 12, 2024 &bull; Moscone</p>
                    </div>
                    <div className="bl-banner-stats">
                        <div className="bl-stat-item">
                            <h4>5</h4>
                            <span className="bl-stat-label smaller-body-text">Sold</span>
                        </div>
                        <div className="bl-stat-item">
                            <h4>1</h4>
                            <span className="bl-stat-label smaller-body-text">Reserved</span>
                        </div>
                        <div className="bl-stat-item">
                            <h4>4</h4>
                            <span className="bl-stat-label smaller-body-text">Available</span>
                        </div>
                        <div className="bl-stat-item bl-stat-revenue">
                            <h4>$9,500</h4>
                            <span className="bl-stat-label smaller-body-text">Revenue</span>
                        </div>
                    </div>
                </div>

                <div className="bl-content-columns">
                    <div className="bl-left-col">
                        <div className="bl-map-container">
                            <div className="bl-section-header">
                                <h3 className="bl-section-title">Exhibition Hall Layout</h3>
                                <div className="bl-toolbar">
                                    <button className="outlined-button bl-btn bl-btn-icon" aria-label="Zoom in"><Icon icon="mdi:magnify-plus-outline" /></button>
                                    <button className="outlined-button bl-btn bl-btn-icon" aria-label="Zoom out"><Icon icon="mdi:magnify-minus-outline" /></button>
                                </div>
                            </div>
                            <div className="bl-map-wrapper">

                                <div className="bl-booth-grid">
                                    {boothGrid.map((row, ri) =>
                                        row.map((cell, ci) => (
                                            <div
                                                key={`${ri}-${ci}`}
                                                className={`bl-booth-cell ${cell ? `filled status-${cell.status} bl-type-${cell.type}` : "empty"}`}
                                                aria-label={cell ? `Booth ${cell.code}, ${cell.type}, ${cell.status}` : `Empty slot row ${ri + 1} col ${ci + 1}`}
                                                onClick={() => setDetailPopup(cell ? { tooltipKind: "booth", ...cell, ri, ci } : { tooltipKind: "booth-empty", ri, ci })}
                                                role="button"
                                                tabIndex={0}
                                            >
                                                {cell && (
                                                    <span className="bl-booth-code">{cell.code}</span>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="bl-map-legend-bottom">
                                <div className="smaller-body-text bl-legend-item-bottom"><span className="bl-dot bl-dot-green"></span> Available</div>
                                <div className="smaller-body-text bl-legend-item-bottom"><span className="bl-dot bl-dot-red"></span> Unavailable</div>
                                <div className="smaller-body-text bl-legend-item-bottom"><span className="bl-dot bl-dot-yellow"></span> Corner Location</div>
                                <div className="smaller-body-text bl-legend-item-bottom"><span className="bl-dot bl-dot-purple"></span> VIP</div>
                            </div>

                        </div>
                    </div>

                    <div className="bl-right-col">
                        <div className="bl-side-box bl-legend-box">
                            <h4>Legend</h4>
                            <div className="bl-legend-list">
                                <div className="bl-legend-row">
                                    <div className="bl-legend-label">
                                        <div className="bl-legend-color bl-color-available"></div>
                                        <span>Available</span>
                                    </div>
                                    <h5 className="bl-legend-value">4</h5>
                                </div>
                                <div className="bl-legend-row">
                                    <div className="bl-legend-label">
                                        <div className="bl-legend-color bl-color-reserved"></div>
                                        <span>Unavailable</span>
                                    </div>
                                    <h5 className="bl-legend-value">1</h5>
                                </div>
                                <div className="bl-legend-row">
                                    <div className="bl-legend-label">
                                        <div className="bl-legend-color bl-color-VIP"></div>
                                        <span>VIP</span>
                                    </div>
                                    <h5 className="bl-legend-value">5</h5>
                                </div>
                                <div className="bl-legend-row">
                                    <div className="bl-legend-label">
                                        <div className="bl-legend-color bl-color-corner"></div>
                                        <span>Corner Booth</span>
                                    </div>
                                    <h5 className="bl-legend-value">5</h5>
                                </div>
                                <div className="bl-legend-row">
                                    <div className="bl-legend-label">
                                        <div className="bl-legend-color bl-color-inline"></div>
                                        <span>Inline Booth</span>
                                    </div>
                                    <h5 className="bl-legend-value">5</h5>
                                </div>
                            </div>
                        </div>

                        <div className="bl-side-box bl-sponsors-box">
                            <h4>Sponsors with Booths</h4>
                            <div className="bl-sponsors-list">
                                <div className="bl-sponsor-card">
                                    <div className="bl-sponsor-info">
                                        <h5>TechCorp Inc.</h5>
                                        <span className="smaller-body-text bl-sponsor-booth">Booth B-101</span>
                                    </div>
                                    <span className="bl-pill-vip button-label">VIP</span>
                                </div>

                                <div className="bl-sponsor-card">
                                    <div className="bl-sponsor-info">
                                        <h5>Innovate Labs</h5>
                                        <span className="smaller-body-text bl-sponsor-booth">Booth B-203</span>
                                    </div>
                                    <span className="bl-pill-corner button-label">Corner Location</span>
                                </div>

                                <div className="bl-sponsor-card">
                                    <div className="bl-sponsor-info">
                                        <h5>Cloud Systems</h5>
                                        <span className="smaller-body-text bl-sponsor-booth">Booth B-303</span>
                                    </div>
                                    <span className="bl-pill bl-pill-inline button-label">Inline Location</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div >

            {detailPopup &&
                createPortal(
                    <div
                        className="bl-detail-popup-overlay"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="bl-detail-popup-title"
                        onClick={() => setDetailPopup(null)}
                    >
                        <div className="bl-detail-popup-box" onClick={(e) => e.stopPropagation()}>
                            <button
                                type="button"
                                className="bl-detail-popup-close"
                                onClick={() => setDetailPopup(null)}
                                aria-label="Close"
                            >
                                <Icon icon="mdi:close" />
                            </button>
                            <div className="bl-detail-popup-content">
                                {detailPopup.tooltipKind === "booth" && (
                                    <>
                                        <strong id="bl-detail-popup-title">Booth {detailPopup.code}</strong>
                                        <span>Type: {detailPopup.type}</span>
                                        <span>Dimensions: {detailPopup.dimensions}</span>
                                        <span>Status: {detailPopup.status}</span>
                                        {detailPopup.bookedBy && <span>Booked by: {detailPopup.bookedBy}</span>}
                                        <span>Position: Row {detailPopup.ri + 1}, Col {detailPopup.ci + 1}</span>
                                    </>
                                )}
                                {detailPopup.tooltipKind === "booth-empty" && (
                                    <>
                                        <strong id="bl-detail-popup-title">Empty slot</strong>
                                        <span>Position: Row {detailPopup.ri + 1}, Col {detailPopup.ci + 1}</span>
                                        <span>Available for assignment</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </div >
    );
};

export default PromoterBoothLayout;
