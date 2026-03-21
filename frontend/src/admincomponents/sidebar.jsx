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

import "./sidebar.css";

const Sidebar = ({ mobileExpanded, setMobileExpanded }) => {

  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      setMobileExpanded(false);
    }
  };

  return (
    <>
      <aside
        className={`sidebar ${mobileExpanded ? "mobile-expanded" : "mobile-collapsed"
          }`}
      >
        {/* LOGO + TOGGLE */}
        <div className="sidebar-logo">
          <img src="/logo/Logo1.png" alt="App Logo" className="logo" />

          {mobileExpanded && (
            <button
              className="mobile-toggle close-icon"
              onClick={() => setMobileExpanded(false)}
            >
              <MdClose />
            </button>
          )}
        </div>

        {/* CONTENT */}
        <div className="sidebar-content">
          {/* OVERVIEW */}
          <div className="sidebar-section">
            <p className="section-title">OVERVIEW</p>

            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                isActive ? "sidebar-item active" : "sidebar-item"
              }
              onClick={handleLinkClick}
            >
              <MdDashboard className="icon" />
              <span>Dashboard</span>
            </NavLink>
          </div>

          {/* APPROVALS */}
          <div className="sidebar-section">
            <p className="section-title">APPROVALS</p>

            <NavLink to="/admin/event-approval" className="sidebar-item" onClick={handleLinkClick}>
              <MdEventAvailable className="icon" />
              <span>Event Approval</span>
            </NavLink>
          </div>

          {/* OPERATIONS */}
          <div className="sidebar-section">
            <p className="section-title">OPERATIONS</p>

            <NavLink to="/admin/users" className="sidebar-item" onClick={handleLinkClick}>
              <MdPeople className="icon" />
              <span>User Management</span>
            </NavLink>

            <NavLink to="/admin/events" className="sidebar-item" onClick={handleLinkClick}>
              <MdEvent className="icon" />
              <span>Event Management</span>
            </NavLink>

            <NavLink to="/admin/transactions" className="sidebar-item" onClick={handleLinkClick}>
              <MdPayment className="icon" />
              <span>Transactions</span>
            </NavLink>

            <NavLink to="/admin/payments" className="sidebar-item" onClick={handleLinkClick}>
              <MdPayment className="icon" />
              <span>Payments & Payouts</span>
            </NavLink>

            <NavLink to="/admin/booths-tickets" className="sidebar-item" onClick={handleLinkClick}>
              <MdConfirmationNumber className="icon" />
              <span>Booth & Tickets</span>
            </NavLink>
          </div>

          {/* INSIGHTS */}
          <div className="sidebar-section">
            <p className="section-title">INSIGHTS</p>

            <NavLink to="/admin/analytics" className="sidebar-item" onClick={handleLinkClick}>
              <MdInsights className="icon" />
              <span>Reports & Analytics</span>
            </NavLink>
          </div>

          {/* PLATFORM */}
          <div className="sidebar-section">
            <p className="section-title">PLATFORM</p>

            <NavLink to="/admin/content" className="sidebar-item" onClick={handleLinkClick}>
              <MdDescription className="icon" />
              <span>Content</span>
            </NavLink>

            <NavLink to="/admin/support" className="sidebar-item" onClick={handleLinkClick}>
              <MdSupport className="icon" />
              <span>Support & Disputes</span>
            </NavLink>

            <NavLink to="/admin/audit-logs" className="sidebar-item" onClick={handleLinkClick}>
              <MdAssignment className="icon" />
              <span>Audit Logs</span>
            </NavLink>
          </div>
        </div>
      </aside>
      {mobileExpanded && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileExpanded(false)}
        ></div>
      )}
    </>
  );
};


export default Sidebar;
