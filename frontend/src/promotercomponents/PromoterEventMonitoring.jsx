import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import "./PromoterEventMonitoring.css";

import PromoterSales from "./promotersales.jsx";
import PromoterAttendees from "./promoterattendees.jsx";
import PromoterSponsors from "./promotersponsors.jsx";

import { useEventsContext } from "../admincomponents/hooks/useEventsContext";
import { useAuthContext } from "../admincomponents/hooks/useAuthContext";
import eventsService from "../services/eventsService";

const PromoterEventMonitoring = () => {
    const { events, dispatch } = useEventsContext();
    const { user } = useAuthContext();
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("sales");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortFilter, setSortFilter] = useState("Recently Added");
    const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
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

    const totalPages = Math.ceil(filteredAndSortedEvents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredAndSortedEvents.slice(startIndex, Math.min(startIndex + itemsPerPage, filteredAndSortedEvents.length));

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="pmon-container">
            {!selectedEvent ? (
                    <div className="pmon-event-selection-container">
                        <div className="pmon-header">
                            <div>
                                <h1>Event Monitoring</h1>
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
                                <div className="pmon-loading-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px' }}>
                                    <Icon icon="line-md:loading-twotone-loop" width="48" style={{ color: "var(--color-red-primary)" }} />
                                    <p className="large-body-text">Loading your events...</p>
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
                                            const imageUrl = event.image 
                                                ? `${import.meta.env.VITE_BACKEND_URL || ""}/uploads/${event.image}` 
                                                : "/assets/eventbg.jpg";

                                            return (
                                                <div
                                                    key={event._id}
                                                    className="pmon-event-card"
                                                    onClick={() => setSelectedEvent(event)}
                                                >
                                                    <div className="pmon-card-image-wrap">
                                                        <img src={imageUrl} alt={event.title} />
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

                            {totalPages > 1 && (
                                <div className="pagination">
                                    <button
                                        className="pagination-btn"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </button>
                                    <span className="pagination-info">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        className="pagination-btn"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
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
                        <button className={`pmon-tab large-body-text ${activeTab === "attendees" ? "active" : ""}`} onClick={() => setActiveTab("attendees")}>
                            Attendees
                        </button>
                        <button className={`pmon-tab large-body-text ${activeTab === "sponsors" ? "active" : ""}`} onClick={() => setActiveTab("sponsors")}>
                            Sponsors & Exhibitors
                        </button>
                    </div>

                    <div className="pmon-main-content">
                        {activeTab === "sales" && <PromoterSales />}
                        {activeTab === "attendees" && <PromoterAttendees />}
                        {activeTab === "sponsors" && <PromoterSponsors />}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromoterEventMonitoring;
