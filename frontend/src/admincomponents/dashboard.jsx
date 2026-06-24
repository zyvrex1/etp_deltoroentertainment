import "./Dashboard.css";
import { Icon } from "@iconify/react";
import CreateEventModal from './Modal/CreateEventModal';
import ViewReportModal from './Modal/ViewReportModal';
import AddUserModal from './Modal/CreateUserModal';
import ViewNotif from './Modal/ViewNotif';

import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, AreaChart, Area, LineChart, Line, PieChart, Pie } from 'recharts';
import { useAuthContext } from '../hooks/useAuthContext';
import eventsService from '../services/eventsService';
import adminService from '../services/adminService';
import concernService from '../services/concernService';
import reservationService from '../services/reservationService';
import payoutService from '../services/payoutService';

import { useNotificationsContext } from '../hooks/useNotificationsContext';
import { getNotificationPath } from '../utils/notificationPaths';
import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-chart-tooltip">
                <p className="tooltip-label">{label}</p>
                <div className="tooltip-items">
                    {payload.map((entry, index) => {
                        let value = entry.value;
                        if (entry.name && entry.name.toLowerCase().includes('revenue')) {
                            value = `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        }
                        return (
                            <div key={index} className="tooltip-item" style={{ color: entry.color }}>
                                <span className="item-name">{entry.name} : </span>
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
        totalBoothsReserved: 0,
        totalRevenue: 0,
        pendingTickets: 0,
        newUsersThisMonth: 0,
        userTrend: 0,
        currentYear: new Date().getFullYear(),
        currentMonthName: '',
        userGrowthData: [],
        revenueData: [],
        upcomingEventsData: [],
        topSponsorsData: [],
        topPromotersData: [],
        boothTrend: 0,
        revenueTrend: 0,
        ticketTrend: 0,
        eventTrend: 0,
        pendingPayoutsCount: 0,
        loading: true
    });

    const fetchDashboardStats = async () => {
        if (!user?.token) return;

        try {
            // Fetch events, users, and concerns in parallel
            const [eventsRaw, usersRaw, concernsRaw, reservationsRaw, payoutsRaw] = await Promise.all([
                eventsService.getEvents(user.token).catch(() => []),
                adminService.getUsers(user.token).catch(() => []),
                concernService.getAdminConcerns().catch(() => []),
                reservationService.getAdminReservations(user.token).catch(() => []),
                payoutService.getPayouts(user.token).catch(() => [])
            ]);

            // Normalize all responses to arrays
            const events = Array.isArray(eventsRaw) ? eventsRaw : (eventsRaw?.data ?? eventsRaw?.events ?? []);
            const users = Array.isArray(usersRaw) ? usersRaw : (usersRaw?.data ?? usersRaw?.users ?? []);
            const concerns = Array.isArray(concernsRaw) ? concernsRaw : (concernsRaw?.data ?? concernsRaw?.concerns ?? []);
            const reservations = Array.isArray(reservationsRaw) ? reservationsRaw : (reservationsRaw?.data ?? reservationsRaw?.reservations ?? []);
            const payouts = Array.isArray(payoutsRaw) ? payoutsRaw : (payoutsRaw?.data ?? payoutsRaw?.payouts ?? []);

            // Filter out cancelled reservations for all metrics
            const activeReservations = reservations.filter(
                res => res.status === 'confirmed'
            );

            const pendingPayoutsCount = (Array.isArray(payouts) ? payouts : [])
                .filter(p => p.status === 'pending' || p.status === 'requested').length;

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

            // Calculate Users Trends
            const usersThisMonth = users.filter(u => {
                const d = new Date(u.createdAt);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            }).length;

            const usersLastMonth = users.filter(u => {
                const d = new Date(u.createdAt);
                return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
            }).length;

            const calculateTrend = (current, previous) => {
                if (previous === 0) return current > 0 ? 100 : 0;
                return ((current - previous) / previous) * 100;
            };

            const userTrend = calculateTrend(usersThisMonth, usersLastMonth);

            // Calculate Booths Trends (using activeReservations)
            const boothsThisMonth = activeReservations.filter(res => {
                const d = new Date(res.createdAt);
                const isBooth = res.type === 'booth';
                return isBooth && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            }).length;

            const boothsLastMonth = activeReservations.filter(res => {
                const d = new Date(res.createdAt);
                const isBooth = res.type === 'booth';
                return isBooth && d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
            }).length;

            const boothTrend = calculateTrend(boothsThisMonth, boothsLastMonth);

            // Calculate Revenue Trends (using activeReservations)
            const revenueThisMonth = activeReservations
                .filter(res => {
                    const d = new Date(res.createdAt);
                    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                })
                .reduce((sum, res) => sum + (res.amount?.total || 0), 0);

            const revenueLastMonth = activeReservations
                .filter(res => {
                    const d = new Date(res.createdAt);
                    return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
                })
                .reduce((sum, res) => sum + (res.amount?.total || 0), 0);

            const revenueTrend = calculateTrend(revenueThisMonth, revenueLastMonth);

            // Calculate Ticket Trends (using activeReservations)
            const ticketsThisMonth = activeReservations.filter(res => {
                const d = new Date(res.createdAt);
                const isTicket = ['seat', 'general-fee', 'mixed-ticket'].includes(res.type);
                return isTicket && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            }).reduce((sum, res) => sum + (res.seatIds?.length || 1), 0);

            const ticketsLastMonth = activeReservations.filter(res => {
                const d = new Date(res.createdAt);
                const isTicket = ['seat', 'general-fee', 'mixed-ticket'].includes(res.type);
                return isTicket && d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
            }).reduce((sum, res) => sum + (res.seatIds?.length || 1), 0);

            const ticketTrend = calculateTrend(ticketsThisMonth, ticketsLastMonth);

            // Calculate Event Trends
            const eventsThisMonth = events.filter(e => {
                const d = new Date(e.createdAt);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            }).length;

            const eventsLastMonth = events.filter(e => {
                const d = new Date(e.createdAt);
                return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
            }).length;

            const eventTrend = calculateTrend(eventsThisMonth, eventsLastMonth);

            const totalTicketsSold = activeReservations.filter(res => ['seat', 'general-fee', 'mixed-ticket'].includes(res.type))
                .reduce((sum, res) => sum + (res.seatIds?.length || 1), 0);

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

            const dynamicRevenueData = months.map((month, i) => {
                const monthReservations = activeReservations.filter(res => {
                    const d = new Date(res.createdAt);
                    return d.getMonth() === i && d.getFullYear() === currentYear;
                });

                const total = monthReservations.reduce((sum, res) => sum + (res.amount?.total || 0), 0);
                const boothRevenue = monthReservations
                    .filter(res => res.type === 'booth')
                    .reduce((sum, res) => sum + (res.amount?.total || 0), 0);
                const seatRevenue = monthReservations
                    .filter(res => ['seat', 'general-fee', 'mixed-ticket'].includes(res.type))
                    .reduce((sum, res) => sum + (res.amount?.total || 0), 0);

                return { month, total, boothRevenue, seatRevenue };
            });

            // Calculate 4 most upcoming events stats
            const upcomingEvents = events
                .filter(e => {
                    if (e.status !== 'approved' || !e.startDate) return false;
                    return new Date(e.startDate) >= now;
                })
                .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                .slice(0, 4);

            const dynamicUpcomingEventsData = upcomingEvents.map(e => {
                let totalSeats = 0;
                let totalBooths = 0;

                // 1. Capacity from Layout (Primary source)
                if (e.layoutData && Array.isArray(e.layoutData.items)) {
                    e.layoutData.items.forEach(item => {
                        const type = (item.type || "").toLowerCase();
                        const isSeat = type === "seat" || type === "table" || item.isSeat;
                        const isBooth = type === "booth" || item.isBooth;

                        if (isSeat) {
                            totalSeats += (item.seatCount || 1);
                        } else if (isBooth) {
                            totalBooths++;
                        }
                    });
                }

                // 2. Fallback to legacy seatMap if no seats found
                if (totalSeats === 0 && e.seatMap && e.seatMap.sections) {
                    e.seatMap.sections.forEach(sec => {
                        (sec.seats || []).forEach(seat => {
                            totalSeats += (seat.seatCount || 1);
                        });
                    });
                }

                // 3. Fallback to standalone booths array
                if (totalBooths === 0 && Array.isArray(e.booths)) {
                    totalBooths = e.booths.length;
                }

                // 4. Fallback to priceLevels (ONLY if NO seats AND NO booths are placed on the map)
                // Exception: General Admission events use priceLevels, but ONLY if no items of that category are on the map
                const isGA = e.eventType === "General Admission";
                const hasPlacedItems = totalSeats > 0 || totalBooths > 0;

                if (totalSeats === 0 && (isGA ? totalBooths === 0 : !hasPlacedItems) && Array.isArray(e.priceLevels)) {
                    totalSeats = e.priceLevels
                        .filter(p => !p.name?.toLowerCase().includes('booth') && !p.isBooth)
                        .reduce((sum, p) => sum + (p.quantityAvailable || 0), 0);
                }
                if (totalBooths === 0 && (isGA ? totalSeats === 0 : !hasPlacedItems) && Array.isArray(e.priceLevels)) {
                    totalBooths = e.priceLevels
                        .filter(p => p.name?.toLowerCase().includes('booth') || p.isBooth)
                        .reduce((sum, p) => sum + (p.quantityAvailable || 0), 0);
                }

                // 5. Actual sales from reservations (TRUSTED SOURCE)
                const eventRes = activeReservations.filter(res => String(res.event?._id || res.event) === String(e._id));
                const seatsSold = eventRes.filter(res => ['seat', 'general-fee', 'mixed-ticket'].includes(res.type)).reduce((sum, res) => sum + (res.seatIds?.length || 1), 0);
                const boothsSold = eventRes.filter(res => res.type === 'booth').length;

                // 6. Calculate Available (Remaining)
                const seatsAvailable = Math.max(0, (totalSeats || 0) - (seatsSold || 0));
                const boothsAvailable = Math.max(0, (totalBooths || 0) - (boothsSold || 0));

                return {
                    name: e.title.length > 12 ? e.title.substring(0, 10) + '...' : e.title,
                    fullName: e.title,
                    seatsSold: seatsSold || 0,
                    seatsAvailable: seatsAvailable || 0,
                    boothsSold: boothsSold || 0,
                    boothsAvailable: boothsAvailable || 0
                };
            });



            // Calculate Top Sponsors based on confirmed booth reservations
            const sponsorMap = {};
            activeReservations.forEach(res => {
                if (!res.user || res.type !== 'booth') return;
                const sponsorId = String(res.user._id || res.user);
                if (!sponsorMap[sponsorId]) {
                    sponsorMap[sponsorId] = {
                        name: res.user.companyName || `${res.user.firstName} ${res.user.lastName}`,
                        email: res.user.email,
                        boothCount: 0,
                        latestEvent: res.event?.title || 'Multiple Events'
                    };
                }
                sponsorMap[sponsorId].boothCount += 1;
            });

            const dynamicTopSponsorsData = Object.values(sponsorMap)
                .sort((a, b) => b.boothCount - a.boothCount)
                .slice(0, 5)
                .map((s, index) => ({
                    name: s.name,
                    event: s.event || s.latestEvent,
                    type: `Top ${index + 1}`
                }));

            // Calculate Top Promoters based on total sales from activeReservations
            const promoterMap = {};
            events.forEach(e => {
                if (!e.createdBy || e.createdBy.role !== 'promoter') return;
                const promoterId = String(e.createdBy._id || e.createdBy);

                const eventRes = activeReservations.filter(res => String(res.event?._id || res.event) === String(e._id));
                const totalSalesCount = eventRes.length; // Count of individual reservations

                if (!promoterMap[promoterId]) {
                    promoterMap[promoterId] = {
                        name: `${e.createdBy.firstName} ${e.createdBy.lastName}`,
                        email: e.createdBy.email,
                        totalSales: 0
                    };
                }
                promoterMap[promoterId].totalSales += totalSalesCount;
            });

            const dynamicTopPromotersData = Object.values(promoterMap)
                .sort((a, b) => b.totalSales - a.totalSales)
                .slice(0, 5)
                .map((p, index) => ({
                    name: p.name,
                    email: p.email,
                    status: `Top ${index + 1}`
                }));

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
                totalBoothsReserved: activeReservations.filter(res => res.type === 'booth').length,
                totalTicketsSold: totalTicketsSold,
                totalRevenue: activeReservations.reduce((total, res) => total + (res.amount?.total || 0), 0),
                revenueData: dynamicRevenueData,
                upcomingEventsData: dynamicUpcomingEventsData,
                topSponsorsData: dynamicTopSponsorsData,
                topPromotersData: dynamicTopPromotersData,
                boothTrend,
                revenueTrend,
                ticketTrend,
                eventTrend,
                pendingPayoutsCount: pendingPayoutsCount,
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
                    <button className="primary-button create-btn" onClick={() => setIsReportModalOpen(true)}>
                        View Report
                    </button>
                    {/* <button className="primary-button create-btn" onClick={() => setIsModalOpen(true)}>
                        Create Event
                    </button> */}
                </div>
            </div>

            <div className="stats-grid-wrapper">
                <div className="stats-grid">
                    <div className="dashboard-stat-card">
                        <div className="upper-stats">
                            <span className="icon red"><Icon icon="mdi:calendar-blank" width="24" /></span>
                            <span className={`trend ${stats.eventTrend >= 0 ? 'up' : 'down'}`}>
                                <Icon icon={stats.eventTrend >= 0 ? "mdi:trending-up" : "mdi:trending-down"} />
                                {stats.loading ? "0%" : `${Math.abs(stats.eventTrend).toFixed(1)}%`}
                            </span>
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
                            <span className="icon red"><Icon icon="mdi:currency-usd" width="24" /></span>
                            <span className="trend hidden"></span>
                        </div>
                        <div className="bottom-stats">
                            <p className="regular-body-text left-aligned">Pending Payouts</p>
                            <h3>{stats.loading ? "..." : stats.pendingPayoutsCount}</h3>
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
                            {/* <p className="smaller-body-text left-aligned">assigned to you</p> */}
                            <span className="view-details" onClick={() => navigate('/admin/support')}>
                                View details <Icon icon="mdi:arrow-right" />
                            </span>
                        </div>
                    </div>
                    <div className="dashboard-stat-card">
                        <div className="upper-stats">
                            <span className="icon purple"><Icon icon="mdi:account-group-outline" width="24" /></span>
                            {/* <span className={`trend ${stats.userTrend >= 0 ? 'up' : 'down'}`}>
                                <Icon icon={stats.userTrend >= 0 ? "mdi:trending-up" : "mdi:trending-down"} />
                                {stats.loading ? "0%" : `${Math.abs(stats.userTrend).toFixed(1)}%`}
                            </span> */}
                        </div>
                        <div className="bottom-stats">
                            <p className="regular-body-text left-aligned">Total Users this {stats.currentMonthName}</p>
                            <h3>{stats.loading ? "..." : stats.newUsersThisMonth}</h3>
                            {/* <p className="smaller-body-text left-aligned">
                                {stats.loading ? "Calculating..." : `The total created accounts is ${stats.totalUsers} `}
                            </p> */}
                        </div>
                    </div>
                    <div className="dashboard-stat-card">
                        <div className="upper-stats">
                            <span className="icon orange"><Icon icon="mdi:map-marker-outline" width="24" /></span>
                            <span className={`trend ${stats.boothTrend >= 0 ? 'up' : 'down'}`}>
                                <Icon icon={stats.boothTrend >= 0 ? "mdi:trending-up" : "mdi:trending-down"} />
                                {stats.loading ? "0%" : `${Math.abs(stats.boothTrend).toFixed(1)}%`}
                            </span>
                        </div>
                        <div className="bottom-stats">
                            <p className="regular-body-text left-aligned">Booths Sold</p>
                            <h3>{stats.loading ? "..." : stats.totalBoothsReserved}</h3>
                            {/* <p className="smaller-body-text left-aligned">vs last month</p> */}
                        </div>
                    </div>
                    <div className="dashboard-stat-card">
                        <div className="upper-stats">
                            <span className="icon blue"><Icon icon="mdi:ticket-outline" width="24" /></span>
                            <span className={`trend ${stats.ticketTrend >= 0 ? 'up' : 'down'}`}>
                                <Icon icon={stats.ticketTrend >= 0 ? "mdi:trending-up" : "mdi:trending-down"} />
                                {stats.loading ? "0%" : `${Math.abs(stats.ticketTrend).toFixed(1)}%`}
                            </span>
                        </div>
                        <div className="bottom-stats">
                            <p className="regular-body-text left-aligned">Tickets Sold</p>
                            <h3>{stats.loading ? "..." : stats.totalTicketsSold}</h3>
                            {/* <p className="smaller-body-text left-aligned">vs last month</p> */}
                        </div>
                    </div>
                    <div className="dashboard-stat-card">
                        <div className="upper-stats">
                            <span className="icon green"><Icon icon="mdi:currency-usd" width="24" /></span>
                            <span className={`trend ${stats.revenueTrend >= 0 ? 'up' : 'down'}`}>
                                <Icon icon={stats.revenueTrend >= 0 ? "mdi:trending-up" : "mdi:trending-down"} />
                                {stats.loading ? "0%" : `${Math.abs(stats.revenueTrend).toFixed(1)}%`}
                            </span>
                        </div>
                        <div className="bottom-stats">
                            <p className="regular-body-text left-aligned">Total Revenue</p>
                            <h3>${stats.loading ? "..." : stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                            {/* <p className="smaller-body-text left-aligned">vs last month</p> */}
                        </div>
                    </div>
                </div>
            </div>

            <div className="main-content-grid">
                <div className="left-panel">
                    <div className="charts-row">
                        <div className="chart-card bar-chart-card">
                            <h4 className="left-aligned">Sales by Upcoming Events</h4>
                            <div className="chart-placeholder">
                                <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
                                    <BarChart
                                        data={stats.upcomingEventsData}
                                        maxBarSize={isMobile ? 14 : 25}
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
                                        <RechartsTooltip content={<CustomTooltip />} />

                                        {/* Booths Bar Stack */}
                                        <Bar dataKey="boothsAvailable" stackId="booths" name="Booths Available" fill="#ffe0cc" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="boothsSold" stackId="booths" name="Booths Sold" fill="#ff6b00" radius={[0, 0, 0, 0]} />

                                        {/* Tickets (Seats) Bar Stack */}
                                        <Bar dataKey="seatsAvailable" stackId="tickets" name="Seats Available" fill="#e6e6e6" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="seatsSold" stackId="tickets" name="Seats Sold" fill="#0059ff" radius={[0, 0, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                                <div className="chart-legend sales-legend">
                                    <div className="legend-group">
                                        <span className="legend-item"><span className="dot blue"></span>Seats Sold</span>
                                        <span className="legend-item"><span className="dot gray"></span>Seats Available</span>
                                    </div>
                                    <div className="legend-group">
                                        <span className="legend-item"><span className="dot orange"></span>Booths Sold</span>
                                        <span className="legend-item"><span className="dot light-orange"></span>Booths Available</span>
                                    </div>
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
                                        <RechartsTooltip content={<CustomTooltip />} />
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
                            <span className={`button-label ${stats.revenueTrend >= 0 ? 'green' : 'red'}`}>
                                {stats.loading ? "0%" : `${stats.revenueTrend >= 0 ? '+' : ''}${stats.revenueTrend.toFixed(1)}%`}
                            </span>
                        </div>
                        <div className="chart-placeholder area-placeholder">
                            <ResponsiveContainer width="100%" height={isMobile ? 180 : 250}>
                                <AreaChart data={stats.revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>

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
                                        dataKey="seatRevenue"
                                        stackId="1"
                                        name="Tickets Revenue"
                                        stroke="#0059ff"
                                        strokeWidth={isMobile ? 2 : 3}
                                        fillOpacity={0.6}
                                        fill="#0059ff"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="boothRevenue"
                                        stackId="1"
                                        name="Booths Revenue"
                                        stroke="#ff6b00"
                                        strokeWidth={isMobile ? 2 : 3}
                                        fillOpacity={0.6}
                                        fill="#ff6b00"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                            <div className="chart-legend revenue-legend" style={{ marginTop: '10px', display: 'flex', gap: '20px', justifyContent: 'center' }}>
                                <span className="legend-item"><span className="dot blue"></span>Tickets Revenue</span>
                                <span className="legend-item"><span className="dot orange"></span>Booths Revenue</span>
                            </div>
                        </div>
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

                                    <RechartsTooltip content={<CustomTooltip />} />

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
                                {stats.topPromotersData.length > 0 ? (
                                    stats.topPromotersData.map((promoter, i) => (
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
                                    ))
                                ) : (
                                    <div className="no-activity">No promoters found</div>
                                )}
                            </div>
                        </div>

                        <div className="list-card sponsors-card">
                            <div className="card-header">
                                <h4 className="left-aligned">Top Buyers</h4>
                            </div>
                            <div className="promoters-list">
                                {stats.topSponsorsData.length > 0 ? (
                                    stats.topSponsorsData.map((sponsor, i) => (
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
                                    ))
                                ) : (
                                    <div className="no-activity">No sponsors found</div>
                                )}
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
                                    <p className="left-aligned">{stats.loading ? "..." : stats.pendingPayoutsCount} payouts waiting for approval</p>
                                    <span className="time left-aligned">Just now</span>
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
                                            <div className="activity-left" onClick={() => navigate(getNotificationPath(notif, user?.role))}>
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
                                                    onClick={() => navigate(getNotificationPath(notif, user?.role))}
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
                    navigate(getNotificationPath(notif, user?.role));
                }}
            />

        </div>
    );
}
