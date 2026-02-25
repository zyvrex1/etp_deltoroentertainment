import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import './promotersales.css';

const PromoterSales = () => {
    const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState("techstart");
    const [activeFilter, setActiveFilter] = useState("All Sales");
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

    const salesStats = [
        { title: "Ticket Sales", amount: "$448", sub: "4 Transactions", icon: "mdi:ticket-confirmation-outline", colorClass: "text-green", bgClass: "bg-green-light" },
        { title: "Booth Sales", amount: "$15,000", sub: "1 transactions", icon: "mdi:map-outline", colorClass: "text-purple", bgClass: "bg-purple-light" }
    ];

    const salesData = [
        { id: "001", initials: "SJ", name: "Sarah Jenkins", email: "sarah@example.com", typePill: "ticket", typeColor: "green", item: "VIP Access Row A, Seat 12", amount: "$299", date: "2026-05-13", status: "completed", statusColor: "green" },
        { id: "002", initials: "TI", name: "TechCorp Inc.", email: "john@techcorp.com", typePill: "Booth", typeColor: "purple", item: "Booth VIP 101", amount: "$299", date: "2026-04-11", status: "completed", statusColor: "green" },
        { id: "003", initials: "SJ", name: "Sarah Jenkins", email: "sarah@example.com", typePill: "ticket", typeColor: "green", item: "VIP Access Row A, Seat 12", amount: "$299", date: "2026-05-16", status: "refunded", statusColor: "red" },
        { id: "001", initials: "SJ", name: "Sarah Jenkins", email: "sarah@example.com", typePill: "ticket", typeColor: "green", item: "General Admission Row C, Seat 12", amount: "$299", date: "2026-05-13", status: "completed", statusColor: "green" },
        { id: "001", initials: "SJ", name: "Sarah Jenkins", email: "sarah@example.com", typePill: "ticket", typeColor: "green", item: "Early Bird Row D, Seat 1", amount: "$299", date: "2026-05-13", status: "completed", statusColor: "green" },
        { id: "001", initials: "SJ", name: "Sarah Jenkins", email: "sarah@example.com", typePill: "ticket", typeColor: "green", item: "Early Bird Row D, Seat 1", amount: "$299", date: "2026-05-13", status: "completed", statusColor: "green" },

    ];

    const filteredSalesData = salesData.filter((row) => {
        if (activeFilter === "All Sales") return true;
        if (activeFilter === "Tickets") return row.typePill.toLowerCase() === "ticket";
        if (activeFilter === "Booths") return row.typePill.toLowerCase() === "booth";
        return true;
    });

    const counts = {
        all: salesData.length,
        tickets: salesData.filter(row => row.typePill.toLowerCase() === "ticket").length,
        booths: salesData.filter(row => row.typePill.toLowerCase() === "booth").length,
    }

    const totalPages = Math.ceil(filteredSalesData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredSalesData.slice(startIndex, startIndex + itemsPerPage);

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
        <div className="sales-container">
            <div className="sales-header">
                <div className="sales-header-left">
                    <h1 className="sales-title">Sales Overview</h1>
                    <p className="small-body-text sales-header-subtitle">Track all transactions and revenue</p>
                </div>
                <div className="sales-header-controls">
                    <div className="sales-filter-dropdown" ref={eventDropdownRef}>
                        <button
                            className="sales-filter-dropdown-btn"
                            onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
                        >
                            <span className="truncate-text">{getSelectedEventLabel()}</span>
                            <Icon
                                icon="mdi:chevron-down"
                                className={`dropdown-icon ${isEventDropdownOpen ? "open" : ""}`}
                            />
                        </button>
                        {isEventDropdownOpen && (
                            <div className="sales-filter-dropdown-menu">
                                {eventOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        className={`sales-filter-dropdown-item ${selectedEvent === option.value ? "active" : ""}`}
                                        onClick={() => handleEventChange(option.value)}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button className="outlined-button sales-export-btn">
                        <Icon icon="mdi:tray-arrow-up" className="export-icon" />
                        Upload Map
                    </button>
                </div>
            </div>

            <div className="sales-main-content">
                <div className="sales-event-banner">
                    <div className="sales-banner-left">
                        <h3>TechStart Summit 2026</h3>
                        <p className="small-body-text">June 16, 2026 &bull; Moscone</p>
                    </div>
                    <div className="sales-banner-stats">
                        <div className="sales-stat-item">
                            <h3 className="text-green-stat">$25,448</h3>
                            <span className="sales-stat-label smaller-body-text">Total Revenue</span>
                        </div>
                    </div>
                </div>

                <div className="sales-cards-container">
                    {salesStats.map((stat, idx) => (
                        <div className="sales-card" key={idx}>
                            <div className="sales-card-left">
                                <p className={`smaller-body-text sales-card-title ${stat.colorClass}`}>{stat.title}</p>
                                <h2 className={stat.colorClass}>{stat.amount}</h2>
                                <p className={`smaller-body-text ${stat.colorClass}`}>{stat.sub}</p>
                            </div>
                            <div className={`sales-card-icon ${stat.bgClass}`}>
                                <Icon icon={stat.icon} className={stat.colorClass} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="sales-table-container">
                    <div className="sales-table-header">
                        <div className="outlined-button sales-search">
                            <Icon icon="mdi:magnify" className="search-icon" />
                            <input type="text" placeholder="Search transactions..." className="sales-search-input" />
                        </div>
                        <div className="sales-filters">
                            <button className={`sales-filter-pill ${activeFilter === "All Sales" ? "active" : ""}`} onClick={() => handleFilterChange("All Sales")}>
                                <span>All Sales</span>
                                <span className="sales-count">{counts.all}</span>
                            </button>
                            <button className={`sales-filter-pill ${activeFilter === "Tickets" ? "active" : ""}`} onClick={() => handleFilterChange("Tickets")}>
                                <span>Tickets</span>
                                <span className="sales-count">{counts.tickets}</span>
                            </button>
                            <button className={`sales-filter-pill ${activeFilter === "Booths" ? "active" : ""}`} onClick={() => handleFilterChange("Booths")}>
                                <span>Booths</span>
                                <span className="sales-count">{counts.booths}</span>
                            </button>
                        </div>
                    </div>
                    <div className="sales-table-wrapper">
                        <table className="sales-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Type</th>
                                    <th>Item</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.map((row, index) => (
                                    <tr key={index}>
                                        <td className="small-body-text date-col">{row.id}</td>
                                        <td>
                                            <div className="user-info">
                                                <div className="user-avatar">{row.initials}</div>
                                                <div>
                                                    <h5 className="user-name">{row.name}</h5>
                                                    <p className="smaller-body-text user-email">{row.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`button-label pill-bg-${row.typeColor}`}>{row.typePill}</span>
                                        </td>
                                        <td className="small-body-text item-col">{row.item}</td>
                                        <td className='ps-green-amount large-body-text'><strong>{row.amount}</strong></td>
                                        <td className="small-body-text date-col">{row.date}</td>
                                        <td>
                                            <span className={`button-label pill-bg-${row.statusColor}`}>{row.status}</span>
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

export default PromoterSales;
