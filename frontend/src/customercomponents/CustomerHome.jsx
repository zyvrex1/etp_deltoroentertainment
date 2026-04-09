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
                <div className={`customer-announcements-container ${announcements.length > 0 ? 'scrolling' : ''}`}>
                    {announcements.length > 0 ? (
                        announcements.map((item, idx) => (
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

            {/* Trending Now */}
            <section id="events" className="customer-trending">
                <div className="customer-section-header">
                    <div>
                        <h2>Upcoming Events</h2>
                        <p className="regular-body-text">Discover trending events happening soon.</p>
                    </div>
                    <NavLink to="/customer/browse-events" className="view-all-link regular-body-text">View All</NavLink>
                </div>
                <div className="customer-trending-grid">
                    {isLoading ? (
                        <div className="hp-empty-state full-width">
                            <Icon icon="mdi:loading" className="customer-spin" width="48" />
                            <p>Finding the hottest events for you...</p>
                        </div>
                    ) : events.length > 0 ? (
                        events.map((evt, idx) => (
                            <div className="customer-event-card" key={evt._id || idx}>
                                <div 
                                    className="customer-event-image" 
                                    style={{ 
                                        backgroundImage: `url(${evt.image ? (evt.image.startsWith('http') ? evt.image : `${BACKEND_URL}/uploads/${evt.image}`) : '/assets/eventbg.jpg'})` 
                                    }}
                                >
                                    <span className="button-label event-date-badge">
                                        {formatEventDate(evt.startDate)}
                                    </span>
                                </div>
                                <div className="customer-event-details">
                                    <span className={`button-label event-tag ${
                                        evt.category === "Concert" ? "tag-red" : 
                                        evt.category === "Sports" ? "tag-green" : "tag-blue"
                                    }`}>
                                        {evt.category || "Event"}
                                    </span>
                                    <h4>{evt.title}</h4>
                                    <p className="event-location">📍 
                                        {`${evt.venue?.name || ""}, ${evt.venue?.city || ""}`.trim().replace(/^, |, $/, "") || "TBA"}
                                    </p>
                                    
                                    <div className="event-info-row">
                                        <div className="event-time">
                                            <Icon icon="mdi:clock-outline" />
                                            <span className="small-body-text">{evt.startTime || "TBA"} - {evt.endTime || "TBA"}</span>
                                        </div>
                                        <div className="customer-event-price">
                                            <p className="smaller-body-text">Price Range</p>
                                            <h6 className="price-range">{getPriceRange(evt.priceLevels)}</h6>
                                        </div>
                                    </div>

                                    <button className="primary-button full-width-btn" onClick={() => setEventDetailsModal({
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
                        ))
                    ) : (
                        <div className="hp-empty-state full-width">
                            <Icon icon="mdi:calendar-search" width="48" className="hp-empty-icon" />
                            <p>No upcoming events found. Check back soon!</p>
                        </div>
                    )}
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
                    {policies.length > 0 ? (
                        policies.map((item, idx) => (
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

            {/* Event Details Modal */}
            <CustomerViewEventFullDetails
                show={!!eventDetailsModal}
                onClose={() => setEventDetailsModal(null)}
                eventData={eventDetailsModal}
            />
        </div>
    );
}
