import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { MdCardGiftcard } from "react-icons/md";
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
import { useAuthContext } from "../hooks/useAuthContext";
import concernService from "../services/concernService";
import eventsService from "../services/eventsService";
import { io } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const Sidebar = ({ mobileExpanded, setMobileExpanded }) => {
  const { user } = useAuthContext();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingEventsCount, setPendingEventsCount] = useState(0);

  const fetchSidebarCounts = async () => {
    if (!user?.token) return;
    try {
      // Fetch unread support messages
      const { total } = await concernService.getAdminUnreadCount(user.token);
      setUnreadCount(total);

      // Fetch pending events (only for admins)
      if (user.role === 'admin' || user.role === 'superadmin') {
        const events = await eventsService.getEvents(user.token, 'pending');
        setPendingEventsCount(events.length);
      }
    } catch (error) {
      console.error("Error fetching sidebar counts:", error);
    }
  };

  useEffect(() => {
    fetchSidebarCounts();
  }, [user]);

  useEffect(() => {
    if (!user?.token) return;
    const socket = io(BACKEND_URL);

    socket.on("newConcern", () => fetchSidebarCounts());
    socket.on("newMessage", () => fetchSidebarCounts());
    socket.on("statusUpdate", () => fetchSidebarCounts());
    socket.on("unreadCountUpdate", () => fetchSidebarCounts());
    socket.on("dashboardUpdate", () => fetchSidebarCounts());

    return () => socket.disconnect();
  }, [user]);

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
          {/* <div className="sidebar-section">
            <p className="section-title">APPROVALS</p>

            <NavLink to="/admin/event-approval" className="sidebar-item" onClick={handleLinkClick}>
              <MdEventAvailable className="icon" />
              <span>Event Approval</span>
            </NavLink>
          </div> */}

          {/* OPERATIONS */}
          <div className="sidebar-section">
            <p className="section-title">OPERATIONS</p>

            <NavLink to="/admin/users" className="sidebar-item" onClick={handleLinkClick}>
              <MdPeople className="icon" />
              <span>User Management</span>
            </NavLink>

            <NavLink to="/admin/events" className="sidebar-item" onClick={handleLinkClick}>
              <div className="icon-with-badge">
                <MdEvent className="icon" />
                {pendingEventsCount > 0 && (
                  <span className="sidebar-pending-badge">{pendingEventsCount}</span>
                )}
              </div>
              <span>Event Management</span>
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

            <NavLink to="/admin/digital-gifts" className="sidebar-item" onClick={handleLinkClick}>
  <MdCardGiftcard className="icon" />
  <span>Digital Gifts</span>
</NavLink>

            <NavLink to="/admin/content" className="sidebar-item" onClick={handleLinkClick}>
              <MdDescription className="icon" />
              <span>Content</span>
            </NavLink>

            <NavLink to="/admin/support" className="sidebar-item" onClick={handleLinkClick}>
              <div className="icon-with-badge">
                <MdSupport className="icon" />
                {unreadCount > 0 && <span className="sidebar-unread-badge">{unreadCount}</span>}
              </div>
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
