import { Icon } from "@iconify/react";
import './CustomerFooter.css';
import { NavLink } from "react-router-dom";

export default function CustomerFooter() {
    return (
        <footer className="ch-footer" role="contentinfo">
            <div className="ch-footer-container">
                <div className="ch-footer-content">
                    <div className="ch-footer-col">
                        <img src="/logo/Logo1.png" alt="Deltoro Entertainment Logo" className="ch-footer-logo" />
                        <p className="ch-text-muted">
                            The easiest way to discover and book tickets for your favorite events.
                            Secure, fast, and reliable.
                        </p>
                        <div className="ch-footer-social-links">
                            <a
                                href="https://www.tiktok.com/@eticketspro"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ch-footer-social-link"
                                aria-label="TikTok"
                            >
                                <Icon icon="simple-icons:tiktok" />
                            </a>

                            <a
                                href="https://www.instagram.com/eticketspr0/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ch-footer-social-link"
                                aria-label="Instagram"
                            >
                                <Icon icon="simple-icons:instagram" />
                            </a>

                            <a
                                href="https://www.facebook.com/eticketspr0"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ch-footer-social-link"
                                aria-label="Facebook"
                            >
                                <Icon icon="simple-icons:facebook" />
                            </a>
                        </div>
                    </div>

                    <nav className="ch-footer-col" aria-label="Quick links">
                        <h4>Discover</h4>
                        <NavLink to="/customer/browse-events">Concerts</NavLink>
                        <NavLink to="/customer/browse-events">Sports</NavLink>
                        <NavLink to="/customer/browse-events">Theater</NavLink>
                        <NavLink to="/customer/browse-events">Festivals</NavLink>
                    </nav>

                    <nav className="ch-footer-col" aria-label="Support links">
                        <h4>Support</h4>
                        <NavLink to="/customer/support">Help Center</NavLink>
                        <NavLink to="/customer/support">Contact Us</NavLink>
                        <NavLink to="/customer/settings">Refund Policy</NavLink>
                        <NavLink to="/customer/settings">Privacy Policy</NavLink>
                    </nav>

                    <div className="ch-footer-col">
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

            <div className="ch-footer-bottom">
                <div className="ch-footer-container">
                    <p>© 2026 Deltoro Entertainment. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
