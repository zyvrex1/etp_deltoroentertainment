import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import './promotersponsors.css';

const PromoterSponsors = () => {
    const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState("techstart");
    const [activeFilter, setActiveFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
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

    const eventOptions = [
        { value: "techstart", label: "TechStart Summit 2026" },
        { value: "techstart_creator", label: "TechStart Summit 2026 Creator Economy Expo SaaS Growth Meetup" },
    ];

    const getSelectedEventLabel = () => {
        const option = eventOptions.find(opt => opt.value === selectedEvent);
        return option ? option.label : "Select Event";
    };

    const handleEventChange = (val) => {
        setSelectedEvent(val);
        setIsEventDropdownOpen(false);
    };

    const sponsorStats = [
        { type: "VIP", count: "5", checkins: "1 checked in", colorClass: "text-purple", bgClass: "bg-purple-light" },
        { type: "Corner Location", count: "1", checkins: "1 checked in", colorClass: "text-yellow", bgClass: "bg-yellow-light" },
        { type: "Inline Location", count: "1", checkins: "1 checked in", colorClass: "text-green", bgClass: "bg-green-light" }
    ];

    const sponsorsData = [
        { initials: "SJ", name: "Sarah Jenkins", email: "Tech Corp", boothPill: "VIP 101", date: "2026-04-19", status: "Checked In", statusType: "checked", time: "2026-06-16 08:45" },
        { initials: "MC", name: "Michael Chen", email: "Tech Corp", boothPill: "Inline Location", date: "2026-01-12", status: "Checked In", statusType: "checked", time: "2026-06-16 08:50" },
        { initials: "MC", name: "Michael Chen", email: "Innovate Labs", boothPill: "Corner Locationt", date: "2026-01-15", status: "Checked In", statusType: "checked", time: "2026-06-16 09:05" },
        { initials: "MC", name: "Michael Chen", email: "Innovate Labs", boothPill: "VIP 101", date: "2026-02-14", status: "Registered", statusType: "pending", time: "---" },
        { initials: "MC", name: "Michael Chen", email: "Cloud Systems", boothPill: "Corner Locationt", date: "2026-01-12", status: "Checked In", statusType: "checked", time: "2026-06-16 09:25" },
        { initials: "MC", name: "Michael Chen", email: "Cloud Systems", boothPill: "Corner Locationt", date: "2026-01-12", status: "Checked In", statusType: "checked", time: "2026-06-16 09:25" },

    ];

    const filteredData = sponsorsData.filter((row) => {
        if (activeFilter === "All") return true;
        if (activeFilter === "Checked In") return row.statusType === "checked";
        if (activeFilter === "Pending") return row.statusType === "pending";
        return true;
    });

    const counts = {
        all: sponsorsData.length,
        checked: sponsorsData.filter(row => row.statusType === "checked").length,
        pending: sponsorsData.filter(row => row.statusType === "pending").length,
    }

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
        setCurrentPage(1);
    };


    return (
        <div className="spon-container">
            <div className="spon-header">
                <div className="spon-header-left">
                    <h1 className="spon-title">Sponsors & Exhibitors</h1>
                    <p className="small-body-text spon-header-subtitle">Manage event sponsors and their booths</p>
                </div>
                <div className="spon-header-controls">
                    <div className="spon-filter-dropdown" ref={eventDropdownRef}>
                        <button
                            className="spon-filter-dropdown-btn"
                            onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
                        >
                            <span className="truncate-text">{getSelectedEventLabel()}</span>
                            <Icon
                                icon="mdi:chevron-down"
                                className={`dropdown-icon ${isEventDropdownOpen ? "open" : ""}`}
                            />
                        </button>
                        {isEventDropdownOpen && (
                            <div className="spon-filter-dropdown-menu">
                                {eventOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        className={`spon-filter-dropdown-item ${selectedEvent === option.value ? "active" : ""}`}
                                        onClick={() => handleEventChange(option.value)}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button className="outlined-button spon-export-btn">
                        <Icon icon="mdi:tray-arrow-down" className="export-icon" />
                        Export List
                    </button>
                </div>
            </div>

            <div className="spon-main-content">
                <div className="spon-event-banner">
                    <div className="spon-banner-left">
                        <h3>TechStart Summit 2026</h3>
                        <p className="small-body-text">June 16, 2026 &bull; Moscone</p>
                    </div>
                    <div className="spon-banner-stats">
                        <div className="spon-stat-item">
                            <h4 className="text-green-stat">$30,500</h4>
                            <span className="spon-stat-label smaller-body-text">Sponsorship Revenue</span>
                        </div>
                        <div className="spon-stat-item">
                            <h4>7</h4>
                            <span className="spon-stat-label smaller-body-text">Total Sponsors</span>
                        </div>
                    </div>
                </div>

                <div className="spon-cards-container">
                    {sponsorStats.map((stat, idx) => (
                        <div className="spon-card" key={idx}>
                            <div className={`button-label ${stat.bgClass} ${stat.colorClass}`}>{stat.type}</div>
                            <h2>{stat.count}</h2>
                            <p className="smaller-body-text spon-card-sub">{stat.checkins}</p>
                        </div>
                    ))}
                </div>

                <div className="spon-table-container">
                    <div className="spon-table-header">
                        <div className="outlined-button spon-search">
                            <Icon icon="mdi:magnify" className="search-icon" />
                            <input type="text" placeholder="Search attendees..." className="spon-search-input" />
                        </div>
                        <div className="spon-filters">
                            <button className={`spon-filter-pill ${activeFilter === "All" ? "active" : ""}`} onClick={() => handleFilterChange("All")}>
                                <span>All</span>
                                <span className="spon-count">{counts.all}</span>
                            </button>
                            <button className={`spon-filter-pill ${activeFilter === "Checked In" ? "active" : ""}`} onClick={() => handleFilterChange("Checked In")}>
                                <span>Checked In</span>
                                <span className="spon-count">{counts.checked}</span>
                            </button>
                            <button className={`spon-filter-pill ${activeFilter === "Pending" ? "active" : ""}`} onClick={() => handleFilterChange("Pending")}>
                                <span>Pending</span>
                                <span className="spon-count">{counts.pending}</span>
                            </button>
                        </div>
                    </div>
                    <div className="spon-table-wrapper">
                        <table className="spon-table">
                            <thead>
                                <tr>
                                    <th>Attendee</th>
                                    <th>Booth Type</th>
                                    <th>Purchase Date</th>
                                    <th>Status</th>
                                    <th>Check-in Time</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.map((row, index) => (
                                    <tr key={index}>
                                        <td>
                                            <div className="user-info">
                                                <div className="user-avatar">{row.initials}</div>
                                                <div className="user-details">
                                                    <h6 className="user-name">{row.name}</h6>
                                                    <span className="user-email smaller-body-text">{row.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`button-label type-vip`}>{row.boothPill}</span>
                                        </td>
                                        <td className="small-body-text date-col">{row.date}</td>
                                        <td>
                                            <span className={`button-label status-${row.statusType}`}>{row.status}</span>
                                        </td>
                                        <td className="small-body-text spon-time-col">
                                            {row.statusType === 'checked' && <Icon icon="mdi:clock-outline" className="time-icon text-green" />}
                                            <span className={row.statusType === 'checked' ? 'text-green' : ''}> {row.time}</span>
                                        </td>
                                        <td>
                                            <button className="action-btn">
                                                <Icon icon="mdi:email-outline" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                className="pagination-btn"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>

                            <span className="pagination-info">
                                Page {currentPage} of {totalPages}
                            </span>

                            <button
                                className="pagination-btn"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PromoterSponsors;
