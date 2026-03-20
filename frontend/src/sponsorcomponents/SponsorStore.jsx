import React, { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { Icon } from "@iconify/react";
import "./SponsorStore.css";

const sampleStoreEvents = [
  { id: 1, boothNumber: "Booth #102", title: "TechInnovate Summit 2024", date: "Oct 15-17, 2024", location: "San Francisco, CA", products: 24, activeOrders: 12, status: "Live", image: "/assets/eventbg.jpg" },
  { id: 2, boothNumber: "Booth #405", title: "Global Healthcare Expo", date: "Nov 05-08, 2024", location: "Chicago, IL", products: 15, activeOrders: 0, status: "Completed", image: "/assets/eventbg.jpg" },
  { id: 3, boothNumber: "Booth #10", title: "Future of AI 2024", date: "Dec 10-12, 2024", location: "New York, NY", products: 30, activeOrders: 5, status: "Live", image: "/assets/eventbg.jpg" },
  { id: 4, boothNumber: "Booth #55", title: "Eco Sustainability Fair", date: "Jan 20-22, 2025", location: "Seattle, WA", products: 10, activeOrders: 2, status: "Upcoming", image: "/assets/eventbg.jpg" },
  { id: 5, boothNumber: "Booth #22", title: "Fintech Revolution", date: "Feb 15-17, 2025", location: "London, UK", products: 45, activeOrders: 20, status: "Live", image: "/assets/eventbg.jpg" },
  { id: 6, boothNumber: "Booth #108", title: "Cyber Security Con", date: "Mar 05-07, 2025", location: "Austin, TX", products: 5, activeOrders: 1, status: "Upcoming", image: "/assets/eventbg.jpg" },
  { id: 7, boothNumber: "Booth #303", title: "Gaming World Expo", date: "Apr 10-12, 2025", location: "Tokyo, JP", products: 60, activeOrders: 100, status: "Live", image: "/assets/eventbg.jpg" },
  { id: 8, boothNumber: "Booth #77", title: "Retail Innovation 2025", date: "May 20-22, 2025", location: "Paris, FR", products: 22, activeOrders: 8, status: "Upcoming", image: "/assets/eventbg.jpg" },
  { id: 9, boothNumber: "Booth #99", title: "Auto Show Next", date: "Jun 15-17, 2025", location: "Detroit, MI", products: 18, activeOrders: 0, status: "Live", image: "/assets/eventbg.jpg" },
];

const SponsorStore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const dropdownRef = useRef(null);

  const getStatusClass = (status) => {
    switch (status) {
      case "Live":
        return "live";
      case "Upcoming":
        return "upcoming";
      case "Completed":
        return "completed";
      default:
        return "";
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

  const filteredEvents = sampleStoreEvents.filter((event) => {
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
    <div className="sponsor-store-container">
      <div className="sponsor-store-header-section">
        <div className="store-header-title">
          <Icon icon="mdi:store-outline" className="store-title-icon" />
          <h1>My Stores</h1>
        </div>
        <p className="regular-body-text store-title-desc">
          Select an event to manage your booth's inventory, track orders, and view sales analytics.
        </p>
      </div>

      <div className="sponsor-store-content-card">
        <div className="store-toolbar">
          <div className="store-toolbar-left">
            <div className="store-search">
              <Icon icon="mdi:magnify" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                className="small-body-text store-search-input"
              />
            </div>
          </div>

          <div className="store-toolbar-right">
            <div className="store-filter-dropdown" ref={dropdownRef}>
              <button
                className="store-filter-dropdown-btn small-body-text"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className="truncate-text">{statusFilter}</span>
                <Icon
                  icon="mdi:chevron-down"
                  className={`dropdown-icon ${isDropdownOpen ? "open" : ""}`}
                />
              </button>

              {isDropdownOpen && (
                <div className="store-filter-dropdown-menu">
                  {["All", "Live", "Upcoming", "Completed"].map((option) => (
                    <button
                      key={option}
                      className={`store-filter-dropdown-item small-body-text ${statusFilter === option ? "active" : ""}`}
                      onClick={() => {
                        setStatusFilter(option);
                        setIsDropdownOpen(false);
                        setCurrentPage(1); // Reset to first page on filter change
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

        <div className="store-events-grid">
          {paginatedData.length > 0 ? (
            paginatedData.map((event) => (
              <div key={event.id} className="store-event-card">
                <div className="store-card-image-wrap">
                  <img src={event.image} alt={event.title} />
                  <div className={`store-booth-badge button-label ${getStatusClass(event.status)}`}>
                    {event.status}
                  </div>
                </div>
                <div className="store-card-details">
                  <h5 className="store-event-title">{event.title}</h5>
                  <div className="store-card-info small-body-text">
                    <Icon icon="mdi:calendar-blank-outline" />
                    <span>{event.date}</span>
                  </div>
                  <div className="store-card-info small-body-text">
                    <Icon icon="mdi:map-marker-outline" />
                    <span>{event.location}</span>
                  </div>
                  <div className="store-card-info small-body-text">
                    {event.boothNumber}
                  </div>

                  <div className="store-stats-row">
                    <div className="store-stat-item">
                      <span className="smaller-body-text stat-label">Products</span>
                      <span className="large-body-text stat-value">{event.products}</span>
                    </div>
                    <div className="store-stat-item">
                      <span className="smaller-body-text stat-label">Active Orders</span>
                      <span className="large-body-text stat-value">{event.activeOrders}</span>
                    </div>
                  </div>

                  <button className="primary-button store-manage-btn">
                    Manage Store <Icon icon="mdi:arrow-right" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="store-empty-state">
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

export default SponsorStore;
