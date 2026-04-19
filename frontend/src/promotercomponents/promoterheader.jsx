import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import axios from "axios";
import "./promoterheader.css";
import { showLogoutConfirmAlert } from "../admincomponents/utils/sweetAlert";
import { useLogout } from "../admincomponents/hooks/useLogout";
import { useAuthContext } from "../admincomponents/hooks/useAuthContext";
import { useNotificationsContext } from "../admincomponents/hooks/useNotificationsContext";
import ViewNotif from "../admincomponents/Modal/ViewNotif";

const PromoterHeader = ({ mobileExpanded, setMobileExpanded }) => {
  const { logout } = useLogout();
  const { user: authUser } = useAuthContext();
  const { notifications, dispatch } = useNotificationsContext();
  const navigate = useNavigate();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [showAllNotifs, setShowAllNotifs] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const iconMap = {
    concern: "mdi:chat-outline",
    payment: "mdi:wallet-outline",
    event: "mdi:calendar-outline",
    user: "mdi:account-plus-outline",
    update: "mdi:file-document-outline"
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get('http://localhost:4000/api/notifications', {
          headers: {
            'Authorization': `Bearer ${authUser.token}`
          }
        });
        // Filter out notifications created by the current user
        const filteredNotifs = response.data.filter(n => !n.createdBy || String(n.createdBy) !== String(authUser._id));
        dispatch({ type: 'SET_NOTIFICATIONS', payload: filteredNotifs });
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    if (authUser) {
      fetchNotifications();
    }
  }, [authUser, dispatch]);

  const handleMarkRead = async (id) => {
    try {
      const response = await axios.patch(`http://localhost:4000/api/notifications/${id}/read`, {}, {
        headers: {
          'Authorization': `Bearer ${authUser.token}`
        }
      });
      dispatch({ type: 'MARK_READ', payload: response.data });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.patch('http://localhost:4000/api/notifications/read-all', {}, {
        headers: {
          'Authorization': `Bearer ${authUser.token}`
        }
      });
      dispatch({ type: 'MARK_ALL_READ' });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotifClick = (notif) => {
    if (notif.unread) {
      handleMarkRead(notif._id);
    }
    setIsNotifOpen(false);
    
    let path = notif.path;
    // Translate admin paths to promoter paths
    if (authUser.role === 'promoter') {
      if (path === '/admin/content') path = '/promoter/promoter-announcement';
      if (path === '/admin/events') path = '/promoter/promoter-eventmanagement';
    }
    
    navigate(path);
  };

  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return "";
    const firstInitial = firstName ? firstName[0] : "";
    const lastInitial = lastName ? lastName[0] : "";
    return (firstInitial + lastInitial).toUpperCase();
  };

  const handleToggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleSignOut = async () => {
    const result = await showLogoutConfirmAlert();

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
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
            {notifications.filter(n => n.unread).length > 0 && (
              <span className="notif-badge">{notifications.filter(n => n.unread).length}</span>
            )}
          </button>

          {isNotifOpen && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <h5 className="notif-title">Notifications</h5>
                <button className="notif-mark-read" onClick={handleMarkAllRead}>
                  <Icon icon="mdi:check-all" /> <span>Mark all read</span>
                </button>
              </div>

              <div className="notif-list">
                {notifications.length > 0 ? (
                  notifications.slice(0, 5).map((notif) => (
                    <div 
                      className={`notif-item ${notif.unread ? 'unread' : ''}`} 
                      key={notif._id}
                      onClick={() => handleNotifClick(notif)}
                    >
                      <div className="notif-status-dot"></div>
                      <div className={`notif-icon-box ${notif.type}`}>
                        <Icon icon={iconMap[notif.type] || "mdi:bell-outline"} />
                      </div>
                      <div className="notif-content">
                        <p className="notif-text">
                          <strong>{notif.title}</strong>: {notif.content}
                        </p>
                        <span className="smaller-body-text notif-date">
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="notif-empty">No notifications</div>
                )}
              </div>

              <button className="view-all-notif-btn" onClick={() => { setIsNotifOpen(false); setShowAllNotifs(true); }}>
                View all notifications
              </button>
            </div>
          )}
        </div>

        <div className="header-profile" ref={dropdownRef}>
          <button
            type="button"
            className="profile-info profile-toggle"
            onClick={handleToggleDropdown}
          >
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
                to="/promoter/settings"
                className="dropdown-item"
                onClick={() => setIsDropdownOpen(false)}
              >
                <Icon icon="mdi:cog-outline" className="dropdown-icon" />
                <span>Settings</span>
              </Link>
              <button
                type="button"
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

export default PromoterHeader;

