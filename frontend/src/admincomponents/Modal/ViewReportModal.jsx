import React from 'react';
import { Icon } from '@iconify/react';
import './ViewReportModal.css';
import jsPDF from 'jspdf';
import { loadLogo, addReportHeader, addReportFooter, showExportToast, removeExportToast, drawTable } from '../utils/pdfExport';

const ViewReportModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const reportStats = [
        { label: 'Total Revenue', value: '$687,550.00', change: '+12.5%' },
        { label: 'Active Events', value: '5', change: '+8.2%' },
        { label: 'Total Users', value: '34', change: '+5.4%' },
        { label: 'Pending Actions', value: '6', change: '!' },
    ];

    const miniStats = [
        { label: 'Tickets Sold Today', value: '1,245' },
        { label: 'Booths Booked', value: '85' },
        { label: 'New Signups', value: '42' },
        { label: 'Open Support Tickets', value: '5' },
    ];

    const recentTransactions = [
        { name: 'John Smith', email: 'john@techstart.com', date: '2026-02-10', amount: '$299.00', status: 'completed' },
        { name: 'Techstart Summit 2026', email: 'Emily Blunt', date: '2026-02-10', amount: '$5,000.00', status: 'completed' },
        { name: 'Alice Nguyen', email: 'alice@attendee.com', date: '2026-02-11', amount: '$299.00', status: 'pending' },
        { name: 'Maria Lopez', email: 'maria@vendor.com', date: '2026-02-08', amount: '$299.00', status: 'completed' },
        { name: 'David Kim', email: 'david@eventpro.com', date: '2026-02-07', amount: '$1,500.00', status: 'completed' },
        { name: 'Sarah Chen', email: 'sarah@musicfest.com', date: '2026-02-06', amount: '$850.00', status: 'completed' },
    ];

    const topPromoters = [
        { name: 'TechStart Inc', email: 'contact@techstart.com', badge: 'Top Rated' },
        { name: 'MusicFest LLC', email: 'info@musicfest.com', badge: 'Top Rated' },
        { name: 'EventPro Solutions', email: 'hello@eventpro.com', badge: 'Top Rated' },
        { name: 'LiveEvents Co', email: 'support@liveevents.com', badge: 'Top Rated' },
    ];

    const exportToPDF = async () => {
        const loadingToast = showExportToast();
        try {
            const logoData = await loadLogo();

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const MARGIN = 15;
            const FOOTER_HEIGHT = 15;
            const contentTop = 45;
            const lineHeight = 6;
            let y = contentTop;

            addReportHeader(pdf, 'Dashboard Report', logoData);

            const section = (title) => {
                y += 4;
                pdf.setFontSize(12);
                pdf.setTextColor(30, 60, 114);
                pdf.setFont('helvetica', 'bold');
                pdf.text(title, MARGIN, y);
                y += lineHeight + 8; // bottom margin after section title
                pdf.setFontSize(10);
                pdf.setTextColor(50, 50, 50);
                pdf.setFont('helvetica', 'normal');
            };

            section('Key Metrics');
            reportStats.forEach(s => {
                pdf.text(`${s.label}: ${s.value} (${s.change})`, MARGIN + 2, y);
                y += lineHeight;
            });

            section('Additional Statistics');
            miniStats.forEach(s => {
                pdf.text(`${s.label}: ${s.value}`, MARGIN + 2, y);
                y += lineHeight;
            });

            // Recent Transactions Table
            y += 4;
            pdf.setFontSize(12);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Recent Transactions', MARGIN, y);
            y += 14; // bottom margin after section title
            
            const transactionHeaders = ['Name', 'Email', 'Date', 'Amount', 'Status'];
            const transactionRows = recentTransactions.map(tx => [
                tx.name,
                tx.email,
                tx.date,
                tx.amount,
                tx.status
            ]);
            y = drawTable(pdf, y, transactionHeaders, transactionRows, MARGIN, pdfWidth, pdfHeight, FOOTER_HEIGHT);

            // Top Promoters Table
            y += 6;
            pdf.setFontSize(12);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Top Promoters', MARGIN, y);
            y += 14; // bottom margin after section title
            
            const promoterHeaders = ['Name', 'Email', 'Badge'];
            const promoterRows = topPromoters.map(p => [
                p.name,
                p.email,
                p.badge
            ]);
            y = drawTable(pdf, y, promoterHeaders, promoterRows, MARGIN, pdfWidth, pdfHeight, FOOTER_HEIGHT);

            y += 4;
            pdf.setFontSize(9);
            pdf.setTextColor(100, 100, 100);
            pdf.text('Report generated from dashboard data. Use the main dashboard for real-time updates.', MARGIN, y, { maxWidth: pdfWidth - 2 * MARGIN });

            addReportFooter(pdf, 1, 1);
            pdf.save(`Dashboard_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            removeExportToast(loadingToast);
        }
    };

    return (
        <div className="general-modal-overlay" onClick={onClose}>
            <div className="general-modal-container" onClick={e => e.stopPropagation()}>
                <div className="general-modal-header">
                    <h3>Dashboard Report</h3>
                    <button className="close-btn" onClick={onClose} aria-label="Close">
                        <Icon icon="mdi:close" width="24" height="24" />
                    </button>
                </div>

                <div className="view-report-body">
                    <div className="small-body-text">

                        <div className="report-text-content">
                            <div className="report-section-text">
                                <h3>Key Metrics</h3>
                                {reportStats.map((stat, idx) => (
                                    <div key={idx} className="report-text-item">
                                        <span className="regular-body-text report-text-label">{stat.label}:</span>
                                        <h4 className="report-text-value">{stat.value}</h4>
                                        <span className="smaller-body-text report-text-change">({stat.change})</span>
                                    </div>
                                ))}
                            </div>

                            <div className="report-section-text">
                                <h3>Additional Statistics</h3>
                                {miniStats.map((stat, idx) => (
                                    <div key={idx} className="report-text-item">
                                        <span className="regular-body-text report-text-label">{stat.label}:</span>
                                        <h4 className="report-text-value">{stat.value}</h4>
                                    </div>
                                ))}
                            </div>

                            <div className="report-section-text report-transactions-section">
                                <h3>Recent Transactions</h3>
                                <div className="report-transactions-list">
                                    {recentTransactions.map((tx, idx) => (
                                        <div key={idx} className="report-transaction-item">
                                            <div className="report-transaction-left">
                                                <h6 className="report-transaction-name">{tx.name}</h6>
                                                <span className="small-body-text report-transaction-subtitle">{tx.email}</span>
                                                <span className="small-body-text report-transaction-date">{tx.date}</span>
                                            </div>
                                            <div className="report-transaction-right">
                                                <h6 className="report-transaction-amount">{tx.amount}</h6>
                                                <span className={`button-label report-transaction-status ${tx.status}`}>{tx.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="report-section-text report-promoters-section">
                                <h3>Top Promoters</h3>
                                <div className="report-promoters-list">
                                    {topPromoters.map((promoter, idx) => (
                                        <div key={idx} className="report-promoter-item">
                                            <div className="report-promoter-info">
                                                <h6 className="report-promoter-name">{promoter.name}</h6>
                                                <span className="small-body-text report-promoter-email">{promoter.email}</span>
                                            </div>
                                            <span className="button-label report-promoter-badge">{promoter.badge}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="report-section-text">
                                <p className="report-text-description">
                                    Report generated from dashboard data. Use the main dashboard for real-time updates.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="general-modal-footer">
                        <button className="button cancel-btn" onClick={onClose}>Close</button>
                        <button className="primary-button save-btn" onClick={exportToPDF}>
                            Export as PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewReportModal;
