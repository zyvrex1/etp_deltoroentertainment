import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  MdDashboard,
  MdEventAvailable,
  MdPeople,
  MdEvent,
  MdPayment,
  MdConfirmationNumber,
  MdInsights,
  MdDescription,
  MdSettings,
  MdSupport,
  MdAssignment,
  MdLogout,
  MdMenu,
  MdClose
} from "react-icons/md";

import "./sidebar.css";

const Sidebar = () => {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  return (
    <aside
      className={`sidebar ${
        mobileExpanded ? "mobile-expanded" : "mobile-collapsed"
      }`}
    >
      {/* LOGO + TOGGLE */}
      <div className="sidebar-logo">
        <img src="/logo/Logo1.png" alt="App Logo" className="logo" />

        <button
          className={`mobile-toggle ${mobileExpanded ? 'close-icon' : 'menu-icon'}`}
          onClick={() => setMobileExpanded(!mobileExpanded)}
        >
          {mobileExpanded ? <MdClose /> : <MdMenu />}
        </button>
      </div>

      {/* CONTENT */}
      <div className="sidebar-content">
        {/* OVERVIEW */}
        <div className="sidebar-section">
          <p className="section-title">OVERVIEW</p>

          <NavLink to="/" className="sidebar-item" activeClassName="active">
            <MdDashboard className="icon" />
            <span>Dashboard</span>
          </NavLink>
        </div>

        {/* APPROVALS */}
        <div className="sidebar-section">
          <p className="section-title">APPROVALS</p>

          <NavLink to="/event-approval" className="sidebar-item">
            <MdEventAvailable className="icon" />
            <span>Event Approval</span>
          </NavLink>
        </div>

        {/* OPERATIONS */}
        <div className="sidebar-section">
          <p className="section-title">OPERATIONS</p>

          <NavLink to="/users" className="sidebar-item">
            <MdPeople className="icon" />
            <span>User Management</span>
          </NavLink>

          <NavLink to="/events" className="sidebar-item">
            <MdEvent className="icon" />
            <span>Event Management</span>
          </NavLink>

          <NavLink to="/transactions" className="sidebar-item">
            <MdPayment className="icon" />
            <span>Transactions</span>
          </NavLink>

          <NavLink to="/payments" className="sidebar-item">
            <MdPayment className="icon" />
            <span>Payments & Payouts</span>
          </NavLink>

          <NavLink to="/booths-tickets" className="sidebar-item">
            <MdConfirmationNumber className="icon" />
            <span>Booth & Tickets</span>
          </NavLink>
        </div>

        {/* INSIGHTS */}
        <div className="sidebar-section">
          <p className="section-title">INSIGHTS</p>

          <NavLink to="/analytics" className="sidebar-item">
            <MdInsights className="icon" />
            <span>Reports & Analytics</span>
          </NavLink>
        </div>

        {/* PLATFORM */}
        <div className="sidebar-section">
          <p className="section-title">PLATFORM</p>

          <NavLink to="/content" className="sidebar-item">
            <MdDescription className="icon" />
            <span>Content</span>
          </NavLink>

          <NavLink to="/settings" className="sidebar-item">
            <MdSettings className="icon" />
            <span>Settings</span>
          </NavLink>

          <NavLink to="/support" className="sidebar-item">
            <MdSupport className="icon" />
            <span>Support & Disputes</span>
          </NavLink>

          <NavLink to="/audit-logs" className="sidebar-item">
            <MdAssignment className="icon" />
            <span>Audit Logs</span>
          </NavLink>
        </div>
      </div>

      {/* FOOTER */}
      <div className="sidebar-footer">
        <div className="sidebar-item signout">
          <MdLogout className="icon" />
          <span>Sign out</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
