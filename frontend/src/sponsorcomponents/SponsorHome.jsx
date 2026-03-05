import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { NavLink } from 'react-router-dom';

import './SponsorHome.css';

export default function SponsorHome() {
    const [modalData, setModalData] = useState(null);

    const openModal = (title, content) => {
        setModalData({ title, content });
    };
    const closeModal = () => {
        setModalData(null);
    };

    const policies = [
        { title: "Refund Policy", content: "If an event is canceled or postponed, you may be eligible for a refund depending on the event organizer's policy. Contact support for more info." },
        { title: "Privacy Policy", content: "Your data is important to us. We secure your information and do not share it with third parties without your consent." },
        { title: "Terms of Service", content: "By using our platform, you agree to our terms of service which ensure a safe and reliable environment for everyone." },
        { title: "Event Guidelines", content: "All events must adhere to local laws and community guidelines. Any violation may result in the event being taken down." },
        { title: "Sponsor Guidelines", content: "Sponsors must provide accurate information and honor their commitments to event organizers as outlined in their agreements." },
        { title: "Security Policies", content: "We use advanced encryption and security protocols to ensure your transactions and data are safe." }
    ];

    const announcements = [
        { type: "New Feature", badgeClass: "red-badge", title: "Event analytics are now live!", content: "Track your performance natively. You can now see real-time insights on ticket sales, demographic breakdowns, and campaign ROI right from your dashboard." },
        { type: "Platform Update", badgeClass: "blue-badge", title: "New updates to our dashboard UI.", content: "Experience the redesign today. We have streamlined the navigation menus and improved contrast to make your workflow faster and more intuitive." },
        { type: "System Note", badgeClass: "green-badge", title: "Upcoming server maintenance", content: "Server maintenance scheduled for tonight at 2 AM EST. The platform will experience a brief downtime of approximately 15 minutes." },
        { type: "Feature Update", badgeClass: "blue-badge", title: "Added new ticket tier options", content: "You can now define up to 10 unique ticket tiers for your events, including early bird specials and VIP access with custom delivery methods." }
    ];
    const trendingEvents = [
        { tag: "Concert", title: "TechInnovate Summit 2026", date: "Jun 16, 2026", location: "Starlight Arena, Los Angeles, CA", attendees: "5,000+ Expected Attendees", spots: "12 Spots Left" },
        { tag: "Sports", title: "Championship Finals 2026", date: "Jul 02, 2026", location: "Grand Stadium, Dallas, TX", attendees: "18,000+ Expected Attendees", spots: "5 Spots Left" },
        { tag: "Theater", title: "Broadway Nights", date: "Aug 10, 2026", location: "City Arts Center, NY", attendees: "2,000+ Expected Attendees", spots: "20 Spots Left" }
    ];

    const features = [
        { icon: "mdi:magnify", title: "Easy Discovery", desc: "Find the perfect event with our smart search and personalized recommendations.", colorClass: "feature-red", bgClass: "bg-red-light" },
        { icon: "mdi:shield-check-outline", title: "Secure Booking", desc: "Your payments are protected and tickets are 100% guaranteed authentic.", colorClass: "feature-green", bgClass: "bg-green-light" },
        { icon: "mdi:lightning-bolt-outline", title: "Instant Access", desc: "Get your digital tickets instantly. Scan from your phone and enjoy the show.", colorClass: "feature-purple", bgClass: "bg-purple-light" }
    ];

    return (
        <div className="sponsor-home-page">
            {/* Hero Section */}
            <section className="sponsor-hero" style={{ backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.6), rgba(15, 23, 42, 0.8)), url('/assets/eventbg.jpg')` }}>
                <div className="sponsor-hero-content">
                    <h1>Find your next <span className="highlight-red">experience</span></h1>
                    <p className="large-body-text">Discover concerts, sports, theater, and more. Book tickets with confidence and ease.</p>
                    <div className="sponsor-hero-buttons">
                        <button
                            className="primary-button hero-btn"
                            onClick={() => {
                                document.getElementById("events")?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start"
                                });
                            }}
                        >
                            Browse Events
                        </button>             <NavLink to="/sponsor/sponsor-events"><button className="outlined-button white-outline hero-btn">View Categories</button></NavLink>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="sponsor-features">
                <div className="sponsor-features-grid">
                    {features.map((feat, idx) => (
                        <div className="sponsor-feature-card" key={idx}>
                            <div className={`sponsor-feature-icon-wrapper ${feat.bgClass}`}>
                                <Icon icon={feat.icon} className={`sponsor-feature-icon ${feat.colorClass}`} width="32" />
                            </div>
                            <h4>{feat.title}</h4>
                            <p className="small-body-text sponsor-feature-desc">{feat.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Announcements Section */}
            {/* Announcements Section */}
            <section className="sponsor-announcements">
                <div className="sponsor-announcements-container">
                    {[...announcements].map((ann, idx) => (
                        <div
                            className="sponsor-announcement-item clickable"
                            key={idx}
                            onClick={() => openModal(ann.title, ann.content)}
                        >
                            <span
                                className={`button-label announcement-badge ${ann.badgeClass}`}
                            >
                                {ann.type}
                            </span>

                            <p className="announcement-text">{ann.title}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Trending Now */}
            <section id="events" className="sponsor-trending">
                <div className="sponsor-section-header">
                    <div>
                        <h2>Trending Now</h2>
                        <p className="regular-body-text">Don't miss out on these hot events</p>
                    </div>
                    <NavLink to="/sponsor/sponsor-events" className="view-all-link regular-body-text">View All</NavLink>
                </div>
                <div className="sponsor-trending-grid">
                    {trendingEvents.map((evt, idx) => (
                        <div className="sponsor-event-card" key={idx}>
                            <div className="sponsor-event-image" style={{ backgroundImage: `url('/assets/eventbg.jpg')` }}>
                                <span
                                    className={`button-label ${evt.tag === "Concert"
                                        ? "event-tag-red"
                                        : evt.tag === "Sports"
                                            ? "event-tag-green"
                                            : "event-tag-blue"
                                        }`}>
                                    {evt.tag}
                                </span>
                            </div>
                            <div className="sponsor-event-details">
                                <h4>{evt.title}</h4>
                                <div className="sponsor-event-info">
                                    <p className="small-body-text"><Icon icon="mdi:calendar-blank-outline" width="16" /> {evt.date}</p>
                                    <p className="small-body-text"><Icon icon="mdi:map-marker-outline" width="16" /> {evt.location}</p>
                                    <p className="small-body-text"><Icon icon="mdi:account-group-outline" width="16" /> {evt.attendees}</p>
                                </div>
                                <div className="sponsor-event-footer">
                                    <p className="smaller-body-text">Booths Available</p>
                                    <h6 className="highlight-red">{evt.spots}</h6>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Platform Policies */}
            <section className="sponsor-policies-section">
                <div className="sponsor-section-header">
                    <div>
                        <h2>Platform Policies</h2>
                        <p className="regular-body-text">Transparency is our priority. Review our policies below to understand how we operate.</p>
                    </div>
                </div>
                <div className="sponsor-policies-grid">
                    {policies.map((policy, idx) => (
                        <div className="sponsor-policy-card" key={idx} onClick={() => openModal(policy.title, policy.content)}>
                            <Icon icon="mdi:file-document-outline" width="24" className="policy-icon" />
                            <h4 className="policy-title">{policy.title}</h4>
                        </div>
                    ))}
                </div>
            </section>

            {/* Reusable Modal for Policies/Announcements */}
            {modalData && (
                <div className="sponsor-modal-overlay" onClick={closeModal}>
                    <div className="sponsor-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="sponsor-modal-header">
                            <h3>{modalData.title}</h3>
                            <button className="sponsor-modal-close" onClick={closeModal}><Icon icon="mdi:close" width="24" /></button>
                        </div>
                        <div className="sponsor-modal-body">
                            <p className="regular-body-text">{modalData.content}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}