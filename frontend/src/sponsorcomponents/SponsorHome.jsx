import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { NavLink } from 'react-router-dom';
import { useAuthContext } from '../admincomponents/hooks/useAuthContext';
import eventsService from '../services/eventsService';
import announcementService from '../services/announcementService';
import policyService from '../services/policyService';
import PromoterViewFullAnnouncement from '../promotercomponents/PromoterModal/PromoterViewFullAnnouncement';

import './SponsorHome.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function SponsorHome() {
    const { user } = useAuthContext();
    const [modalData, setModalData] = useState(null);
    const [modalType, setModalType] = useState('announcement');
    const [liveEvents, setLiveEvents] = useState([]);
    const [liveAnnouncements, setLiveAnnouncements] = useState([]);
    const [livePolicies, setLivePolicies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [eventsData, announcementsData, policiesData] = await Promise.all([
                    eventsService.getEvents(user?.token),
                    announcementService.getAnnouncements(),
                    policyService.getPolicies()
                ]);

                // Only show approved events and take top 6 for trending
                const approvedEvents = eventsData.filter(e => e.status === 'approved').slice(0, 6);
                setLiveEvents(approvedEvents);

                // Map announcements with badge classes
                const mappedAnnouncements = announcementsData.map(ann => {
                    let badgeClass = "general";
                    const category = ann.contentcategory?.toLowerCase() || ann.type?.toLowerCase();
                    if (category === "maintenance") badgeClass = "maintenance";
                    if (category === "news") badgeClass = "news";
                    if (category === "update") badgeClass = "update";
                    if (category === "alert") badgeClass = "alert";

                    return {
                        ...ann,
                        badgeClass,
                        type: ann.contentcategory || ann.type || "General",
                        date: new Date(ann.date || ann.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                        icon: "mdi:bullhorn-outline"
                    };
                });
                setLiveAnnouncements(mappedAnnouncements);

                // Map policies
                const mappedPolicies = policiesData.map(policy => ({
                    ...policy,
                    date: new Date(policy.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                    icon: "mdi:file-document-outline"
                }));
                setLivePolicies(mappedPolicies);

            } catch (error) {
                console.error("Error fetching sponsor home data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user?.token]);

    const openModal = (item, type) => {
        setModalData(item);
        setModalType(type);
    };
    const closeModal = () => {
        setModalData(null);
    };

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
            <section className="sponsor-announcements">
                <div className={`sponsor-announcements-container ${liveAnnouncements.length > 0 ? 'scrolling' : ''}`}>
                    {liveAnnouncements.length > 0 ? (
                        liveAnnouncements.map((item, idx) => (
                            <div
                                key={item._id || idx}
                                className="hp-card"
                                onClick={() => openModal(item, 'announcement')}
                            >
                                <div className="hp-card-top">
                                    <div className="hp-card-icon-container">
                                        <Icon icon={item.icon} className="hp-card-icon" />
                                    </div>
                                    <div className="hp-card-meta">
                                        <h3 className="hp-card-title">{item.title}</h3>
                                        <span className="hp-date">
                                            <Icon icon="mdi:calendar-outline" /> {item.date}
                                        </span>
                                    </div>
                                </div>
                                <div className="hp-card-body">
                                    <span className={`hp-badge button-label ${item.badgeClass}`}>
                                        {item.type}
                                    </span>
                                    <p className="hp-card-text">
                                        {item.content}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        !isLoading && (
                            <div className="hp-empty-state">
                                <Icon icon="mdi:bullhorn-outline" className="hp-empty-icon" />
                                <h3>There are no announcements yet</h3>
                            </div>
                        )
                    )}
                </div>
            </section>

            {/* Upcoming Events */}
            <section id="events" className="sponsor-upcoming">
                <div className="sponsor-section-header">
                    <div>
                        <h2>Upcoming Events</h2>
                        <p className="regular-body-text">Discover trending events happening soon.</p>
                    </div>
                    <NavLink to="/sponsor/sponsor-events" className="view-all-link regular-body-text">View All Events &gt;</NavLink>
                </div>
                <div className="sponsor-events-grid">
                    {liveEvents.length > 0 ? (
                        liveEvents.map((evt, idx) => (
                            <div className="sponsor-event-card" key={evt._id || idx}>
                                <div
                                    className="sponsor-event-image"
                                    style={{
                                        backgroundImage: `url(${evt.image ? `${BACKEND_URL}/uploads/${evt.image}` : '/assets/eventbg.jpg'})`
                                    }}
                                >
                                    <span className="button-label event-date-badge">
                                        {new Date(evt.startDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                                    </span>
                                </div>
                                <div className="sponsor-event-details">
                                    <span className={`button-label event-tag ${evt.category === "Concert" ? "tag-red" :
                                        evt.category === "Sports" ? "tag-green" : "tag-blue"
                                        }`}>
                                        {evt.category || "Event"}
                                    </span>
                                    <h4>{evt.title}</h4>
                                    <p className="event-location">📍
                                        {`${evt.venue?.name || ""}, ${evt.venue?.address || ""}, ${evt.venue?.city || ""}, ${evt.venue?.zipCode || ""}`.trim().replace(/^, |, $/, "") || "TBA"}
                                    </p>

                                    <div className="event-info-row">
                                        <div className="event-time">
                                            <Icon icon="mdi:clock-outline" />
                                            <span className="small-body-text">{evt.startTime || "TBA"} - {evt.endTime || "TBA"}</span>
                                        </div>
                                        <div className="event-booths">
                                            <Icon icon="mdi:store-outline" />
                                            <span className="small-body-text">{evt.booths?.filter(b => b.status === "available").length || 0} Booths Available</span>
                                        </div>
                                    </div>

                                    <NavLink to={`/sponsor/sponsor-events`} className="primary-button full-width-btn">
                                        View Details
                                    </NavLink>
                                </div>
                            </div>
                        ))
                    ) : (
                        !isLoading && (
                            <div className="hp-empty-state full-width">
                                <Icon icon="mdi:calendar-blank-outline" className="hp-empty-icon" />
                                <h3>No upcoming events at the moment.</h3>
                            </div>
                        )
                    )}
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
                    {livePolicies.length > 0 ? (
                        livePolicies.map((item, idx) => (
                            <div
                                key={item._id || idx}
                                className="hp-card"
                                onClick={() => openModal(item, 'policy')}
                            >
                                <div className="hp-card-top align-start">
                                    <div className="hp-card-icon-container document-icon">
                                        <Icon icon={item.icon} className="hp-card-icon" />
                                    </div>
                                    <div className="hp-card-meta">
                                        <h3 className="hp-card-title">{item.title}</h3>
                                        <span className="hp-date">
                                            Updated Last: {item.date}
                                        </span>
                                    </div>
                                </div>
                                <div className="hp-card-body">
                                    <p className="hp-card-text">{item.content}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        !isLoading && (
                            <div className="hp-empty-state full-width">
                                <Icon icon="mdi:file-document-outline" className="hp-empty-icon" />
                                <h3>There are no policies yet</h3>
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
        </div>
    );
}