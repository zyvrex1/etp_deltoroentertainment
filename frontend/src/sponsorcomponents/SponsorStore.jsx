import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import merchandiseService from "../services/merchandiseService";
import reservationService from "../services/reservationService";
import { useAuthContext } from "../hooks/useAuthContext";
import "./SponsorStore.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const SponsorStore = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [merchandise, setMerchandise] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState([]);
  
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
        
        const [merchData, reservationsData] = await Promise.all([
          merchandiseService.getMerchandises(user.token),
          reservationService.getMyReservations(user.token)
        ]);
        
        setMerchandise(merchData);
        
        const now = new Date();

        const formattedEvents = reservationsData
          .filter(res => res.event && res.event.title) // Ensure event exists and has a title
          .map(res => {
            const event = res.event || {};
            
            let status = "Upcoming";
            const startDate = event.startDate ? new Date(event.startDate) : new Date();
            const endDate = (event.endDate || event.startDate) ? new Date(event.endDate || event.startDate) : new Date();
            
            // Incorporate startTime and endTime if available (format: HH:mm)
            if (event.startTime) {
              const [sHours, sMinutes] = event.startTime.split(':').map(Number);
              startDate.setHours(sHours, sMinutes, 0, 0);
            }
            
            if (event.endTime) {
              const [eHours, eMinutes] = event.endTime.split(':').map(Number);
              endDate.setHours(eHours, eMinutes, 0, 0);
            }

            // Use adjusted end time for comparison
            if (now > endDate) {
              status = "Completed";
            } else if (now >= startDate && now <= endDate) {
              status = "Live";
            }

            const count = merchData.filter(m => (m.eventId?._id === event._id || m.eventId === event._id) && m.boothCode === res.boothCode).length;
            
            const formattedDate = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            let imageUrl = event.image || '/assets/eventbg.jpg';
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/assets/')) {
              imageUrl = `${BACKEND_URL}/uploads/${imageUrl.replace('/uploads/', '')}`;
            }

            return {
              id: res._id,
              _id: event._id,
              boothCodeRaw: res.boothCode,
              boothNumber: `Booth ${res.boothCode || ''}`,
              title: event.title || 'Unknown Event',
              date: formattedDate,
              location: event.venue?.name || 'TBA',
              products: count,
              activeOrders: 0,
              status: status,
              image: imageUrl
            };
          });
        
        setEventData(formattedEvents);

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
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="store-event-card">
                <div className="skeleton skeleton-image"></div>
                <div className="store-card-details">
                  <div className="skeleton skeleton-text title" style={{width: '80%'}}></div>
                  <div className="skeleton skeleton-text" style={{width: '60%'}}></div>
                  <div className="skeleton skeleton-text" style={{width: '70%'}}></div>
                  <div className="skeleton skeleton-text" style={{width: '50%'}}></div>
                  <div className="store-stats-row">
                    <div className="skeleton skeleton-stat-box"></div>
                    <div className="skeleton skeleton-stat-box"></div>
                  </div>
                  <div className="skeleton skeleton-button"></div>
                </div>
              </div>
            ))
          ) : paginatedData.length > 0 ? (
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
                    className={`primary-button store-manage-btn ${event.status === "Completed" ? "see-reports-btn" : ""}`}
                    onClick={() => {
                      navigate("/sponsor/store/dashboard", { 
                        state: { 
                          eventId: event._id || event.id, 
                          eventName: event.title, 
                          boothCode: event.boothCodeRaw,
                          isCompleted: event.status === "Completed"
                        } 
                      });
                    }}
                  >
                    {event.status === "Completed" ? "See Reports" : "Manage Store"} 
                    <Icon icon="mdi:arrow-right" />
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
