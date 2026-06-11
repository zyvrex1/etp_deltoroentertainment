import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { NavLink } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';
import eventsService from '../services/eventsService';
import announcementService from '../services/announcementService';
import policyService from '../services/policyService';
import HomeViewFullContent from '../landingpage/HomeViewFullContent';

import './SponsorHome.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function SponsorHome() {
    const { user } = useAuthContext();
    const [modalData, setModalData] = useState(null);
    const [modalType, setModalType] = useState('announcement');
    const [events, setEvents] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [policies, setPolicies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [evtData, annData, polData] = await Promise.all([
                eventsService.getEvents(user?.token),
                announcementService.getAnnouncements(),
                policyService.getPolicies()
            ]);

            // Filter approved events and take 4 most upcoming
            const now = new Date().setHours(0, 0, 0, 0);
            const sortedEvents = (evtData || [])
                .filter(e => e.status === 'approved' && new Date(e.startDate) >= now)
                .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                .slice(0, 4);
            setEvents(sortedEvents);

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

        } catch (error) {
            console.error("Error fetching sponsor home data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user?.token]);
 
    // Intersection Observer for scroll reveal
    useEffect(() => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: "0px 0px -50px 0px"
        };
 
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, observerOptions);
 
        const revealElements = document.querySelectorAll('.reveal');
        revealElements.forEach(el => observer.observe(el));
 
        return () => {
            revealElements.forEach(el => observer.unobserve(el));
        };
    }, [isLoading, announcements, policies]);

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

    const features = [
        { icon: "mdi:handshake-outline", title: "Prime Sponsorship", desc: "Gain massive exposure by sponsoring high-traffic events across the platform." },
        { icon: "mdi:store-plus-outline", title: "Booth Management", desc: "Easily reserve and manage your physical and digital presence at major venues." },
        { icon: "mdi:chart-timeline-variant", title: "Deep Analytics", desc: "Track your impact with detailed reports on visitor engagement and brand reach." }
    ];

    return (
        <div className="sh-theme">
            {/* Hero Section */}
            <section className="sh-hero-section">
                <div className="sh-hero-bg" style={{ backgroundImage: `url('/assets/herobg.jpg')` }}>
                    <div className="sh-hero-overlay"></div>
                </div>
                <div className="sh-hero-content sh-container">
                    <h1 className="sh-title">
                        Grow your <span className="sh-gradient-text">brand identity</span>
                    </h1>
                    <p className="sh-subtitle">
                        Partner with the most exciting events. Manage your booths, track sponsorships, and expand your reach.
                    </p>
                    <div className="sh-hero-buttons">
                        <button
                            className="sh-btn sh-btn-primary"
                            onClick={() => {
                                document.getElementById("events")?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start"
                                });
                            }}
                        >
                            Browse Events
                        </button>
                        <NavLink to="/sponsor/sponsor-events" className="sh-btn sh-btn-secondary">
                            View Categories
                        </NavLink>
                    </div>

                    {/* Features Grid */}
                    <div className="sh-stats-cards reveal">
                        {features.map((feat, idx) => (
                            <div className={`sh-stat-card sh-glass reveal stagger-${(idx % 4) + 1}`} key={idx}>
                                <div className="sh-stat-icon">
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
            <section className="sh-section reveal">
                <div className="sh-container">
                    <div className="sh-section-header">
                        <div className="sh-section-header-left">
                            <h3>Platform Announcements</h3>
                        </div>
                    </div>
                </div>

                {announcements.length > 0 ? (
                    <div className="sh-announcements-marquee-container">
                        <div className="sh-announcements-marquee-track animating">
                            {[...announcements, ...announcements].map((item, idx) => (
                                <div
                                    key={`${item._id || idx}-${idx}`}
                                    className="sh-announcement-marquee-item"
                                    onClick={() => openModal(item, 'announcement')}
                                >
                                    <div className={`sh-announcement-v3 ${item.badgeClass}`}>
                                        <div className="sh-v3-header">
                                            <div className="sh-v3-icon-box">
                                                <Icon icon={item.icon || "mdi:bullhorn-outline"} />
                                            </div>
                                            <span className={`sh-v3-category ${item.badgeClass}`}>{item.type}</span>
                                        </div>
                                        <div className="sh-v3-content">
                                            <div className="sh-v3-title-row">
                                                <h4>{item.title}</h4>
                                                <span className="sh-v3-date-top">{item.date}</span>
                                            </div>
                                            <p>{item.content}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="sh-container">
                        <div className="sh-empty-state sh-glass">
                            <div className="sh-empty-icon-box">
                                <Icon icon="mdi:bullhorn-variant-outline" />
                            </div>
                            <h3>No Announcements Yet</h3>
                            <p>We haven't posted any announcements for sponsors yet. Stay tuned for platform updates!</p>
                        </div>
                    </div>
                )}
            </section>

            {/* Upcoming Events */}
            <section id="events" className="sh-section sh-container reveal">
                <div className="sh-section-header">
                    <div className="sh-section-header-left">
                        <h3>Upcoming Events</h3>
                        <p className="sh-subheading">Discover trending events looking for sponsors.</p>
                    </div>
                    <NavLink to="/sponsor/sponsor-events" className="sh-link">View All</NavLink>
                </div>

                {isLoading ? (
                    <div className="sh-grid">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="sh-event-card-v2 sh-glass">
                                <div className="sh-v2-image-area skeleton" style={{ height: '180px' }}></div>
                                <div className="sh-v2-content">
                                    <div className="skeleton skeleton-text" style={{ width: '40%' }}></div>
                                    <div className="skeleton skeleton-text title" style={{ width: '80%' }}></div>
                                    <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
                                    <div className="sh-v2-details-row">
                                        <div className="skeleton" style={{ height: '30px', width: '100px' }}></div>
                                        <div className="skeleton" style={{ height: '30px', width: '100px' }}></div>
                                    </div>
                                    <div className="sh-v2-footer">
                                        <div className="skeleton skeleton-button"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : events.length > 0 ? (
                    <div className="sh-grid">
                        {events.map((evt, idx) => (
                            <div className={`sh-event-card-v2 sh-glass reveal stagger-${(idx % 4) + 1}`} key={evt._id || idx}>
                                <div className="sh-v2-image-area">
                                    <img
                                        src={evt.image ? `/uploads/${evt.image}` : '/assets/eventbg.jpg'}
                                        alt={evt.title}
                                        className="sh-v2-img"
                                        onError={(e) => { e.target.src = '/assets/eventbg.jpg' }}
                                    />
                                    <div className="sh-v2-date-badge">
                                        <Icon icon="mdi:calendar-month" />
                                        <span>{formatEventDate(evt.startDate)}</span>
                                    </div>
                                </div>
                                <div className="sh-v2-content">
                                    <span className={`sh-v2-tag ${evt.category === "Concert" ? "tag-red" :
                                        evt.category === "Sports" ? "tag-green" : "tag-blue"
                                        }`}>
                                        {evt.category || "Event"}
                                    </span>
                                    <h5 className="sh-v2-title">{evt.title}</h5>
                                    <p className="sh-event-location">
                                        <Icon icon="mdi:map-marker-outline" /> {`${evt.venue?.name || ""}, ${evt.venue?.city || ""}`.trim().replace(/^, |, $/, "") || "TBA"}
                                    </p>

                                    <div className="sh-v2-details-row">
                                        <div className="sh-v2-detail-item">
                                            <span className="sh-v2-label">Starts</span>
                                            <span className="sh-v2-value time-val">
                                                <Icon icon="mdi:clock-outline" />
                                                {evt.startTime || "TBA"}
                                            </span>
                                        </div>
                                        <div className="sh-v2-detail-item sh-text-right">
                                            <span className="sh-v2-label">Booths</span>
                                            <span className="sh-v2-value">
                                                {evt.booths?.filter(b => b.status === "available").length || 0} Avail.
                                            </span>
                                        </div>
                                    </div>

                                    <div className="sh-v2-footer">
                                        <NavLink to="/sponsor/sponsor-events" className="sh-v2-btn">
                                            View Details
                                        </NavLink>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="sh-empty-state sh-glass">
                        <div className="sh-empty-icon-box">
                            <Icon icon="mdi:calendar-blank-outline" />
                        </div>
                        <h3>No Events Found</h3>
                        <p>There are no upcoming events looking for sponsors at the moment. Please check back later!</p>
                    </div>
                )}
            </section>

            {/* Platform Policies */}
            <section className="sh-section sh-container reveal">
                <div className="sh-section-header">
                    <div className="sh-section-header-left">
                        <h3>Platform Policies</h3>
                        <p className="sh-subheading">Review our terms to ensure a smooth partnership.</p>
                    </div>
                </div>

                {policies.length > 0 ? (
                    <div className="sh-policy-list">
                        {policies.map((item, idx) => (
                            <div
                                key={item._id || idx}
                                className={`sh-policy-item sh-glass reveal stagger-${(idx % 4) + 1}`}
                                onClick={() => openModal(item, 'policy')}
                            >
                                <div className="sh-policy-icon-box">
                                    <Icon icon={item.icon || "mdi:file-document-outline"} />
                                </div>
                                <div className="sh-policy-text">
                                    <h4>{item.title}</h4>
                                    <p className="sh-text-ellipsis-2 sh-text-left">Updated Last: {item.date}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    !isLoading && (
                        <div className="sh-empty-state sh-glass">
                            <div className="sh-empty-icon-box">
                                <Icon icon="mdi:shield-account-outline" />
                            </div>
                            <h3>No Policies Available</h3>
                            <p>Platform policies for sponsors are currently being updated. We'll post them here soon.</p>
                        </div>
                    )
                )}
            </section>

            {/* Reusable Modal for Policies/Announcements */}
            <HomeViewFullContent
                isOpen={!!modalData}
                onClose={closeModal}
                item={modalData}
                type={modalType}
            />
        </div>
    );
}