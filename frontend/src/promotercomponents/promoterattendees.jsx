import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import jsPDF from 'jspdf';
import { loadLogo, addReportHeader, addReportFooter, showExportToast, removeExportToast, drawTable } from '../admincomponents/utils/pdfExport';
import './promoterattendees.css';

const PromoterAttendees = () => {
    const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState("techstart");
    const [activeFilter, setActiveFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedRow, setExpandedRow] = useState(null);
    const itemsPerPage = 5;
    const eventDropdownRef = useRef(null);
    const filterDropdownRef = useRef(null);

    const toggleRow = (index) => {
        setExpandedRow(expandedRow === index ? null : index);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (eventDropdownRef.current && !eventDropdownRef.current.contains(event.target)) {
                setIsEventDropdownOpen(false);
            }
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
                setIsFilterDropdownOpen(false);
            }
        };

        if (isEventDropdownOpen || isFilterDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isEventDropdownOpen, isFilterDropdownOpen]);

    const eventOptions = [
        { value: "techstart", label: "TechStart Summit 2026" },
        { value: "techstart_creator", label: "TechStart Summit 2026 Creator Economy Expo SaaS Growth Meetup" },
    ];

    const getSelectedEventLabel = () => {
        const option = eventOptions.find(opt => opt.value === selectedEvent);
        return option ? option.label : "Select Event";
    };

    const stats = [
        { title: "Early Bird General Admission", count: "1", sub: "1 checked in" },
        { title: "General Admission", count: "3", sub: "2 checked in" },
        { title: "VIP Access", count: "2", sub: "2 checked in" },
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
        const q = searchQuery.toLowerCase();
        const matchesFilter = (() => {
            if (activeFilter === "All") return true;
            if (activeFilter === "Checked In") return row.statusType === "checked";
            if (activeFilter === "Pending") return row.statusType === "pending";
            return true;
        })();
        if (!matchesFilter) return false;
        if (!q) return true;
        return row.name.toLowerCase().includes(q) || row.email.toLowerCase().includes(q) || row.pill.toLowerCase().includes(q);
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

    const exportList = async () => {
        const loadingToast = showExportToast();
        try {
            const logoData = await loadLogo();
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 15;
            const FOOTER_HEIGHT = 15;
            let y = 45;
            const lineHeight = 6;

            addReportHeader(pdf, 'Attendee List', logoData);

            pdf.setFontSize(12);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Summary', margin, y);
            y += lineHeight + 2;

            pdf.setFontSize(10);
            pdf.setTextColor(50, 50, 50);
            pdf.setFont('helvetica', 'normal');
            const currentEventLabel = getSelectedEventLabel();
            pdf.text(`Event: ${currentEventLabel}`, margin + 2, y); y += lineHeight;
            pdf.text(`Total Attendees: ${filteredData.length}`, margin + 2, y); y += lineHeight;
            pdf.text(`Checked In: ${counts.checked}`, margin + 2, y); y += lineHeight;
            pdf.text(`Pending: ${counts.pending}`, margin + 2, y); y += lineHeight + 4;

            pdf.setFontSize(12);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Attendees', margin, y);
            y += 8;

            const headers = ['Name', 'Email', 'Ticket Type', 'Purchase Date', 'Status', 'Check-in Time'];
            const rows = filteredData.map(row => [
                row.name,
                row.email,
                row.pill,
                row.date,
                row.status,
                row.time
            ]);
            y = drawTable(pdf, y, headers, rows, margin, pdfWidth, pdfHeight, FOOTER_HEIGHT);

            y += 4;
            pdf.setFontSize(9);
            pdf.setTextColor(100, 100, 100);
            pdf.setFont('helvetica', 'normal');
            pdf.text('Attendee list export. Use the dashboard for real-time check-in status.', margin, y, { maxWidth: pdfWidth - 2 * margin });

            addReportFooter(pdf, 1, 1);
            pdf.save(`Attendees_List_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            removeExportToast(loadingToast);
        }
    };

    return (
        <div className="att-container">
            <div className="att-header">
                <div className="att-header-left">
                    <h1 className="att-title">Attendee List</h1>
                    <p className="small-body-text att-header-subtitle">Manage registered attendees</p>
                </div>
                <div className="att-header-controls">
                    <button className="outlined-button att-export-btn" onClick={exportList}>
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
                    <div className="att-toolbar">
                        <div className="att-toolbar-left">
                            <div className="att-search">
                                <Icon icon="mdi:magnify" />
                                <input
                                    type="text"
                                    placeholder="Search attendees..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="small-body-text"
                                />
                            </div>
                        </div>

                        <div className="att-toolbar-right">
                            <div className="att-filter-dropdown" ref={filterDropdownRef}>
                                <button
                                    className="att-filter-dropdown-btn"
                                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                                >
                                    <span className="truncate-text">
                                        {activeFilter}
                                    </span>
                                    <Icon
                                        icon="mdi:chevron-down"
                                        className={`dropdown-icon ${isFilterDropdownOpen ? "open" : ""}`}
                                    />
                                </button>

                                {isFilterDropdownOpen && (
                                    <div className="att-filter-dropdown-menu">
                                        {["All", "Checked In", "Pending"].map((option) => (
                                            <button
                                                key={option}
                                                className={`att-filter-dropdown-item small-body-text ${activeFilter === option ? "active" : ""}`}
                                                onClick={() => {
                                                    handleFilterChange(option);
                                                    setIsFilterDropdownOpen(false);
                                                }}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="att-table-wrapper">
                         {paginatedData.length === 0 ? (
            // Empty state outside table for mobile-friendly display
            <div className="empty-state">
              <Icon icon="mdi:magnify-close" width="48" />
              <h4>No Attendee(s) found</h4>
              <p className="small-body-text">
                No Attendee(s) match "<strong>{searchQuery}</strong>".
              </p>
            </div>
          ) : (
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
                                    <tr key={index} className={expandedRow === index ? "expanded" : ""}>
                                        <td className="id-td" data-label="Attendee">
                                            <div className="mobile-expand-icon" onClick={() => toggleRow(index)}>
                                                <Icon icon={expandedRow === index ? "mdi:chevron-up" : "mdi:chevron-down"} />
                                            </div>
                                            <div className="user-info">
                                                <div className="user-avatar">{row.initials}</div>
                                                <div className="user-details">
                                                    <h6 className="user-name">{row.name}</h6>
                                                    <span className="user-email smaller-body-text">{row.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="type-cell" data-label="Ticket Type">
                                            <span className={`button-label type-${row.type}`}>{row.pill}</span>
                                        </td>
                                        <td data-label="Purchase Date" className="small-body-text date-col">{row.date}</td>
                                        <td className="status-cell" data-label="Status">
                                            <span className={`button-label status-${row.statusType}`}>{row.status}</span>
                                        </td>
                                        <td data-label="Check-in Time" className="small-body-text att-time-col">
                                            {row.statusType === 'checked' && <Icon icon="mdi:clock-outline" className="time-icon text-green" />}
                                            <span className={row.statusType === 'checked' ? 'text-green' : ''}> {row.time}</span>
                                        </td>
                                        <td data-label="Actions">
                                            <button className="action-btn">
                                                <Icon icon="mdi:email-outline" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
          )}
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
