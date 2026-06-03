import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import analyticsService from "../services/analyticsService";
import reservationService from "../services/reservationService";

import "./reportsandanalytics.css";
import { Icon } from "@iconify/react";
import jsPDF from "jspdf";
import { loadLogo, addReportHeader, addReportFooter, showExportToast, removeExportToast, drawTable, finalizeReport } from "../utils/pdfExport";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from "recharts";
import DateRangePicker from "../utils/DateRangePicker";
 
 const CustomTooltip = ({ active, payload, label }) => {
     if (active && payload && payload.length) {
         return (
             <div className="custom-chart-tooltip">
                 <p className="tooltip-label">{label}</p>
                 <div className="tooltip-items">
                     {payload.map((entry, index) => {
                         let value = entry.value;
                         // Check if name exists and contains 'total' or 'revenue'
                         const isRevenue = entry.name?.toLowerCase().includes('revenue') || 
                                          entry.dataKey === 'total' || 
                                          entry.name === 'Total Revenue';
                         
                         if (isRevenue) {
                             value = `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                         }
                         return (
                             <div key={index} className="tooltip-item" style={{ color: entry.color || '#333' }}>
                                 <span className="item-name">{entry.name || 'Total'} : </span>
                                 <span className="item-value">{value ?? 0}</span>
                             </div>
                         );
                     })}
                 </div>
             </div>
         );
     }
     return null;
 };

export default function ReportsAnalytics() {
    const { user } = useContext(AuthContext);
    const [dateRange, setDateRange] = useState(() => {
        const now = new Date();
        const start = new Date(now);
        start.setDate(start.getDate() - 6);
        return { preset: "last7", presetLabel: "Last 7 days", start, end: new Date(now) };
    });

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [expandedRow, setExpandedRow] = useState(null);
    const [topEvents, setTopEvents] = useState([]);
    const [overviewStats, setOverviewStats] = useState({
        grossRevenue: 0,
        netRevenue: 0,
        ticketsSold: 0,
        boothsSold: 0,
        ticketsReserved: 0,
        boothsReserved: 0,
        seatOccupancy: 0,
        boothOccupancy: 0,
        refundRate: 0.8,
        revenueTrends: []
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
       const fetchAnalytics = async () => {
            if (!user?.token) return;
            
            try {
                setIsLoading(true);
                const [topData, overviewData, allReservations] = await Promise.all([
                    analyticsService.getTopPerformingEvents(user.token, dateRange.start, dateRange.end),
                    analyticsService.getOverviewStats(user.token, dateRange.start, dateRange.end),
                    reservationService.getAdminReservations(user.token)
                ]);

                if (topData) setTopEvents(topData);

                if (overviewData) {
                    const rangeStart = new Date(dateRange.start);
                    const rangeEnd = new Date(dateRange.end);
                    rangeEnd.setHours(23, 59, 59, 999);

                    // Reservations within selected date range
                    const inRange = (allReservations || []).filter(r => {
                        const d = new Date(r.createdAt);
                        return d >= rangeStart && d <= rangeEnd;
                    });

                    const totalCount = inRange.length;
                    const refundedCount = inRange.filter(r =>
                        ['refunded', 'rejected', 'cancelled'].includes(r.status)
                    ).length;

                    const refundRate = totalCount > 0
                        ? parseFloat(((refundedCount / totalCount) * 100).toFixed(1))
                        : 0;

                    // Calculate refund trend vs previous period of same length
                    const periodMs = rangeEnd.getTime() - rangeStart.getTime();
                    const prevEnd = new Date(rangeStart.getTime() - 1);
                    const prevStart = new Date(prevEnd.getTime() - periodMs);

                    const prevInRange = (allReservations || []).filter(r => {
                        const d = new Date(r.createdAt);
                        return d >= prevStart && d <= prevEnd;
                    });

                    const prevTotal = prevInRange.length;
                    const prevRefunded = prevInRange.filter(r =>
                        ['refunded', 'rejected', 'cancelled'].includes(r.status)
                    ).length;

                    const prevRefundRate = prevTotal > 0
                        ? parseFloat(((prevRefunded / prevTotal) * 100).toFixed(1))
                        : 0;

                    const refundTrend = prevRefundRate > 0
                        ? parseFloat(((refundRate - prevRefundRate) / prevRefundRate * 100).toFixed(1))
                        : refundRate > 0 ? 100 : 0;

                    setOverviewStats({
                        ...overviewData,
                        refundRate,
                        refundTrend
                    });
                }
            } catch (error) {
                console.error("Error fetching analytics:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalytics();
    }, [user?.token, dateRange]);


    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const toggleRow = (id) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    // Category and Revenue Trends are still static for now as per design scope, 
    // but topEvents and overview are now dynamic.
    const revenueData = overviewStats.revenueTrends?.length > 0 ? overviewStats.revenueTrends : [
        { month: "Jan", total: 0 },
        { month: "Feb", total: 0 },
        { month: "Mar", total: 0 },
        { month: "Apr", total: 0 },
        { month: "May", total: 0 },
        { month: "Jun", total: 0 },
        { month: "Jul", total: 0 },
        { month: "Aug", total: 0 },
        { month: "Sep", total: 0 },
        { month: "Oct", total: 0 },
        { month: "Nov", total: 0 },
        { month: "Dec", total: 0 },
    ];

   const totalSold = (overviewStats.boothsSold || 0) + (overviewStats.ticketsSold || 0);
    const refundedCount = totalSold > 0
        ? Math.round(totalSold * ((overviewStats.refundRate || 0) / 100))
        : 0;

    const categoryData = [
        { name: "Booth", value: overviewStats.boothsSold || 0, color: "#0059ff" },
        { name: "Seats", value: overviewStats.ticketsSold || 0, color: "#8c52ff" },
        { name: "Refund", value: refundedCount, color: "#e6e6e6" },
    ];

    const totalSalesForChart = categoryData.reduce((acc, item) => acc + item.value, 0);
    const getPercent = (value) => {
        if (totalSalesForChart === 0) return 0;
        return Math.round((value / totalSalesForChart) * 100);
    };


const exportReport = async () => {
    const loadingToast = showExportToast();
    const REPORT_TITLE = "Reports & Analytics";
    try {
        const logoData = await loadLogo();
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        let y = 45;

        addReportHeader(pdf, REPORT_TITLE, logoData);

        // ── Date Range Banner ─────────────────────────────────────────
        pdf.setFillColor(245, 247, 255);
        pdf.setDrawColor(220, 225, 245);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(margin, y, pdfWidth - margin * 2, 10, 2, 2, 'FD');
        pdf.setFontSize(8.5);
        pdf.setTextColor(80, 80, 120);
        pdf.setFont('helvetica', 'normal');
        const rangeLabel = `Period: ${dateRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${dateRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        pdf.text(rangeLabel, pdfWidth / 2, y + 6.5, { align: 'center' });
        y += 18;

        // ── Section Label: Key Metrics ────────────────────────────────
        pdf.setFontSize(11);
        pdf.setTextColor(30, 60, 114);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Key Metrics', margin, y);
        pdf.setDrawColor(30, 60, 114);
        pdf.setLineWidth(0.4);
        pdf.line(margin, y + 2, pdfWidth - margin, y + 2);
        y += 10;

        // ── 4 Metric Cards (2x2 grid) ─────────────────────────────────
        const cardW = (pdfWidth - margin * 2 - 6) / 2;
        const cardH = 22;
        const cardGap = 6;

        const metrics = [
            {
                label: 'Total Revenue',
                value: `$${overviewStats.grossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                trend: overviewStats.revenueTrend,
                icon: '●',
                color: [0, 168, 107],       // green
                bg: [235, 255, 245],
                border: [180, 235, 210],
            },
            {
                label: 'Booths Sold',
                value: overviewStats.boothsSold.toLocaleString(),
                trend: overviewStats.boothsTrend,
                icon: '●',
                color: [30, 60, 200],        // blue
                bg: [235, 240, 255],
                border: [180, 200, 245],
            },
            {
                label: 'Seats Sold',
                value: overviewStats.ticketsSold.toLocaleString(),
                trend: overviewStats.ticketsTrend,
                icon: '●',
                color: [120, 60, 200],       // purple
                bg: [245, 235, 255],
                border: [210, 190, 245],
            },
            {
                label: 'Refund Rate',
                value: `${overviewStats.refundRate}%`,
                trend: overviewStats.refundTrend,
                trendInverted: true,         // lower is better
                icon: '●',
                color: [198, 40, 40],        // red
                bg: [255, 240, 240],
                border: [245, 190, 190],
            },
        ];

        metrics.forEach((m, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const cx = margin + col * (cardW + cardGap);
            const cy = y + row * (cardH + cardGap);

            // Card background
            pdf.setFillColor(...m.bg);
            pdf.setDrawColor(...m.border);
            pdf.setLineWidth(0.3);
            pdf.roundedRect(cx, cy, cardW, cardH, 3, 3, 'FD');

            // Color dot
            pdf.setFillColor(...m.color);
            pdf.circle(cx + 5, cy + 6, 2, 'F');

            // Label
            pdf.setFontSize(8);
            pdf.setTextColor(100, 100, 100);
            pdf.setFont('helvetica', 'normal');
            pdf.text(m.label, cx + 10, cy + 7);

            // Value
            pdf.setFontSize(14);
            pdf.setTextColor(...m.color);
            pdf.setFont('helvetica', 'bold');
            pdf.text(m.value, cx + 5, cy + 16);

            // Trend badge
     const trendVal = parseFloat(m.trend);
if (!isNaN(trendVal)) {
    const isGood     = m.trendInverted ? trendVal <= 0 : trendVal >= 0;
    const trendColor = isGood ? [22, 163, 74] : [220, 38, 38];
    const trendText  = `${trendVal >= 0 ? '+' : '-'}${Math.abs(trendVal)}%`;

    pdf.setFontSize(7.5);
    pdf.setTextColor(...trendColor);
    pdf.setFont('helvetica', 'bold');
    pdf.text(trendText, cx + cardW - 4, cy + 7, { align: 'right' });
    pdf.setFontSize(6.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(130, 130, 130);
    pdf.text('vs prev. period', cx + cardW - 4, cy + 11.5, { align: 'right' });
}
        });

        y += 2 * (cardH + cardGap) + 4;

        // ── Sales by Category ─────────────────────────────────────────
        pdf.setFontSize(11);
        pdf.setTextColor(30, 60, 114);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Sales by Category', margin, y);
        pdf.setDrawColor(30, 60, 114);
        pdf.setLineWidth(0.4);
        pdf.line(margin, y + 2, pdfWidth - margin, y + 2);
        y += 10;

        const categories = [
            { label: 'Booth Sales', value: overviewStats.boothsSold || 0, color: [0, 89, 255] },
            { label: 'Seat Sales',  value: overviewStats.ticketsSold || 0, color: [140, 82, 255] },
            { label: 'Refunded',   value: refundedCount,                   color: [200, 200, 200] },
        ];
        const catTotal = categories.reduce((s, c) => s + c.value, 0);
        const barMaxW = pdfWidth - margin * 2 - 45;

        categories.forEach((cat) => {
            const pct = catTotal > 0 ? (cat.value / catTotal) * 100 : 0;
            const fillW = (pct / 100) * barMaxW;

            pdf.setFontSize(8.5);
            pdf.setTextColor(50, 50, 50);
            pdf.setFont('helvetica', 'normal');
            pdf.text(cat.label, margin, y + 4);

            // Track background
            pdf.setFillColor(235, 235, 235);
            pdf.roundedRect(margin + 32, y, barMaxW, 5, 1, 1, 'F');

            // Fill
            if (fillW > 0) {
                pdf.setFillColor(...cat.color);
                pdf.roundedRect(margin + 32, y, fillW, 5, 1, 1, 'F');
            }

            // Percent label
            pdf.setFontSize(7.5);
            pdf.setTextColor(80, 80, 80);
            pdf.text(`${pct.toFixed(1)}% (${cat.value})`, margin + 32 + barMaxW + 2, y + 4);

            y += 10;
        });

        // Occupancy bars
        y += 2;
        const occupancyItems = [
            { label: 'Booth Occupancy', pct: overviewStats.boothOccupancy || 0, color: [30, 60, 200] },
            { label: 'Seat Occupancy',  pct: overviewStats.seatOccupancy || 0,  color: [22, 163, 74] },
        ];
        occupancyItems.forEach((oc) => {
            const fillW = ((oc.pct || 0) / 100) * barMaxW;
            pdf.setFontSize(8.5);
            pdf.setTextColor(50, 50, 50);
            pdf.setFont('helvetica', 'normal');
            pdf.text(oc.label, margin, y + 4);

            pdf.setFillColor(235, 235, 235);
            pdf.roundedRect(margin + 32, y, barMaxW, 5, 1, 1, 'F');
            if (fillW > 0) {
                pdf.setFillColor(...oc.color);
                pdf.roundedRect(margin + 32, y, fillW, 5, 1, 1, 'F');
            }
            pdf.setFontSize(7.5);
            pdf.setTextColor(80, 80, 80);
            pdf.text(`${oc.pct}%`, margin + 32 + barMaxW + 2, y + 4);
            y += 10;
        });

        y += 4;

        // ── Top Performing Events Table ───────────────────────────────
        pdf.setFontSize(11);
        pdf.setTextColor(30, 60, 114);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Top Performing Events', margin, y);
        pdf.setDrawColor(30, 60, 114);
        pdf.setLineWidth(0.4);
        pdf.line(margin, y + 2, pdfWidth - margin, y + 2);
        y += 8;

        const eventHeaders = ['#', 'Event Name', 'Seats / Booths', 'Revenue', 'Capacity'];
        const eventRows = topEvents.map((e, i) => [
            `#${i + 1}`,
            e.name,
            `${e.ticketsSold} seats • ${e.boothsSold} booths`,
            e.revenueText,
            e.cap,
        ]);

        y = drawTable(pdf, y, eventHeaders, eventRows, margin, pdfWidth, pdfHeight, 15, 11, 3, logoData, REPORT_TITLE);

        // ── Summary Footer Strip ──────────────────────────────────────
        y += 8;
        if (y + 16 < pdfHeight - 20) {
            pdf.setFillColor(245, 247, 255);
            pdf.setDrawColor(210, 218, 245);
            pdf.setLineWidth(0.3);
            pdf.roundedRect(margin, y, pdfWidth - margin * 2, 14, 2, 2, 'FD');
            pdf.setFontSize(8);
            pdf.setTextColor(80, 90, 130);
            pdf.setFont('helvetica', 'italic');
            pdf.text(
                `This report covers ${topEvents.length} event(s) • Generated by eTicketsPro Analytics`,
                pdfWidth / 2, y + 9,
                { align: 'center' }
            );
        }

        finalizeReport(pdf);
        pdf.save(`Reports_Analytics_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Failed to generate PDF. Please try again.");
    } finally {
        removeExportToast(loadingToast);
    }
};


    return (
        <div className="admin-reports-page">

            <div className="reports-header">
                <div>
                    <h1>Reports & Analytics</h1>
                    <p className="large-body-text">Platform performance and revenue insights.</p>
                </div>
                <div className="reports-actions">
                    <DateRangePicker
                        value={dateRange}
                        onChange={setDateRange}
                        buttonClassName="outlined-button filter-button"
                        placeholder="Select date range"
                    />
                    <button className="outlined-button export-btn" onClick={exportReport}>
                        <Icon icon="mdi:download-outline" width="18" />
                        Export Report
                    </button>
                </div>
            </div>

            <div className="stats-grid-wrapper">
                <div className="stats-grid">
                    <div className="report-stat-card">
                        <div className="upper-stats">
                            <span className="icon green"><Icon icon="mdi:currency-usd" width="24" /></span>
                            <span className={`trend ${overviewStats.revenueTrend >= 0 ? 'up' : 'down'}`}>
                                <Icon icon={overviewStats.revenueTrend >= 0 ? "mdi:trending-up" : "mdi:trending-down"} /> 
                                {Math.abs(overviewStats.revenueTrend)}%
                            </span>
                        </div>
                        <div className="bottom-stats">
                            <p className="regular-body-text left-aligned">Total Revenue</p>
                            <h4>${overviewStats.grossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                            <p className="smaller-body-text left-aligned">vs previous period</p>
                        </div>
                    </div>

                    <div className="report-stat-card">
                        <div className="upper-stats">
                            <span className="icon blue"><Icon icon="mdi:trending-up" width="24" /></span>
                            <span className={`trend ${(overviewStats.boothsTrend ?? 0) >= 0 ? 'up' : 'down'}`}>
    <Icon icon={(overviewStats.boothsTrend ?? 0) >= 0 ? "mdi:trending-up" : "mdi:trending-down"} /> 
    {overviewStats.boothsTrend != null ? `${Math.abs(overviewStats.boothsTrend)}%` : '—'}
</span>
                        </div>
                        <div className="bottom-stats">
                            <p className="regular-body-text left-aligned">Booths Sold</p>
                            <h4>{overviewStats.boothsSold.toLocaleString()}</h4>
                            <p className="smaller-body-text left-aligned">vs previous period</p>
                        </div>
                    </div>

                    <div className="report-stat-card">
                        <div className="upper-stats">
                            <span className="icon purple"><Icon icon="mdi:account-group-outline" width="24" /></span>
                            <span className={`trend ${overviewStats.ticketsTrend >= 0 ? 'up' : 'down'}`}>
                                <Icon icon={overviewStats.ticketsTrend >= 0 ? "mdi:trending-up" : "mdi:trending-down"} /> 
                                {Math.abs(overviewStats.ticketsTrend)}%
                            </span>
                        </div>
                        <div className="bottom-stats">
                            <p className="regular-body-text left-aligned">Seats Sold</p>
                            <h4>{overviewStats.ticketsSold.toLocaleString()}</h4>
                            <p className="smaller-body-text left-aligned">vs previous period</p>
                        </div>
                    </div>

                    <div className="report-stat-card">
                        <div className="upper-stats">
                            <span className="icon red"><Icon icon="mdi:chart-bar" width="24" /></span>
                            <span className={`trend ${overviewStats.refundTrend >= 0 ? 'down' : 'up'}`}>
                                <Icon icon={overviewStats.refundTrend >= 0 ? "mdi:trending-down" : "mdi:trending-up"} /> 
                                {Math.abs(overviewStats.refundTrend)}%
                            </span>
                        </div>
                        <div className="bottom-stats">
                            <p className="regular-body-text left-aligned">Refund Rate</p>
                            <h4>{overviewStats.refundRate}%</h4>
                            <p className="smaller-body-text left-aligned">vs previous period</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="reports-content-grid">
                <div className="reports-left-panel">
                    <div className="chart-card wide area">
                        <div className="chart-card-header">
                            <h4 className="left-aligned">Revenue Trends</h4>
                        </div>
                        <div className="chart-placeholder area-placeholder">
                            <ResponsiveContainer width="100%" height={isMobile ? 180 : 250}>
                                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#c62828" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#f1bcbc" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>

                                    {!isMobile && (
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                                    )}
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: isMobile ? 10 : 12 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: isMobile ? 10 : 12 }}
                                        tickFormatter={(val) => `$${val / 1000}k`}
                                    />
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#f1f5f9"
                                        strokeWidth={isMobile ? 2 : 3}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="list-card top-events-card">
                        <div className="card-header">
                            <h4 className="left-aligned">Top Performing Events</h4>
                        </div>
                        <div className="table-wrapper scrollable">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Event Name</th>
                                        <th>Revenue</th>
                                        <th>Rank</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topEvents.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>
                                                {isLoading ? "Loading performance data..." : "No event data available yet."}
                                            </td>
                                        </tr>
                                    ) : topEvents.map((row, index) => (
                                        <tr key={row.id} className={expandedRow === row.id ? "expanded" : ""}>
                                            <td data-label="Event Name" className="regular-body-text event-name-td">
                                                <div className="mobile-expand-icon" onClick={() => toggleRow(row.id)}>
                                                    <Icon icon={expandedRow === row.id ? "mdi:chevron-up" : "mdi:chevron-down"} />
                                                </div>
                                                <div className="event-name-cell">
                                                    <div className="event-avatar">
                                                        {row.name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="event-info-wrapper left-aligned">
                                                        <span className="event-name-text">{row.name}</span>
                                                        <span className="event-sub-text smaller-body-text">
                                                            {row.ticketsSold} seats sold {row.ticketsReserved > 0 ? `(${row.ticketsReserved} reserved)` : ""} • {row.boothsSold} booths {row.boothsReserved > 0 ? `(${row.boothsReserved} reserved)` : ""}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td data-label="Revenue" className="regular-body-text rev-td">
                                                <div className="event-rev-wrapper">
                                                    <span className="event-rev-text">{row.revenueText}</span>
                                                    <span className="event-sub-text smaller-body-text">{row.cap}</span>
                                                </div>
                                            </td>
                                            <td className="small-body-text rank-td" data-label="Rank">
                                                <span>#{index + 1}</span>
                                            </td>
                                        </tr>
                                    ))}

                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="reports-right-panel">
                    <div className="chart-card donut-chart-card">
                        <h4 className="left-aligned">Sales by Category</h4>
                        <div className="chart-placeholder donut">
                            <ResponsiveContainer width={isMobile ? "100%" : "90%"} height={isMobile ? 180 : 250}>
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        innerRadius={isMobile ? 55 : 65}
                                        outerRadius={isMobile ? 75 : 90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="donut-center-text">
                                <h3>{totalSalesForChart >= 1000 ? `${(totalSalesForChart / 1000).toFixed(1)}k` : totalSalesForChart}</h3>
                                <p>Total Sales</p>
                            </div>
                            <div className="chart-legend multi">
                                <span className="legend-item"><span className="dot blue"></span>Booth ({getPercent(categoryData[0].value)}%)</span>
                                <span className="legend-item"><span className="dot purple"></span>Seats ({getPercent(categoryData[1].value)}%)</span>
                                <span className="legend-item"><span className="dot gray"></span>Refund ({getPercent(categoryData[2].value)}%)</span>
                            </div>
                        </div>
                    </div>

                    <div className="list-card sponsor-metrics-card">
                        <div className="card-header">
                            <h4 className="left-aligned">Event Distribution Ratings</h4>
                        </div>
                        <div className="progress-list">
                            <div className="progress-group">
                                <div className="progress-header">
                                    <span className="small-body-text label-text">Booth Occupancy</span>
                                    <span className="small-body-text percent-text">{overviewStats.boothOccupancy}%</span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-fill blue" style={{ width: `${overviewStats.boothOccupancy}%` }}></div>
                                </div>
                            </div>
                            <div className="progress-group">
                                <div className="progress-header">
                                    <span className="small-body-text label-text">Seats Occupancy</span>
                                    <span className="small-body-text percent-text">{overviewStats.seatOccupancy}%</span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-fill green" style={{ width: `${overviewStats.seatOccupancy}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
