import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useAuthContext } from "../hooks/useAuthContext";
import "./CustomerStore.css";

const samplePurchasedEvents = [
        { id: 1, title: 'Texas Home Show', date: 'Aug 7', location: 'Bert Ogden Arena', price: '$45 - $150', category: 'Concert', image: '/uploads/monday-content-post-1-0429260249.jpg', time: '14:00 - 18:00', availability: 450, products: 8, status: 'Live' },
        { id: 2, title: 'Guey Funny Comedy Show', date: 'May 1', location: 'La Villa', price: '$30 - $80', category: 'Concert', image: '/uploads/guey-funny-comedy-show-march-20-0429260231.jpg', time: '10:00 - 15:00', availability: 120, products: 12, status: 'Completed' },
        { id: 3, title: 'Siggno Solido Secretto', date: 'Apr 30', location: 'Magnolia Halle', price: '$50 - $200', category: 'Theater', image: '/uploads/grupo-siggno,-solido-and-secretto-flyers-2026-mock-up-0429260228.jpg', time: '16:00 - 20:00', availability: 85, products: 15, status: 'Live' },
        { id: 4, title: 'Weslaco Texas OnionFest', date: 'Aug 1', location: 'Greet & Gather Downtown Weslaco', price: '$60 - $120', category: 'Concert', image: '/uploads/weslaco-texas-onion-fest-0429260226.jpg', time: '11:00 - 16:00', availability: 1500, products: 6, status: 'Upcoming' },
        { id: 5, title: 'Tejano Music Awards Fanfair', date: 'Jul 25', location: 'Henry B. Gonzales Convention Center', price: '$100 - $500', category: 'Sports', image: '/uploads/siggno-advertising-poster-0429260219.jpg', time: '10:00 - 18:00', availability: 300, products: 20, status: 'Live' },
        { id: 6, title: 'Your Health Matters', date: 'Aug 25', location: 'Creative Arts Studio (Texas)', price: '$25 - $50', category: 'Concert', image: '/uploads/yhm-event-page-cover-pharr-1777152601031.jpg', time: '10:00 - 18:00', availability: 200, products: 4, status: 'Upcoming' },
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
                      <span className="smaller-body-text stat-label">Stores</span>
                      <span className="large-body-text stat-value">{event.products}</span>
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
