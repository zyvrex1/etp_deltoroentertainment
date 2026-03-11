import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { NavLink } from 'react-router-dom';

import './CustomerHome.css';
import CustomerViewEventFullDetails from './Modal/CustomerViewEventFullDetails';

export default function CustomerHome() {
    const [modalData, setModalData] = useState(null);
    const [eventDetailsModal, setEventDetailsModal] = useState(null);

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
        { title: "Customer Guidelines", content: "Customers are expected to present valid tickets and IDs at the venue, and respect the ongoing event rules." },
        { title: "Security Policies", content: "We use advanced encryption and security protocols to ensure your transactions and data are safe." }
    ];

    const announcements = [
        { type: "New Feature", badgeClass: "red-badge", title: "Mobile scanning is now live!", content: "Scan your tickets natively. You can now use your mobile device to show QR codes directly at the entrance." },
        { type: "Platform Update", badgeClass: "blue-badge", title: "New updates to our dashboard UI.", content: "Experience the redesign today. We have streamlined the navigation menus and improved contrast to make your workflow faster and more intuitive." },
        { type: "System Note", badgeClass: "green-badge", title: "Upcoming server maintenance", content: "Server maintenance scheduled for tonight at 2 AM EST. The platform will experience a brief downtime of approximately 15 minutes." },
        { type: "Feature Update", badgeClass: "blue-badge", title: "Added new ticket tier options", content: "You can now see up to 10 unique ticket tiers for events, including early bird specials and VIP access with custom delivery methods." }
    ];

    const trendingEventsAll = [
        { tag: "Concert", title: "Neon Dreams Tour", date: "Jun 15 • 20:00", location: "Starlight Arena, Los Angeles, CA", price: "$45 - $150" },
        { tag: "Concert", title: "All-Stars", date: "Jun 20 • 19:30", location: "Gotham Comedy Club, New York, NY", price: "$30 - $80" },
        { tag: "Concert", title: "Hamlet", date: "Jul 1 • 19:00", location: "Royal Globe Theatre, London, UK", price: "$50 - $200" },
        { tag: "Sports", title: "Championship Finals", date: "Jul 05 • 18:00", location: "Grand Stadium, Dallas, TX", price: "$100 - $500" },
        { tag: "Theater", title: "Broadway Nights", date: "Aug 10 • 19:00", location: "City Arts Center, NY", price: "$75 - $250" },
        { tag: "Festival", title: "Summer Vibe Fest", date: "Aug 20 • 12:00", location: "Open Grounds, Miami, FL", price: "$120 - $400" }
    ];

    const topEvents = trendingEventsAll.slice(0, 3);

    const features = [
        { icon: "mdi:magnify", title: "Easy Discovery", desc: "Find the perfect event with our smart search and personalized recommendations.", colorClass: "feature-red", bgClass: "bg-red-light" },
        { icon: "mdi:shield-check-outline", title: "Secure Booking", desc: "Your payments are protected and tickets are 100% guaranteed authentic.", colorClass: "feature-green", bgClass: "bg-green-light" },
        { icon: "mdi:lightning-bolt-outline", title: "Instant Access", desc: "Get your digital tickets instantly. Scan from your phone and enjoy the show.", colorClass: "feature-purple", bgClass: "bg-purple-light" }
    ];

    return (
        <div className="customer-home-page">
            {/* Hero Section */}
            <section className="customer-hero" style={{ backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.6), rgba(15, 23, 42, 0.8)), url('/assets/eventbg.jpg')` }}>
                <div className="customer-hero-content">
                    <h1>Find your next <span className="highlight-red">experience</span></h1>
                    <p className="large-body-text">Discover concerts, sports, theater, and more. Book tickets with confidence and ease.</p>
                    <div className="customer-hero-buttons">
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
                        </button>
                        <NavLink to="/customer/browse-events">
                            <button className="outlined-button white-outline hero-btn">View Categories</button>
                        </NavLink>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="customer-features">
                <div className="customer-features-grid">
                    {features.map((feat, idx) => (
                        <div className="customer-feature-card" key={idx}>
                            <div className={`customer-feature-icon-wrapper ${feat.bgClass}`}>
                                <Icon icon={feat.icon} className={`customer-feature-icon ${feat.colorClass}`} width="32" />
                            </div>
                            <h4>{feat.title}</h4>
                            <p className="small-body-text customer-feature-desc">{feat.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Announcements Section */}
            <section className="customer-announcements">
                <div className="customer-announcements-container">
                    {[...announcements, ...announcements].map((ann, idx) => (
                        <div
                            className="customer-announcement-item clickable"
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
            <section id="events" className="customer-trending">
                <div className="customer-section-header">
                    <div>
                        <h2>Trending Now</h2>
                        <p className="regular-body-text">Don't miss out on these hot events</p>
                    </div>
                    <NavLink to="/customer/browse-events" className="view-all-link regular-body-text">View All</NavLink>
                </div>
                <div className="customer-trending-grid">
                    {topEvents.map((evt, idx) => (
                        <div className="customer-event-card" key={idx}>
                            <div className="customer-event-image" style={{ backgroundImage: `url('/assets/eventbg.jpg')` }}>
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
                            <div className="customer-event-details">
                                <h4>{evt.title}</h4>
                                <div className="customer-event-info">
                                    <p className="small-body-text"><Icon icon="mdi:calendar-blank-outline" width="16" /> {evt.date}</p>
                                    <p className="small-body-text"><Icon icon="mdi:map-marker-outline" width="16" /> {evt.location}</p>
                                </div>
                                <div className="customer-event-footer">
                                    <div className="customer-event-price">
                                        <p className="smaller-body-text">From</p>
                                        <h6 className="price-range">{evt.price}</h6>
                                    </div>
                                    <button className="outlined-button get-tickets-btn" onClick={() => setEventDetailsModal(evt)}>View Details</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </section>

            {/* CTA Section */}
            <section className="customer-cta-section" style={{ backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.9)), url('/assets/eventbg.jpg')` }}>
                <div className="customer-cta-content">
                    <h2>Ready to make memories?</h2>
                    <p className="regular-body-text">Join millions of fans who trust eTicketsPro for their live entertainment needs.</p>
                    <NavLink to="/customer/browse-events">     <button className="primary-button cta-btn">Start Exploring</button></NavLink>
                </div>
            </section>

            {/* Platform Policies */}
            <section className="customer-policies-section">
                <div className="customer-section-header">
                    <div>
                        <h2>Platform Policies</h2>
                        <p className="regular-body-text">Transparency is our priority. Review our policies below to understand how we operate.</p>
                    </div>
                </div>
                <div className="customer-policies-grid">
                    {policies.map((policy, idx) => (
                        <div className="customer-policy-card" key={idx} onClick={() => openModal(policy.title, policy.content)}>
                            <Icon icon="mdi:file-document-outline" width="24" className="policy-icon" />
                            <h4 className="policy-title">{policy.title}</h4>
                        </div>
                    ))}
                </div>
            </section>

            {/* Reusable Modal for Policies/Announcements */}
            {modalData && (
                <div className="customer-modal-overlay" onClick={closeModal}>
                    <div className="customer-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="customer-modal-header">
                            <h3>{modalData.title}</h3>
                            <button className="customer-modal-close" onClick={closeModal}><Icon icon="mdi:close" width="24" /></button>
                        </div>
                        <div className="customer-modal-body">
                            <p className="regular-body-text">{modalData.content}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Event Details Modal */}
            <CustomerViewEventFullDetails
                show={!!eventDetailsModal}
                onClose={() => setEventDetailsModal(null)}
                eventData={eventDetailsModal}
            />
        </div>
    );
}
