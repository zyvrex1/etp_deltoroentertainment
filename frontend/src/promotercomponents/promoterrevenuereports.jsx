import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import jsPDF from 'jspdf';
import { loadLogo, addReportHeader, addReportFooter, showExportToast, removeExportToast, drawTable } from '../admincomponents/utils/pdfExport';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import './promoterrevenuereports.css';

const PromoterRevenueReports = () => {
    const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState("techstart");
    const eventDropdownRef = useRef(null);

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

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
        { value: "techstart", label: "TechStart Summit 2024" },
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

    const revenueTrendData = [
        { date: 'Oct 01', revenue: 100000 },
        { date: 'Oct 03', revenue: 101000 },
        { date: 'Oct 05', revenue: 101500 },
        { date: 'Oct 07', revenue: 102000 },
        { date: 'Oct 09', revenue: 102500 },
        { date: 'Oct 11', revenue: 103000 },
        { date: 'Oct 14', revenue: 103550 },
    ];

    const revenueSourcesData = [
        { name: 'Tickets', value: 64050, color: '#0059ff', percentage: '62%' },
        { name: 'Booths', value: 9500, color: '#e62e2d', percentage: '9%' },
        { name: 'Sponsorships', value: 30000, color: '#4ca626', percentage: '29%' },
    ];

    const monthlyRevenueData = [
        { month: 'May', gross: 40000, fees: 2500 },
        { month: 'Jun', gross: 55000, fees: 3000 },
        { month: 'Jul', gross: 70000, fees: 4000 },
        { month: 'Aug', gross: 65000, fees: 3800 },
        { month: 'Sep', gross: 85000, fees: 5000 },
        { month: 'Oct', gross: 103550, fees: 6005 },
    ];

    const exportReport = async () => {
        const loadingToast = showExportToast();
        const REPORT_TITLE = 'Revenue Reports';
        try {
            const logoData = await loadLogo();
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 15;
            const FOOTER_HEIGHT = 15;
            let y = 45;
            const lineHeight = 6;

            addReportHeader(pdf, REPORT_TITLE, logoData);

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
                ['Sponsorships', '29%', '$30,000'],
                ['Booth Sales', '9%', '$9,500'],
            ];
            y = drawTable(pdf, y, sourceHeaders, sourceRows, margin, pdfWidth, pdfHeight, FOOTER_HEIGHT, 10, 3, logoData, REPORT_TITLE);

            y += 10;
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
            y = drawTable(pdf, y, eventHeaders, eventRows, margin, pdfWidth, pdfHeight, FOOTER_HEIGHT, 10, 3, logoData, REPORT_TITLE);

            y += 10;
            pdf.setFontSize(9);
            pdf.setTextColor(100, 100, 100);
            pdf.setFont('helvetica', 'normal');
            pdf.text('Revenue report export. Use the dashboard for interactive charts and real-time data.', margin, y, { maxWidth: pdfWidth - 2 * margin });

            finalizeReport(pdf);
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
                    <h3 className="rep-banner-title">TechStart Summit 2024</h3>
                    <p className="small-body-text rep-banner-subtitle">Oct 12, 2024</p>
                </div>

                <div className="rep-summary-cards">
                    <div className="rep-summary-card">
                        <div className="card-bg-icon" style={{ color: 'var(--color-green-tertiary)' }}><Icon icon="mdi:currency-usd" /></div>
                        <div className="card-content">
                            <p className="small-body-text rep-card-label">Gross Revenue</p>
                            <h3 className="rep-card-value">$103,550</h3>
                            <span className="button-label rep-card-trend green">
                                <Icon icon="mdi:trending-up" /> +12.5% from last month
                            </span>
                        </div>
                    </div>
                    <div className="rep-summary-card">
                        <div className="card-bg-icon" style={{ color: 'var(--color-red-tertiary)' }}><Icon icon="mdi:credit-card-outline" /></div>
                        <div className="card-content">
                            <p className="small-body-text rep-card-label">Platform Fees</p>
                            <h3 className="rep-card-value">$6,005.9</h3>
                            <span className="button-label rep-card-trend gray">5.8% of gross revenue</span>
                        </div>
                    </div>
                    <div className="rep-summary-card">
                        <div className="card-content">
                            <p className="small-body-text rep-card-label">Net Earnings</p>
                            <h3 className="rep-card-value" style={{ color: 'transparent', userSelect: 'none' }}>$0</h3>
                            <span className="button-label rep-card-trend green temp-avail">Available for payout</span>
                        </div>
                    </div>
                </div>

                  <div className="rep-analytics-overview bottom-stats-row">
                    <div className="rep-analytics-card ticket-card">
                        <div className="rep-analytics-icon-box blue">
                            <Icon icon="mdi:ticket-confirmation-outline" />
                        </div>
                        <div className="rep-analytics-info">
                            <h6 className="rep-card-label">Ticket Sales</h6>
                            <p className="smaller-body-text">62% of total</p>
                        </div>
                        <h4 className="rep-card-value">$64,050</h4>
                    </div>
                    <div className="rep-analytics-card booth-card">
                        <div className="rep-analytics-icon-box red">
                            <Icon icon="mdi:storefront-outline" />
                        </div>
                        <div className="rep-analytics-info">
                            <h6 className="rep-card-label">Booth Sales</h6>
                            <p className="smaller-body-text">9% of total</p>
                        </div>
                        <h4 className="rep-card-value">$9,500</h4>
                    </div>
                    <div className="rep-analytics-card sponsor-card">
                        <div className="rep-analytics-icon-box green">
                            <Icon icon="mdi:briefcase-outline" />
                        </div>
                        <div className="rep-analytics-info">
                            <h6 className="rep-card-label">Sponsorships</h6>
                            <p className="smaller-body-text">29% of total</p>
                        </div>
                        <h4 className="rep-card-value">$30,000</h4>
                    </div>
                </div>

                <div className="rep-content-columns">
                    <div className="rep-left-col">
                        <div className="rep-card">
                            <div className="rep-card-header">
                                <div className="header-text">
                                    <h4 className="left-aligned">Revenue Trend</h4>
                                    <p className="small-body-text left-aligned">Last 14 days</p>
                                </div>
                                <div className="header-value">
                                    <h3 className="left-aligned">$103,550</h3>
                                    <span className="green-text left-aligned">+12.5%</span>
                                </div>
                            </div>
                            <div className="chart-placeholder area-placeholder">
                                <ResponsiveContainer width="100%" height={isMobile ? 180 : 250}>
                                    <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        {!isMobile && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />}
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: isMobile ? 10 : 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: isMobile ? 10 : 12 }} tickFormatter={(val) => `$${val / 1000}k`} />
                                        <RechartsTooltip formatter={(value) => `$${value}`} />
                                        <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} fillOpacity={0.1} fill="#16a34a" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="rep-card">
                            <div className="rep-card-header">
                                <div className="header-text">
                                    <h4 className="left-aligned">Monthly Revenue</h4>
                                    <p className="small-body-text left-aligned">Gross revenue vs fees (last 6 months)</p>
                                </div>
                            </div>
                            <div className="chart-placeholder bar-placeholder">
                                <ResponsiveContainer width="100%" height={isMobile ? 180 : 250}>
                                    <BarChart data={monthlyRevenueData} maxBarSize={30} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        {!isMobile && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />}
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: isMobile ? 10 : 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: isMobile ? 10 : 12 }} tickFormatter={(val) => `$${val / 1000}k`} />
                                        <RechartsTooltip formatter={(value) => `$${value}`} />
                                        <Bar dataKey="gross" fill="#0059ff" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="fees" fill="#e6e6e6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="rep-right-col">
                        <div className="rep-card rep-donut-card">
                            <div className="rep-card-header">
                                <div className="header-text">
                                    <h4 className="left-aligned">Revenue Sources</h4>
                                    <p className="small-body-text left-aligned">By transaction type</p>
                                </div>
                            </div>
                            <div className="chart-placeholder donut-placeholder">
                                <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
                                    <PieChart>
                                        <Pie data={revenueSourcesData} innerRadius={isMobile ? 60 : 70} outerRadius={isMobile ? 80 : 90} paddingAngle={2} dataKey="value" stroke="none">
                                            {revenueSourcesData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip formatter={(value) => `$${value}`} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="donut-center-text">
                                    <p className="smaller-body-text">TOTAL</p>
                                    <h3>$103.5k</h3>
                                </div>
                            </div>
                            <div className="rep-donut-legend">
                                {revenueSourcesData.map((s, i) => (
                                    <div className="legend-row" key={i}>
                                        <div className="legend-label">
                                            <span className="dot" style={{ backgroundColor: s.color }}></span>
                                            <span>{s.name}</span>
                                        </div>
                                        <div className="legend-values">
                                            <span className="bold-val">${s.value.toLocaleString()}</span>
                                            <span className="small-pct">{s.percentage}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rep-card rep-event-box">
                            <h4 className="left-aligned">Revenue by Event</h4>
                            <div className="rep-event-list">
                                {revenueByEvent.map((item, index) => (
                                    <div className="rep-event-item" key={index}>
                                        <div className="rep-event-header">
                                            <h6 className="rep-event-name left-aligned">{item.name}</h6>
                                            <h6 className="rep-event-val left-aligned">{item.revenue}</h6>
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
