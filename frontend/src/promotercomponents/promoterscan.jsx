import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import './promoterscan.css';

const PromoterScan = () => {
    const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState("techstart");
    const eventDropdownRef = useRef(null);

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


    const getSelectedEventLabel = () => {
        const option = eventOptions.find(opt => opt.value === selectedEvent);
        return option ? option.label : "Select Event";
    };

    const handleEventChange = (val) => {
        setSelectedEvent(val);
        setIsEventDropdownOpen(false);
    };

    const recentCheckins = [
        { initials: "SJ", name: "Sarah Jenkins", detail: "VIP Row A,Seat 12", time: "08:45", },
        { initials: "JR", name: "James Rodriguez", detail: "VIP Row A,Seat 12", time: "09:15", },
        { initials: "MC", name: "Michael Chen", detail: "VIP Row A,Seat 12", time: "09:02", color: "#bbf7d0" },
        { initials: "EW", name: "Emma Wilson", detail: "VIP Row A,Seat 12", time: "10:00", color: "#d9f99d" },
        { initials: "EW", name: "Emma Wilson", detail: "VIP Row A,Seat 12", time: "08:30", color: "#d9f99d" },
        { initials: "EW", name: "Emma Wilson", detail: "VIP Row A,Seat 12", time: "08:30", color: "#d9f99d" },

    ];

  const [manualCheckins, setManualCheckins] = useState([
    { initials: "SJ", name: "Sarah Jenkins", email: "sarah@example.com", pill: "VIP A-12", type: "vip", time: null, status: "pending", undoCount: 0 },
    { initials: "EA", name: "Ehdsell Apan", email: "ehdsell@example.com", pill: "GenAd C-1", type: "gen", time: null, status: "pending", undoCount: 0 },
    { initials: "ZP", name: "Zyvrex Perez", email: "zyvrex@example.com", pill: "EarlyBird E-1", type: "early", time: null, status: "pending", undoCount: 0 },
    { initials: "SS", name: "Somebody Son", email: "somebody@example.com", pill: "EarlyBird E-1", type: "early", time: null, status: "pending", undoCount: 0 },
    { initials: "SS", name: "Somebody Son", email: "somebody@example.com", pill: "EarlyBird E-1", type: "early", time: null, status: "pending", undoCount: 0 },
    { initials: "SS", name: "Somebody Son", email: "somebody@example.com", pill: "EarlyBird E-1", type: "early", time: null, status: "pending", undoCount: 0 },


]);

const handleCheckIn = (index) => {
    const updated = [...manualCheckins];

    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    updated[index].status = "checked";
    updated[index].time = formattedTime;
    updated[index].undoCount = 0; // reset undo count every new check in

    setManualCheckins(updated);
};

const handleUndo = (index) => {
    const updated = [...manualCheckins];

    if (updated[index].undoCount < 2) {
        updated[index].status = "pending";
        updated[index].time = null;
        updated[index].undoCount += 1;

        setManualCheckins(updated);
    } else {
        alert("Maximum undo attempts reached (2 only).");
    }
};

    const ticketStats = [
        { name: "VIP Access", count: "2 / 2", progress: "100%" },
        { name: "General Admission", count: "2 / 3", progress: "66%" },
        { name: "Early Bird", count: "1 / 1", progress: "100%" },
        { name: "Workshop Pass", count: "0 / 1", progress: "0%" },
    ];

    return (
        <div className="scan-container">
            <div className="scan-header">
                <div className="sc-header-left">
                    <h1 className="sc-title">Event Check-In</h1>
                    <p className="small-body-text sc-header-subtitle">Scan tickets and manage attendee entry</p>
                </div>
                <div className="sc-header-controls">
                </div>
            </div>

            <div className="sc-main-content">
                <div className="sc-event-banner">
                    <div className="sc-banner-top">
                        <div className="sc-banner-info">
                            <h3>TechStart Summit 2026</h3>
                            <p className="small-body-text">June 16, 2026 &bull; Moscone</p>
                        </div>
                        <div className="sc-banner-stats">
                            <div className="sc-stat-item">
                                <h4 className="sc-text-green">550</h4>
                                <span className="sc-stat-label smaller-body-text">Checked in</span>
                            </div>
                            <div className="sc-stat-item">
                                <h4>600</h4>
                                <span className="sc-stat-label smaller-body-text">Total Registered</span>
                            </div>
                            <div className="sc-stat-item">
                                <h4>92%</h4>
                                <span className="sc-stat-label smaller-body-text">Attendance</span>
                            </div>
                        </div>
                    </div>
                    <div className="sc-banner-progress-bar">
                        <div className="sc-progress-fill" style={{ width: "92%" }}></div>
                    </div>
                </div>

                <div className="sc-content-columns">
                    <div className="sc-left-col">
                        <div className="sc-card sc-scan-box">
                            <div className="sc-scan-icon-container">
                                <Icon icon="mdi:qrcode-scan" className="sc-scan-icon" />
                            </div>
                            <h4>Ready to Scan</h4>
                            <p className="small-body-text sc-scan-text">Point your camera at a ticket QR code or use manual search below.</p>
                            <button className="primary-button sc-sim-scan">Simulate Scan</button>
                        </div>

                        <div className="sc-card sc-recent-box">
                            <h4>Recent Check-ins</h4>
                            <div className="sc-recent-list">
                                {recentCheckins.map((item, index) => (
                                    <div className="sc-recent-item" key={index}>
                                        <div className="sc-recent-left">
                                            <div className="sc-avatar">
                                                {item.initials}
                                            </div>
                                            <div className="sc-recent-info">
                                                <h6 className="sc-name">{item.name}</h6>
                                                <span className="smaller-body-text sc-sub">{item.detail}</span>
                                            </div>
                                        </div>
                                        <div className="sc-recent-right">
                                            <Icon icon="mdi:check-circle-outline" className="sc-check-icon" />
                                            <span className="smaller-body-text sc-time">{item.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="sc-right-col">
                        <div className="sc-card sc-manual-box">
                            <h4>Manual Check-in</h4>
                            <div className="sc-search-container">
                                <input type="text" className="sc-search-input" placeholder="Search by name" />
                            </div>
                            <div className="sc-manual-list">
                                {manualCheckins.map((item, index) => (
                                    <div className="sc-manual-item" key={index}>
                                        <div className="sc-manual-left">
                                            <div className="sc-avatar">
                                                {item.initials}
                                            </div>
                                            <div className="sc-manual-info">
                                                <h6 className="sc-name">{item.name}</h6>
                                                <span className="smaller-body-text sc-email">{item.email}</span>
                                            </div>
                                            <div className={`button-label sc-pill-${item.type} button-label`}>
                                                {item.pill}
                                            </div>
                                        </div>
                                        <div className="sc-manual-right">
                                            {item.status === "checked" ? (
    <>
        <div className="sc-check-status">
            <Icon icon="mdi:check-circle-outline" className="sc-check-icon" />
            <span className="smaller-body-text sc-time">{item.time}</span>
        </div>
        <button 
            className="sc-undo-btn small-body-text"
            onClick={() => handleUndo(index)}
        >
            Undo ({2 - item.undoCount} left)
        </button>
    </>
) : (
    <button 
        className="primary-button sc-checkin-btn"
        onClick={() => handleCheckIn(index)}
    >
        Check in
    </button>
)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="sc-card sc-ticket-type-box">
                            <h4>Check-in by Ticket Type</h4>
                            <div className="sc-ticket-stats-list">
                                {ticketStats.map((stat, index) => (
                                    <div className="sc-stat-row" key={index}>
                                        <div className="sc-stat-row-top">
                                            <h6 className="sc-stat-name">{stat.name}</h6>
                                            <span className="smaller-body-text sc-stat-count">{stat.count}</span>
                                        </div>
                                        <div className="sc-stat-progress-bar">
                                            <div className="sc-stat-fill" style={{ width: stat.progress }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromoterScan;
