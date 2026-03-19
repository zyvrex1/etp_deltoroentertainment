import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import "./promotereventmanagement.css";
import { useLocation } from "react-router-dom";

import PromoterTicketSetup from "./promoterticketsetup.jsx";
import PromoterBoothLayout from "./promoterboothlayout.jsx";
import PromoterScan from "./promoterscan.jsx";

const sampleEvents = [
  { id: 1, title: "TechStart Summit 2026", date: "Jun 16, 2026", location: "Starlight Arena, Los Angeles, CA", category: "Technology" },
  { id: 2, title: "Future of Work 2025", date: "Oct 15, 2025", location: "O2 Arena, London", category: "Business" },
  { id: 3, title: "Future of Work 2025", date: "Oct 15, 2025", location: "O2 Arena, London", category: "Business" },
  { id: 4, title: "Future of Work 2025", date: "Oct 15, 2025", location: "O2 Arena, London", category: "Business" },
  { id: 5, title: "Future of Work 2025", date: "Oct 15, 2025", location: "O2 Arena, London", category: "Business" },
  { id: 6, title: "Future of Work 2025", date: "Oct 15, 2025", location: "O2 Arena, London", category: "Business" },
  { id: 7, title: "Future of Work 2025", date: "Oct 15, 2025", location: "O2 Arena, London", category: "Business" },
  { id: 8, title: "Future of Work 2025", date: "Oct 15, 2025", location: "O2 Arena, London", category: "Business" },
];

const PromoterEventManagement = () => {
  const location = useLocation();
  const { event: passedEvent, defaultTab } = location.state || {};
  const [selectedEvent, setSelectedEvent] = useState(passedEvent || null);
  const [activeTab, setActiveTab] = useState(defaultTab || "ticket-setup");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortFilter, setSortFilter] = useState("Recently Added");
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const eventDropdownRef = useRef(null);


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
  const filteredEvents = sampleEvents.filter((event) =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

            <div className="pem-events-grid">
              {paginatedData.length > 0 ? (
                paginatedData.map((event) => (
                  <div
                    key={event.id}
                    className="pem-event-card"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="pem-card-image-wrap">
                      <img src="/assets/eventbg.jpg" alt={event.title} />
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
                        <span className="event-dates">{event.date}</span>
                      </div>
                      <div className="pem-card-info">
                        <Icon icon="mdi:map-marker" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </div>
                ))
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
              className={`pem-tab ${activeTab === "ticket-setup" ? "active" : ""}`}
              onClick={() => setActiveTab("ticket-setup")}
            >
              Ticket Setup
            </button>
            <button
              className={`pem-tab ${activeTab === "booth-layout" ? "active" : ""}`}
              onClick={() => setActiveTab("booth-layout")}
            >
              Booth Layout
            </button>
            <button
              className={`pem-tab ${activeTab === "scan" ? "active" : ""}`}
              onClick={() => setActiveTab("scan")}
            >
              Check in/ Scan
            </button>
          </div>

          <div className="pem-main-content">
            {activeTab === "ticket-setup" && <PromoterTicketSetup />}
            {activeTab === "booth-layout" && <PromoterBoothLayout />}
            {activeTab === "scan" && <PromoterScan />}
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoterEventManagement;
