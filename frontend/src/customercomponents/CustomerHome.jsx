import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { NavLink } from 'react-router-dom';

import './CustomerHome.css';
import CustomerViewEventFullDetails from './Modal/CustomerViewEventFullDetails';
import announcementService from '../services/announcementService';
import policyService from '../services/policyService';
import eventsService from '../services/eventsService';
import PromoterViewFullAnnouncement from '../promotercomponents/PromoterModal/PromoterViewFullAnnouncement';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function CustomerHome() {
    const [modalData, setModalData] = useState(null);
    const [modalType, setModalType] = useState('announcement');
    const [eventDetailsModal, setEventDetailsModal] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [policies, setPolicies] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [events, setEvents] = useState([]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [annData, polData, evtData] = await Promise.all([
                announcementService.getAnnouncements(),
                policyService.getPolicies(),
                eventsService.getEvents()
            ]);

            // Map announcements with badge classes
            const mappedAnnouncements = annData.map(ann => {
                let badgeClass = "general";
                const category = ann.contentcategory?.toLowerCase();
                if (category === "maintenance") badgeClass = "maintenance";
                if (category === "news") badgeClass = "news";
                if (category === "update") badgeClass = "update";
                if (category === "alert") badgeClass = "alert";

                return {
                    ...ann,
                    badgeClass,
                    type: ann.contentcategory || "General",
                    date: new Date(ann.date || ann.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                    icon: "mdi:bullhorn-outline"
                };
            });
            setAnnouncements(mappedAnnouncements);

            // Map policies
            const mappedPolicies = polData.map(policy => ({
                ...policy,
                date: new Date(policy.updatedAt || policy.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                icon: "mdi:file-document-outline"
            }));
            setPolicies(mappedPolicies);

            // Get 6 latest created events
            const sortedEvents = (evtData || [])
                .filter(e => e.status === 'approved')
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 6);
            setEvents(sortedEvents);

        } catch (error) {
            console.error("Error fetching homepage data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openModal = (item, type) => {
        setModalData(item);
        setModalType(type);
    };
    const closeModal = () => {
        setModalData(null);
    };

    const formatEventDate = (dateStr) => {
        if (!dateStr) return "TBA";
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    };

    const getPriceRange = (priceLevels) => {
        if (!priceLevels || priceLevels.length === 0) return "TBA";
        const prices = priceLevels.map(p => p.facePrice);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        if (min === max) return `$${min}`;
        return `$${min} - $${max}`;
    };

    const features = [
        { icon: "mdi:magnify", title: "Easy Discovery", desc: "Find the perfect event with our smart search and personalized recommendations." },
        { icon: "mdi:shield-check-outline", title: "Secure Booking", desc: "Your payments are protected and tickets are 100% guaranteed authentic." },
        { icon: "mdi:lightning-bolt-outline", title: "Instant Access", desc: "Get your digital tickets instantly. Scan from your phone and enjoy the show." }
    ];

    return (
        <div className="ch-theme">
            {/* Hero Section */}
            <section className="ch-hero-section">
                <div className="ch-hero-bg" style={{ backgroundImage: `url('/assets/herobg.jpg')` }}>
                    <div className="ch-hero-overlay"></div>
                </div>
                <div className="ch-hero-content ch-container">
                    <h1 className="ch-title">
                        Find your next <span className="ch-gradient-text">experience</span>
                    </h1>
                    <p className="ch-subtitle">
                        Discover concerts, sports, theater, and more. Book tickets with confidence and ease.
                    </p>
                    <div className="ch-hero-buttons">
                        <button
                            className="ch-btn ch-btn-primary"
                            onClick={() => {
                                document.getElementById("events")?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start"
                                });
                            }}
                        >
                            Browse Events
                        </button>
                        <NavLink to="/customer/browse-events" className="ch-btn ch-btn-secondary">
                            View Categories
                        </NavLink>
                    </div>

                    {/* Features Grid */}
                    <div className="ch-stats-cards">
                        {features.map((feat, idx) => (
                            <div className="ch-stat-card ch-glass" key={idx}>
                                <div className="ch-stat-icon">
                                    <Icon icon={feat.icon} />
                                </div>
                                <h4>{feat.title}</h4>
                                <p>{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Announcements Section */}
            <section className="ch-section">
                <div className="ch-container">
                    <div className="ch-section-header">
                        <div className="ch-section-header-left">
                            <h3>Platform Announcements</h3>
                        </div>
                    </div>
                </div>

                <div className="ch-announcements-marquee-container">
                    <div className={`ch-announcements-marquee-track ${announcements.length > 0 ? 'animating' : ''}`}>
                        {announcements.length > 0 ? (
                            [...announcements, ...announcements].map((item, idx) => (
                                <div
                                    key={`${item._id || idx}-${idx}`}
                                    className="ch-announcement-marquee-item"
                                    onClick={() => openModal(item, 'announcement')}
                                >
                                    <div className={`ch-announcement-v3 ${item.badgeClass}`}>
                                        <div className="ch-v3-header">
                                            <div className="ch-v3-icon-box">
                                                <Icon icon={item.icon || "mdi:bullhorn-outline"} />
                                            </div>
                                            <span className={`ch-v3-category ${item.badgeClass}`}>{item.type}</span>
                                        </div>
                                        <div className="ch-v3-content">
                                            <div className="ch-v3-title-row">
                                                <h4>{item.title}</h4>
                                                <span className="ch-v3-date-top">{item.date}</span>
                                            </div>
                                            <p>{item.content}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="ch-empty ch-container">
                                <Icon icon="mdi:bullhorn-outline" />
                                <h3>No announcements yet.</h3>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Trending Now */}
            <section id="events" className="ch-section ch-container">
                <div className="ch-section-header">
                    <div className="ch-section-header-left">
                        <h3>Upcoming Events</h3>
                        <p className="ch-subheading">Discover trending events happening soon.</p>
                    </div>
                    <NavLink to="/customer/browse-events" className="ch-link">View All</NavLink>
                </div>

                <div className="ch-grid">
                    {isLoading ? (
                        <div className="ch-empty ch-container">
                            <Icon icon="mdi:loading" className="ch-spin" />
                            <p>Finding the hottest events for you...</p>
                        </div>
                    ) : events.length > 0 ? (
                        events.map((evt, idx) => (
                            <div className={`ch-event-card-v2 ch-glass`} key={evt._id || idx}>
                                <div className="ch-v2-image-area">
                                    <img
                                        src={evt.image ? (evt.image.startsWith('http') ? evt.image : `${BACKEND_URL}/uploads/${evt.image}`) : '/assets/eventbg.jpg'}
                                        alt={evt.title}
                                        className="ch-v2-img"
                                    />
                                    <div className="ch-v2-date-badge">
                                        <Icon icon="mdi:calendar-month" />
                                        <span>{formatEventDate(evt.startDate)}</span>
                                    </div>
                                </div>
                                <div className="ch-v2-content">
                                    <span className={`ch-v2-tag ${evt.category === "Concert" ? "tag-red" :
                                        evt.category === "Sports" ? "tag-green" : "tag-blue"
                                        }`}>
                                        {evt.category || "Event"}
                                    </span>
                                    <h5 className="ch-v2-title">{evt.title}</h5>
                                    <p className="ch-event-location">
                                        <Icon icon="mdi:map-marker-outline" /> {`${evt.venue?.name || ""}, ${evt.venue?.city || ""}`.trim().replace(/^, |, $/, "") || "TBA"}
                                    </p>

                                    <div className="ch-v2-details-row">
                                        <div className="ch-v2-detail-item">
                                            <span className="ch-v2-label">Time</span>
                                            <span className="ch-v2-value time-val">
                                                <Icon icon="mdi:clock-outline" />
                                                {evt.startTime || "TBA"}
                                            </span>
                                        </div>
                                        <div className="ch-v2-detail-item ch-text-right">
                                            <span className="ch-v2-label">Price Range</span>
                                            <span className="ch-v2-value">{getPriceRange(evt.priceLevels)}</span>
                                        </div>
                                    </div>

                                    <div className="ch-v2-footer">
                                        <button className="ch-v2-btn" onClick={() => setEventDetailsModal({
                                            ...evt,
                                            tag: evt.category,
                                            date: `${new Date(evt.startDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} • ${evt.startTime}`,
                                            location: `${evt.venue?.name}, ${evt.venue?.city}`,
                                            price: getPriceRange(evt.priceLevels)
                                        })}>
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="ch-empty ch-container">
                            <Icon icon="mdi:calendar-blank-outline" />
                            <p>No upcoming events found. Check back soon!</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Platform Policies */}
            <section className="ch-section ch-container">
                <div className="ch-section-header">
                    <div className="ch-section-header-left">
                        <h3>Platform Policies</h3>
                        <p className="ch-subheading">Transparency is our priority. Review our policies below.</p>
                    </div>
                </div>

                <div className="ch-policy-list">
                    {policies.length > 0 ? (
                        policies.map((item, idx) => (
                            <div
                                key={item._id || idx}
                                className="ch-policy-item ch-glass"
                                onClick={() => openModal(item, 'policy')}
                            >
                                <div className="ch-policy-icon-box">
                                    <Icon icon={item.icon || "mdi:file-document-outline"} />
                                </div>
                                <div className="ch-policy-text">
                                    <h4>{item.title}</h4>
                                    <p className="ch-text-ellipsis-2 ch-text-left">Updated Last: {item.date}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        !isLoading && (
                            <div className="ch-empty ch-container">
                                <Icon icon="mdi:shield-outline" />
                                <h3>No policies available.</h3>
                            </div>
                        )
                    )}
                </div>
            </section>

            {/* Reusable Modal for Policies/Announcements */}
            <PromoterViewFullAnnouncement
                isOpen={!!modalData}
                onClose={closeModal}
                item={modalData}
                type={modalType}
            />

            {/* Event Details Modal */}
            <CustomerViewEventFullDetails
                show={!!eventDetailsModal}
                onClose={() => setEventDetailsModal(null)}
                eventData={eventDetailsModal}
            />
        </div>
    );
}
