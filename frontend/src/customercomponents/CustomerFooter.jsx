import { Icon } from "@iconify/react";
import './CustomerFooter.css';
import { NavLink } from "react-router-dom";
import { useState } from "react";
import policyService from '../services/policyService';
import HomeViewFullContent from '../landingpage/HomeViewFullContent';

export default function CustomerFooter() {
    const [modalData, setModalData] = useState(null);

    const openPolicyModal = async (keyword) => {
        try {
            const policies = await policyService.getPolicies();
            const match = policies.find(p =>
                p.title.toLowerCase().includes(keyword.toLowerCase())
            );
            if (match) {
                setModalData({
                    ...match,
                    date: new Date(match.updatedAt || match.date).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric"
                    }),
                    icon: "mdi:file-document-outline"
                });
            }
        } catch (err) {
            console.error("Error fetching policy:", err);
        }
    };

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
                        <h4>Manage</h4>
                        <NavLink to="/customer/browse-events">Events</NavLink>
                        <NavLink to="/customer/my-ticketsorder">My Seats</NavLink>
                        <NavLink to="/customer/history">Purchase History</NavLink>
                        <NavLink to="/customer/store">Store</NavLink>
                    </nav>

                    <nav className="ch-footer-col" aria-label="Support links">
                        <h4>Support</h4>
                        <NavLink to="/customer/support" state={{ tab: 'Help Center' }}>Help Center</NavLink>
                        <NavLink to="/customer/support">Contact Support</NavLink>
                        <NavLink to="/customer/settings">Settings</NavLink>
                        <button className="ch-footer-link-btn" onClick={() => openPolicyModal('refund')}>
                            Refund Policy
                        </button>
                        <button className="ch-footer-link-btn" onClick={() => openPolicyModal('privacy')}>
                            Privacy Policy
                        </button>
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
            <HomeViewFullContent
                isOpen={!!modalData}
                onClose={() => setModalData(null)}
                item={modalData}
                type="policy"
            />
        </footer>
    );
}
