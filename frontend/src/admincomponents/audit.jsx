import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import './audit.css';
import DateRangePicker from './DateRangePicker';
import jsPDF from 'jspdf';
import { loadLogo, addReportHeader, addReportFooter, showExportToast, removeExportToast, drawTable } from './utils/pdfExport';

const AuditLogs = () => {
    const [dateRange, setDateRange] = useState(() => ({
        preset: 'all',
        presetLabel: 'All time',
        start: new Date(2000, 0, 1),
        end: new Date(2100, 11, 31),
    }));

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
        },
          {
            id: 11,
            action: 'Updated Settings',
            admin: 'Alex Thompson',
            target: 'Platform Fees',
            details: 'Changed fee to 5%',
            timestamp: '2024-10-10 16:00:00'
        }
    ]);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    const filterLogsByDateRange = (logsToFilter) => {
        if (!dateRange?.start || !dateRange?.end || dateRange?.preset === 'all') return logsToFilter;

        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        return logsToFilter.filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate >= start && logDate <= end;
        });
    };

    const filteredLogs = filterLogsByDateRange(logs);
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleDateRangeChange = (newRange) => {
        setDateRange(newRange);
        setCurrentPage(1);
    };

    const [expandedRow, setExpandedRow] = useState(null);
    const toggleRow = (id) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const exportReport = async () => {
        const loadingToast = showExportToast();
        try {
            const logoData = await loadLogo();
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 15;
            const FOOTER_HEIGHT = 15;
            let y = 45;

            addReportHeader(pdf, 'Audit Logs Report', logoData);

            pdf.setFontSize(12);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Audit Log Entries', margin, y);
            y += 8;

            const auditHeaders = ['Action', 'Admin', 'Target', 'Details', 'Timestamp'];
            const auditRows = filteredLogs.map(log => [
                log.action,
                log.admin,
                log.target,
                log.details,
                log.timestamp
            ]);
            y = drawTable(pdf, y, auditHeaders, auditRows, margin, pdfWidth, pdfHeight, FOOTER_HEIGHT);

            y += 4;
            pdf.setFontSize(9);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`Report generated from Audit Logs. ${filteredLogs.length} entries.`, margin, y, { maxWidth: pdfWidth - 2 * margin });

            addReportFooter(pdf, 1, 1);
            pdf.save(`Audit_Logs_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            removeExportToast(loadingToast);
        }
    };

    return (
        <div className="audit-container">
            {/* Header */}
            <div className="audit-header">
                <div className="header-title-group">
                    <h1>Audit Logs</h1>
                    <p className="large-body-text">Track all administrative actions for security and compliance.</p>
                </div>
                <button className="outlined-button export-btn" onClick={exportReport}>
                    <Icon icon="mdi:download-outline" /> Export Report
                </button>
            </div>

            {/* Controls Row */}
            <div className="audit-controls">
                <div className="search-bar">
                    <Icon icon="mdi:magnify" className="search-icon" />
                    <input type="text" placeholder="Search logs..." />
                </div>
                <DateRangePicker
                    value={dateRange}
                    onChange={handleDateRangeChange}
                    buttonClassName="filter-btn"
                    placeholder="Select date range"
                />
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
                                <tr key={log.id} className={expandedRow === log.id ? 'expanded' : ''}>
                                    <td className="action-td" data-label="Action">
                                        <div className="mobile-expand-icon" onClick={() => toggleRow(log.id)}>
                                            <Icon icon={expandedRow === log.id ? "mdi:chevron-up" : "mdi:chevron-down"} />
                                        </div>
                                        <div className="action-cell">
                                            <h6 className="action-text">{log.action}</h6>
                                        </div>
                                    </td>
                                    <td className="regular-body-text admin-td" data-label="Admin">{log.admin}</td>
                                    <td className="small-body-text target-cell" data-label="Target">{log.target}</td>
                                    <td className="small-body-text details-cell" data-label="Details">{log.details}</td>
                                    <td className="small-body-text timestamp-cell" data-label="Timestamp">
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
