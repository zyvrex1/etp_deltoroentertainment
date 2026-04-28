import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { showConfirmAlert, showSuccessAlert } from '../utils/sweetAlert';
import { useAuthContext } from '../hooks/useAuthContext';
import { useSponsorCartContext } from '../context/SponsorCartContext';
import './SponsorHeader.css';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function SponsorHeader() {
    const { user: authUser } = useAuthContext();
    const { cartItems } = useSponsorCartContext();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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
            localStorage.removeItem('user');
            window.location.href = "/?logout=success";
        }
    };

    const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

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
        <header className="sponsor-header">
            <div className="sponsor-header-container">
                <div className="sponsor-logo-container">
                    <NavLink to="/sponsor" className="sponsor-header-logo">
                        <img src="/logo/Logo1.png" alt="App Logo" className="sponsor-head-logo" />
                    </NavLink>
                </div>

                <nav className="sponsor-nav-links">
                    <NavLink to="/sponsor" className="sponsor-nav-link" end>Home</NavLink>
                    <NavLink to="/sponsor/sponsor-events" className="sponsor-nav-link">Browse Events</NavLink>
                    <NavLink to="/sponsor/store" className="sponsor-nav-link">Store</NavLink>
                </nav>

                <div className="sponsor-header-actions">
                    {/* 
                    <button className="sponsor-notification-btn" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', color: 'var(--color-white)' }}>
                        <Icon icon="mdi:bell-outline" width="24" />
                    </button> 
                    */}
                    <NavLink to="/sponsor/cart" className="sponsor-cart-btn" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', color: 'var(--color-white)' }}>
                        <Icon icon="mdi:cart-outline" width="24" />
                        <span className="cart-badge" style={{ position: 'absolute', top: '0px', right: '0px', background: 'var(--color-red-primary)', color: 'white', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {cartItems?.length || 0}
                        </span>
                    </NavLink>
                    <div className="sponsor-profile-container" ref={dropdownRef}>
                        <button className="sponsor-profile-btn" onClick={toggleDropdown}>
                            <div className="sponsor-avatar">
                                {authUser.avatar ? (
                                    <img 
                                        src={authUser.avatar.startsWith('http') || authUser.avatar.startsWith('data:') 
                                            ? authUser.avatar 
                                            : `${BACKEND_URL}${authUser.avatar}`} 
                                        alt="Profile" 
                                        className="sponsor-avatar-img" 
                                    />
                                ) : (
                                    getInitials(authUser.firstName, authUser.lastName)
                                )}
                            </div>
                            <h6 className="sponsor-user-name">
                                {authUser.firstName} {authUser.lastName}
                            </h6>
                        </button>

                        {isDropdownOpen && (
                            <div className="sponsor-profile-dropdown">
                                <div className="dropdown-user-info">
                                    <h6 className="dropdown-name">{authUser.firstName} {authUser.lastName}</h6>
                                    <p className="small-body-text dropdown-email">{authUser.email}</p>
                                </div>
                                <ul className="dropdown-menu-list regular-body-text">
                                    <li>
                                        <NavLink to="/sponsor/sponsor-my-booths" onClick={() => setIsDropdownOpen(false)}>
                                            <Icon icon="mdi:storefront-outline" width="20" /> My Booths
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/sponsor/sponsor-history" onClick={() => setIsDropdownOpen(false)}>
                                            <Icon icon="mdi:history" width="20" /> Sponsorship History
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/sponsor/sponsor-invoices" onClick={() => setIsDropdownOpen(false)}>
                                            <Icon icon="mdi:receipt-outline" width="20" /> Invoice & Receipts
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/sponsor/settings" onClick={() => setIsDropdownOpen(false)}>
                                            <Icon icon="mdi:cog-outline" width="20" /> Settings
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/sponsor/support" onClick={() => setIsDropdownOpen(false)}>
                                            <Icon icon="mdi:help-circle-outline" width="20" /> Support
                                        </NavLink>
                                    </li>
                                </ul>
                                <div className="dropdown-menu-footer">
                                    <button className="sponsor-signout-btn regular-body-text" onClick={handleSignOut}>
                                        <Icon icon="mdi:logout" width="20" /> Sign out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className={`sponsor-bottom-nav ${!showBottomNav ? 'hidden' : ''}`}>
                <NavLink to="/sponsor" className="bottom-nav-item" end>
                    <Icon icon="mdi:home" width="24" />
                    <span>Home</span>
                </NavLink>
                <NavLink to="/sponsor/sponsor-events" className="bottom-nav-item">
                    <Icon icon="mdi:compass-outline" width="24" />
                    <span>Browse Event</span>
                </NavLink>
                <NavLink to="/sponsor/store" className="bottom-nav-item">
                    <Icon icon="mdi:storefront-outline" width="24" />
                    <span>Store</span>
                </NavLink>
                <button className="bottom-nav-item profile-trigger" onClick={() => setIsMobileProfileOpen(true)}>
                    <Icon icon="mdi:account-outline" width="24" />
                    <span>Profile</span>
                </button>
            </div>

            {/* Full-Screen Mobile Profile Modal */}
            {isMobileProfileOpen && (
                <div className="sponsor-mobile-profile-overlay" onClick={() => setIsMobileProfileOpen(false)}>
                    <div className="sponsor-mobile-profile-modal" onClick={(e) => e.stopPropagation()}>
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
                            <NavLink to="/sponsor/sponsor-my-booths" className="mobile-profile-link" onClick={() => setIsMobileProfileOpen(false)}>
                                <Icon icon="mdi:storefront-outline" width="24" /> My Booths
                            </NavLink>
                            <NavLink to="/sponsor/sponsor-history" className="mobile-profile-link" onClick={() => setIsMobileProfileOpen(false)}>
                                <Icon icon="mdi:history" width="24" /> Sponsorship History
                            </NavLink>
                            <NavLink to="/sponsor/sponsor-invoices" className="mobile-profile-link" onClick={() => setIsMobileProfileOpen(false)}>
                                <Icon icon="mdi:receipt-outline" width="24" /> Invoice & Receipts
                            </NavLink>
                            <NavLink to="/sponsor/settings" className="mobile-profile-link" onClick={() => setIsMobileProfileOpen(false)}>
                                <Icon icon="mdi:cog-outline" width="24" /> Settings
                            </NavLink>
                            <NavLink to="/sponsor/support" className="mobile-profile-link" onClick={() => setIsMobileProfileOpen(false)}>
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