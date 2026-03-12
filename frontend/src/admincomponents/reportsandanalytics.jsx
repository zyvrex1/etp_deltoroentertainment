import React, { useState, useEffect } from "react";
import "./reportsandanalytics.css";
import { Icon } from "@iconify/react";
import jsPDF from "jspdf";
import { loadLogo, addReportHeader, addReportFooter, showExportToast, removeExportToast, drawTable } from "./utils/pdfExport";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import DateRangePicker from "./DateRangePicker";


export default function ReportsAnalytics() {
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [activeEvent, setActiveEvent] = useState("all");
    const [dateRange, setDateRange] = useState(() => {
        const now = new Date();
        const start = new Date(now);
        start.setDate(start.getDate() - 6);
        return { preset: "last7", presetLabel: "Last 7 days", start, end: new Date(now) };
    });

    const eventOptions = [
        { label: "All Events", value: "all" },
        { label: "Tech Expo 2026", value: "tech" },
        { label: "Startup Summit", value: "startup" },
        { label: "Music Festival", value: "music" },
    ];


    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (!event.target.closest(".tx-filter-dropdown")) {
                setActiveDropdown(null);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Static Data for Charts
    const revenueData = [
        { month: "Jan", revenue: 42000 },
        { month: "Feb", revenue: 30000 },
        { month: "Mar", revenue: 20000 },
        { month: "Apr", revenue: 28000 },
        { month: "May", revenue: 19000 },
        { month: "Jun", revenue: 24000 },
        { month: "Jul", revenue: 36000 },
    ];

    const ticketSalesData = [
        { day: "Mon", sales: 120 },
        { day: "Tue", sales: 135 },
        { day: "Wed", sales: 100 },
        { day: "Thu", sales: 140 },
        { day: "Fri", sales: 190 },
        { day: "Sat", sales: 240 },
        { day: "Sun", sales: 210 },
    ];

    const categoryData = [
        { name: "Technology", value: 35 },
        { name: "Music", value: 25 },
        { name: "Business", value: 20 },
        { name: "Art", value: 20 },
    ];

    const topEvents = [
        {
            name: "TechStart Summit 2026",
            date: "Jun 16, 2026",
            tickets: "450/600",
            revenue: "$103,550",
            status: "Active",
        },
        {
            name: "Music Festival 2024",
            date: "Nov 15, 2024",
            tickets: "2,100/5,000",
            revenue: "$185,200",
            status: "Active",
        },
        {
            name: "Creator Economy Expo",
            date: "Nov 05, 2024",
            tickets: "120/500",
            revenue: "$33,230",
            status: "Active",
        },
        {
            name: "Game Dev Con 2024",
            date: "Dec 10, 2024",
            tickets: "800/1,000",
            revenue: "$95,000",
            status: "Active",
        },
        {
            name: "Startup Pitch Night",
            date: "Jan 20, 2025",
            tickets: "150/200",
            revenue: "$12,500",
            status: "Pending",
        },
        {
            name: "Art Gallery Opening",
            date: "Feb 14, 2025",
            tickets: "300/300",
            revenue: "$45,000",
            status: "Sold Out",
        },
        {
            name: "Blockchain Summit",
            date: "Mar 05, 2025",
            tickets: "400/500",
            revenue: "$120,000",
            status: "Active",
        },
        {
            name: "AI Workshop",
            date: "Apr 12, 2025",
            tickets: "50/50",
            revenue: "$5,000",
            status: "Sold Out",
        }
    ];

    // Pagination Logic
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const totalPages = Math.ceil(topEvents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedEvents = topEvents.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const COLORS = ["var(--color-red-primary)", "var(--color-blue-primary)", "var(--color-purple-primary)", "var(--color-yellow-primary)"];

    const exportReport = async () => {
        const loadingToast = showExportToast();
        try {
            const logoData = await loadLogo();
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 15;
            const FOOTER_HEIGHT = 15;
            let y = 45;
            const lineHeight = 6;

            addReportHeader(pdf, "Reports & Analytics", logoData);

            // Key Metrics Section
            pdf.setFontSize(12);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont("helvetica", "bold");
            pdf.text("Key Metrics", margin, y);
            y += lineHeight + 2;

            pdf.setFontSize(10);
            pdf.setTextColor(50, 50, 50);
            pdf.setFont("helvetica", "normal");
            pdf.text("Total Events: 156 (↑ 12.5%)", margin + 2, y); y += lineHeight;
            pdf.text("Pending Approvals: 8", margin + 2, y); y += lineHeight;
            pdf.text("Tickets Sold: 12,458 (↑ 8.2%)", margin + 2, y); y += lineHeight;
            pdf.text("Total Revenue: $458,920 (↑ 15.3%)", margin + 2, y); y += lineHeight;
            pdf.text("Active Users: 8,542 (↑ 5.8%)", margin + 2, y); y += lineHeight;
            pdf.text("Booths Reserved: 342 (↑ 22.3%)", margin + 2, y); y += lineHeight;
            pdf.text("Pending Payouts: $45,230", margin + 2, y); y += lineHeight;
            pdf.text("Support Tickets: 12", margin + 2, y); y += lineHeight + 6;

            // Revenue Trends Section
            pdf.setFontSize(12);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont("helvetica", "bold");
            pdf.text("Revenue Trends (Monthly)", margin, y);
            y += lineHeight + 2;
            pdf.setFontSize(9);
            pdf.setTextColor(50, 50, 50);
            pdf.setFont("helvetica", "normal");
            revenueData.forEach((d) => {
                pdf.text(`${d.month}: $${d.revenue.toLocaleString()}`, margin + 2, y);
                y += lineHeight - 1;
            });
            y += 4;

            // Ticket Sales Section
            pdf.setFontSize(12);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont("helvetica", "bold");
            pdf.text("Ticket Sales (Daily)", margin, y);
            y += lineHeight + 2;
            pdf.setFontSize(9);
            pdf.setTextColor(50, 50, 50);
            pdf.setFont("helvetica", "normal");
            ticketSalesData.forEach((d) => {
                pdf.text(`${d.day}: ${d.sales} tickets`, margin + 2, y);
                y += lineHeight - 1;
            });
            y += 4;

            // Event Categories Section
            pdf.setFontSize(12);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont("helvetica", "bold");
            pdf.text("Event Categories Distribution", margin, y);
            y += lineHeight + 2;
            pdf.setFontSize(9);
            pdf.setTextColor(50, 50, 50);
            pdf.setFont("helvetica", "normal");
            categoryData.forEach((d) => {
                pdf.text(`${d.name}: ${d.value}%`, margin + 2, y);
                y += lineHeight - 1;
            });
            y += 6;

            // Top Performing Events Table
            pdf.setFontSize(12);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont("helvetica", "bold");
            pdf.text("Top Performing Events", margin, y);
            y += 8;
            
            const eventHeaders = ['Event Name', 'Date', 'Tickets', 'Revenue', 'Status'];
            const eventRows = topEvents.map(e => [
                e.name,
                e.date,
                e.tickets,
                e.revenue,
                e.status
            ]);
            y = drawTable(pdf, y, eventHeaders, eventRows, margin, pdfWidth, pdfHeight, FOOTER_HEIGHT);

            y += 4;
            pdf.setFontSize(9);
            pdf.setTextColor(100, 100, 100);
            pdf.text("Report generated from Reports & Analytics. Charts and detailed data available in the dashboard.", margin, y, { maxWidth: pdfWidth - 2 * margin });

            addReportFooter(pdf, 1, 1);
            pdf.save(`Reports_Analytics_${new Date().toISOString().split("T")[0]}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            removeExportToast(loadingToast);
        }
    };

    return (
        <div className="reports-container">

            {/* Header */}
            <div className="reports-header">
                <div>
                    <h1>Reports & Analytics</h1>
                    <p>Platform performance and revenue insights.</p>
                </div>
                <div className="reports-actions">
                    {/* Event Dropdown */}
                    <div className="filters-group">
                        <div className="tx-filter-dropdown">
                            <button
                                className="outlined-button filter-button"
                                onClick={() =>
                                    setActiveDropdown(
                                        activeDropdown === "event" ? null : "event"
                                    )
                                }
                            >
                                <span>
                                    {eventOptions.find(
                                        (opt) => opt.value === activeEvent
                                    )?.label}
                                </span>

                                <Icon
                                    icon="mdi:chevron-down"
                                    width="18"
                                    className={`dropdown-icon ${activeDropdown === "event" ? "rotate" : ""
                                        }`}
                                />
                            </button>

                            {activeDropdown === "event" && (
                                <div className="tx-filter-dropdown-menu">
                                    {eventOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            className={`tx-filter-dropdown-item ${activeEvent === option.value ? "active" : ""
                                                }`}
                                            onClick={() => {
                                                setActiveEvent(option.value);
                                                setActiveDropdown(null);
                                            }}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <DateRangePicker
                            value={dateRange}
                            onChange={setDateRange}
                            buttonClassName="outlined-button filter-button"
                            placeholder="Select date range"
                        />

                    </div>

                    {/* Export Button */}
                    <button className="outlined-button export-btn" onClick={exportReport}>
                        <Icon icon="mdi:download-outline" width="18" />
                        Export Report
                    </button>

                </div>
            </div>

            {/* Metrics */}
            <div className="stats-grid">

                <div className="stat-card">
                    <div className="upper-stats">
                        <span className="icon red">
                            <Icon icon="mdi:calendar-blank" width="32" />
                        </span>
                        <span className="trend up">↑ 12.5%</span>
                    </div>

                    <div className="bottom-stats">
                        <p className="regular-body-text">Total Events</p>
                        <h3>156</h3>
                        <p className="smaller-body-text">vs last period</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="upper-stats">
                        <span className="icon yellow">
                            <Icon icon="mdi:clock-outline" width="32" />
                        </span>
                        <span className="trend hidden"></span>
                    </div>

                    <div className="bottom-stats">
                        <p className="regular-body-text">Pending Approvals</p>
                        <h3>8</h3>
                        <p className="smaller-body-text">vs last period</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="upper-stats">
                        <span className="icon blue">
                            <Icon icon="mdi:ticket-outline" width="32" />
                        </span>
                        <span className="trend up">↑ 8.2%</span>
                    </div>

                    <div className="bottom-stats">
                        <p className="regular-body-text">Tickets Sold</p>
                        <h3>12,458</h3>
                        <p className="smaller-body-text">vs last period</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="upper-stats">
                        <span className="icon green">
                            <Icon icon="mdi:currency-usd" width="32" />
                        </span>
                        <span className="trend up">↑ 15.3%</span>
                    </div>

                    <div className="bottom-stats">
                        <p className="regular-body-text">Total Revenue</p>
                        <h3>$458,920</h3>
                        <p className="smaller-body-text">vs last period</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="upper-stats">
                        <span className="icon purple">
                            <Icon icon="mdi:account-group-outline" width="32" />
                        </span>
                        <span className="trend up">↑ 5.8%</span>
                    </div>

                    <div className="bottom-stats">
                        <p className="regular-body-text">Active Users</p>
                        <h3>8,542</h3>
                        <p className="smaller-body-text">vs last period</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="upper-stats">
                        <span className="icon orange">
                            <Icon icon="mdi:map-marker-outline" width="32" />
                        </span>
                        <span className="trend up">↑ 22.3%</span>
                    </div>

                    <div className="bottom-stats">
                        <p className="regular-body-text">Booths Reserved</p>
                        <h3>342</h3>
                        <p className="smaller-body-text">vs last period</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="upper-stats">
                        <span className="icon red">
                            <Icon icon="mdi:currency-usd" width="32" />
                        </span>
                        <span className="trend hidden"></span>
                    </div>

                    <div className="bottom-stats">
                        <p className="regular-body-text">Pending Payouts</p>
                        <h3>$45,230</h3>
                        <p className="smaller-body-text">vs last period</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="upper-stats">
                        <span className="icon yellow">
                            <Icon icon="mdi:alert-outline" width="32" />
                        </span>
                        <span className="trend hidden"></span>
                    </div>

                    <div className="bottom-stats">
                        <p className="regular-body-text">Support Tickets</p>
                        <h3>12</h3>
                        <p className="smaller-body-text">vs last period</p>
                    </div>
                </div>

            </div>

            {/* Analytics Charts Section */}
            <div className="analytics-grid">

                {/* Revenue Trends */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Revenue Trends</h3>
                        <p>Monthly revenue breakdown</p>
                    </div>

                    <ResponsiveContainer width="99%" height={300}>
                        <LineChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>

                            {/* Gradient Definition */}
                            <defs>
                                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--color-red-primary)" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="var(--color-red-primary)" stopOpacity={0} />
                                </linearGradient>
                            </defs>

                            {/* Grid */}
                            <CartesianGrid
                                stroke="rgba(0,0,0,0.06)"
                                strokeDasharray="3 3"
                                vertical={false}
                            />

                            {/* X Axis */}
                            <XAxis
                                dataKey="month"
                                tick={{
                                    fill: "var(--color-black-secondary)",
                                    fontSize: 12,
                                    fontWeight: 500,
                                }}
                                tickLine={false}
                                axisLine={{ stroke: "var(--color-black-quaternary" }}
                            />

                            {/* Y Axis */}
                            <YAxis
                                tick={{
                                    fill: "var(--color-black-secondary)",
                                    fontSize: 12,
                                }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `$${value / 1000}k`}
                            />

                            {/* Tooltip */}
                            <Tooltip
                                formatter={(value) => [`$${value.toLocaleString()}`, "Revenue"]}
                                contentStyle={{
                                    backgroundColor: "var(--color-white-primary)",
                                    border: "1px solid var(--color-border)",
                                    borderRadius: "10px",
                                    fontSize: "13px"
                                }}
                                labelStyle={{
                                    color: "var(--color-black-primary)",
                                    fontWeight: 600
                                }}
                            />

                            {/* Line */}
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="var(--color-red-primary)"
                                strokeWidth={3}
                                dot={{
                                    r: 4,
                                    strokeWidth: 2,
                                    fill: "white"
                                }}
                                activeDot={{
                                    r: 6
                                }}
                                animationDuration={800}
                            />

                            {/* Area Under Line */}
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="transparent"
                                fill="url(#revenueGradient)"
                            />

                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Ticket Sales */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Ticket Sales</h3>
                        <p>Daily ticket sales volume</p>
                    </div>

                    <ResponsiveContainer width="99%" height={300}>
                        <BarChart data={ticketSalesData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-black-tertiary)" />

                            <XAxis
                                dataKey="day"
                                tick={{
                                    fill: "var(--color-black-secondary)",
                                    fontSize: 12,
                                    fontWeight: 500
                                }}
                                tickLine={false}
                                axisLine={{ stroke: "var(--color-border)" }}
                            />

                            <YAxis
                                tick={{
                                    fill: "var(--color-black-secondary)",
                                    fontSize: 12
                                }}
                                tickLine={false}
                                axisLine={false}
                            />

                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "var(--color-white-primary)",
                                    border: "1px solid var(--color-border)",
                                    borderRadius: "6px"
                                }}
                                labelStyle={{
                                    color: "var(--color-black-primary)",
                                    fontWeight: 600
                                }}
                            />

                            <Bar
                                dataKey="sales"
                                fill="var(--color-blue-primary)"
                                radius={[6, 6, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Event Categories */}
                {/* Bottom Row: Categories + Top Events */}
                <div className="bottom-row">

                    {/* Event Categories */}
                    <div className="chart-card">
                        <div className="chart-header">
                            <h3>Event Categories</h3>
                            <p>Distribution by type</p>
                        </div>

                        <ResponsiveContainer width="99%" height={300}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={60}
                                    outerRadius={85}
                                    paddingAngle={4}
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Legend */}
                        <div className="pie-legend">
                            {categoryData.map((item, index) => (
                                <div key={item.name} className=" legend-item">
                                    <span
                                        className="legend-color"
                                        style={{ background: COLORS[index] }}
                                    ></span>
                                    <span className="small-body-text">{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Performing Events Table */}
                    <div className="chart-card">
                        <div className="chart-header">
                            <h3>Top Performing Events</h3>
                            <p>By revenue and attendance</p>
                        </div>

                        <div className="events-table">
                            <div className="table-header">
                                <span>Event Name</span>
                                <span>Date</span>
                                <span>Tickets</span>
                                <span>Revenue</span>
                                <span>Status</span>
                            </div>

                            {paginatedEvents.map((event, index) => (
                                <div key={index} className="table-row">
                                    <h6>{event.name}</h6>
                                    <span className="small-body-text">{event.date}</span>
                                    <span className="small-body-text">{event.tickets}</span>
                                    <span className="regular-body-text revenue">{event.revenue}</span>
                                    <span className="button-label status">{event.status}</span>
                                </div>
                            ))}
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
            </div>


        </div>
    );
}
