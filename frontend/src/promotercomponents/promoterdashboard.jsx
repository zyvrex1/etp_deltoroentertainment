import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import "./promoterdashboard.css";
import PromoterCreateEventModal from "./PromoterModal/PromoterCreateEventModal.jsx";


export default function PromoterDashboard() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const navigate = useNavigate();

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
      name: "TechStart Summit 2026",
      date: "Jun 16, 2026",
      location: "Starlight Arena, Los Angeles, CA",
      amount: "$103,550",
      statusLabel: "Selling fast",
      statusColor: "green",
      soldText: "450 / 600 tickets sold",
      progress: 75,
      subStats: ["3 checked in", "5 / 10 booths sold"],
    },
    {
      name: "Creator Economy Expo",
      date: "Nov 05, 2026",
      location: "Austin Convention Center",
      amount: "$33,230",
      statusLabel: "On track",
      statusColor: "blue",
      soldText: "120 / 500 tickets sold",
      progress: 24,
      subStats: ["0 checked in", "1 / 5 booths sold"],
    },
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

  const schedule = [
    { title: "Early Bird Ends", subtitle: "TechStart Summit", time: "Tomorrow, 5:00 PM" },
    { title: "Vendor Setup", subtitle: "Creator Expo", time: "Nov 04, 8:00 AM" },
    { title: "Event Start", subtitle: "Creator Expo", time: "Nov 05, 9:00 AM" },
  ];

  const transactions = [
    {
      customer: "Sarah Jenkins",
      event: "TechStart Summit 2026",
      type: "ticket",
      amount: "$299",
      status: "completed",
    },
    {
      customer: "TechCorp Inc.",
      event: "TechStart Summit 2026",
      type: "booth",
      amount: "$299",
      status: "completed",
    },
    {
      customer: "Michael Chen",
      event: "TechStart Summit 2026",
      type: "ticket",
      amount: "$299",
      status: "completed",
    },
    {
      customer: "David Miller",
      event: "TechStart Summit 2026",
      type: "ticket",
      amount: "$299",
      status: "completed",
    },
    {
      customer: "Alex Johnson",
      event: "Creator Economy Expo",
      type: "ticket",
      amount: "$299",
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
          <NavLink to="/promoter/promoter-ticketsetup"><button type="button" className="outlined-button pd-action-btn scan-btn">
            <span>Scan Tickets</span>
          </button></NavLink>
          <button type="button" className="primary-button pd-action-btn" onClick={() => setIsCreateOpen(true)}>
            <span>Create Event</span>
          </button>
        </div>
      </div>

      <div className="pd-stats">
        {stats.map((s) => (
          <div key={s.label} className="pd-stat">
            <div className="pd-stat-left">
              <span className="small-body-text pd-stat-label">{s.label}</span>
              <h3 className="pd-stat-value">{s.value}</h3>
              <div className="smaller-body-text button-label pd-stat-delta" style={s.isNeutral ? { background: "#f1f5f9", color: "#334155" } : undefined}>
                {!s.isNeutral && <Icon icon="mdi:arrow-top-right" />}
                <span>{s.delta}</span>
              </div>
            </div>
            <div className={`pd-stat-icon ${s.color}`}>
              <Icon icon={s.icon} />
            </div>
          </div>
        ))}
      </div>

      <div className="pd-main">
        <div className="pd-left">
          <div className="pd-card">
            <div className="pd-card-header">
              <h3>Active Events</h3>
              <a href="/promoter/promoter-events">View All</a>
            </div>

            <div className="pd-events">
              {activeEvents.map((evt) => (
                <div key={evt.name} className="pd-event">
                  <div className="pd-event-top">
                    <div className="pd-event-title-row">
                      <div className="pd-event-badge">
                        <Icon icon="mdi:calendar-month-outline" />
                      </div>
                      <div className="pd-event-meta">
                        <h4>{evt.name}</h4>
                        <p className="small-body-text">
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

                  <div className="smaller-body-text pd-progress-row" style={{ marginTop: 10 }}>
                    <span>
                      <Icon icon="mdi:account-group-outline" /> {evt.subStats[0]}
                    </span>
                    <span>
                      <Icon icon="mdi:storefront-outline" /> {evt.subStats[1]}
                    </span>
                  </div>

                  <div className="pd-event-actions">
                    <NavLink to="/promoter/promoter-ticketsetup"><button type="button" className="outlined-button">Manage Tickets</button></NavLink>
                    <NavLink to="/promoter/promoter-boothlayout"><button type="button" className="outlined-button">Booth Layout</button></NavLink>
                    <NavLink to="/promoter/promoter-scan"><button type="button" className="outlined-button">Check-In</button></NavLink>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pd-card" style={{ marginTop: 16 }}>
            <div className="pd-card-header">
              <h3>Recent Transactions</h3>
            </div>
            <div className="pd-table-wrapper">
              <table className="pd-transactions-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Event</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={`${t.customer}-${t.event}-${t.type}`}>
                      <td>
                        <h6>{t.customer}</h6>
                      </td>
                      <td className="small-body-text">{t.event}</td>
                      <td>
                        <span className="button-label pd-type-pill">{t.type}</span>
                      </td>
                      <td className="regular-body-text pd-green-price">{t.amount}</td>
                      <td>
                        <span className="button-label pd-status-pill">{t.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pd-transactions-footer">
              <NavLink to="/promoter/promoter-sales"><button type="button" className="primary-button pd-link">
                View all transactions
              </button></NavLink>
            </div>
          </div>
        </div>

        <div className="pd-right">
          <div className="pd-card">
            <div className="pd-card-header">
              <h3>Quick Actions</h3>
            </div>
            <div className="pd-quick-actions">
              {quickActions.map((a) => (
                <div key={a.title} className="pd-qa-item" style={{ cursor: 'pointer' }} onClick={() => {
                  if (a.title === "Create New Event") setIsCreateOpen(true);
                  if (a.title === "Check-in Attendees") navigate("/promoter/promoter-scan");
                  if (a.title === "View Revenue") navigate("/promoter/promoter-revenue");
                }}>
                  <div className={`pd-qa-icon ${a.color}`}>
                    <Icon icon={a.icon} />
                  </div>
                  <div className="pd-qa-text">
                    <h5>{a.title}</h5>
                    <p className="small-body-text">{a.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pd-card">
            <div className="pd-card-header">
              <h3>Upcoming Schedule</h3>
            </div>
            <div className="pd-schedule">
              {schedule.map((s) => (
                <div key={s.title} className="pd-schedule-item">
                  <div className="pd-dot" />
                  <div className="pd-schedule-text">
                    <h5>{s.title}</h5>
                    <p className="small-body-text">
                      {s.subtitle} </p>
                    <p className="smaller-body-text pd-subtitle-red"><strong>{s.time}</strong>
                    </p>
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

