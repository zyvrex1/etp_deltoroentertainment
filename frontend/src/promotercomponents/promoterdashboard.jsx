import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import "./promoterdashboard.css";
import PromoterCreateEventModal from "./PromoterModal/PromoterCreateEventModal.jsx";
import { useAuthContext } from "../hooks/useAuthContext";
import { useEventsContext } from "../hooks/useEventsContext";
import eventsService from "../services/eventsService";

export default function PromoterDashboard() {
  const { user } = useAuthContext();
  const { events, dispatch } = useEventsContext();
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [expandedSponsorRow, setExpandedSponsorRow] = useState(null);
  const navigate = useNavigate();

  const toggleSponsorRow = (index) => {
    setExpandedSponsorRow(expandedSponsorRow === index ? null : index);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;
      try {
        const data = await eventsService.getEvents(user.token);
        if (dispatch) {
          dispatch({ type: "SET_EVENTS", payload: data });
        }
      } catch (err) {
        console.error("Error fetching events:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user, dispatch]);

  const approvedEvents = events 
    ? events.filter(e => e.status === "approved") 
    : [];

  const displayEvents = [...approvedEvents]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map(evt => {
      // Calculate capacity and sold using virtuals
      const totalTickets = evt.totalTickets || 0;
      const ticketsSold = evt.ticketsSold || 0;
      const totalBooths = evt.totalBooths || 0;
      const boothsSold = evt.boothsSold || 0;
      
      const totalCapacity = totalTickets + totalBooths;
      const totalSold = ticketsSold + boothsSold;

      const progress = totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0;
      const totalRevenue = (evt.seatRevenue || 0) + (evt.boothRevenue || 0);

      // Format date
      const dateStr = new Date(evt.startDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      return {
        _id: evt._id,
        name: evt.title,
        date: dateStr,
        location: evt.venue?.name || "Multiple Locations",
        amount: `$ ${totalRevenue.toLocaleString()}`,
        statusLabel: evt.status === "completed" ? "Completed" : "Active",
        statusColor: evt.status === "completed" ? "gray" : "green",
        soldText: `${totalSold} / ${totalCapacity} tickets sold`,
        progress: progress,
        subStats: [
          `${evt.ticketsSold || totalSold} checked in`, 
          `${evt.booths?.filter(b => b.status === "sold").length || 0}/${evt.booths?.length || 0} booths sold`
        ],
        raw: evt
      };
    });

  const stats = [
    {
      label: "Total Revenue",
      value: `$${approvedEvents.reduce((sum, e) => sum + (e.seatRevenue || 0) + (e.boothRevenue || 0), 0).toLocaleString()}`,
      delta: "+12.5%",
      icon: "mdi:currency-usd",
      color: "green",
    },
    {
      label: "Tickets Sold",
      value: approvedEvents.reduce((sum, e) => sum + (e.ticketsSold || 0), 0).toLocaleString(),
      delta: "+8.2%",
      icon: "mdi:ticket-confirmation-outline",
      color: "blue",
    },
    {
      label: "Active Events",
      value: approvedEvents.filter(e => e.status === "approved").length.toString(),
      delta: `+${approvedEvents.filter(e => e.status === "approved").length}`,
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

  const ticketSalesData = approvedEvents.map(e => {
    let sold = 0;
    let total = 0;
    if (e.eventType === "General Admission") {
      sold = e.priceLevels.reduce((sum, p) => sum + (p.quantitySold || 0), 0);
      total = e.priceLevels.reduce((sum, p) => sum + (p.quantityAvailable || 0), 0);
    } else {
      if (e.seatMap && e.seatMap.sections) {
        e.seatMap.sections.forEach(sec => {
          if (sec.seats) {
            total += sec.seats.length;
            sold += sec.seats.filter(s => s.status === "sold").length;
          }
        });
      }
    }
    return {
      name: e.title.substring(0, 10),
      sold: sold,
      remaining: Math.max(0, total - sold)
    };
  });

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

  if (loading) {
    return (
      <div className="promoter-dashboard">
        <div className="pd-topbar">
          <div className="pd-title">
            <div className="skeleton skeleton-text title" style={{ width: '250px' }} />
            <div className="skeleton skeleton-text" style={{ width: '300px' }} />
          </div>
          <div className="pd-actions">
            <div className="skeleton skeleton-rect" style={{ width: '150px', height: '40px' }} />
          </div>
        </div>

        <div className="stats-grid-wrapper">
          <div className="stats-grid">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="dashboard-stat-card skeleton-card">
                <div className="upper-stats">
                  <div className="skeleton skeleton-circle" style={{ width: '24px', height: '24px' }} />
                  <div className="skeleton skeleton-text" style={{ width: '40px', marginBottom: 0 }} />
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

        <div className="pd-main-content-grid">
          <div className="pd-left-panel">
            <div className="pd-charts-row">
              <div className="pd-card graph-card skeleton-card" style={{ height: '300px' }}>
                <div className="skeleton skeleton-text title" style={{ width: '150px' }} />
                <div className="skeleton skeleton-rect" style={{ height: '220px', marginTop: '20px' }} />
              </div>
              <div className="pd-card graph-card skeleton-card" style={{ height: '300px' }}>
                <div className="skeleton skeleton-text title" style={{ width: '150px' }} />
                <div className="skeleton skeleton-rect" style={{ height: '220px', marginTop: '20px' }} />
              </div>
            </div>
            <div className="pd-card skeleton-card">
              <div className="skeleton skeleton-text title" style={{ width: '150px' }} />
              {[...Array(3)].map((_, i) => (
                <div key={i} style={{ marginTop: '20px' }}>
                  <div className="skeleton skeleton-text title" />
                  <div className="skeleton skeleton-text" />
                  <div className="skeleton skeleton-rect" style={{ height: '8px', borderRadius: '4px' }} />
                </div>
              ))}
            </div>
          </div>
          <div className="pd-right-panel">
            <div className="pd-card skeleton-card" style={{ height: '200px' }}>
              <div className="skeleton skeleton-text title" />
              <div className="skeleton skeleton-rect" style={{ height: '40px', marginTop: '10px' }} />
              <div className="skeleton skeleton-rect" style={{ height: '40px', marginTop: '10px' }} />
            </div>
            <div className="pd-card skeleton-card" style={{ height: '400px' }}>
              <div className="skeleton skeleton-text title" />
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', marginTop: '15px' }}>
                  <div className="skeleton skeleton-circle" style={{ width: '40px', height: '40px' }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton skeleton-text" />
                    <div className="skeleton skeleton-text short" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="promoter-dashboard">
      <div className="pd-topbar">
        <div className="pd-title">
          <h1>Welcome back, {user?.firstName || "Alex"}</h1>
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
              {displayEvents.map((evt, idx) => (
                <div key={evt._id} className="pd-event" style={{ borderLeft: '4px solid var(--color-red-primary)' }}>
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
                      <tr key={i} className={expandedSponsorRow === i ? 'expanded' : ''}>
                        <td data-label="Sponsor" className="sponsor-name-td" style={{ padding: '16px 10px' }}>
                          <div className="mobile-expand-icon" onClick={() => toggleSponsorRow(i)}>
                            <Icon icon={expandedSponsorRow === i ? "mdi:chevron-up" : "mdi:chevron-down"} />
                          </div>
                          <h6 className="left-aligned">{s.sponsor}</h6>
                        </td>
                        <td data-label="Tier" style={{ padding: '16px 10px' }}><span className={`button-label pd-tier-pill ${s.tier.toLowerCase()}`}>{s.tier}</span></td>
                        <td data-label="Event" className="small-body-text left-aligned" style={{ padding: '16px 10px' }}>{s.event}</td>
                        <td data-label="Amount" className="regular-body-text pd-black-price left-aligned" style={{ padding: '16px 10px' }}><strong>{s.amount}</strong></td>
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
