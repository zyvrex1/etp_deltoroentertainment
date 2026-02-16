import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import './audit.css';

const AuditLogs = () => {
    // Mock data for audit logs matching the screenshot
    const [logs] = useState([
        {
            id: 1,
            action: 'Approved Event',
            admin: 'Alex Thompson',
            target: 'TechStart Summit 2024',
            details: 'Event met all criteria',
            timestamp: '2024-09-01 10:00:00'
        },
        {
            id: 2,
            action: 'Suspended User',
            admin: 'Alex Thompson',
            target: 'Spam Bot User',
            details: 'Violation of terms',
            timestamp: '2024-09-05 14:30:00'
        },
        {
            id: 3,
            action: 'Created Event',
            admin: 'Jessica Martinez',
            target: 'AI Innovation Conference',
            details: 'New event created',
            timestamp: '2024-09-10 09:00:00'
        },
        {
            id: 4,
            action: 'Resolved Ticket',
            admin: 'Robert Chen',
            target: 'Refund Request',
            details: 'Refund processed',
            timestamp: '2024-09-15 11:00:00'
        },
        {
            id: 5,
            action: 'Added Admin',
            admin: 'Alex Thompson',
            target: 'Amanda Foster',
            details: 'New admin account',
            timestamp: '2024-09-20 13:00:00'
        },
        {
            id: 6,
            action: 'Updated Event',
            admin: 'Amanda Foster',
            target: 'TechStart Summit 2024',
            details: 'Changed venue details',
            timestamp: '2024-09-25 15:00:00'
        },
        {
            id: 7,
            action: 'Closed Ticket',
            admin: 'Michael Brown',
            target: 'Login Issues',
            details: 'User issue resolved',
            timestamp: '2024-09-30 10:00:00'
        },
        {
            id: 8,
            action: 'Rejected Event',
            admin: 'Jessica Martinez',
            target: 'Scam Event',
            details: 'Fraudulent activity',
            timestamp: '2024-10-01 12:00:00'
        },
        {
            id: 9,
            action: 'Suspended Promoter',
            admin: 'Robert Chen',
            target: "Kevin O'Brien",
            details: 'Policy violation',
            timestamp: '2024-10-05 14:00:00'
        },
        {
            id: 10,
            action: 'Updated Settings',
            admin: 'Alex Thompson',
            target: 'Platform Fees',
            details: 'Changed fee to 5%',
            timestamp: '2024-10-10 16:00:00'
        }
    ]);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const totalPages = Math.ceil(logs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedLogs = logs.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="audit-container">
            {/* Header */}
            <div className="audit-header">
                <div className="header-title-group">
                    <h1>Audit Logs</h1>
                    <p>Track all administrative actions for security and compliance.</p>
                </div>
                <button className="outlined-button export-btn">
                    <Icon icon="mdi:download-outline" /> Export Report
                </button>
            </div>

            {/* Controls Row */}
            <div className="audit-controls">
                <div className="search-bar">
                    <Icon icon="mdi:magnify" className="search-icon" />
                    <input type="text" placeholder="Search logs..." />
                </div>
                <button className="filter-btn">
                    <Icon icon="mdi:filter-variant" /> Filter by Date
                </button>
            </div>

            {/* Logs Table */}
            <div className="audit-card">
                <div className="table-responsive">
                    <table className="audit-table">
                        <thead>
                            <tr>
                                <th>Action</th>
                                <th>Admin</th>
                                <th>Target</th>
                                <th>Details</th>
                                <th>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedLogs.map((log) => (
                                <tr key={log.id}>
                                    <td className="action-cell">
                                        <h6 className="action-text">{log.action}</h6>
                                    </td>
                                    <td className="regular-body-text audit-admin-cell">{log.admin}</td>
                                    <td className="small-body-text target-cell">{log.target}</td>
                                    <td className="small-body-text details-cell">{log.details}</td>
                                    <td className="small-body-text timestamp-cell">
                                        <div className="timestamp-wrapper">
                                            <Icon icon="mdi:clock-time-four-outline" className="clock-icon" />
                                            <span>{log.timestamp}</span>
                                        </div>
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
    );
};

export default AuditLogs;
