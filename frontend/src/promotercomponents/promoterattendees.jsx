import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import './promoterattendees.css';

const PromoterAttendees = () => {
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

    const stats = [
        { title: "Early Bird General Admission", count: "1", sub: "1 checked in" },
        { title: "General Admission", count: "3", sub: "2 checked in" },
        { title: "VIP Access", count: "2", sub: "2 checked in" },
        { title: "Workshop Pass", count: "1", sub: "checked in" }
    ];

    const attendeesData = [
        { initials: "SJ", name: "Sarah Jenkins", email: "sarah@example.com", pill: "VIP A-12", type: "vip", date: "2026-04-19", status: "Checked In", statusType: "checked", time: "2026-06-16 08:45" },
        { initials: "MC", name: "Michael Chen", email: "m.chen@tech.co", pill: "GenAd C-1", type: "gen", date: "2026-01-12", status: "Checked In", statusType: "checked", time: "2026-06-16 08:50" },
        { initials: "MC", name: "Michael Chen", email: "m.chen@tech.co", pill: "Early Bird D-8", type: "early", date: "2026-01-15", status: "Checked In", statusType: "checked", time: "2026-06-16 09:05" },
        { initials: "MC", name: "Michael Chen", email: "m.chen@tech.co", pill: "Workshop Pass", type: "workshop", date: "2026-02-14", status: "Registered", statusType: "pending", time: "---" },
        { initials: "MC", name: "Michael Chen", email: "m.chen@tech.co", pill: "GenAd C-3", type: "gen", date: "2026-01-12", status: "Checked In", statusType: "checked", time: "2026-06-16 09:25" },
        { initials: "MC", name: "Michael Chen", email: "m.chen@tech.co", pill: "GenAd C-3", type: "gen", date: "2026-01-12", status: "Checked In", statusType: "checked", time: "2026-06-16 09:25" },
    ];

    const filteredData = attendeesData.filter((row) => {
        if (activeFilter === "All") return true;
        if (activeFilter === "Checked In") return row.statusType === "checked";
        if (activeFilter === "Pending") return row.statusType === "pending";
        return true;
    });

    const counts = {
        all: attendeesData.length,
        checked: attendeesData.filter(row => row.statusType === "checked").length,
        pending: attendeesData.filter(row => row.statusType === "pending").length,
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
        <div className="att-container">
            <div className="att-header">
                <div className="att-header-left">
                    <h1 className="att-title">Attendee List</h1>
                    <p className="small-body-text att-header-subtitle">Manage registered attendees</p>
                </div>
                <div className="att-header-controls">
                    <div className="att-filter-dropdown" ref={eventDropdownRef}>
                        <button
                            className="att-filter-dropdown-btn"
                            onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
                        >
                            <span className="truncate-text">{getSelectedEventLabel()}</span>
                            <Icon
                                icon="mdi:chevron-down"
                                className={`dropdown-icon ${isEventDropdownOpen ? "open" : ""}`}
                            />
                        </button>
                        {isEventDropdownOpen && (
                            <div className="att-filter-dropdown-menu">
                                {eventOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        className={`att-filter-dropdown-item ${selectedEvent === option.value ? "active" : ""}`}
                                        onClick={() => handleEventChange(option.value)}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button className="outlined-button att-export-btn">
                        <Icon icon="mdi:tray-arrow-down" className="export-icon" />
                        Export List
                    </button>
                </div>
            </div>

            <div className="att-main-content">
                <div className="att-event-banner">
                    <div className="att-banner-left">
                        <h3>TechStart Summit 2026</h3>
                        <p className="small-body-text">June 16, 2026 &bull; Moscone</p>
                    </div>
                    <div className="att-banner-stats">
                        <div className="att-stat-item">
                            <h3>7</h3>
                            <span className="att-stat-label smaller-body-text">Total Registered</span>
                        </div>
                        <div className="att-stat-item">
                            <h3 className="text-green">5</h3>
                            <span className="att-stat-label smaller-body-text">Checked in</span>
                        </div>
                        <div className="att-stat-item">
                            <h3 className="text-red">2</h3>
                            <span className="att-stat-label smaller-body-text">Pending</span>
                        </div>
                    </div>
                </div>

                <div className="att-cards-container">
                    {stats.map((stat, idx) => (
                        <div className="att-card" key={idx}>
                            <p className="smaller-body-text att-card-title">{stat.title}</p>
                            <h2>{stat.count}</h2>
                            <p className="smaller-body-text att-card-sub">{stat.sub}</p>
                        </div>
                    ))}
                </div>

                <div className="att-table-container">
                    <div className="att-table-header">
                        <div className="outlined-button att-search">
                            <Icon icon="mdi:magnify" className="search-icon" />
                            <input type="text" placeholder="Search attendees..." className="att-search-input" />
                        </div>
                        <div className="att-filters">
                            <button className={`att-filter-pill ${activeFilter === "All" ? "active" : ""}`} onClick={() => handleFilterChange("All")}>
                                <span>All</span>
                                <span className="att-count">{counts.all}</span>
                            </button>
                            <button className={`att-filter-pill ${activeFilter === "Checked In" ? "active" : ""}`} onClick={() => handleFilterChange("Checked In")}>
                                <span>Checked In</span>
                                <span className="att-count">{counts.checked}</span>
                            </button>
                            <button className={`att-filter-pill ${activeFilter === "Pending" ? "active" : ""}`} onClick={() => handleFilterChange("Pending")}>
                                <span>Pending</span>
                                <span className="att-count">{counts.pending}</span>
                            </button>
                        </div>
                    </div>
                    <div className="att-table-wrapper">
                        <table className="att-table">
                            <thead>
                                <tr>
                                    <th>Attendee</th>
                                    <th>Ticket Type</th>
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
                                            <span className={`button-label type-${row.type}`}>{row.pill}</span>
                                        </td>
                                        <td className="small-body-text date-col">{row.date}</td>
                                        <td>
                                            <span className={`button-label status-${row.statusType}`}>{row.status}</span>
                                        </td>
                                        <td className="small-body-text att-time-col">
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

export default PromoterAttendees;
