import "./Dashboard.css";
import { Icon } from "@iconify/react";
import CreateEventModal from './Modal/CreateEventModal';
import ViewReportModal from './Modal/ViewReportModal';
import AddUserModal from './Modal/CreateUserModal';
import ViewNotif from './Modal/ViewNotif';

import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, AreaChart, Area, LineChart, Line, PieChart, Pie } from 'recharts';
import { useAuthContext } from './hooks/useAuthContext';
import eventsService from '../services/eventsService';
import adminService from '../services/adminService';
import concernService from '../services/concernService';

import { useNotificationsContext } from './hooks/useNotificationsContext';
import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function Dashboard() {
    const { user } = useAuthContext();
    const { notifications } = useNotificationsContext();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [showAllNotifs, setShowAllNotifs] = useState(false);

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Live Stats State
    const [stats, setStats] = useState({
        totalEvents: 0,
        pendingApprovals: 0,
        totalUsers: 0,
        eventStatusData: [
            { name: 'Active', value: 0, color: '#4ca626' },
            { name: 'Upcoming', value: 0, color: '#0059ff' },
            { name: 'Completed', value: 0, color: '#b3b3b3' },
            { name: 'Pending', value: 0, color: '#ffcc00' },
        ],
        pendingTickets: 0,
        newUsersThisMonth: 0,
        userTrend: 0,
        currentYear: new Date().getFullYear(),
        currentMonthName: '',
        userGrowthData: [],
        loading: true
    });

    const fetchDashboardStats = async () => {
        if (!user?.token) return;

        try {
            // Fetch events, users, and concerns in parallel
            const [events, users, concerns] = await Promise.all([
                eventsService.getEvents(user.token),
                adminService.getUsers(user.token),
                concernService.getAdminConcerns(user.token)
            ]);

            const pendingCount = events.filter(e => e.status === 'pending').length;
            const activeCount = events.filter(e => e.status === 'approved').length;
            const completedCount = events.filter(e => e.status === 'completed').length;
            const upcomingCount = events.filter(e => {
                if (e.status !== 'approved' || !e.startDate) return false;
                const now = new Date();
                const start = new Date(e.startDate);
                return start > now;
            }).length;

            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
            const lastMonth = lastMonthDate.getMonth();
            const lastMonthYear = lastMonthDate.getFullYear();

            const usersThisMonth = users.filter(u => {
                const d = new Date(u.createdAt);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            }).length;

            const usersLastMonth = users.filter(u => {
                const d = new Date(u.createdAt);
                return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
            }).length;

            let userTrend = 0;
            if (usersLastMonth > 0) {
                userTrend = ((usersThisMonth - usersLastMonth) / usersLastMonth) * 100;
            } else if (usersThisMonth > 0) {
                userTrend = 100;
            }

            const usersThisYear = users.filter(u => {
                const d = new Date(u.createdAt);
                return d.getFullYear() === currentYear;
            }).length;

            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const dynamicGrowthData = Array.from({ length: 12 }, (_, i) => {
                const monthUsers = users.filter(u => {
                    const d = new Date(u.createdAt);
                    return d.getMonth() === i && d.getFullYear() === currentYear;
                });

                return {
                    month: months[i],
                    customers: monthUsers.filter(u => u.role === 'customer').length,
                    sponsors: monthUsers.filter(u => u.role === 'sponsor').length,
                    promoters: monthUsers.filter(u => u.role === 'promoter').length,
                    admins: monthUsers.filter(u => ['admin', 'superadmin'].includes(u.role)).length,
                    total: monthUsers.length
                };
            });

            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const currentMonthName = monthNames[currentMonth];

            setStats({
                totalEvents: events.length,
                pendingApprovals: pendingCount,
                totalUsers: users.length,
                newUsersThisMonth: usersThisMonth,
                newUsersThisYear: usersThisYear,
                userTrend: userTrend,
                currentYear: currentYear,
                currentMonthName: currentMonthName,
                userGrowthData: dynamicGrowthData,
                eventStatusData: [
                    { name: 'Active', value: activeCount, color: '#4ca626' },
                    { name: 'Upcoming', value: upcomingCount, color: '#0059ff' },
                    { name: 'Completed', value: completedCount, color: '#b3b3b3' },
                    { name: 'Pending', value: pendingCount, color: '#ffcc00' },
                ],
                pendingTickets: concerns.filter(c =>
                    (c.status === 'open' || c.status === 'in-progress') &&
                    String(c.assignedTo) === String(user._id)
                ).length,
                loading: false
            });
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
            setStats(prev => ({ ...prev, loading: false }));
        }
    };

    // Initial Fetch
    useEffect(() => {
        fetchDashboardStats();
    }, [user]);

    // WebSocket Real-time Updates
    useEffect(() => {
        if (!user?.token) return;

        const socket = io(BACKEND_URL);

        socket.on('connect', () => {
            console.log('Dashboard connected to WebSocket');
        });

        socket.on('dashboardUpdate', () => {
            console.log('Real-time dashboard update received');
            fetchDashboardStats();
        });

        return () => {
            socket.disconnect();
        };
    }, [user]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const ticketSalesData = [
        { name: 'TechStart', sold: 60, remaining: 40 },
        { name: 'Creator Expo', sold: 20, remaining: 60 },
        { name: 'Music Fest', sold: 50, remaining: 15 },
        { name: 'AI Summit', sold: 30, remaining: 30 },
    ];


    const revenueData = [
        { month: 'Jan', total: 32000 },
        { month: 'Feb', total: 32000 },
        { month: 'Mar', total: 32000 },
        { month: 'Apr', total: 32000 },
        { month: 'May', total: 32000 },
        { month: 'Jun', total: 32000 },
        { month: 'Jul', total: 45000 },
        { month: 'Aug', total: 39000 },
        { month: 'Sep', total: 52000 },
        { month: 'Oct', total: 61000 },
        { month: 'Nov', total: 55000 },
        { month: 'Dec', total: 72000 },
    ];



    const topPromotersData = [
        { name: 'TechStart Inc', email: 'contact@techstart.com', status: 'Top Rated' },
        { name: 'MusicFest LLC', email: 'info@musicfest.com', status: 'Top Rated' },
        { name: 'EventPro Solutions', email: 'hello@eventpro.com', status: 'Top Rated' },
        { name: 'EventPro Solutions', email: 'hello@eventpro.com', status: 'Top Rated' },
        { name: 'EventPro Solutions', email: 'hello@eventpro.com', status: 'Top Rated' },
        { name: 'EventPro Solutions', email: 'hello@eventpro.com', status: 'Top Rated' },

    ];

    const topSponsorsData = [
        { name: 'Global Tech', event: 'AI Summit 2026', type: 'Platinum' },
        { name: 'Nexus Corp', event: 'Creator Expo', type: 'Gold' },
        { name: 'Startup Hub', event: 'TechStart', type: 'Silver' },
        { name: 'Startup Hub', event: 'TechStart', type: 'Silver' },

        { name: 'Startup Hub', event: 'TechStart', type: 'Silver' },

    ];

    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " min ago";
        return Math.floor(seconds) + " seconds ago";
    };

    const activityConfig = {
        concern: { icon: "mdi:chat-outline", color: "yellow-light" },
        payment: { icon: "mdi:wallet-outline", color: "blue-light" },
        event: { icon: "mdi:calendar-outline", color: "red-light" },
        user: { icon: "mdi:account-plus-outline", color: "purple-light" },
        update: { icon: "mdi:file-document-outline", color: "dark-light" }
    };

    if (stats.loading) {
        return (
            <div className="admin-dashboard-page">
                <div className="dashboard-header">
                    <div className="skeleton-title-wrap">
                        <div className="skeleton skeleton-text title" style={{ width: '200px' }} />
                        <div className="skeleton skeleton-text" style={{ width: '300px' }} />
                    </div>
                    <div className="header-actions">
                        <div className="skeleton skeleton-rect" style={{ width: '120px', height: '40px' }} />
                        <div className="skeleton skeleton-rect" style={{ width: '120px', height: '40px' }} />
                    </div>
                </div>

                <div className="stats-grid-wrapper">
                    <div className="stats-grid">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="dashboard-stat-card skeleton-card">
                                <div className="upper-stats">
                                    <div className="skeleton skeleton-circle" style={{ width: '24px', height: '24px' }} />
                                    <div className="skeleton skeleton-text short" style={{ marginBottom: 0 }} />
                                </div>
                                <div className="bottom-stats" style={{ marginTop: '12px' }}>
                                    <div className="skeleton skeleton-text short" />
                                    <div className="skeleton skeleton-text title" style={{ width: '100px' }} />
                                    <div className="skeleton skeleton-text short" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="main-content-grid">
                    <div className="left-panel">
                        <div className="charts-row">
                            <div className="chart-card skeleton-card" style={{ height: '300px' }}>
                                <div className="skeleton skeleton-text title" style={{ width: '150px' }} />
                                <div className="skeleton skeleton-rect" style={{ height: '200px', marginTop: '20px' }} />
                            </div>
                            <div className="chart-card skeleton-card" style={{ height: '300px' }}>
                                <div className="skeleton skeleton-text title" style={{ width: '150px' }} />
                                <div className="skeleton skeleton-rect" style={{ height: '200px', marginTop: '20px' }} />
                            </div>
                        </div>
                        <div className="chart-card wide skeleton-card" style={{ height: '350px' }}>
                            <div className="skeleton skeleton-text title" style={{ width: '200px' }} />
                            <div className="skeleton skeleton-rect" style={{ height: '250px', marginTop: '20px' }} />
                        </div>
                    </div>
                    <div className="right-panel">
                        <div className="quick-actions-card skeleton-card">
                            <div className="skeleton skeleton-text title" />
                            <div className="skeleton skeleton-rect" style={{ height: '40px', marginTop: '10px' }} />
                            <div className="skeleton skeleton-rect" style={{ height: '40px', marginTop: '10px' }} />
                        </div>
                        <div className="system-alerts-card skeleton-card" style={{ height: '300px' }}>
                            <div className="skeleton skeleton-text title" />
                            {[...Array(3)].map((_, i) => (
                                <div key={i} style={{ marginTop: '15px' }}>
                                    <div className="skeleton skeleton-text" />
                                    <div className="skeleton skeleton-rect" style={{ height: '40px' }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-page">
            <div className="dashboard-header">
                <div>
                    <h1>Dashboard</h1>
                    <p>System overview and key metrics.</p>
                </div>
                <div className="header-actions">
                    <button className="outlined-button view-report-btn" onClick={() => setIsReportModalOpen(true)}>
                        View Report
                    </button>
                    <button className="primary-button create-btn" onClick={() => setIsModalOpen(true)}>
                        Create Event
                    </button>
                </div>
            </div>

            <div className="stats-grid-wrapper">
                <div className="stats-grid">
                    <div className="dashboard-stat-card">
                        <div className="upper-stats">
                            <span className="icon red"><Icon icon="mdi:calendar-blank" width="24" /></span>
                            <span className="trend up"><Icon icon="mdi:trending-up" /> 12.5%</span>
                        </div>
                        <div className="bottom-stats">
                            <p className="regular-body-text left-aligned">Total Events</p>
                            <h3>{stats.loading ? "..." : stats.totalEvents}</h3>
                        </div>
                    </div>
                    <div className="dashboard-stat-card">
                        <div className="upper-stats">
                            <span className="icon yellow"><Icon icon="mdi:clock-outline" width="24" /></span>
                            <span className="trend hidden"></span>
                        </div>
                        <div className="bottom-stats">
                            <p className="regular-body-text left-aligned">Pending Approvals</p>
                            <h3>{stats.loading ? "..." : stats.pendingApprovals}</h3>
                        </div>
                    </div>
                    <div className="dashboard-stat-card">
                        <div className="upper-stats">
                            <span className="icon blue"><Icon icon="mdi:ticket-outline" width="24" /></span>
                            <span className="trend up"><Icon icon="mdi:trending-up" /> 8.2%</span>
                        </div>
                        <div className="bottom-stats">
                            <p className="regular-body-text left-aligned">Tickets Sold</p>
                            <h3>12,458</h3>
                            <p className="smaller-body-text left-aligned">vs last month</p>
                        </div>
                    </div>
                    <div className="dashboard-stat-card">
                        <div className="upper-stats">
                            <span className="icon green"><Icon icon="mdi:currency-usd" width="24" /></span>
                            <span className="trend up"><Icon icon="mdi:trending-up" /> 15.3%</span>
                        </div>
                        <div className="bottom-stats">
                            <p className="regular-body-text left-aligned">Total Revenue</p>
                            <h3>$458,920</h3>
                            <p className="smaller-body-text left-aligned">vs last month</p>
                        </div>
                    </div>
                    <div className="dashboard-stat-card">
                        <div className="upper-stats">
                            <span className="icon purple"><Icon icon="mdi:account-group-outline" width="24" /></span>
                            <span className={`trend ${stats.userTrend >= 0 ? 'up' : 'down'}`}>
                                <Icon icon={stats.userTrend >= 0 ? "mdi:trending-up" : "mdi:trending-down"} /> 
                                {stats.loading ? "0%" : `${Math.abs(stats.userTrend).toFixed(1)}%`}
                            </span>
                        </div>
                        <div className="bottom-stats">
                            <p className="regular-body-text left-aligned">Total Users this {stats.currentMonthName}</p>
                            <h3>{stats.loading ? "..." : stats.newUsersThisMonth}</h3>
                            <p className="smaller-body-text left-aligned">
                                {stats.loading ? "Calculating..." : `The total created accounts is ${stats.totalUsers} (this ${stats.currentMonthName})`}
                            </p>
                        </div>
                    </div>
                    <div className="dashboard-stat-card">
                        <div className="upper-stats">
                            <span className="icon orange"><Icon icon="mdi:map-marker-outline" width="24" /></span>
                            <span className="trend up"><Icon icon="mdi:trending-up" /> 22.3%</span>
                        </div>
                        <div className="bottom-stats">
                            <p className="regular-body-text left-aligned">Booths Reserved</p>
                            <h3>342</h3>
                            <p className="smaller-body-text left-aligned">vs last month</p>
                        </div>
                    </div>
                    <div className="dashboard-stat-card">
                        <div className="upper-stats">
                            <span className="icon red"><Icon icon="mdi:currency-usd" width="24" /></span>
                            <span className="trend hidden"></span>
                        </div>
                        <div className="bottom-stats">
                            <p className="regular-body-text left-aligned">Pending Payouts</p>
                            <h3>5</h3>
                        </div>
                    </div>
                    <div className="dashboard-stat-card">
                        <div className="upper-stats">
                            <span className="icon yellow"><Icon icon="mdi:alert-outline" width="24" /></span>
                            <span className="trend hidden"></span>
                        </div>
                        <div className="bottom-stats">
                            <p className="regular-body-text left-aligned">Pending Tickets</p>
                            <h3>{stats.loading ? "..." : stats.pendingTickets}</h3>
                            <p className="smaller-body-text left-aligned">assigned to you</p>
                            <span className="view-details" onClick={() => navigate('/admin/support')}>
                                View details <Icon icon="mdi:arrow-right" />
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="main-content-grid">
                <div className="left-panel">
                    <div className="charts-row">
                        <div className="chart-card bar-chart-card">
                            <h4 className="left-aligned">Ticket Sales by Event</h4>
                            <div className="chart-placeholder">
                                <ResponsiveContainer width="100%" height={isMobile ? 160 : 220}>
                                    <BarChart
                                        data={ticketSalesData}
                                        maxBarSize={isMobile ? 14 : 30}
                                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                    >
                                        {!isMobile && (
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                                        )}

                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: isMobile ? 9 : 11 }}
                                        />

                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: isMobile ? 9 : 11 }}
                                        />

                                        <RechartsTooltip />

                                        <Bar dataKey="sold" stackId="a" fill="#0059ff" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="remaining" stackId="a" fill="#e6e6e6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                                <div className="chart-legend">
                                    <span className="legend-item"><span className="dot blue"></span>Tickets Sold</span>
                                    <span className="legend-item"><span className="dot gray"></span>Total Capacity</span>
                                </div>
                            </div>
                        </div>

                        <div className="chart-card donut-chart-card">
                            <h4 className="left-aligned">Event Status Distribution</h4>
                            <div className="chart-placeholder donut">
                                <ResponsiveContainer width="100%" height={isMobile ? 140 : 160}>
                                    <PieChart>
                                        <Pie
                                            data={stats.eventStatusData}
                                            innerRadius={isMobile ? 35 : 45}
                                            outerRadius={isMobile ? 55 : 65}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {stats.eventStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>                                <div className="donut-center-text">
                                    <h3>{stats.loading ? "..." : stats.totalEvents}</h3>
                                    <p>Total Events</p>
                                </div>
                                <div className="chart-legend multi">
                                    <span className="legend-item"><span className="dot green"></span>Active</span>
                                    <span className="legend-item"><span className="dot blue"></span>Upcoming</span>
                                    <span className="legend-item"><span className="dot gray"></span>Completed</span>
                                    <span className="legend-item"><span className="dot yellow"></span>Pending</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="chart-card wide area">
                        <div className="chart-card-header">
                            <h4 className="left-aligned">Revenue Overview</h4>
                            <span className="button-label green">+15.3%</span>
                        </div>
                        <div className="chart-placeholder area-placeholder">
                            <ResponsiveContainer width="100%" height={isMobile ? 180 : 250}>
                                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>

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

                                    <RechartsTooltip formatter={(value) => `$${value}`} />

                                    <Area
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#c62828"
                                        strokeWidth={isMobile ? 2 : 3}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>                        </div>
                    </div>

                    <div className="chart-card wide line">
                        <div className="chart-card-header">
                            <h4 className="left-aligned">User Growth</h4>
                            <div className="header-stats">
                                <span className="stat-pill">
                                    <Icon icon="mdi:account-plus" />
                                    {stats.loading ? "..." : `${stats.newUsersThisYear} joined in ${stats.currentYear}`}
                                </span>
                            </div>
                        </div>
                        <div className="chart-placeholder line-placeholder">
                            <ResponsiveContainer width="100%" height={isMobile ? 170 : 200}>
                                <LineChart data={stats.userGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>

                                    {!isMobile && (
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                                    )}

                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: isMobile ? 10 : 11 }}
                                    />

                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: isMobile ? 10 : 11 }}
                                        tickFormatter={(val) => val >= 1000 ? `${val / 1000}k` : val}
                                    />

                                    <RechartsTooltip />

                                    <Line
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#4a4a4a"
                                        strokeWidth={3}
                                        strokeDasharray="5 5"
                                        dot={{ r: isMobile ? 2 : 4, fill: "white", strokeWidth: 2 }}
                                    />

                                    <Line
                                        type="monotone"
                                        dataKey="customers"
                                        stroke="#0059ff"
                                        strokeWidth={2}
                                        dot={{ r: isMobile ? 2 : 4, fill: "white", strokeWidth: 2 }}
                                    />

                                    <Line
                                        type="monotone"
                                        dataKey="sponsors"
                                        stroke="#4ca626"
                                        strokeWidth={2}
                                        dot={{ r: isMobile ? 2 : 4, fill: "white", strokeWidth: 2 }}
                                    />

                                    <Line
                                        type="monotone"
                                        dataKey="promoters"
                                        stroke="#c62828"
                                        strokeWidth={2}
                                        dot={{ r: isMobile ? 2 : 4, fill: "white", strokeWidth: 2 }}
                                    />

                                    <Line
                                        type="monotone"
                                        dataKey="admins"
                                        stroke="#800080"
                                        strokeWidth={2}
                                        dot={{ r: isMobile ? 2 : 4, fill: "white", strokeWidth: 2 }}
                                    />

                                </LineChart>
                            </ResponsiveContainer>                            <div className="chart-legend">
                                <span className="legend-item"><span className="dot dash"></span>Total</span>
                                <span className="legend-item"><span className="dot blue"></span>Customers</span>
                                <span className="legend-item"><span className="dot green"></span>Sponsors</span>
                                <span className="legend-item"><span className="dot red"></span>Promoters</span>
                                <span className="legend-item"><span className="dot purple"></span>Admins</span>
                            </div>
                        </div>
                    </div>

                    <div className="split-cards-container">
                        <div className="list-card promoters-card">
                            <div className="card-header">
                                <h4 className="left-aligned">Top Promoters</h4>
                            </div>
                            <div className="promoters-list">
                                {topPromotersData.map((promoter, i) => (
                                    <div className="promoter-item" key={i}>
                                        <div className="promoter-info left-aligned">
                                            <div className="icon purple"><Icon icon="mdi:account" /></div>
                                            <div className="details left-aligned">
                                                <h5>{promoter.name}</h5>
                                                <p>{promoter.email}</p>
                                            </div>
                                        </div>
                                        <span className="button-label green-badge">{promoter.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="list-card sponsors-card">
                            <div className="card-header">
                                <h4 className="left-aligned">Top Sponsors</h4>
                            </div>
                            <div className="promoters-list">
                                {topSponsorsData.map((sponsor, i) => (
                                    <div className="promoter-item" key={i}>
                                        <div className="promoter-info left-aligned">
                                            <div className="icon blue"><Icon icon="mdi:domain" /></div>
                                            <div className="details left-aligned">
                                                <h5>{sponsor.name}</h5>
                                                <p>{sponsor.event}</p>
                                            </div>
                                        </div>
                                        <span className="button-label blue-badge">{sponsor.type}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="right-panel">
                    <div className="quick-actions-card">
                        <h4 className="left-aligned">Quick Actions</h4>
                        <NavLink to="/admin/event-approval" className="outlined-button link-btn left-aligned-flex">
                            <Icon icon="mdi:check-circle-outline" /> <span>Review Pending Events</span>
                        </NavLink>
                        <button className="outlined-button link-btn left-aligned-flex" onClick={() => setIsUserModalOpen(true)}>
                            <Icon icon="mdi:account-plus-outline" /> <span>Add New Admin</span>
                        </button>
                        <NavLink to="/admin/payments" className="outlined-button link-btn left-aligned-flex">
                            <Icon icon="mdi:currency-usd" /> <span>Process Payouts</span>
                        </NavLink>
                        {/* 
                        <div className="alert-card red-alert left-aligned">
                            <div className="alert-header left-aligned">
                                <Icon icon="mdi:alert-circle" width="24" className="alert-icon" />
                                <div className="alert-info left-aligned">
                                    <h4 className="left-aligned">Action Required</h4>
                                    <p className="left-aligned">4 promoter payouts are pending approval.</p>
                                </div>
                            </div>
                            <NavLink to="/admin/payments" >
                                <button className="outlined-button red-outline">Review Payouts</button>
                            </NavLink>
                        </div> */}
                    </div>



                    <div className="system-alerts-card">
                        <div className="card-header">
                            <h4 className="left-aligned">System Alerts</h4>
                            <span className="button-label red">{notifications.filter(n => n.unread).length} Active</span>
                        </div>
                        <div className="alerts-list">
                            <div className="alert-item yellow-bg left-aligned-flex">
                                <Icon icon="mdi:alert-outline" className="alert-icon" />
                                <div className="alert-details left-aligned">
                                    <h5 className="left-aligned">Pending Concerns</h5>
                                    <p className="left-aligned">{stats.loading ? "..." : stats.pendingTickets} concerns waiting for your review</p>
                                    <span className="time left-aligned">Just now</span>
                                </div>
                                <Icon icon="mdi:close" className="close-icon" />
                            </div>
                            <div className="alert-item red-bg left-aligned-flex">
                                <Icon icon="mdi:alert-octagon-outline" className="alert-icon" />
                                <div className="alert-details left-aligned">
                                    <h5 className="left-aligned">Pending Approval</h5>
                                    <p className="left-aligned">{stats.loading ? "..." : stats.pendingApprovals} events waiting for approval</p>
                                    <span className="time left-aligned">Just now</span>
                                </div>
                                <Icon icon="mdi:close" className="close-icon" />
                            </div>
                            <div className="alert-item blue-bg left-aligned-flex">
                                <Icon icon="mdi:alert-circle-outline" className="alert-icon" />
                                <div className="alert-details left-aligned">
                                    <h5 className="left-aligned">Pending Payout Requests</h5>
                                    <p className="left-aligned">5 payouts waiting for approval</p>
                                    <span className="time left-aligned">2 hours ago</span>
                                </div>
                                <Icon icon="mdi:close" className="close-icon" />
                            </div>
                        </div>
                    </div>

                    <div className="recent-activity-card">
                        <div className="card-header">
                            <h4 className="left-aligned">Recent Activity</h4>
                            <span className="view-all" onClick={() => setShowAllNotifs(true)}>
                                View all <Icon icon="mdi:arrow-right" />
                            </span>
                        </div>
                        <div className="activity-list">
                            {notifications.length > 0 ? (
                                notifications.slice(0, 10).map((notif) => {
                                    const config = activityConfig[notif.type] || { icon: "mdi:bell-outline", color: "blue-light" };
                                    return (
                                        <div className="activity-item" key={notif._id}>
                                            <div className="activity-left" onClick={() => navigate(notif.path)}>
                                                <div className={`activity-icon ${config.color}`}>
                                                    <Icon icon={config.icon} />
                                                </div>
                                                <div className="activity-details left-aligned">
                                                    <h5 className="left-aligned">{notif.title}</h5>
                                                    <p className="left-aligned">{notif.content}</p>
                                                </div>
                                            </div>
                                            <div className="activity-right">
                                                <span className="time left-aligned">{timeAgo(notif.createdAt)}</span>
                                                <Icon
                                                    icon="mdi:eye-outline"
                                                    className="view-icon"
                                                    onClick={() => navigate(notif.path)}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="no-activity">No recent activity</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <CreateEventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            <ViewReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
            <AddUserModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} />
            <ViewNotif
                isOpen={showAllNotifs}
                onClose={() => setShowAllNotifs(false)}
                notifications={notifications}
                onNotifClick={(notif) => {
                    setShowAllNotifs(false);
                    navigate(notif.path);
                }}
            />

        </div>
    );
}
