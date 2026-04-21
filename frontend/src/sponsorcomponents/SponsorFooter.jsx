import { Icon } from "@iconify/react";
import './SponsorFooter.css';
import { NavLink } from "react-router-dom";

export default function SponsorFooter() {
    return (
        <footer className="sf-footer" role="contentinfo">
            <div className="sf-footer-container">
                <div className="sf-footer-content">
                    <div className="sf-footer-col">
                        <img src="/logo/Logo1.png" alt="Deltoro Entertainment Logo" className="sf-footer-logo" />
                        <p className="sf-text-muted">
                            The professional's gateway to premium event sponsorship.
                            Manage your booths, reach new audiences, and grow your brand.
                        </p>
                        <div className="sf-footer-social-links">
                            <a
                                href="https://www.tiktok.com/@eticketspro"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="sf-footer-social-link"
                                aria-label="TikTok"
                            >
                                <Icon icon="simple-icons:tiktok" />
                            </a>

                            <a
                                href="https://www.instagram.com/eticketspr0/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="sf-footer-social-link"
                                aria-label="Instagram"
                            >
                                <Icon icon="simple-icons:instagram" />
                            </a>

                            <a
                                href="https://www.facebook.com/eticketspr0"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="sf-footer-social-link"
                                aria-label="Facebook"
                            >
                                <Icon icon="simple-icons:facebook" />
                            </a>
                        </div>
                    </div>

                    <nav className="sf-footer-col" aria-label="Sponsor navigation">
                        <h4>Manage</h4>
                        <NavLink to="/sponsor/sponsor-events">Events</NavLink>
                        <NavLink to="/sponsor/my-booths">My Booths</NavLink>
                        <NavLink to="/sponsor/sponsor-history">History</NavLink>
                        <NavLink to="/sponsor/sponsor-analytics">Analytics</NavLink>
                    </nav>

                    <nav className="sf-footer-col" aria-label="Support links">
                        <h4>Support</h4>
                        <NavLink to="/sponsor/sponsor-support">Help Center</NavLink>
                        <NavLink to="/sponsor/sponsor-support">Contact Support</NavLink>
                        <NavLink to="/sponsor/sponsor-settings">Settings</NavLink>
                        <NavLink to="/sponsor/sponsor-settings">Privacy</NavLink>
                    </nav>

                    <div className="sf-footer-col">
                        <h4>Contact Us</h4>
                        <p>
                            717 South 12th St Suite 3<br />
                            McAllen, TX, United States
                        </p>
                        <p>
                            <a href="tel:+19564671080">+1 956-467-1080</a>
                        </p>
                        <p>
                            <a href="mailto:info@eticketspro.com">info@eticketspro.com</a>
                        </p>
                    </div>
                </div>
            </div>

            <div className="sf-footer-bottom">
                <div className="sf-footer-container">
                    <p>© 2026 Deltoro Entertainment. All rights reserved. Sponsor Portal</p>
                </div>
            </div>
        </footer>
    );
}