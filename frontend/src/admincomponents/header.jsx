import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useLogout } from "./hooks/useLogout";
import { useAuthContext } from "./hooks/useAuthContext";
import "./header.css";
import { showLogoutConfirmAlert } from "./utils/sweetAlert";
import ViewNotif from "./Modal/ViewNotif";

const Header = ({ mobileExpanded, setMobileExpanded }) => {
  const { logout } = useLogout();
  const { user: authUser } = useAuthContext();
  const navigate = useNavigate();

  // Hooks must always be at the top
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [showAllNotifs, setShowAllNotifs] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const notifications = [
    {
      id: 1,
      type: "concern",
      title: "New support ticket from William Taylor",
      content: '"Payment Processing Failed"',
      date: "10/24/2024",
      icon: "mdi:chat-outline",
      unread: true,
      path: "/admin/support"
    },
    {
      id: 2,
      type: "payment",
      title: "Sarah Chen requested a payout",
      content: "$10,000 for AI Innovation Conference",
      date: "10/24/2024",
      icon: "mdi:wallet-outline",
      unread: true,
      path: "/admin/payments"
    },
    {
      id: 3,
      type: "event",
      title: 'New event "Health & Wellness Expo"',
      content: "pending approval from James Wilson",
      date: "10/24/2024",
      icon: "mdi:calendar-outline",
      unread: true,
      path: "/admin/events"
    },
    {
      id: 5,
      type: "user",
      title: "New sponsor registered: Tom Cruise",
      content: "from Action Movies",
      date: "10/23/2024",
      icon: "mdi:account-plus-outline",
      unread: false,
      path: "/admin/users"
    },
    {
      id: 6,
      type: "update",
      title: "Updated Platform Policy",
      content: "Changes to Sponsor terms of service",
      date: "10/22/2024",
      icon: "mdi:file-document-outline",
      unread: false,
      path: "/admin/content"
    }
  ];

  const handleNotifClick = (path) => {
    setIsNotifOpen(false);
    navigate(path);
  };

  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return "";
    const firstInitial = firstName ? firstName[0] : "";
    const lastInitial = lastName ? lastName[0] : "";
    return (firstInitial + lastInitial).toUpperCase();
  };

  const handleToggleDropdown = () => setIsDropdownOpen((prev) => !prev);

  // const handleSignOut = async () => {
  //   setIsSigningOut(true);
  //   try {
  //     await logout();
  //     setIsDropdownOpen(false);
  //     navigate("/");
  //   } catch (err) {
  //     console.error(err);
  //     setIsSigningOut(false);
  //   }
  // };


  const handleSignOut = async () => {
    const result = await showLogoutConfirmAlert(
      "Logout",
      "Are you sure you want to logout?"
    );

    if (result.isConfirmed) {
      setIsSigningOut(true);
      try {
        await logout();
        setIsDropdownOpen(false);

        window.location.href = "/?logout=success";
      } catch (err) {
        console.error(err);
        setIsSigningOut(false);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Early return **after hooks**
  if (!authUser) return null;

  return (
    <header className="app-header">
      <div className="header-left-mobile">
        <button
          className="mobile-header-toggle"
          onClick={() => setMobileExpanded(!mobileExpanded)}
        >
          <Icon icon={mobileExpanded ? "mdi:close" : "mdi:menu"} width="28" />
        </button>
      </div>
      <div className="header-right">
        <div className="header-notifications" ref={notifRef}>
          <button className="notif-trigger" onClick={() => setIsNotifOpen(!isNotifOpen)}>
            <Icon icon="mdi:bell-outline" width="24" />
            <span className="notif-badge">4</span>
          </button>

          {isNotifOpen && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <h5 className="notif-title">Notifications</h5>
                <button className="notif-mark-read">
                  <Icon icon="mdi:check-all" /> <span>Mark all read</span>
                </button>
              </div>

              <div className="notif-list">
                {notifications.slice(0, 5).map((notif) => (
                  <div 
                    className={`notif-item ${notif.unread ? 'unread' : ''}`} 
                    key={notif.id}
                    onClick={() => handleNotifClick(notif.path)}
                  >
                    <div className="notif-status-dot"></div>
                    <div className={`notif-icon-box ${notif.type}`}>
                      <Icon icon={notif.icon} />
                    </div>
                    <div className="notif-content">
                      <p className="notif-text">
                        <strong>{notif.title}</strong>: {notif.content}
                      </p>
                      <span className="smaller-body-text notif-date">{notif.date}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button className="view-all-notif-btn" onClick={() => { setIsNotifOpen(false); setShowAllNotifs(true); }}>
                View all notifications
              </button>
            </div>
          )}
        </div>

        <div className="header-profile" ref={dropdownRef}>
          <button className="profile-info profile-toggle" onClick={handleToggleDropdown}>
            <div className="profile-details">
              <h4 className="profile-name">
                {authUser.firstName && authUser.lastName
                  ? `${authUser.firstName} ${authUser.lastName}`
                  : "User"}
              </h4>
              <p className="small-body-text profile-email">{authUser.email}</p>
              <p className="small-body-text profile-role">
                <strong>{authUser.role}</strong>
              </p>
            </div>
            <div className="profile-avatar">
              {authUser.avatar ? (
                <img src={authUser.avatar} alt="Profile" className="header-avatar-img" />
              ) : (
                <>
                  <span className="avatar-initials">
                    {getInitials(authUser.firstName, authUser.lastName)}
                  </span>
                  <Icon icon="mdi:account-circle" className="avatar-icon" />
                </>
              )}
            </div>
          </button>

          {isDropdownOpen && (
            <div className="profile-dropdown">
              <Link
                to="/admin/settings"
                className="dropdown-item"
                onClick={() => setIsDropdownOpen(false)}
              >
                <Icon icon="mdi:cog-outline" className="dropdown-icon" />
                <span>Settings</span>
              </Link>
              <button
                className="dropdown-item dropdown-signout"
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                <Icon icon="mdi:logout" className="dropdown-icon" />
                <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <ViewNotif 
        isOpen={showAllNotifs} 
        onClose={() => setShowAllNotifs(false)} 
        notifications={notifications}
        onNotifClick={handleNotifClick}
      />
    </header>
  );
};

export default Header;