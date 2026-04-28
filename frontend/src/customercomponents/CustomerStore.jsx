import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useAuthContext } from "../hooks/useAuthContext";
import "./CustomerStore.css";

const samplePurchasedEvents = [
  { id: 1, title: "TechInnovate Summit 2024", date: "Oct 15-17, 2024", location: "San Francisco, CA", booths: 8, status: "Live", image: "/assets/eventbg.jpg" },
  { id: 2, title: "Global Healthcare Expo", date: "Nov 05-08, 2024", location: "Chicago, IL", booths: 12, status: "Completed", image: "/assets/eventbg.jpg" },
  { id: 3, title: "Future of AI 2024", date: "Dec 10-12, 2024", location: "New York, NY", booths: 15, status: "Live", image: "/assets/eventbg.jpg" },
  { id: 4, title: "Eco Sustainability Fair", date: "Jan 20-22, 2025", location: "Seattle, WA", booths: 6, status: "Upcoming", image: "/assets/eventbg.jpg" },
  { id: 5, title: "Fintech Revolution", date: "Feb 15-17, 2025", location: "London, UK", booths: 20, status: "Live", image: "/assets/eventbg.jpg" },
  { id: 6, title: "Cyber Security Con", date: "Mar 05-07, 2025", location: "Austin, TX", booths: 4, status: "Upcoming", image: "/assets/eventbg.jpg" },
  { id: 7, title: "Gaming World Expo", date: "Apr 10-12, 2025", location: "Tokyo, JP", booths: 30, status: "Live", image: "/assets/eventbg.jpg" },
  { id: 8, title: "Retail Innovation 2025", date: "May 20-22, 2025", location: "Paris, FR", booths: 10, status: "Upcoming", image: "/assets/eventbg.jpg" },
  { id: 9, title: "Auto Show Next", date: "Jun 15-17, 2025", location: "Detroit, MI", booths: 18, status: "Live", image: "/assets/eventbg.jpg" },
];

const CustomerStore = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [eventData, setEventData] = useState(samplePurchasedEvents);

  const itemsPerPage = 8;
  const dropdownRef = useRef(null);

  const getStatusClass = (status) => {
    switch (status) {
      case "Live": return "live";
      case "Upcoming": return "upcoming";
      case "Completed": return "completed";
      default: return "";
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredEvents = eventData.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredEvents.slice(startIndex, Math.min(startIndex + itemsPerPage, filteredEvents.length));

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="customer-store-container">
      <div className="customer-store-header-section">
        <div className="cs-header-title">
          <Icon icon="mdi:store-outline" className="cs-title-icon" />
          <h1>Event Stores</h1>
        </div>
        <p className="regular-body-text cs-title-desc">
          Browse stores and booths from events you've attended. Explore sponsor products and merchandise.
        </p>
      </div>

      <div className="customer-store-content-card">
        <div className="cs-toolbar">
          <div className="cs-toolbar-left">
            <div className="cs-search">
              <Icon icon="mdi:magnify" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="small-body-text cs-search-input"
              />
            </div>
          </div>

          <div className="cs-toolbar-right">
            <div className="cs-filter-dropdown" ref={dropdownRef}>
              <button
                className="cs-filter-dropdown-btn small-body-text"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className="truncate-text">{statusFilter}</span>
                <Icon
                  icon="mdi:chevron-down"
                  className={`dropdown-icon ${isDropdownOpen ? "open" : ""}`}
                />
              </button>

              {isDropdownOpen && (
                <div className="cs-filter-dropdown-menu">
                  {["All", "Live", "Upcoming", "Completed"].map((option) => (
                    <button
                      key={option}
                      className={`cs-filter-dropdown-item small-body-text ${statusFilter === option ? "active" : ""}`}
                      onClick={() => {
                        setStatusFilter(option);
                        setIsDropdownOpen(false);
                        setCurrentPage(1);
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

        <div className="cs-events-grid">
          {paginatedData.length > 0 ? (
            paginatedData.map((event) => (
              <div key={event.id} className="cs-event-card">
                <div className="cs-card-image-wrap">
                  <img src={event.image} alt={event.title} />
                  <div className={`cs-status-badge button-label ${getStatusClass(event.status)}`}>
                    {event.status}
                  </div>
                </div>
                <div className="cs-card-details">
                  <h5 className="cs-event-title">{event.title}</h5>
                  <div className="cs-card-info small-body-text">
                    <Icon icon="mdi:calendar-blank-outline" />
                    <span>{event.date}</span>
                  </div>
                  <div className="cs-card-info small-body-text">
                    <Icon icon="mdi:map-marker-outline" />
                    <span>{event.location}</span>
                  </div>

                  <div className="cs-stats-row">
                    <div className="cs-stat-item">
                      <span className="smaller-body-text stat-label">Booths</span>
                      <span className="large-body-text stat-value">{event.booths}</span>
                    </div>
                    <div className="cs-stat-item">
                      <span className="smaller-body-text stat-label">Status</span>
                      <span className={`large-body-text stat-value cs-status-text ${getStatusClass(event.status)}`}>{event.status}</span>
                    </div>
                  </div>

                  <button
                    className="primary-button cs-browse-btn"
                    onClick={() => navigate("/customer/store/booths", {
                      state: { eventId: event._id || event.id, eventName: event.title }
                    })}
                  >
                    Browse Stores <Icon icon="mdi:arrow-right" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="cs-empty-state">
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
  );
};

export default CustomerStore;
