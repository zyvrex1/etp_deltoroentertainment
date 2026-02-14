import React, { useState, useEffect } from "react";
import "./reportsandanalytics.css";
import { Icon } from "@iconify/react";
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


export default function ReportsAnalytics() {
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [activeEvent, setActiveEvent] = useState("all");
    const [activeDate, setActiveDate] = useState("7days");

    const eventOptions = [
        { label: "All Events", value: "all" },
        { label: "Tech Expo 2026", value: "tech" },
        { label: "Startup Summit", value: "startup" },
        { label: "Music Festival", value: "music" },
    ];

    const dateOptions = [
        { label: "Last Week", value: "7days" },
        { label: "Last Month", value: "30days" },
        { label: "Last Quarter", value: "90days" },
        { label: "Last Year", value: "365days" },
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
    ];


    const COLORS = ["var(--color-red-primary)", "var(--color-blue-primary)", "var(--color-purple-primary)", "var(--color-yellow-primary)"];


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

                        {/* Date Dropdown */}
                        <div className="tx-filter-dropdown">
                            <button
                                className="outlined-button filter-button"
                                onClick={() =>
                                    setActiveDropdown(
                                        activeDropdown === "date" ? null : "date"
                                    )
                                }
                            >
                                <span>
                                    {dateOptions.find(
                                        (opt) => opt.value === activeDate
                                    )?.label}
                                </span>

                                <Icon
                                    icon="mdi:chevron-down"
                                    width="18"
                                    className={`dropdown-icon ${activeDropdown === "date" ? "rotate" : ""
                                        }`}
                                />
                            </button>

                            {activeDropdown === "date" && (
                                <div className="tx-filter-dropdown-menu">
                                    {dateOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            className={`tx-filter-dropdown-item ${activeDate === option.value ? "active" : ""
                                                }`}
                                            onClick={() => {
                                                setActiveDate(option.value);
                                                setActiveDropdown(null);
                                            }}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Export Button */}
                    <button className="outlined-button export-btn">
                        <Icon icon="mdi:download-outline" width="18" />
                        Export Report
                    </button>

                </div>
            </div>

            {/* Metrics */}
            <div className="stats-grid">

                <div className="stat-card">
                    <div className="upper-stats">
                        <span className="icon green">
                            <Icon icon="mdi:currency-usd" width="32" />
                        </span>
                        <span className="trend up">↑ 12.5%</span>
                    </div>

                    <div className="bottom-stats">
                        <p className="regular-body-text">Total Revenue</p>
                        <h3>$687,550.00</h3>
                        <p className="smaller-body-text">vs last period</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="upper-stats">
                        <span className="icon red">
                            <Icon icon="solar:ticket-outline" width="32" />
                        </span>
                        <span className="trend up">↑ 8.2%</span>
                    </div>

                    <div className="bottom-stats">
                        <p className="regular-body-text">Tickets Sold</p>
                        <h3>1,245</h3>
                        <p className="smaller-body-text">vs last period</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="upper-stats">
                        <span className="icon blue">
                            <Icon icon="mdi:office-building-outline" width="32" />
                        </span>
                        <span className="trend up">↑ 5.4%</span>
                    </div>

                    <div className="bottom-stats">
                        <p className="regular-body-text">Booth Rents</p>
                        <h3>400</h3>
                        <p className="smaller-body-text">vs last period</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="upper-stats">
                        <span className="icon purple">
                            <Icon icon="mdi:account-group" width="32" />
                        </span>
                        <span className="trend up">↑ 5.4%</span>
                    </div>

                    <div className="bottom-stats">
                        <p className="regular-body-text">Total Users</p>
                        <h3>8,542</h3>
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

                    <ResponsiveContainer width="100%" height={300}>
    <LineChart data={revenueData}>

        {/* Gradient Definition */}
        <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-red-primary)" stopOpacity={0.3}/>
                <stop offset="100%" stopColor="var(--color-red-primary)" stopOpacity={0}/>
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
                fontSize: 14,
                fontWeight: 500,
            }}
            tickLine={false}
            axisLine={{ stroke: "var(--color-black-quaternary" }}
        />

        {/* Y Axis */}
        <YAxis
            tick={{
                fill: "var(--color-black-secondary)",
                fontSize: 14,
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

                   <ResponsiveContainer width="100%" height={300}>
    <BarChart data={ticketSalesData}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-black-tertiary)" />

        <XAxis
            dataKey="day"
            tick={{
                fill: "var(--color-black-secondary)",
                fontSize: 14,
                fontWeight: 500
            }}
            tickLine={false}
            axisLine={{ stroke: "var(--color-border)" }}
        />

        <YAxis
            tick={{
                fill: "var(--color-black-secondary)",
                fontSize: 14
            }}
            tickLine={false}
            axisLine={false}
        />

        <Tooltip
            contentStyle={{
                backgroundColor: "var(--color-white-primary)",
                border: "1px solid var(--color-border)",
                borderRadius: "10px"
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

                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    dataKey="value"
                                    nameKey="name" sty
                                    innerRadius={70}
                                    outerRadius={100}
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

                            {topEvents.map((event, index) => (
                                <div key={index} className="table-row">
                                    <h6>{event.name}</h6>
                                    <span className="small-body-text">{event.date}</span>
                                    <span className="small-body-text">{event.tickets}</span>
                                    <span className="regular-body-text revenue">{event.revenue}</span>
                                    <span className="button-label status">{event.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>


        </div>
    );
}
