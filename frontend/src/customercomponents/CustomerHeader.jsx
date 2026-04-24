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

                <div className={`customer-mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
                    <NavLink to="/customer" className="customer-mobile-nav-link regular-body-text" onClick={() => setIsMobileMenuOpen(false)} end>Home</NavLink>
                    <NavLink to="/customer/browse-events" className="customer-mobile-nav-link regular-body-text" onClick={() => setIsMobileMenuOpen(false)}>Browse Events</NavLink>
                </div>
            </div>
        </header>
    );
}
