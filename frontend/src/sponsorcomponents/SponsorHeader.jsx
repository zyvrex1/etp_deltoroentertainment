import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { showConfirmAlert, showSuccessAlert } from '../admincomponents/utils/sweetAlert';
import './SponsorHeader.css';

export default function SponsorHeader() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const handleSignOut = async () => {
        setIsDropdownOpen(false);
        const result = await showConfirmAlert("Sign Out?", "Are you sure you want to sign out?", "Yes, Sign Out");
        if (result.isConfirmed) {
            await showSuccessAlert("Signed Out", "You have been signed out successfully.");
            navigate('/');
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
                </nav>

                <div className="sponsor-header-actions">
                    <div className="sponsor-profile-container" ref={dropdownRef}>
                        <button className="sponsor-profile-btn" onClick={toggleDropdown}>
                            <div className="sponsor-avatar">
                                <Icon icon="mdi:account-outline" width="20" />
                            </div>
                            <h6 className="sponsor-user-name">Zyvrex Perez</h6>
                        </button>

                        {isDropdownOpen && (
                            <div className="sponsor-profile-dropdown">
                                <div className="dropdown-user-info">
                                    <h6 className="dropdown-name">Zyvrex Perez</h6>
                                    <p className="small-body-text dropdown-email">zyvrex.p@example.com</p>
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
                </div>
            </div>
        </header>
    );
}