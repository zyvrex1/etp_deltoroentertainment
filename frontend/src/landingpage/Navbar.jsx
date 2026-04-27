import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import './Navbar.css';

const Navbar = ({ openSignup, openLogin }) => {
  return (
    <header className="landing-navbar-header">
      <div className="landing-navbar-container">
        <Link to="/" className="landing-navbar-logo">
          <img src="/logo/Logo1.png" alt="App Logo" className="landingpage-logo" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="landing-navbar-links">
          <a href="#home" className="landing-nav-link">Home</a>
          <a href="#events" className="landing-nav-link">Events</a>
          <a href="#benefits" className="landing-nav-link">Benefits</a>
          <a href="#about" className="landing-nav-link">About</a>
          <a href="#policies" className="landing-nav-link">Policies</a>
        </nav>

        <div className="landing-navbar-actions">
          <button className="landing-nav-signin-btn" onClick={openLogin}>
            <span className="nav-text">Sign in</span>
            <Icon icon="mdi:login" className="nav-icon" />
          </button>
          <button className="primary-button landing-nav-signup-btn" onClick={openSignup}>Get Started</button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;