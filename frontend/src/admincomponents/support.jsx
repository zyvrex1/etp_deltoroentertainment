import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import './support.css';
import ViewTicket from './ViewTicket';
import AssignAdmin from './Modal/AssignAdmin';
import { useAuthContext } from '../hooks/useAuthContext';
import concernService from '../services/concernService';
import { io } from 'socket.io-client';
import usePagination from '../hooks/usePagination';
import PaginationBar from '../components/PaginationBar';
import { showSuccessAlert, showErrorAlert } from '../utils/sweetAlert';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const SupportDisputes = () => {
    const { user } = useAuthContext();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    const itemsPerPage = 7;
    const {
        page, totalPages, total,
        setTotal, goTo, next, prev,
        reset: resetPage,
    } = usePagination({ limit: itemsPerPage });

    const fetchTickets = async () => {
        if (!user?.token) return;
        setLoading(true);
        try {
            const data = await concernService.getAdminConcerns(user.token);
            setTickets(data);
        } catch (error) {
            console.error("Error fetching tickets:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, [user]);

    useEffect(() => {
        if (!user?.token) return;
        const socket = io(BACKEND_URL);

        socket.on('newConcern', () => fetchTickets());
        socket.on('newMessage', () => fetchTickets());
        socket.on('statusUpdate', () => fetchTickets());
        socket.on('concernAssigned', () => fetchTickets());

        return () => socket.disconnect();
    }, [user]);

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
        resetPage();
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
                (tx.sponsorName?.toLowerCase().includes(q) || false) ||
                (tx.subject?.toLowerCase().includes(q) || false) ||
                (tx._id?.toLowerCase().includes(q) || false)
            );
        });
    }, [tickets, searchQuery, activeFilter]);

    useEffect(() => {
        setTotal({
            total: filteredTickets.length,
            totalPages: Math.ceil(filteredTickets.length / itemsPerPage) || 1
        });
    }, [filteredTickets.length, setTotal]);

    const startIndex = (page - 1) * itemsPerPage;
    const paginatedTickets = filteredTickets.slice(startIndex, startIndex + itemsPerPage);

    const [expandedRow, setExpandedRow] = useState(null);
    const toggleRow = (id) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    // View State
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedTicketForAssign, setSelectedTicketForAssign] = useState(null);

    const handleViewTicket = async (ticket) => {
        if (!user?.token) return;
        try {
            // Fetching resets the unread count on the backend
            const updatedTicket = await concernService.getConcernById(ticket._id, user.token);
            // Update local tickets list to reflect the reset unread count
            setTickets(prev => prev.map(t => t._id === updatedTicket._id ? updatedTicket : t));
            setSelectedTicketId(ticket._id);
        } catch (error) {
            console.error("Error fetching ticket details:", error);
            setSelectedTicketId(ticket._id); // Fallback to current ticket data if fetch fails
        }
    };

    const handleAssignClick = (ticket) => {
        setSelectedTicketForAssign(ticket);
        setIsAssignModalOpen(true);
    };

    const handleCloseAssignModal = () => {
        setIsAssignModalOpen(false);
        setSelectedTicketForAssign(null);
    };

    const handleAssignAdmin = async (assignedName, assignedId) => {
        if (!user?.token || !selectedTicketForAssign) return;
        try {
            await concernService.assignConcern(selectedTicketForAssign._id, assignedId, assignedName, user.token);
            showSuccessAlert("Success", "Ticket assigned successfully.");
            fetchTickets();
            setIsAssignModalOpen(false);
            setSelectedTicketForAssign(null);
        } catch (error) {
            showErrorAlert("Error", error.message);
        }
    };

    const handleBackToSupport = () => {
        setSelectedTicketId(null);
    };

    const handleUpdateStatus = async (id, newStatus) => {
        if (!user?.token) return;
        try {
            await concernService.updateStatus(id, newStatus, user.token);
            showSuccessAlert("Success", `Status updated to ${newStatus}.`);
            fetchTickets();
        } catch (error) {
            showErrorAlert("Error", error.message);
        }
    };
    
    const handleUpdatePriority = async (id, newPriority) => {
        if (!user?.token) return;
        try {
            await concernService.updatePriority(id, newPriority, user.token);
            showSuccessAlert("Success", `Priority updated to ${newPriority}.`);
            fetchTickets();
        } catch (error) {
            showErrorAlert("Error", error.message);
        }
    };

    if (selectedTicketId) {
        const ticket = tickets.find(t => t._id === selectedTicketId);
        return (
            <ViewTicket
                ticket={ticket}
                onUpdateStatus={handleUpdateStatus}
                onUpdatePriority={handleUpdatePriority}
                onBack={handleBackToSupport}
            />
        );
    }

    if (loading) {
        return (
            <div className="support-page">
                <div className="support-header">
                    <div>
                        <h1>Support & Disputes</h1>
                        <p className="large-body-text">Manage user support tickets and resolve disputes.</p>
                    </div>
                </div>

                <div className="support-stats-grid">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="support-stat-card skeleton-card">
                            <div className="stat-info">
                                <div className="skeleton skeleton-text short" />
                                <div className="skeleton skeleton-text title" style={{ width: '40px' }} />
                            </div>
                            <div className="skeleton skeleton-circle" style={{ width: '40px', height: '40px' }} />
                        </div>
                    ))}
                </div>
                <div className="support-content">
                    <div className="support-toolbar">
                        <div className="support-toolbar-left">
                            <div className="support-search">
                                <Icon icon="mdi:magnify" />
                                <div className="skeleton skeleton-rect" style={{ width: '200px', height: '36px' }} />
                            </div>
                        </div>
                        <div className="support-toolbar-right">
                            <div className="skeleton skeleton-rect" style={{ width: '150px', height: '36px', borderRadius: '8px' }} />
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
                                    <th>Assigned To</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...Array(itemsPerPage)].map((_, i) => (
                                    <tr key={i}>
                                        <td><div className="skeleton skeleton-text" style={{ width: '60px' }} /></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '100px' }} /></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '150px' }} /></td>
                                        <td><div className="skeleton skeleton-badge" style={{ width: '80px', height: '24px' }} /></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '100px' }} /></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '80px' }} /></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <div className="skeleton skeleton-rect" style={{ width: '60px', height: '32px' }} />
                                                <div className="skeleton skeleton-rect" style={{ width: '60px', height: '32px' }} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
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
                                    resetPage();
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
                    {paginatedTickets.length === 0 ? (
                        // Empty state outside table for mobile-friendly display
                        <div className="empty-state">
                            <Icon 
                                icon={
                                    activeFilter === "open"
                                        ? "mdi:alert-circle-outline"
                                        : activeFilter === "in-progress"
                                            ? "mdi:clock-time-four-outline"
                                            : activeFilter === "resolved"
                                                ? "mdi:check-circle-outline"
                                                : "mdi:ticket-outline"
                                } 
                                style={{ fontSize: '48px', marginBottom: '16px' }} 
                            />
                            <h4>{searchQuery ? "No tickets found" : `No ${activeFilter !== 'all' ? activeFilter.replace('-', ' ') : ''} tickets yet`}</h4>
                            <p className="small-body-text">
                                {searchQuery 
                                    ? <>No tickets match "<strong>{searchQuery}</strong>".</>
                                    : `There are currently no ${activeFilter !== 'all' ? activeFilter.replace('-', ' ') : ''} support tickets.`
                                }
                            </p>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>User</th>
                                    <th>Subject</th>
                                    <th>Status</th>
                                    <th>Assigned To</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedTickets.map((ticket) => (
                                    <tr key={ticket._id} className={expandedRow === ticket._id ? "expanded" : ""}>
                                        <td className="regular-body-text id-td" data-label="ID">
                                            <div className="mobile-expand-icon" onClick={() => toggleRow(ticket._id)}>
                                                <Icon icon={expandedRow === ticket._id ? "mdi:chevron-up" : "mdi:chevron-down"} />
                                            </div>
                                            <span>#{ticket._id.slice(-6).toUpperCase()}</span>
                                        </td>
                                        <td className="regular-body-text name-td" data-label="User">{ticket.sponsorName}</td>
                                        <td className="subject-cell regular-body-text" data-label="Subject">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span className="subject-text">{ticket.subject}</span>
                                                {ticket.unreadCountAdmin > 0 && (
                                                    <span style={{
                                                        backgroundColor: 'var(--color-red-primary, #ea4335)',
                                                        color: 'white',
                                                        fontSize: '11px',
                                                        fontWeight: 'bold',
                                                        padding: '2px 6px',
                                                        borderRadius: '10px',
                                                        minWidth: '18px',
                                                        textAlign: 'center'
                                                    }}>
                                                        {ticket.unreadCountAdmin}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="status-cell" data-label="Status">{getStatusBadge(ticket.status)}</td>
                                        <td className="regular-body-text" data-label="Assigned To">
                                            {(ticket.assignedName === 'Unassigned' || !ticket.assignedName) ? (
                                                <span style={{ color: "var(--color-black-tertiary)" }}>Unassigned</span>
                                            ) : (
                                                ticket.assignedName
                                            )}
                                        </td>
                                        <td className="regular-body-text created-cell" data-label="Created">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                                        <td className="actions-cell" data-label="Actions">
                                            <div className="actions-flex">
                                                <button className="outlined-button view-btn" onClick={() => handleViewTicket(ticket)}>
                                                    View
                                                </button>
                                                <button className="primary-button assign-btn" onClick={() => handleAssignClick(ticket)}>
                                                    Assign
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <PaginationBar
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    onPrev={prev}
                    onNext={next}
                    onGoTo={goTo}
                />
            </div>

            <AssignAdmin
                isOpen={isAssignModalOpen}
                onClose={handleCloseAssignModal}
                onAssign={handleAssignAdmin}
                ticket={selectedTicketForAssign}
            />
        </div>
    );
};

export default SupportDisputes;
