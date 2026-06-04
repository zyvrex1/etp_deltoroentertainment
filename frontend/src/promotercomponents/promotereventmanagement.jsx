import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import "./promotereventmanagement.css";
import { useLocation } from "react-router-dom";

import PromoterAccessManagement from "./promoteraccessmanagement.jsx";
import PromoterBoothLayout from "./promoterboothlayout.jsx";
import PromoterScan from "./promoterscan.jsx";
import PromoterTicketLayout from "./promoterticketlayout.jsx";

import { useEventsContext } from "../hooks/useEventsContext";
import { useAuthContext } from "../hooks/useAuthContext";
import eventsService from "../services/eventsService";

const PromoterEventManagement = () => {
  const { events, dispatch } = useEventsContext();
  const { user } = useAuthContext();
  const location = useLocation();
  const { event: passedEvent, defaultTab } = location.state || {};
  const [selectedEvent, setSelectedEvent] = useState(passedEvent || null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(defaultTab || "booth-layout");
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
      case "A-Z":
        return sorted.sort((a, b) => a.title?.localeCompare(b.title));

      case "Z-A":
        return sorted.sort((a, b) => b.title?.localeCompare(a.title));

      case "Recently Added":
      default:
        return sorted.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
    }
  };



  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        eventDropdownRef.current &&
        !eventDropdownRef.current.contains(event.target)
      ) {
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
    <div className="pem-container">
      {!selectedEvent ? (
        <div className="pem-event-selection-container">
          <div className="pem-header">
            <div>
              <h1>Event Management</h1>
              <p className="large-body-text pem-title-desc">
                Select an event to manage venue layouts and ticket inventory.
              </p>
            </div>
          </div>

          <div className="pem-content-first-page">
            <div className="pem-toolbar">
              <div className="pem-toolbar-left">
                <div className="pem-search">
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

              <div className="pem-toolbar-right">
                <div className="pem-filter-dropdown" ref={eventDropdownRef}>
                  <button
                    className="pem-filter-dropdown-btn small-body-text"
                    onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
                  >
                    <span className="truncate-text">{sortFilter}</span>
                    <Icon
                      icon="mdi:chevron-down"
                      className={`dropdown-icon ${isEventDropdownOpen ? "open" : ""}`}
                    />
                  </button>

                  {isEventDropdownOpen && (
                    <div className="pem-filter-dropdown-menu">
                      {["Recently Added", "A-Z", "Z-A"].map((option) => (
                        <button
                          key={option}
                          className={`pem-filter-dropdown-item small-body-text ${sortFilter === option ? "active" : ""
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
              <div className="pem-events-grid">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="pem-event-card skeleton-card">
                    <div className="skeleton skeleton-rect" style={{ height: '200px', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }} />
                    <div className="pem-card-details">
                      <div className="skeleton skeleton-text title" style={{ width: '90%' }} />
                      <div className="skeleton skeleton-text" style={{ width: '40%', marginBottom: '16px' }} />
                      <div className="skeleton skeleton-text short" />
                      <div className="skeleton skeleton-text short" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="pem-events-grid">
                {paginatedData.length > 0 ? (
                  filteredAndSortedEvents.map((event) => {
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
                        className="pem-event-card"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="pem-card-image-wrap">
                          <img src={imageUrl} onError={(e) => { e.target.src = "/assets/eventbg.jpg" }} alt={event.title} />
                          <span className={`pem-status-badge status-${event.status?.toLowerCase()}`}>
                            {event.status}
                          </span>
                        </div>
                        <div className="pem-card-details">
                          <div className="pem-card-info">
                            <h3>{event.title}</h3>
                          </div>
                          <div className="pem-card-info">
                            <span>{event.category || "No category"}</span>
                          </div>
                          <div className="pem-card-info">
                            <Icon icon="mdi:calendar" />
                            <span className="event-dates">{eventDate}</span>
                          </div>
                          <div className="pem-card-info">
                            <Icon icon="mdi:map-marker" />
                            <span>{eventLocation}</span>
                          </div>

                          {/* Overall Sales Progress */}
                          {(() => {
                            const total = (event.totalTickets || 0) + (event.totalBooths || 0);
                            const sold = (event.ticketsSold || 0) + (event.boothsSold || 0);
                            const percent = total > 0 ? Math.round((sold / total) * 100) : 0;

                            if (total === 0) return null;

                            return (
                              <div className="pem-sales-progress">
                                <div className="pem-progress-labels">
                                  <span className="smaller-body-text">{sold} / {total} Sold</span>
                                  <span className="smaller-body-text font-bold">{percent}%</span>
                                </div>
                                <div className="pem-progress-bar-bg">
                                  <div
                                    className="pem-progress-bar-fill"
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="pem-empty-state">
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
        <div className="pem-management-view">
          <div className="pem-header">
            <div className="pem-header-left">
              <button
                className="pem-back-btn"
                onClick={() => setSelectedEvent(null)}
              >
                <Icon icon="mdi:arrow-left" width="24" />
              </button>
              <h1>{selectedEvent.title}</h1>
            </div>
          </div>

          <div className="pem-tabs">
            <button
              className={`pem-tab ${activeTab === "booth-layout" ? "active" : ""}`}
              onClick={() => setActiveTab("booth-layout")}
            >
              Seat/Booth map
            </button>
            <button
              className={`pem-tab ${activeTab === "ticket-layout" ? "active" : ""}`}
              onClick={() => setActiveTab("ticket-layout")}
            >
              Ticket Layout
            </button>
            <button
              className={`pem-tab ${activeTab === "ticket-setup" ? "active" : ""}`}
              onClick={() => setActiveTab("ticket-setup")}
            >
              Manage Access
            </button>
            <button
              className={`pem-tab ${activeTab === "scan" ? "active" : ""}`}
              onClick={() => setActiveTab("scan")}
            >
              live scanning
            </button>
          </div>

          <div className="pem-main-content">
            {activeTab === "ticket-setup" && <PromoterAccessManagement selectedEvent={selectedEvent} />}
            {activeTab === "booth-layout" && <PromoterBoothLayout selectedEvent={selectedEvent} />}
            {activeTab === "ticket-layout" && <PromoterTicketLayout selectedEvent={selectedEvent} />}
            {activeTab === "scan" && <PromoterScan selectedEvent={selectedEvent} />}
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoterEventManagement;
