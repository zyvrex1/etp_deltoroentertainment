import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import './support.css';
import ViewTicket from './ViewTicket';

const SupportDisputes = () => {
    // Mock data for tickets
    const [tickets, setTickets] = useState([
        {
            id: 1,
            subject: 'Refund Request',
            user: 'Emily Blunt',
            status: 'open',
            created: 'Jan 2, 2026'
        },
        {
            id: 2,
            subject: 'Booth Layout Issue',
            user: 'Sarah Chen',
            status: 'in-progress',
            created: 'Sep 28, 2024'
        },
        {
            id: 3,
            subject: 'Sponsorship Inquiry',
            user: 'Mike Ross',
            status: 'resolved',
            created: 'Sep 15, 2024'
        },
        {
            id: 4,
            subject: 'Login Issues',
            user: 'James Wilson',
            status: 'resolved',
            created: 'Sep 10, 2024'
        },
        {
            id: 5,
            subject: 'Ticket Not Received',
            user: 'Sophia Garcia',
            status: 'open',
            created: 'Oct 5, 2024'
        },
        {
            id: 6,
            subject: 'Booth Size Question',
            user: 'Lisa Wang',
            status: 'in-progress',
            created: 'Oct 1, 2024'
        },
        {
            id: 7,
            subject: 'Booth Size Question',
            user: 'Lisa Wang',
            status: 'in-progress',
            created: 'Oct 1, 2024'
        },
        {
            id: 8,
            subject: 'Booth Size Question',
            user: 'Lisa Wang',
            status: 'in-progress',
            created: 'Oct 1, 2024'
        }
    ]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'open':
                return <span className="button-label status-open">open</span>;
            case 'in-progress':
                return <span className="button-label status-in-progress">In progress</span>;
            case 'resolved':
                return <span className="button-label status-resolved">resolved</span>;
            default:
                return <span className="button-label">{status}</span>;
        }
    };

    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const filterOptions = [
        { value: "all", label: "All Status" },
        { value: "open", label: "Open" },
        { value: "in-progress", label: "In Progress" },
        { value: "resolved", label: "Resolved" },
    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isDropdownOpen]);

    const getFilterLabel = () => {
        const option = filterOptions.find((opt) => opt.value === activeFilter);
        return option ? option.label : "All Status";
    };

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
        setCurrentPage(1);
        setIsDropdownOpen(false);
    };

    const filteredTickets = useMemo(() => {
        const q = searchQuery.toLowerCase();

        return tickets.filter((tx) => {
            const matchesFilter =
                activeFilter === "all" ? true : tx.status === activeFilter;

            if (!matchesFilter) return false;

            if (!q) return true;

            return (
                tx.user.toLowerCase().includes(q) ||
                tx.subject.toLowerCase().includes(q) ||
                tx.id.toString().includes(q)
            );
        });
    }, [tickets, searchQuery, activeFilter]);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    const totalPages = Math.ceil(filteredTickets.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedTickets = filteredTickets.slice(startIndex, startIndex + itemsPerPage);

    const [expandedRow, setExpandedRow] = useState(null);
    const toggleRow = (id) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // View State
    const [selectedTicketId, setSelectedTicketId] = useState(null);

    const handleViewTicket = (ticket) => {
        setSelectedTicketId(ticket.id);
    };

    const handleBackToSupport = () => {
        setSelectedTicketId(null);
    };

    const handleUpdateStatus = (id, newStatus) => {
        // Update tickets list
        const updatedTickets = tickets.map(ticket =>
            ticket.id === id ? { ...ticket, status: newStatus } : ticket
        );
        setTickets(updatedTickets);
    };

    if (selectedTicketId) {
        const ticket = tickets.find(t => t.id === selectedTicketId);
        return (
            <ViewTicket
                ticket={ticket}
                onUpdateStatus={handleUpdateStatus}
                onBack={handleBackToSupport}
            />
        );
    }

    return (
        <div className="support-page">
            <div className="support-header">
                <div>
                    <h1>Support & Disputes</h1>
                    <p className="large-body-text">Manage user support tickets and resolve disputes.</p>
                </div>
            </div>

            <div className="support-stats-grid">
                <div className="support-stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Total Tickets</span>
                        <div className="stat-value">{tickets.length}</div>
                    </div>
                    <div className="stat-icon icon-blue">
                        <Icon icon="mdi:ticket-outline" />
                    </div>
                </div>

                <div className="support-stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Open Tickets</span>
                        <div className="stat-value">{tickets.filter(t => t.status === 'open').length}</div>
                    </div>
                    <div className="stat-icon icon-red">
                        <Icon icon="mdi:alert-circle-outline" />
                    </div>
                </div>

                <div className="support-stat-card">
                    <div className="stat-info">
                        <span className="stat-label">In Progress</span>
                        <div className="stat-value">{tickets.filter(t => t.status === 'in-progress').length}</div>
                    </div>
                    <div className="stat-icon icon-yellow">
                        <Icon icon="mdi:clock-time-four-outline" />
                    </div>
                </div>

                <div className="support-stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Resolved</span>
                        <div className="stat-value">{tickets.filter(t => t.status === 'resolved').length}</div>
                    </div>
                    <div className="stat-icon icon-green">
                        <Icon icon="mdi:check-circle-outline" />
                    </div>
                </div>
            </div>
            <div className="support-content">


                <div className="support-toolbar">
                    <div className="support-toolbar-left">
                        <div className="support-search">
                            <Icon icon="mdi:magnify" />
                            <input
                                type="text"
                                placeholder="Search tickets..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="small-body-text"
                            />
                        </div>
                    </div>

                    <div className="support-toolbar-right">
                        <div className="support-filter-dropdown" ref={dropdownRef}>
                            <button
                                className="support-filter-dropdown-btn"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <span className="truncate-text">{getFilterLabel()}</span>
                                <Icon
                                    icon="mdi:chevron-down"
                                    className={`dropdown-icon ${isDropdownOpen ? "open" : ""}`}
                                />
                            </button>
                            {isDropdownOpen && (
                                <div className="support-filter-dropdown-menu">
                                    {filterOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            className={`support-filter-dropdown-item small-body-text ${activeFilter === option.value ? "active" : ""
                                                }`}
                                            onClick={() => handleFilterChange(option.value)}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>User</th>
                                <th>Subject</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedTickets.map((ticket) => (
                                <tr key={ticket.id} className={expandedRow === ticket.id ? "expanded" : ""}>
                                    <td className="regular-body-text id-td" data-label="ID">
                                        <div className="mobile-expand-icon" onClick={() => toggleRow(ticket.id)}>
                                            <Icon icon={expandedRow === ticket.id ? "mdi:chevron-up" : "mdi:chevron-down"} />
                                        </div>
                                        <span>#{ticket.id.toString().padStart(2, "0")}</span>
                                    </td>
                                    <td className="regular-body-text name-td" data-label="User">{ticket.user}</td>
                                    <td className="subject-cell regular-body-text" data-label="Subject">
                                        <span className="subject-text">{ticket.subject}</span>
                                    </td>
                                    <td className="status-cell" data-label="Status">{getStatusBadge(ticket.status)}</td>
                                    <td className="regular-body-text created-cell" data-label="Created">{ticket.created}</td>
                                    <td className="actions-cell" data-label="Actions">
                                        <div className="actions-flex">
                                            <button
                                                className="outlined-button view-btn"
                                                onClick={() => handleViewTicket(ticket)}
                                            >
                                                View
                                            </button>
                                            <button
                                                className="primary-button assign-btn"
                                            >
                                                Assign
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

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
    );
};

export default SupportDisputes;
