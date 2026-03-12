import "./Dashboard.css";
import { Icon } from "@iconify/react";
import CreateEventModal from './Modal/CreateEventModal';
import ViewReportModal from './Modal/ViewReportModal';
import AddUserModal from './Modal/CreateUserModal';

import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, AreaChart, Area, LineChart, Line, PieChart, Pie } from 'recharts';

export default function Dashboard() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

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

    const eventStatusData = [
        { name: 'Active', value: 80, color: '#4ca626' },
        { name: 'Upcoming', value: 40, color: '#0059ff' },
        { name: 'Completed', value: 25, color: '#b3b3b3' },
        { name: 'Pending', value: 11, color: '#ffcc00' },
    ];

    const revenueData = [
        { month: 'Jun', total: 32000 },
        { month: 'Jul', total: 45000 },
        { month: 'Aug', total: 39000 },
        { month: 'Sep', total: 52000 },
        { month: 'Oct', total: 61000 },
        { month: 'Nov', total: 55000 },
        { month: 'Dec', total: 72000 },
    ];

    const userGrowthData = [
        { month: 'Jun', customers: 5000, sponsors: 150, promoters: 80 },
        { month: 'Jul', customers: 5500, sponsors: 180, promoters: 95 },
        { month: 'Aug', customers: 5800, sponsors: 210, promoters: 105 },
        { month: 'Sep', customers: 6500, sponsors: 240, promoters: 120 },
        { month: 'Oct', customers: 7200, sponsors: 280, promoters: 135 },
        { month: 'Nov', customers: 7800, sponsors: 310, promoters: 150 },
        { month: 'Dec', customers: 8542, sponsors: 345, promoters: 168 },
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
                            <h3>156</h3>
                            <p className="smaller-body-text left-aligned">vs last month</p>
                        </div>
                    </div>
                    <div className="dashboard-stat-card">
                        <div className="upper-stats">
                            <span className="icon yellow"><Icon icon="mdi:clock-outline" width="24" /></span>
                            <span className="trend hidden"></span>
                        </div>
                        <div className="bottom-stats">
                            <p className="regular-body-text left-aligned">Pending Approvals</p>
                            <h3>8</h3>
                            <p className="smaller-body-text left-aligned">vs last month</p>
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
                            <span className="trend up"><Icon icon="mdi:trending-up" /> 5.8%</span>
                        </div>
                        <div className="bottom-stats">
                            <p className="regular-body-text left-aligned">Active Users</p>
                            <h3>8,542</h3>
                            <p className="smaller-body-text left-aligned">vs last month</p>
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
                            <h3>$45,230</h3>
                            <p className="smaller-body-text left-aligned">vs last month</p>
                        </div>
                    </div>
                    <div className="dashboard-stat-card">
                        <div className="upper-stats">
                            <span className="icon yellow"><Icon icon="mdi:alert-outline" width="24" /></span>
                            <span className="trend hidden"></span>
                        </div>
                        <div className="bottom-stats">
                            <p className="regular-body-text left-aligned">Support Tickets</p>
                            <h3>12</h3>
                            <p className="smaller-body-text left-aligned">vs last month</p>
                            <span className="view-details">View details <Icon icon="mdi:arrow-right" /></span>
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
                                            data={eventStatusData}
                                            innerRadius={isMobile ? 35 : 45}
                                            outerRadius={isMobile ? 55 : 65}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {eventStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>                                <div className="donut-center-text">
                                    <h3>156</h3>
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
                        </div>
                        <div className="chart-placeholder line-placeholder">
                            <ResponsiveContainer width="100%" height={isMobile ? 170 : 200}>
                                <LineChart data={userGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>

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
                                        stroke="#e67e22"
                                        strokeWidth={2}
                                        dot={{ r: isMobile ? 2 : 4, fill: "white", strokeWidth: 2 }}
                                    />

                                </LineChart>
                            </ResponsiveContainer>                            <div className="chart-legend">
                                <span className="legend-item"><span className="dot blue"></span>Customers</span>
                                <span className="legend-item"><span className="dot green"></span>Sponsors</span>
                                <span className="legend-item"><span className="dot orange"></span>Promoters</span>
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
                        </div>
                    </div>



                    <div className="system-alerts-card">
                        <div className="card-header">
                            <h4 className="left-aligned">System Alerts</h4>
                            <span className="button-label red">3 Active</span>
                        </div>
                        <div className="alerts-list">
                            <div className="alert-item yellow-bg left-aligned-flex">
                                <Icon icon="mdi:alert-outline" className="alert-icon" />
                                <div className="alert-details left-aligned">
                                    <h5 className="left-aligned">Pending Approvals</h5>
                                    <p className="left-aligned">5 events waiting for review</p>
                                    <span className="time left-aligned">10 min ago</span>
                                </div>
                                <Icon icon="mdi:close" className="close-icon" />
                            </div>
                            <div className="alert-item red-bg left-aligned-flex">
                                <Icon icon="mdi:alert-octagon-outline" className="alert-icon" />
                                <div className="alert-details left-aligned">
                                    <h5 className="left-aligned">Payment Failed</h5>
                                    <p className="left-aligned">Payout to John Doe failed - insufficient funds</p>
                                    <span className="time left-aligned">1 hour ago</span>
                                </div>
                                <Icon icon="mdi:close" className="close-icon" />
                            </div>
                            <div className="alert-item blue-bg left-aligned-flex">
                                <Icon icon="mdi:alert-circle-outline" className="alert-icon" />
                                <div className="alert-details left-aligned">
                                    <h5 className="left-aligned">High Traffic</h5>
                                    <p className="left-aligned">TechStart Summit tickets selling fast</p>
                                    <span className="time left-aligned">2 hours ago</span>
                                </div>
                                <Icon icon="mdi:close" className="close-icon" />
                            </div>
                        </div>
                    </div>

                    <div className="recent-activity-card">
                        <div className="card-header">
                            <h4 className="left-aligned">Recent Activity</h4>
                            <span className="view-all">View all <Icon icon="mdi:arrow-right" /></span>
                        </div>
                        <div className="activity-list">
                            <div className="activity-item left-aligned-flex">
                                <div className="activity-icon red-light"><Icon icon="mdi:calendar-blank" /></div>
                                <div className="activity-details left-aligned">
                                    <h5 className="left-aligned">New Event Created</h5>
                                    <p className="left-aligned">Music Festival 2024 submitted</p>
                                    <span className="time left-aligned">5 min ago</span>
                                </div>
                                <Icon icon="mdi:eye-outline" className="view-icon" />
                            </div>
                            <div className="activity-item left-aligned-flex">
                                <div className="activity-icon green-light"><Icon icon="mdi:currency-usd" /></div>
                                <div className="activity-details left-aligned">
                                    <h5 className="left-aligned">Payment Received</h5>
                                    <p className="left-aligned">$2,500 booth payment from TechCorp</p>
                                    <span className="time left-aligned">15 min ago</span>
                                </div>
                                <Icon icon="mdi:eye-outline" className="view-icon" />
                            </div>
                            <div className="activity-item left-aligned-flex">
                                <div className="activity-icon blue-light"><Icon icon="mdi:ticket-outline" /></div>
                                <div className="activity-details left-aligned">
                                    <h5 className="left-aligned">Tickets Sold</h5>
                                    <p className="left-aligned">50 VIP tickets sold for Creator Expo</p>
                                    <span className="time left-aligned">30 min ago</span>
                                </div>
                                <Icon icon="mdi:eye-outline" className="view-icon" />
                            </div>
                            <div className="activity-item left-aligned-flex">
                                <div className="activity-icon blue-light"><Icon icon="mdi:ticket-outline" /></div>
                                <div className="activity-details left-aligned">
                                    <h5 className="left-aligned">Tickets Sold</h5>
                                    <p className="left-aligned">50 VIP tickets sold for Creator Expo</p>
                                    <span className="time left-aligned">30 min ago</span>
                                </div>
                                <Icon icon="mdi:eye-outline" className="view-icon" />
                            </div>
                            <div className="activity-item left-aligned-flex">
                                <div className="activity-icon blue-light"><Icon icon="mdi:ticket-outline" /></div>
                                <div className="activity-details left-aligned">
                                    <h5 className="left-aligned">Tickets Sold</h5>
                                    <p className="left-aligned">50 VIP tickets sold for Creator Expo</p>
                                    <span className="time left-aligned">30 min ago</span>
                                </div>
                                <Icon icon="mdi:eye-outline" className="view-icon" />
                            </div>
                            <div className="activity-item left-aligned-flex">
                                <div className="activity-icon blue-light"><Icon icon="mdi:ticket-outline" /></div>
                                <div className="activity-details left-aligned">
                                    <h5 className="left-aligned">Tickets Sold</h5>
                                    <p className="left-aligned">50 VIP tickets sold for Creator Expo</p>
                                    <span className="time left-aligned">30 min ago</span>
                                </div>
                                <Icon icon="mdi:eye-outline" className="view-icon" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <CreateEventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            <ViewReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
            <AddUserModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} />

        </div>
    );
}
