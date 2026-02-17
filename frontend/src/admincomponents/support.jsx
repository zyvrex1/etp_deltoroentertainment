import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import './support.css';
import ViewTicketModal from './ViewTicketModal';

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
    const itemsPerPage = 5;

    const totalPages = Math.ceil(tickets.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedTickets = tickets.slice(startIndex, startIndex + itemsPerPage);

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
        <div className="support-container">
            {/* Header */}
            <div className="support-header">
                <div>
                    <h1>Support & Disputes</h1>
                    <p>Manage user support tickets and resolve disputes.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="support-stats-grid">
                <div className="stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Open Tickets</span>
                        <div className="stat-value">{tickets.filter(t => t.status === 'open').length}</div>
                    </div>
                    <div className="stat-icon icon-red">
                        <Icon icon="mdi:alert-circle-outline" />
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-info">
                        <span className="stat-label">In Progress</span>
                        <div className="stat-value">{tickets.filter(t => t.status === 'in-progress').length}</div>
                    </div>
                    <div className="stat-icon icon-yellow">
                        <Icon icon="mdi:clock-time-four-outline" />
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Resolved</span>
                        <div className="stat-value">{tickets.filter(t => t.status === 'resolved').length}</div>
                    </div>
                    <div className="stat-icon icon-green">
                        <Icon icon="mdi:check-circle-outline" />
                    </div>
                </div>
            </div>

            {/* Tickets Table */}
            <div className="support-tickets-card">
                <div className="table-responsive">
                    <table className="tickets-table">
                        <thead>
                            <tr>
                                <th>Subject</th>
                                <th>User</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedTickets.map((ticket) => (
                                <tr key={ticket.id}>
                                    <td className="subject-cell">
                                        <span className="subject-text">{ticket.subject}</span>
                                    </td>
                                    <td className="regular-body-text support-user-cell">{ticket.user}</td>
                                    <td className="status-cell">{getStatusBadge(ticket.status)}</td>
                                    <td className="small-body-text created-cell">{ticket.created}</td>
                                    <td className="actions-cell">
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
