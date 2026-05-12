import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import analyticsService from "../services/analyticsService";

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
                const [topData, overviewData] = await Promise.all([
                    analyticsService.getTopPerformingEvents(user.token, dateRange.start, dateRange.end),
                    analyticsService.getOverviewStats(user.token, dateRange.start, dateRange.end)
                ]);

                if (topData) setTopEvents(topData);
                if (overviewData) setOverviewStats(overviewData);
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

    const categoryData = [
        { name: "Booth", value: overviewStats.boothsSold || 0, color: "#0059ff" },
        { name: "Seats", value: overviewStats.ticketsSold || 0, color: "#8c52ff" },
        { name: "Refund", value: Math.round((overviewStats.ticketsSold + overviewStats.boothsSold) * (overviewStats.refundRate / 100)) || 0, color: "#e6e6e6" },
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
            const FOOTER_HEIGHT = 15;
            let y = 45;
            const lineHeight = 6;

            addReportHeader(pdf, REPORT_TITLE, logoData);

            pdf.setFontSize(12);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont("helvetica", "bold");
            pdf.text("Key Metrics", margin, y);
            y += lineHeight + 2;

            pdf.setFontSize(10);
            pdf.setTextColor(50, 50, 50);
            pdf.setFont("helvetica", "normal");
            pdf.text(`Gross Revenue: $${overviewStats.grossRevenue.toLocaleString()} (↑ 15%)`, margin + 2, y); y += lineHeight;
            pdf.text(`Net Revenue: $${overviewStats.netRevenue.toLocaleString()} (↑ 12%)`, margin + 2, y); y += lineHeight;
            pdf.text(`Tickets Sold: ${overviewStats.ticketsSold.toLocaleString()} (↑ 8%)`, margin + 2, y); y += lineHeight;
            pdf.text(`Refund Rate: ${overviewStats.refundRate}% (↓ 2%)`, margin + 2, y); y += lineHeight + 6;


            pdf.setFontSize(12);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont("helvetica", "bold");
            pdf.text("Top Performing Events", margin, y);
            y += 8;
            
            const eventHeaders = ['Rank', 'Event Name', 'Tickets Info', 'Revenue Info'];
            const eventRows = topEvents.map((e, index) => [
                `#${index + 1}`,
                e.name,
                e.ticketsText,
                `${e.revenueText} (${e.cap})`
            ]);
            y = drawTable(pdf, y, eventHeaders, eventRows, margin, pdfWidth, pdfHeight, FOOTER_HEIGHT, 10, 3, logoData, REPORT_TITLE);

            y += 10;
            pdf.setFontSize(9);
            pdf.setTextColor(100, 100, 100);
            pdf.text("Report generated from Reports & Analytics.", margin, y, { maxWidth: pdfWidth - 2 * margin });

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
                            <span className={`trend ${overviewStats.boothsTrend >= 0 ? 'up' : 'down'}`}>
                                <Icon icon={overviewStats.boothsTrend >= 0 ? "mdi:trending-up" : "mdi:trending-down"} /> 
                                {Math.abs(overviewStats.boothsTrend)}%
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
