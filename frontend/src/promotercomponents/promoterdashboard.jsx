import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import "./promoterdashboard.css";
import PromoterCreateEventModal from "./PromoterModal/PromoterCreateEventModal.jsx";



export default function PromoterDashboard() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);



  const stats = [
    {
      label: "Total Revenue",
      value: "$138,580",
      delta: "+12.5%",
      icon: "mdi:currency-usd",
      color: "green",
    },
    {
      label: "Tickets Sold",
      value: "655",
      delta: "+8.2%",
      icon: "mdi:ticket-confirmation-outline",
      color: "blue",
    },
    {
      label: "Active Events",
      value: "2",
      delta: "+2",
      icon: "mdi:calendar-month-outline",
      color: "red",
    },
    {
      label: "Upcoming Payout",
      value: "$15,240",
      delta: "Due in 2 days",
      icon: "mdi:chart-line",
      color: "purple",
      isNeutral: true,
    },
  ];

  const activeEvents = [
    {
      name: "TechStart Summit 2024",
      date: "Oct 12, 2024",
      location: "Moscone Center, San Francisco",
      amount: "$ 103,550",
      statusLabel: "Selling Fast",
      statusColor: "green",
      soldText: "450 / 600 tickets sold",
      progress: 75,
      subStats: ["5 checked in", "5/10 booths sold"],
    },
    {
      name: "Creator Economy Expo",
      date: "Nov 05, 2024",
      location: "Austin Convention Center",
      amount: "$ 33,230",
      statusLabel: "On Track",
      statusColor: "blue",
      soldText: "120 / 500 tickets sold",
      progress: 24,
      subStats: ["0 checked in", "1/5 booths sold"],
    },
  ];

  const topSponsorsData = [
    { sponsor: "TechCorp Inc.", tier: "Platinum", event: "TechStart Summit 2024", amount: "$ 15,000" },
    { sponsor: "StreamTech", tier: "Platinum", event: "Creator Economy Expo", amount: "$ 12,000" },
    { sponsor: "Innovate Labs", tier: "Gold", event: "TechStart Summit 2024", amount: "$ 10,000" },
    { sponsor: "Creator Tools", tier: "Gold", event: "Creator Economy Expo", amount: "$ 8,000" },
    { sponsor: "Cloud Systems", tier: "Silver", event: "TechStart Summit 2024", amount: "$ 5,000" },
  ];

  const quickActions = [
    {
      title: "Create New Event",
      description: "Launch a new ticket page",
      icon: "mdi:plus",
      color: "red",
    },
    {
      title: "Check-in Attendees",
      description: "Scan tickets at the door",
      icon: "mdi:qrcode-scan",
      color: "blue",
    },
    {
      title: "View Revenue",
      description: "Check earnings by event",
      icon: "mdi:currency-usd",
      color: "green",
    },
  ];

  const revenueData = [
    { month: 'Oct 01', total: 100000 },
    { month: 'Oct 03', total: 110000 },
    { month: 'Oct 05', total: 115000 },
    { month: 'Oct 07', total: 125000 },
    { month: 'Oct 09', total: 128000 },
    { month: 'Oct 11', total: 135000 },
    { month: 'Oct 14', total: 138580 },
  ];

  const ticketSalesData = [
    { name: 'TechStart', sold: 450, remaining: 150 },
    { name: 'Creator Expo', sold: 120, remaining: 380 },
  ];

  const transactions = [
    {
      customer: "Sarah Jenkins",
      email: "sarah@example.com",
      event: "TechStart Summit 2024",
      type: "ticket",
      amount: "$299",
      status: "completed",
    },
    {
      customer: "TechCorp Inc.",
      email: "john@techcorp.com",
      event: "TechStart Summit 2024",
      type: "booth",
      amount: "$15,000",
      status: "completed",
    },
    {
      customer: "Michael Chen",
      email: "m.chen@tech.co",
      event: "TechStart Summit 2024",
      type: "ticket",
      amount: "$149",
      status: "completed",
    },
    {
      customer: "David Miller",
      email: "david@miller.io",
      event: "TechStart Summit 2024",
      type: "ticket",
      amount: "$149",
      status: "pending",
    },
    {
      customer: "Alex Johnson",
      email: "alex@creator.tv",
      event: "Creator Economy Expo",
      type: "ticket",
      amount: "$149",
      status: "completed",
    },
    {
      customer: "Alex Johnson",
      email: "alex@creator.tv",
      event: "Creator Economy Expo",
      type: "ticket",
      amount: "$149",
      status: "completed",
    },
    {
      customer: "Alex Johnson",
      email: "alex@creator.tv",
      event: "Creator Economy Expo",
      type: "ticket",
      amount: "$149",
      status: "completed",
    },
    {
      customer: "Alex Johnson",
      email: "alex@creator.tv",
      event: "Creator Economy Expo",
      type: "ticket",
      amount: "$149",
      status: "completed",
    },
    {
      customer: "Alex Johnson",
      email: "alex@creator.tv",
      event: "Creator Economy Expo",
      type: "ticket",
      amount: "$149",
      status: "completed",
    },
    {
      customer: "Alex Johnson",
      email: "alex@creator.tv",
      event: "Creator Economy Expo",
      type: "ticket",
      amount: "$149",
      status: "completed",
    },
    {
      customer: "Alex Johnson",
      email: "alex@creator.tv",
      event: "Creator Economy Expo",
      type: "ticket",
      amount: "$149",
      status: "completed",
    },
    {
      customer: "Alex Johnson",
      email: "alex@creator.tv",
      event: "Creator Economy Expo",
      type: "ticket",
      amount: "$149",
      status: "completed",
    },
  ];

  return (
    <div className="promoter-dashboard">
      <div className="pd-topbar">
        <div className="pd-title">
          <h1>Welcome back, Alex</h1>
          <p className="small-body-text">
            Here's what's happening with your events today.
          </p>
        </div>

        <div className="pd-actions">
          <button type="button" className="primary-button pd-action-btn" onClick={() => setIsCreateOpen(true)}>
            <Icon icon="mdi:plus" />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      <div className="stats-grid-wrapper">
        <div className="stats-grid">
          {stats.map((s) => (
            <div key={s.label} className="dashboard-stat-card">
              <div className="upper-stats">
                <span className={`icon ${s.color}`}><Icon icon={s.icon} width="24" /></span>
                <span className={s.isNeutral ? "trend hidden" : "trend up"} style={s.isNeutral ? { display: 'none' } : undefined}>
                  <Icon icon="mdi:trending-up" /> {s.delta}
                </span>
              </div>
              <div className="bottom-stats">
                <p className="regular-body-text">{s.label}</p>
                <h3 className="left-aligned">{s.value}</h3>
                <p className="smaller-body-text ">{s.isNeutral ? s.delta : 'vs last month'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pd-main-content-grid">
        <div className="pd-left-panel">
          <div className="pd-charts-row">
            {/* Ticket Sales by Event */}
            <div className="pd-card graph-card bar-chart-card">
              <div className="pd-card-header">
                <div className="header-text">
                  <h3 className="left-aligned">Ticket Sales by Event</h3>
                </div>
              </div>
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
                <div className="pd-chart-legend">
                  <span className="legend-item"><span className="dot blue"></span>Tickets Sold</span>
                  <span className="legend-item"><span className="dot gray"></span>Total Capacity</span>
                </div>
              </div>
            </div>

            {/* Revenue Overview */}
            <div className="pd-card graph-card area">
              <div className="pd-card-header" style={{ marginBottom: 0 }}>
                <div className="header-text">
                  <h3 className="left-aligned">Revenue Overview</h3>
                </div>
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
                      fillOpacity={0.1}
                      fill="#c62828"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Active Events */}
          <div className="pd-card">
            <div className="pd-card-header" style={{ marginBottom: 0 }}>
              <h3 className="left-aligned">Active Events</h3>
              <a href="/promoter/promoter-events">View all <Icon icon="mdi:arrow-right" /></a>
            </div>

            <div className="pd-events">
              {activeEvents.map((evt, idx) => (
                <div key={evt.name} className="pd-event" style={{ borderLeft: '4px solid var(--color-red-primary)' }}>
                  <div className="pd-event-top">
                    <div className="pd-event-title-row">
                      <div className="pd-event-meta left-aligned">
                        <h4 className="left-aligned">{evt.name}</h4>
                        <p className="small-body-text left-aligned">
                          {evt.date} • {evt.location}
                        </p>
                      </div>
                    </div>

                    <div className="pd-event-right">
                      <h4 className="pd-event-amount">{evt.amount}</h4>
                      <span className={`button-label pd-pill ${evt.statusColor}`}>
                        {evt.statusLabel}
                      </span>
                    </div>
                  </div>

                  <div className="small-body-text pd-progress-row">
                    <span>{evt.soldText}</span>
                    <span>{evt.progress}%</span>
                  </div>
                  <div className="pd-progress">
                    <div style={{ width: `${evt.progress}%` }} />
                  </div>

                  <div className="smaller-body-text pd-progress-row" style={{ marginTop: 10, justifyContent: 'flex-start', gap: '24px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Icon icon="mdi:account-group-outline" /> {evt.subStats[0]}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Icon icon="mdi:storefront-outline" /> {evt.subStats[1]}
                    </span>
                  </div>

                  <div className="pd-event-actions">
                    <button
                      type="button"
                      className="outlined-button"
                      onClick={() =>
                        navigate("/promoter/promoter-eventmanagement", {
                          state: {
                            event: evt,           // <-- Pass the full event object
                            defaultTab: "ticket-setup", // optional: default tab
                          },
                        })
                      }
                    >
                      View Event
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Sponsors */}
          <div className="pd-card">
            <div className="pd-card-header">
              <h3 className="left-aligned">Top Sponsors</h3>
              <a href="/promoter/promoter-sales">View all</a>
            </div>
            <div className="pd-sponsors">
              <p className="smaller-body-text left-aligned" style={{ paddingBottom: '16px', color: 'var(--color-black-tertiary)' }}>Highest contributing partners</p>
              <div className="pd-table-wrapper-noshow">
                <table className="pd-transactions-table sponsor-table">
                  <thead>
                    <tr>
                      <th>Sponsor</th>
                      <th>Tier</th>
                      <th>Event</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSponsorsData.map((s, i) => (
                      <tr key={i}>
                        <td style={{ padding: '16px 10px' }}><h6 className="left-aligned">{s.sponsor}</h6></td>
                        <td style={{ padding: '16px 10px' }}><span className={`button-label pd-tier-pill ${s.tier.toLowerCase()}`}>{s.tier}</span></td>
                        <td className="small-body-text left-aligned" style={{ padding: '16px 10px' }}>{s.event}</td>
                        <td className="regular-body-text pd-black-price left-aligned" style={{ padding: '16px 10px' }}><strong>{s.amount}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="pd-right-panel">
          {/* Quick Actions */}
          <div className="quick-actions-card pd-card">
            <h4 className="left-aligned">Quick Actions</h4>
            <div className="pd-quick-actions-container">
              <button
                className="outlined-button link-btn left-aligned-flex"
                onClick={() => setIsCreateOpen(true)}
              >
                <Icon icon="mdi:plus-circle-outline" /> <span>Create New Event</span>
              </button>

              <button
                className="outlined-button link-btn left-aligned-flex"
                onClick={() => navigate("/promoter/promoter-eventmanagement")}
              >
                <Icon icon="mdi:event-multiple-check" /> <span>Check Events</span>
              </button>

              <button
                className="outlined-button link-btn left-aligned-flex"
                onClick={() => navigate("/promoter/promoter-revenue")}
              >
                <Icon icon="mdi:currency-usd" /> <span>View Revenue</span>
              </button>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="pd-card recent-activity-card">
            <div className="pd-card-header">
              <h4 className="left-aligned">Recent Transaction</h4>
              <a href="/promoter/promoter-sales" style={{ color: 'var(--color-red-primary)', fontSize: '13px', fontWeight: '500', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                View all <Icon icon="mdi:arrow-right" />
              </a>
            </div>
            <div className="activity-list" style={{ maxHeight: '585px' }}>
              {transactions.map((t, i) => (
                <div className="activity-item" key={i}>
                  <div className="activity-left">
                    <div className={`activity-icon ${t.status === 'pending' ? 'yellow-light' : 'blue-light'}`}>
                      <Icon icon={t.type === 'ticket' ? 'mdi:ticket-outline' : 'mdi:domain'} />
                    </div>
                    <div className="activity-details">
                      <h5 className="left-aligned">{t.customer}</h5>
                      <p className="smaller-body-text">{t.amount} {t.type} for {t.event}</p>
                    </div>
                  </div>
                  <div className="activity-right">
                    <span className="time">{t.status === 'pending' ? 'Pending' : 'Completed'}</span>
                    <Icon icon="mdi:eye-outline" className="view-icon" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <PromoterCreateEventModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}
