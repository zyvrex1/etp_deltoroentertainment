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

const PromoterSidebar = ({ mobileExpanded, setMobileExpanded }) => {

  const handleLinkClick = () => {
    // Only close sidebar on mobile
    if (window.innerWidth <= 768) {
      setMobileExpanded(false);
    }
  };

  return (
    <aside
      className={`sidebar ${mobileExpanded ? "mobile-expanded" : "mobile-collapsed"
        }`}
    >
      {/* LOGO */}
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
            to="/promoter"
            end
            className={({ isActive }) =>
              isActive ? "sidebar-item active" : "sidebar-item"
            } onClick={handleLinkClick}
          >
            <MdDashboard className="icon" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/promoter/promoter-announcement" className="sidebar-item" onClick={handleLinkClick}>
            <MdDescription className="icon" />
            <span>Announcement & Policy</span>
          </NavLink>
        </div>

        {/* APPROVALS */}
        <div className="sidebar-section">
          <p className="section-title">MANAGEMENT</p>

          <NavLink to="/promoter/promoter-events" className="sidebar-item" onClick={handleLinkClick}>
            <MdEventAvailable className="icon" />
            <span>My Events</span>
          </NavLink>
          <NavLink to="/promoter/promoter-eventmanagement" className="sidebar-item" onClick={handleLinkClick}>
            <MdEvent className="icon" />
            <span>Event Management</span>
          </NavLink>

          <NavLink to="/promoter/promoter-eventmonitoring" className="sidebar-item" onClick={handleLinkClick}>
            <MdInsights className="icon" />
            <span>Event Monitoring</span>
          </NavLink>
        </div>


        {/* PLATFORM */}
        <div className="sidebar-section">
          <p className="section-title">FINANCE</p>

          <NavLink to="/promoter/promoter-revenue" className="sidebar-item" onClick={handleLinkClick}>
            <MdDescription className="icon" />
            <span>Revenue Reports</span>
          </NavLink>

          <NavLink to="/promoter/promoter-payouts" className="sidebar-item" onClick={handleLinkClick}>
            <MdPayment className="icon" />
            <span>Payouts</span>
          </NavLink>

        </div>
      </div>

    </aside>
  );
};

export default PromoterSidebar;
