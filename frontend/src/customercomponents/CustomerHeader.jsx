import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { showConfirmAlert, showSuccessAlert } from '../utils/sweetAlert';
import { useAuthContext } from '../hooks/useAuthContext';
import { useCustomerCart } from '../context/CustomerCartContext';
import { useNotificationsContext } from '../hooks/useNotificationsContext';
import axios from 'axios';
import CustomerNotificationDropdown from './CustomerNotificationDropdown';
import CustomerViewNotif from './CustomerViewNotif';
import { getNotificationPath } from '../utils/notificationPaths';
import { filterNotificationsForRole } from '../utils/notificationFilters';
import './CustomerHeader.css';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

import { useLogout } from '../hooks/useLogout';

export default function CustomerHeader() {
    const { user: authUser } = useAuthContext();
    const { totalItems } = useCustomerCart();
    const { logout } = useLogout();
    const { notifications, dispatch } = useNotificationsContext();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [showAllNotifs, setShowAllNotifs] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
    const [showBottomNav, setShowBottomNav] = useState(true);
    const lastScrollY = useRef(0);
    const dropdownRef = useRef(null);
    const notifRef = useRef(null);
    const navigate = useNavigate();

    const unreadCount = notifications.filter(n => n.unread).length;

    const getInitials = (firstName, lastName) => {
        if (!firstName && !lastName) return "";
        const firstInitial = firstName ? firstName[0] : "";
        const lastInitial = lastName ? lastName[0] : "";
        return (firstInitial + lastInitial).toUpperCase();
    };

    const handleSignOut = async () => {
        setIsDropdownOpen(false);
        const result = await showConfirmAlert("Sign Out?", "Are you sure you want to sign out?", "Yes, Sign Out");
       if (result.isConfirmed) {
    await logout();
    window.location.href = "/?logout=success";
}
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
        setIsNotifOpen(false);
    };

    const toggleNotif = () => {
        if (window.innerWidth <= 768) {
            setShowAllNotifs(true);
            setIsNotifOpen(false);
        } else {
            setIsNotifOpen(!isNotifOpen);
        }
        setIsDropdownOpen(false);
    };

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await axios.get(`${BACKEND_URL}/api/notifications`, {
                    headers: {
                        'Authorization': `Bearer ${authUser.token}`
                    }
                });
                const filteredNotifs = filterNotificationsForRole(
                    response.data.filter(n => !n.createdBy || String(n.createdBy) !== String(authUser._id) || (n.userId && String(n.userId) === String(authUser._id))),
                    authUser.role
                );
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
            const response = await axios.patch(`${BACKEND_URL}/api/notifications/${id}/read`, {}, {
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
            await axios.patch(`${BACKEND_URL}/api/notifications/read-all`, {}, {
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
        navigate(getNotificationPath(notif, authUser.role));
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
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
                // Scrolling down
                setShowBottomNav(false);
            } else {
                // Scrolling up
                setShowBottomNav(true);
            }
            
            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    if (!authUser) return null;

    return (
        <header className="customer-header">
            <div className="customer-header-container">
                <div className="customer-logo-container">
                    <NavLink to="/customer" className="customer-header-logo">
                        <img src="/logo/Logo1.png" alt="App Logo" className="customer-head-logo" />
                    </NavLink>
                </div>

                <nav className="customer-nav-links">
                    <NavLink to="/customer" className="customer-nav-link" end>Home</NavLink>
                    <NavLink to="/customer/browse-events" className="customer-nav-link">Browse Events</NavLink>
                    <NavLink to="/customer/store" className="customer-nav-link">Store</NavLink>
                </nav>

                <div className="customer-header-actions">
                    
                    <div className="customer-notification-wrapper" ref={notifRef}>
                        <button
                            className={`notif-trigger ${isNotifOpen ? 'active' : ''}`}
                            onClick={toggleNotif}
                        >
                            <Icon icon={unreadCount > 0 ? "mdi:bell-badge-outline" : "mdi:bell-outline"} width="24" />
                            {unreadCount > 0 && (
                                <span className="notif-badge">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                        {isNotifOpen && (
                            <CustomerNotificationDropdown
                                notifications={notifications}
                                onClose={() => setIsNotifOpen(false)}
                                onMarkAllRead={handleMarkAllRead}
                                onViewAll={() => setShowAllNotifs(true)}
                                onNotifClick={handleNotifClick}
                            />
                        )}
                    </div>

                    <button className="customer-cart-btn" onClick={() => navigate('/customer/cart')}>
                        <Icon icon="mdi:cart-outline" width="24" />
                        {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
                    </button>

                    <div className="customer-profile-container" ref={dropdownRef}>
                        <button className="customer-profile-btn" onClick={toggleDropdown}>
                            <div className="customer-avatar">
                                {authUser.avatar ? (
                                        <img 
                                            src={authUser.avatar.startsWith('http') || authUser.avatar.startsWith('data:') 
                                                ? authUser.avatar 
                                                : `${BACKEND_URL}${authUser.avatar}`} 
                                            alt="Profile" 
                                            className="customer-avatar-img" 
                                            onError={(e) => { e.target.src = '/assets/eventbg.jpg'; }}
                                        />
                                ) : (
                                    getInitials(authUser.firstName, authUser.lastName)
                                )}
                            </div>
                            <h6 className="customer-user-name">
                                {authUser.firstName} {authUser.lastName}
                            </h6>
                        </button>

                        {isDropdownOpen && (
                            <div className="customer-profile-dropdown">
                                <div className="dropdown-user-info">
                                    <h6 className="dropdown-name">{authUser.firstName} {authUser.lastName}</h6>
                                    <p className="small-body-text dropdown-email">{authUser.email}</p>
                                </div>
                                <ul className="dropdown-menu-list regular-body-text">
                                    <li>
                                        <NavLink to="/customer/my-ticketsorder" onClick={() => setIsDropdownOpen(false)}>
                                            <Icon icon="mdi:ticket-confirmation-outline" width="20" /> My Tickets
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/customer/history" onClick={() => setIsDropdownOpen(false)}>
                                            <Icon icon="mdi:history" width="20" /> Purchase History
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/customer/my-orders" onClick={() => setIsDropdownOpen(false)}>
                                            <Icon icon="mdi:shopping-outline" width="20" /> My Orders
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/customer/my-gifts" onClick={() => setIsDropdownOpen(false)}>
                                            <Icon icon="mdi:ticket-percent-outline" width="20" /> My Gift Cards
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/customer/settings" onClick={() => setIsDropdownOpen(false)}>
                                            <Icon icon="mdi:cog-outline" width="20" /> Settings
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/customer/support" onClick={() => setIsDropdownOpen(false)}>
                                            <Icon icon="mdi:help-circle-outline" width="20" /> Support
                                        </NavLink>
                                    </li>
                                </ul>
                                <div className="dropdown-menu-footer">
                                    <button className="customer-signout-btn regular-body-text" onClick={handleSignOut}>
                                        <Icon icon="mdi:logout" width="20" /> Sign out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <button className="customer-mobile-toggle" onClick={toggleMobileMenu}>
                        <Icon icon={isMobileMenuOpen ? "mdi:close" : "mdi:menu"} width="28" />
                    </button>
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className={`customer-bottom-nav ${!showBottomNav ? 'hidden' : ''}`}>
                <NavLink to="/customer" className="bottom-nav-item" end>
                    <Icon icon="mdi:home" width="24" />
                    <span>Home</span>
                </NavLink>
                <NavLink to="/customer/browse-events" className="bottom-nav-item">
                    <Icon icon="mdi:compass-outline" width="24" />
                    <span>Browse Event</span>
                </NavLink>
                <NavLink to="/customer/store" className="bottom-nav-item">
                    <Icon icon="mdi:store-outline" width="24" />
                    <span>Store</span>
                </NavLink>

                <button className="bottom-nav-item profile-trigger" onClick={() => setIsMobileProfileOpen(true)}>
                    <Icon icon="mdi:account-outline" width="24" />
                    <span>Profile</span>
                </button>
            </div>

            {/* Full-Screen Mobile Profile Modal */}
            {isMobileProfileOpen && (
                <div className="customer-mobile-profile-overlay" onClick={() => setIsMobileProfileOpen(false)}>
                    <div className="customer-mobile-profile-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="mobile-profile-header">
                            <div className="mobile-profile-user-info">
                                <div className="mobile-profile-avatar">
                                    {authUser.avatar ? (
                                        <img 
                                            src={authUser.avatar.startsWith('http') || authUser.avatar.startsWith('data:') 
                                                ? authUser.avatar 
                                                : `${BACKEND_URL}${authUser.avatar}`} 
                                            alt="Profile" 
                                            className="mobile-avatar-img" 
                                            onError={(e) => { e.target.src = '/assets/eventbg.jpg'; }}
                                        />
                                    ) : (
                                        getInitials(authUser.firstName, authUser.lastName)
                                    )}
                                </div>
                                <div className="mobile-profile-details">
                                    <h3 className="mobile-profile-name">{authUser.firstName} {authUser.lastName}</h3>
                                    <p className="mobile-profile-email">{authUser.email}</p>
                                </div>
                            </div>
                            <button className="mobile-profile-close" onClick={() => setIsMobileProfileOpen(false)}>
                                <Icon icon="mdi:close" width="24" />
                            </button>
                        </div>
                        <div className="mobile-profile-body">
                            <NavLink to="/customer/my-ticketsorder" className="mobile-profile-link" onClick={() => setIsMobileProfileOpen(false)}>
                                <Icon icon="mdi:ticket-confirmation-outline" width="24" /> My Tickets
                            </NavLink>
                            <NavLink to="/customer/history" className="mobile-profile-link" onClick={() => setIsMobileProfileOpen(false)}>
                                <Icon icon="mdi:history" width="24" /> Purchase History
                            </NavLink>
                            <NavLink to="/customer/my-orders" className="mobile-profile-link" onClick={() => setIsMobileProfileOpen(false)}>
                                <Icon icon="mdi:shopping-outline" width="24" /> My Orders
                            </NavLink>
                            <NavLink to="/customer/my-gifts" className="mobile-profile-link" onClick={() => setIsMobileProfileOpen(false)}>
                                <Icon icon="mdi:ticket-percent-outline" width="24" /> My Gift Cards
                            </NavLink>
                            <NavLink to="/customer/settings" className="mobile-profile-link" onClick={() => setIsMobileProfileOpen(false)}>
                                <Icon icon="mdi:cog-outline" width="24" /> Settings
                            </NavLink>
                            <NavLink to="/customer/support" className="mobile-profile-link" onClick={() => setIsMobileProfileOpen(false)}>
                                <Icon icon="mdi:help-circle-outline" width="24" /> Support
                            </NavLink>
                            <button className="mobile-profile-link logout-btn" onClick={handleSignOut}>
                                <Icon icon="mdi:logout" width="24" /> Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <CustomerViewNotif
                isOpen={showAllNotifs}
                onClose={() => setShowAllNotifs(false)}
                notifications={notifications}
                onNotifClick={handleNotifClick}
                onMarkAllRead={handleMarkAllRead}
            />
        </header>
    );
}
