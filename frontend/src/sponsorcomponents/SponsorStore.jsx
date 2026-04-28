import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import merchandiseService from "../services/merchandiseService";
import { useAuthContext } from "../hooks/useAuthContext";
import "./SponsorStore.css";

const sampleStoreEvents = [
  { id: 1, boothNumber: 'Booth #102', title: 'Texas Home Show', date: 'Aug 7', location: 'Bert Ogden Arena', products: 24, activeOrders: 12, status: 'Live', image: '/uploads/monday-content-post-1-0429260249.jpg' },
  { id: 2, boothNumber: 'Booth #405', title: 'Guey Funny Comedy Show', date: 'May 1', location: 'La Villa', products: 15, activeOrders: 0, status: 'Completed', image: '/uploads/guey-funny-comedy-show-march-20-0429260231.jpg' },
  { id: 3, boothNumber: 'Booth #10', title: 'Siggno Solido Secretto', date: 'Apr 30', location: 'Magnolia Halle', products: 30, activeOrders: 5, status: 'Live', image: '/uploads/grupo-siggno,-solido-and-secretto-flyers-2026-mock-up-0429260228.jpg' },
  { id: 4, boothNumber: 'Booth #55', title: 'Weslaco Texas OnionFest', date: 'Aug 1', location: 'Greet & Gather Downtown Weslaco', products: 10, activeOrders: 2, status: 'Upcoming', image: '/uploads/weslaco-texas-onion-fest-0429260226.jpg' },
  { id: 5, boothNumber: 'Booth #22', title: 'Tejano Music Awards Fanfair', date: 'Jul 25', location: 'Henry B. Gonzales Convention Center', products: 45, activeOrders: 20, status: 'Live', image: '/uploads/siggno-advertising-poster-0429260219.jpg' },
  { id: 6, boothNumber: 'Booth #108', title: 'Your Health Matters', date: 'Aug 25', location: 'Creative Arts Studio (Texas)', products: 5, activeOrders: 1, status: 'Upcoming', image: '/uploads/yhm-event-page-cover-pharr-1777152601031.jpg' },
];

const SponsorStore = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [merchandise, setMerchandise] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState(sampleStoreEvents);
  
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

  useEffect(() => {
    const fetchAllData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        // Fetch ALL merchandise for this sponsor to count them per store
        const merchData = await merchandiseService.getMerchandises(user.token);
        setMerchandise(merchData);
        
        // Update product counts in our event listing
        const updatedEvents = sampleStoreEvents.map(event => {
          // In a real app, match by event._id. Using id for mock comparison here.
          const count = merchData.filter(m => m.eventId?._id === event._id || m.eventId === event._id).length;
          return { ...event, products: count };
        });
        setEventData(updatedEvents);

      } catch (error) {
        console.error("Error fetching store data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [user]);

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

                  <button 
                    className="primary-button store-manage-btn"
                    disabled={event.status === "Completed"}
                    onClick={() => navigate("/sponsor/store/dashboard", { 
                      state: { eventId: event._id || event.id, eventName: event.title } 
                    })}
                  >
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
