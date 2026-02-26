import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import jsPDF from 'jspdf';
import { loadLogo, addReportHeader, addReportFooter, showExportToast, removeExportToast, drawTable } from '../admincomponents/utils/pdfExport';
import './promoterrevenuereports.css';

const PromoterRevenueReports = () => {
    const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState("techstart");
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
        { value: "creator", label: "Creator Economy Expo" },
    ];

    const getSelectedEventLabel = () => {
        const option = eventOptions.find(opt => opt.value === selectedEvent);
        return option ? option.label : "Select Event";
    };

    const handleEventChange = (val) => {
        setSelectedEvent(val);
        setIsEventDropdownOpen(false);
    };

    const revenueByEvent = [
        { name: "TechStart Summit 2024", revenue: "$103,550", percentage: "100%", width: "100%", color: "var(--color-red-primary)" },
        { name: "Creator Economy Expo", revenue: "$33,230", percentage: "32%", width: "32%", color: "var(--color-red-primary)" },
        { name: "SaaS Growth Meetup", revenue: "$1,800", percentage: "2%", width: "2%", color: "var(--color-red-primary)" },
        { name: "Winter Music Festival", revenue: "$0", percentage: "0%", width: "0%", color: "transparent" },
    ];

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
            const lineHeight = 6;

            addReportHeader(pdf, 'Revenue Reports', logoData);

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
            pdf.text('Gross Revenue: $103,550', margin + 2, y); y += lineHeight;
            pdf.text('Platform Fees: $6,005.9', margin + 2, y); y += lineHeight;
            pdf.text('Net Earnings: $97,544.10', margin + 2, y); y += lineHeight;
            pdf.text('Tickets Sold: 1,215', margin + 2, y); y += lineHeight;
            pdf.text('Booths Sold: 24', margin + 2, y); y += lineHeight;
            pdf.text('Refunds: $450', margin + 2, y); y += lineHeight + 4;

            pdf.setFontSize(12);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Revenue by Source', margin, y);
            y += 8;

            const sourceHeaders = ['Source', 'Share of Total', 'Amount'];
            const sourceRows = [
                ['Ticket Sales', '62%', '$64,050'],
                ['Sponsorships', '29%', '$30,500'],
                ['Merchandise', '9%', '$9,000'],
            ];
            y = drawTable(pdf, y, sourceHeaders, sourceRows, margin, pdfWidth, pdfHeight, FOOTER_HEIGHT);

            y += 6;
            pdf.setFontSize(12);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Revenue by Event', margin, y);
            y += 8;

            const eventHeaders = ['Event', 'Revenue', 'Share of Total'];
            const eventRows = revenueByEvent.map(item => [
                item.name,
                item.revenue,
                item.percentage
            ]);
            y = drawTable(pdf, y, eventHeaders, eventRows, margin, pdfWidth, pdfHeight, FOOTER_HEIGHT);

            y += 4;
            pdf.setFontSize(9);
            pdf.setTextColor(100, 100, 100);
            pdf.setFont('helvetica', 'normal');
            pdf.text('Revenue report export. Use the dashboard for interactive charts and real-time data.', margin, y, { maxWidth: pdfWidth - 2 * margin });

            addReportFooter(pdf, 1, 1);
            pdf.save(`Revenue_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            removeExportToast(loadingToast);
        }
    };

    return (
        <div className="rep-container">
            <div className="rep-header">
                <div className="rep-header-left">
                    <h1 className="rep-title">Revenue Reports</h1>
                    <p className="small-body-text rep-header-subtitle">Financial breakdown and earnings</p>
                </div>
                <div className="rep-header-controls">
                    <div className="rep-filter-dropdown" ref={eventDropdownRef}>
                        <button
                            className="rep-filter-dropdown-btn"
                            onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
                        >
                            <span className="truncate-text">{getSelectedEventLabel()}</span>
                            <Icon
                                icon="mdi:chevron-down"
                                className={`dropdown-icon ${isEventDropdownOpen ? "open" : ""}`}
                            />
                        </button>
                        {isEventDropdownOpen && (
                            <div className="rep-filter-dropdown-menu">
                                {eventOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        className={`rep-filter-dropdown-item ${selectedEvent === option.value ? "active" : ""}`}
                                        onClick={() => handleEventChange(option.value)}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button className="outlined-button rep-export-btn" onClick={exportReport}>
                        <Icon icon="mdi:tray-arrow-down" />
                        Export Report
                    </button>
                </div>
            </div>

            <div className="rep-main-content">
                <div className="rep-event-banner">
                    <h3 className="rep-banner-title">TechStart Summit 2026</h3>
                    <p className="small-body-text rep-banner-subtitle">June 16, 2026 &bull; Moscone</p>
                </div>

                <div className="rep-summary-cards">
                    <div className="rep-summary-card">
                        <p className="small-body-text rep-card-label">Gross Revenue</p>
                        <h3 className="rep-card-value">$103,550</h3>
                        <span className="button-label rep-card-trend green">
                            <Icon icon="mdi:trending-up" /> +12.5% from last month
                        </span>
                    </div>
                    <div className="rep-summary-card">
                        <p className="small-body-text rep-card-label">Platform Fees</p>
                        <h3 className="rep-card-value">$6,005.9</h3>
                        <span className="button-label rep-card-trend gray">5.8% of gross revenue</span>
                    </div>
                    <div className="rep-summary-card">
                        <p className="small-body-text rep-card-label">Net Earnings</p>
                        <h3 className="rep-card-value">$97,544.10</h3>
                        <span className="button-label rep-card-trend green temp-avail">Available for payout</span>
                    </div>
                </div>

                <div className="rep-analytics-overview">
                    <div className="rep-analytics-card">
                        <div className="rep-analytics-icon-box green">
                            <Icon icon="mdi:ticket-confirmation-outline" />
                        </div>
                        <div className="rep-analytics-info">
                            <p className="small-body-text rep-card-label">Tickets Sold</p>
                            <h3 className="rep-card-value">1,215</h3>
                        </div>
                    </div>
                    <div className="rep-analytics-card">
                        <div className="rep-analytics-icon-box green">
                            <Icon icon="mdi:storefront-outline" />
                        </div>
                        <div className="rep-analytics-info">
                            <p className="small-body-text rep-card-label">Booths Sold</p>
                            <h3 className="rep-card-value">24</h3>
                        </div>
                    </div>
                    <div className="rep-analytics-card">
                        <div className="rep-analytics-icon-box red">
                            <Icon icon="mdi:cash-refund" />
                        </div>
                        <div className="rep-analytics-info">
                            <p className="small-body-text rep-card-label">Refunds</p>
                            <h3 className="rep-card-value">$450</h3>
                        </div>
                    </div>
                </div>

                <div className="rep-content-columns">
                    <div className="rep-left-col">
                        <div className="rep-card rep-source-box">
                            <h4>Revenue by Source</h4>
                            <div className="rep-source-list">
                                <div className="rep-source-item rep-ticket-source">
                                    <div className="rep-source-icon-container">
                                        <Icon icon="mdi:ticket-outline" className="rep-source-icon" />
                                    </div>
                                    <div className="rep-source-info">
                                        <h6 className="rep-source-name">Ticket Sales</h6>
                                        <span className="smaller-body-text rep-source-percent">62% of total</span>
                                    </div>
                                    <div className="rep-source-value">
                                        <h6>$64,050</h6>
                                    </div>
                                </div>
                                <div className="rep-source-item rep-sponsor-source">
                                    <div className="rep-source-icon-container">
                                        <Icon icon="mdi:briefcase-outline" className="rep-source-icon" />
                                    </div>
                                    <div className="rep-source-info">
                                        <h6 className="rep-source-name">Sponsorships</h6>
                                        <span className="smaller-body-text rep-source-percent">29% of total</span>
                                    </div>
                                    <div className="rep-source-value">
                                        <h6>$30,500</h6>
                                    </div>
                                </div>
                                <div className="rep-source-item rep-merch-source">
                                    <div className="rep-source-icon-container">
                                        <Icon icon="mdi:tshirt-crew-outline" className="rep-source-icon" />
                                    </div>
                                    <div className="rep-source-info">
                                        <h6 className="rep-source-name">Merchandise</h6>
                                        <span className="smaller-body-text rep-source-percent">9% of total</span>
                                    </div>
                                    <div className="rep-source-value">
                                        <h6>$9,000</h6>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rep-right-col">
                        <div className="rep-card rep-event-box">
                            <h4>Revenue by Event</h4>
                            <div className="rep-event-list">
                                {revenueByEvent.map((item, index) => (
                                    <div className="rep-event-item" key={index}>
                                        <div className="rep-event-header">
                                            <h6 className="rep-event-name">{item.name}</h6>
                                            <h6 className="rep-event-val">{item.revenue}</h6>
                                        </div>
                                        <div className="rep-event-progress-bar">
                                            <div className="rep-event-fill" style={{ width: item.width, backgroundColor: item.color }}></div>
                                        </div>
                                        <span className="smaller-body-text rep-event-pct">{item.percentage} of total revenue</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromoterRevenueReports;
