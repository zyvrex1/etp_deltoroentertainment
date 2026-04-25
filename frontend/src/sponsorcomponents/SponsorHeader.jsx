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
            localStorage.removeItem('user');
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
                    <NavLink to="/sponsor/cart" className="sponsor-cart-btn" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', marginRight: '8px', color: 'var(--color-white)' }}>
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

                    <button className="sponsor-mobile-toggle" onClick={toggleMobileMenu}>
                        <Icon icon={isMobileMenuOpen ? "mdi:close" : "mdi:menu"} width="28" />
                    </button>
                </div>

                <div className={`sponsor-mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
                    <NavLink to="/sponsor" className="sponsor-mobile-nav-link regular-body-text" onClick={() => setIsMobileMenuOpen(false)} end>Home</NavLink>
                    <NavLink to="/sponsor/sponsor-events" className="sponsor-mobile-nav-link regular-body-text" onClick={() => setIsMobileMenuOpen(false)}>Browse Events</NavLink>
                    <NavLink to="/sponsor/store" className="sponsor-mobile-nav-link regular-body-text" onClick={() => setIsMobileMenuOpen(false)}>Store</NavLink>
                </div>
            </div>
        </header>
    );
}