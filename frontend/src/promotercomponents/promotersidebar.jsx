import { useState, useEffect } from "react";
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
  MdClose,
} from "react-icons/md";

import "./promotersidebar.css";

const Promotersidebar = () => {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  return (
    <aside
      className={`sidebar ${mobileExpanded ? "mobile-expanded" : "mobile-collapsed"
        }`}
    >
      {/* LOGO + TOGGLE */}
      <div className="sidebar-logo">
        <img src="/logo/Logo1.png" alt="App Logo" className="logo" />

        <button
          className={`mobile-toggle ${mobileExpanded ? "close-icon" : "menu-icon"}`}
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

          <NavLink
            to="/promoter"
            end
            className={({ isActive }) =>
              isActive ? "sidebar-item active" : "sidebar-item"
            }
          >
            <MdDashboard className="icon" />
            <span>Dashboard</span>
          </NavLink>
        </div>

        {/* APPROVALS */}
        <div className="sidebar-section">
          <p className="section-title">EVENTS</p>

          <NavLink to="/promoter/promoter-events" className="sidebar-item">
            <MdEventAvailable className="icon" />
            <span>My Events</span>
          </NavLink>
        </div>

        {/* OPERATIONS */}
        <div className="sidebar-section">
          <p className="section-title">MANAGEMENT</p>

          <NavLink to="/promoter/promoter-ticketsetup" className="sidebar-item">
            <MdConfirmationNumber className="icon" />
            <span>Ticket Setup</span>
          </NavLink>

          <NavLink to="/promoter/promoter-boothlayout" className="sidebar-item">
            <MdEventAvailable className="icon" />
            <span>Booth Layout</span>
          </NavLink>

          <NavLink to="/promoter/promoter-scan" className="sidebar-item">
            <MdAssignment className="icon" />
            <span>Check in/ Scan</span>
          </NavLink>
        </div>

        {/* INSIGHTS */}
        <div className="sidebar-section">
          <p className="section-title">SALES & PEOPLE</p>

          <NavLink to="/promoter/promoter-sales" className="sidebar-item">
            <MdInsights className="icon" />
            <span>Sales Overview</span>
          </NavLink>

          <NavLink to="/promoter/promoter-attendees" className="sidebar-item">
            <MdPeople className="icon" />
            <span>Attendees</span>
          </NavLink>

          <NavLink to="/promoter/promoter-sponsors" className="sidebar-item">
            <MdSupport className="icon" />
            <span>Sponsors</span>
          </NavLink>
        </div>

        {/* PLATFORM */}
        <div className="sidebar-section">
          <p className="section-title">FINANCE</p>

          <NavLink to="/promoter/promoter-revenue" className="sidebar-item">
            <MdDescription className="icon" />
            <span>Revenue Reports</span>
          </NavLink>

          <NavLink to="/promoter/promoter-payouts" className="sidebar-item">
            <MdPayment className="icon" />
            <span>Payouts</span>
          </NavLink>

        </div>
      </div>

    </aside>
  );
};

export default Promotersidebar;
