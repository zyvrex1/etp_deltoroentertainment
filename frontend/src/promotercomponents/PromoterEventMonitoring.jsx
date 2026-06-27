import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { getImageUrl } from "../utils/imageUrl";
import usePagination from "../hooks/usePagination";
import PaginationBar from "../components/PaginationBar";
import "./PromoterEventMonitoring.css";

import PromoterSales from "./promotersales.jsx";
import PromoterAttendees from "./promoterattendees.jsx";
import PromoterSponsors from "./promotersponsors.jsx";

import { useEventsContext } from "../hooks/useEventsContext";
import { useAuthContext } from "../hooks/useAuthContext";
import eventsService from "../services/eventsService";

const PromoterEventMonitoring = () => {
    const { events, dispatch } = useEventsContext();
    const { user } = useAuthContext();
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("sales");

    // Derived visibility flags based on ticket category types
    const hasAttendeesTab = React.useMemo(() => {
        if (!selectedEvent) return false;
        const levels = selectedEvent.priceLevels || [];
        return levels.some(pl => {
            const t = (pl.type || "").toLowerCase();
            return t.includes("general fee") || t.includes("seat");
        });
    }, [selectedEvent]);

    const hasSponsorsTab = React.useMemo(() => {
        if (!selectedEvent) return false;
        const levels = selectedEvent.priceLevels || [];
        return levels.some(pl => (pl.type || "").toLowerCase().includes("booth"));
    }, [selectedEvent]);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortFilter, setSortFilter] = useState("Recently Added");
    const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
    const itemsPerPage = 8;
    const {
        page, totalPages, total,
        setTotal, goTo, next, prev,
        reset: resetPage,
    } = usePagination({ limit: itemsPerPage });
    const eventDropdownRef = useRef(null);

    useEffect(() => {
        const fetchEvents = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const data = await eventsService.getEvents(user.token);
                dispatch({ type: "SET_EVENTS", payload: data });
            } catch (error) {
                console.error("Error fetching events:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [user, dispatch]);

    const sortEvents = (eventsList) => {
        if (!eventsList) return [];
        const sorted = [...eventsList];
        switch (sortFilter) {
            case "A-Z": return sorted.sort((a, b) => a.title?.localeCompare(b.title));
            case "Z-A": return sorted.sort((a, b) => b.title?.localeCompare(a.title));
            case "Recently Added": default: return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (eventDropdownRef.current && !eventDropdownRef.current.contains(event.target)) {
                setIsEventDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredEvents = (events || []).filter((event) => {
        const isApproved = event.status?.toLowerCase() === "approved";
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
        return isApproved && matchesSearch;
    });

    const filteredAndSortedEvents = sortEvents(filteredEvents);

    useEffect(() => {
        setTotal({
            total: filteredAndSortedEvents.length,
            totalPages: Math.ceil(filteredAndSortedEvents.length / itemsPerPage) || 1,
        });
    }, [filteredAndSortedEvents.length, setTotal]);

    const startIndex = (page - 1) * itemsPerPage;
    const paginatedData = filteredAndSortedEvents.slice(startIndex, Math.min(startIndex + itemsPerPage, filteredAndSortedEvents.length));

    return (
        <div className="pmon-container">
            {!selectedEvent ? (
                <div className="pmon-event-selection-container">
                    <div className="pmon-header">
                        <div>
                            <h1>Manage Attendees</h1>
                            <p className="large-body-text pem-title-desc">
                                Track People and Sales
                            </p>
                        </div>
                    </div>
                    <div className="pmon-content-first-page">
                        <div className="pmon-toolbar">
                            <div className="pmon-toolbar-left">
                                <div className="pmon-search">
                                    <Icon icon="mdi:magnify" />
                                    <input
                                        type="text"
                                        placeholder="Search events..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="small-body-text pem-search-input"
                                    />
                                </div>
                            </div>

                            <div className="pmon-toolbar-right">
                                <div className="pmon-filter-dropdown" ref={eventDropdownRef}>
                                    <button
                                        className="pmon-filter-dropdown-btn small-body-text"
                                        onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
                                    >
                                        <span className="truncate-text">{sortFilter}</span>
                                        <Icon
                                            icon="mdi:chevron-down"
                                            className={`dropdown-icon ${isEventDropdownOpen ? "open" : ""}`}
                                        />
                                    </button>

                                    {isEventDropdownOpen && (
                                        <div className="pmon-filter-dropdown-menu">
                                            {["Recently Added", "A-Z", "Z-A"].map((option) => (
                                                <button
                                                    key={option}
                                                    className={`pmon-filter-dropdown-item small-body-text ${sortFilter === option ? "active" : ""
                                                        }`}
                                                    onClick={() => {
                                                        setSortFilter(option);
                                                        setIsEventDropdownOpen(false);
                                                    }}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="pmon-events-grid">
                                {[...Array(itemsPerPage)].map((_, i) => (
                                    <div key={i} className="pmon-event-card skeleton-card">
                                        <div className="pmon-card-image-wrap">
                                            <div className="skeleton" style={{ width: '100%', height: '100%' }} />
                                        </div>
                                        <div className="pmon-card-details">
                                            <div className="pmon-card-info" style={{ width: '100%' }}>
                                                <div className="skeleton skeleton-text title" />
                                            </div>
                                            <div className="pmon-card-info">
                                                <div className="skeleton skeleton-badge" />
                                            </div>
                                            <div className="pmon-card-info">
                                                <div className="skeleton skeleton-text short" />
                                            </div>
                                            <div className="pmon-card-info">
                                                <div className="skeleton skeleton-text short" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="pmon-events-grid">
                                {paginatedData.length > 0 ? (
                                    paginatedData.map((event) => {
                                        const eventDate = new Date(event.startDate).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric"
                                        });
                                        const eventLocation = event.venue
                                            ? `${event.venue.name}, ${event.venue.city}`
                                            : "TBA";
                                        const imageUrl = getImageUrl(event.image);

                                        return (
                                            <div
                                                key={event._id}
                                                className="pmon-event-card"
                                                onClick={() => { setSelectedEvent(event); setActiveTab("sales"); }}
                                            >
                                                <div className="pmon-card-image-wrap">
                                                    <img src={imageUrl} onError={(e) => { e.target.src = "/assets/eventbg.jpg" }} alt={event.title} />
                                                </div>
                                                <div className="pmon-card-details">
                                                    <div className="pmon-card-info">
                                                        <h3>{event.title}</h3>
                                                    </div>
                                                    <div className="pmon-card-info">
                                                        <span>{event.category || "No category"}</span>
                                                    </div>
                                                    <div className="pmon-card-info">
                                                        <Icon icon="mdi:calendar" />
                                                        <span className="event-dates">{eventDate}</span>
                                                    </div>
                                                    <div className="pmon-card-info">
                                                        <Icon icon="mdi:map-marker" />
                                                        <span>{eventLocation}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="pmon-empty-state">
                                        <Icon icon="mdi:magnify-close" width="48" />
                                        <h4>No events found</h4>
                                        <p className="small-body-text">
                                            No events match "<strong>{searchQuery}</strong>".
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        <PaginationBar
                            page={page}
                            totalPages={totalPages}
                            total={total}
                            onPrev={prev}
                            onNext={next}
                            onGoTo={goTo}
                        />
                    </div>
                </div>
            ) : (
                <div className="pmon-management-view">
                    <div className="pmon-header">
                        <div className="pmon-header-left">
                            <button className="pmon-back-btn" onClick={() => setSelectedEvent(null)}>
                                <Icon icon="mdi:arrow-left" width="24" />
                            </button>
                            <h1>{selectedEvent.title}</h1>
                        </div>
                    </div>

                    <div className="pmon-tabs">
                        <button className={`pmon-tab large-body-text ${activeTab === "sales" ? "active" : ""}`} onClick={() => setActiveTab("sales")}>
                            Sales Overview
                        </button>
                        {hasAttendeesTab && (
                            <button className={`pmon-tab large-body-text ${activeTab === "attendees" ? "active" : ""}`} onClick={() => setActiveTab("attendees")}>
                                Attendees
                            </button>
                        )}
                        {hasSponsorsTab && (
                            <button className={`pmon-tab large-body-text ${activeTab === "sponsors" ? "active" : ""}`} onClick={() => setActiveTab("sponsors")}>
                                Sponsors
                            </button>
                        )}
                    </div>

                    <div className="pmon-main-content">
                        {activeTab === "sales" && <PromoterSales selectedEvent={selectedEvent} />}
                        {activeTab === "attendees" && hasAttendeesTab && <PromoterAttendees selectedEvent={selectedEvent} />}
                        {activeTab === "sponsors" && hasSponsorsTab && <PromoterSponsors selectedEvent={selectedEvent} />}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromoterEventMonitoring;
