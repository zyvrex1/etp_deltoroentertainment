import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { showConfirmAlert, showSuccessAlert } from '../utils/sweetAlert';
import { useAuthContext } from '../hooks/useAuthContext';
import './CustomerHeader.css';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

import { useLogout } from '../hooks/useLogout';

export default function CustomerHeader() {
    const { user: authUser } = useAuthContext();
    const { logout } = useLogout();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
    const [showBottomNav, setShowBottomNav] = useState(true);
    const lastScrollY = useRef(0);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

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
            logout();
            window.location.href = "/?logout=success";
        }
    };

    const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
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
                </nav>

                <div className="customer-header-actions">
                    
                    <button className="customer-cart-btn" onClick={() => navigate('/customer/cart')}>
                        <Icon icon="mdi:cart-outline" width="24" />
                        <span className="cart-badge">3</span>
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
                <NavLink to="/customer/my-ticketsorder" className="bottom-nav-item">
                    <Icon icon="mdi:ticket-confirmation-outline" width="24" />
                    <span>My Tickets</span>
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
        </header>
    );
}
