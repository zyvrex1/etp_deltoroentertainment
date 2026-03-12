import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import './support.css';
import ViewTicketModal from './Modal/ViewTicketModal';

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

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    const totalPages = Math.ceil(tickets.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedTickets = tickets.slice(startIndex, startIndex + itemsPerPage);

    const [expandedRow, setExpandedRow] = useState(null);
    const toggleRow = (id) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);

    const handleViewTicket = (ticket) => {
        setSelectedTicket(ticket);
        setIsModalOpen(true);
    };

    const handleUpdateStatus = (id, newStatus) => {
        // Update tickets list
        const updatedTickets = tickets.map(ticket =>
            ticket.id === id ? { ...ticket, status: newStatus } : ticket
        );
        setTickets(updatedTickets);

        // Update selected ticket to reflect change in modal
        if (selectedTicket && selectedTicket.id === id) {
            setSelectedTicket({ ...selectedTicket, status: newStatus });
        }
    };

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
                                    <td className="small-body-text id-td" data-label="ID">
                                        <div className="mobile-expand-icon" onClick={() => toggleRow(ticket.id)}>
                                            <Icon icon={expandedRow === ticket.id ? "mdi:chevron-up" : "mdi:chevron-down"} />
                                        </div>
                                        <span>#{ticket.id.toString().padStart(2, "0")}</span>
                                    </td>
                                    <td className="regular-body-text name-td" data-label="User">{ticket.user}</td>
                                    <td className="subject-cell" data-label="Subject">
                                        <span className="subject-text">{ticket.subject}</span>
                                    </td>
                                    <td className="status-cell" data-label="Status">{getStatusBadge(ticket.status)}</td>
                                    <td className="small-body-text created-cell" data-label="Created">{ticket.created}</td>
                                    <td className="actions-cell" data-label="Actions">
                                        <button
                                            className="outlined-button view-btn"
                                            onClick={() => handleViewTicket(ticket)}
                                        >
                                            View
                                        </button>
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

            <ViewTicketModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                ticket={selectedTicket}
                onUpdateStatus={handleUpdateStatus}
            />
        </div>
    );
};

export default SupportDisputes;
