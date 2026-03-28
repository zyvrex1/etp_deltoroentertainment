import React from 'react';
import { Icon } from '@iconify/react';
import './ViewReportModal.css';
import jsPDF from 'jspdf';
import { loadLogo, addReportHeader, addReportFooter, showExportToast, removeExportToast, drawTable, finalizeReport } from '../utils/pdfExport';

const ViewReportModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const reportStats = [
        { label: 'Total Events', value: '156', change: '+12.5%' },
        { label: 'Tickets Sold', value: '12,458', change: '+8.2%' },
        { label: 'Total Revenue', value: '$458,920', change: '+15.3%' },
        { label: 'Active Users', value: '8,542', change: '+5.8%' },
    ];

    const miniStats = [
        { label: 'Pending Approvals', value: '8' },
        { label: 'Booths Reserved', value: '342' },
        { label: 'Pending Payouts', value: '$45,230' },
        { label: 'Support Tickets', value: '12' },
    ];

    const topSponsors = [
        { name: 'Global Tech', event: 'AI Summit 2026', type: 'Platinum' },
        { name: 'Nexus Corp', event: 'Creator Expo', type: 'Gold' },
        { name: 'Startup Hub', event: 'TechStart', type: 'Silver' },
        { name: 'Startup Hub', event: 'TechStart', type: 'Silver' },
        { name: 'Startup Hub', event: 'TechStart', type: 'Silver' },
    ];

    const topPromoters = [
        { name: 'TechStart Inc', email: 'contact@techstart.com', badge: 'Top Rated' },
        { name: 'MusicFest LLC', email: 'info@musicfest.com', badge: 'Top Rated' },
        { name: 'EventPro Solutions', email: 'hello@eventpro.com', badge: 'Top Rated' },
        { name: 'EventPro Solutions', email: 'hello@eventpro.com', badge: 'Top Rated' },
        { name: 'EventPro Solutions', email: 'hello@eventpro.com', badge: 'Top Rated' },
        { name: 'EventPro Solutions', email: 'hello@eventpro.com', badge: 'Top Rated' },
    ];

    const PAGE_TITLE = 'Dashboard Report';

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

            addReportHeader(pdf, PAGE_TITLE, logoData);

            const section = (title) => {
                // Check for page overflow before drawing section title
                if (y + 20 > pdfHeight - FOOTER_HEIGHT - 10) {
                    pdf.addPage();
                    addReportHeader(pdf, PAGE_TITLE, logoData);
                    y = contentTop;
                }
                
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

            // Top Sponsors Table
            y += 4;
            pdf.setFontSize(12);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Top Sponsors', MARGIN, y);
            y += 10;
            
            const sponsorHeaders = ['Name', 'Event', 'Type'];
            const sponsorRows = topSponsors.map(s => [
                s.name,
                s.event,
                s.type
            ]);
            y = drawTable(pdf, y, sponsorHeaders, sponsorRows, MARGIN, pdfWidth, pdfHeight, FOOTER_HEIGHT, 10, 3, logoData, PAGE_TITLE);

            // Top Promoters Table
            y += 10;
            pdf.setFontSize(12);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Top Promoters', MARGIN, y);
            y += 10;
            
            const promoterHeaders = ['Name', 'Email', 'Badge'];
            const promoterRows = topPromoters.map(p => [
                p.name,
                p.email,
                p.badge
            ]);
            y = drawTable(pdf, y, promoterHeaders, promoterRows, MARGIN, pdfWidth, pdfHeight, FOOTER_HEIGHT, 10, 3, logoData, PAGE_TITLE);

            y += 10;
            pdf.setFontSize(9);
            pdf.setTextColor(100, 100, 100);
            pdf.text('Report generated from dashboard data. Use the main dashboard for real-time updates.', MARGIN, y, { maxWidth: pdfWidth - 2 * MARGIN });

            finalizeReport(pdf);
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

                            <div className="report-section-text report-promoters-section">
                                <h3>Top Sponsors</h3>
                                <div className="report-promoters-list">
                                    {topSponsors.map((sponsor, idx) => (
                                        <div key={idx} className="report-promoter-item">
                                            <div className="report-promoter-info">
                                                <h6 className="report-promoter-name">{sponsor.name}</h6>
                                                <span className="small-body-text report-promoter-email">{sponsor.event}</span>
                                            </div>
                                            <span className="button-label report-promoter-badge">{sponsor.type}</span>
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

                    <div className="general-viewreport-modal-footer">
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
