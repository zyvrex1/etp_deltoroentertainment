import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ openSignup, openLogin }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="landing-navbar-header">
      <div className="landing-navbar-container">
        <Link to="/" className="landing-navbar-logo">
          <img src="/logo/Logo1.png" alt="App Logo" className="landingpage-logo" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="landing-navbar-links">
          <Link to="/" className="landing-nav-link">Home</Link>
          <Link to="/events" className="landing-nav-link">Events</Link>
          <Link to="/benefits" className="landing-nav-link">Benefits</Link>
          <Link to="/about" className="landing-nav-link">About</Link>
          <Link to="/policies" className="landing-nav-link">Policies</Link>
        </nav>

        <div className="landing-navbar-actions">
          <button className="landing-nav-signin-btn" onClick={openLogin}>Sign in</button>
          <button className="primary-button" onClick={openSignup}>Get Started</button>
        </div>

        {/* Mobile Hamburger Menu */}
        <div className="landing-navbar-mobile-toggle" onClick={toggleMenu}>
          <svg
            className="landing-burger-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="landing-navbar-mobile-menu">
          <Link to="/events" className="landing-mobile-nav-link" onClick={toggleMenu}>Events</Link>
          <Link to="/benefits" className="landing-mobile-nav-link" onClick={toggleMenu}>Benefits</Link>
          <Link to="/about" className="landing-mobile-nav-link" onClick={toggleMenu}>About</Link>
          <Link to="/policies" className="landing-mobile-nav-link" onClick={toggleMenu}>Policies</Link>
          <button className="landing-mobile-signin-btn" onClick={() => { openLogin(); toggleMenu(); }}>Sign in</button>
          <button className="primary-button landing-mobile-getstarted-btn" onClick={() => { openSignup(); toggleMenu(); }}>Get Started</button>
        </div>
      )}
    </header>
  );
};

export default Navbar;