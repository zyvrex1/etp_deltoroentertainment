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
            const eventObj = res.event || {};
            const storeSettings = res.storeSettings || {};
            const sponsorUser = res.user || {};

            let status = "Upcoming";
            const startDate = eventObj.startDate ? new Date(eventObj.startDate) : new Date();
            const endDate = (eventObj.endDate || eventObj.startDate) ? new Date(eventObj.endDate || eventObj.startDate) : new Date();

            // Incorporate startTime and endTime if available (format: HH:mm)
            if (eventObj.startTime) {
              const [sHours, sMinutes] = eventObj.startTime.split(':').map(Number);
              startDate.setHours(sHours, sMinutes, 0, 0);
            }

            if (eventObj.endTime) {
              const [eHours, eMinutes] = eventObj.endTime.split(':').map(Number);
              endDate.setHours(eHours, eMinutes, 0, 0);
            }

            // Use adjusted end time for comparison
            if (now > endDate) {
              status = "Completed";
            } else if (now >= startDate && now <= endDate) {
              status = "Live";
            }

            const count = merchData.filter(m => (m.eventId?._id === eventObj._id || m.eventId === eventObj._id) && m.boothCode === res.boothCode).length;

            const formattedDate = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            // Store Information fallback logic
            const companyName = storeSettings.companyName || sponsorUser.companyName || `${sponsorUser.firstName || ''} ${sponsorUser.lastName || ''}`.trim() || "My Store";
            const industry = storeSettings.industry || sponsorUser.industry || "Sponsor";

            // Logo/Image logic
            let imageUrl = storeSettings.logo ? storeSettings.logo : (eventObj.image || '/assets/eventbg.jpg');
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/assets/') && !imageUrl.startsWith('blob:') && !imageUrl.startsWith('data:')) {
              imageUrl = `${BACKEND_URL}/uploads/${imageUrl.replace('/uploads/', '')}`;
            }

            return {
              id: res._id,
              _id: eventObj._id,
              boothCodeRaw: res.boothCode,
              boothNumber: `Booth ${res.boothCode || ''}`,
              title: companyName, // Use store name as primary title
              eventTitle: eventObj.title || 'Unknown Event',
              industry: industry,
              date: formattedDate,
              location: eventObj.venue?.name || 'TBA',
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
      event.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
          Manage your booth inventory, track orders, and view sales analytics for your active stores.
        </p>
      </div>

      <div className="sponsor-store-content-card">
        <div className="store-toolbar">
          <div className="store-toolbar-left">
            <div className="store-search">
              <Icon icon="mdi:magnify" />
              <input
                type="text"
                placeholder="Search stores..."
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
                  <div className="skeleton skeleton-text title" style={{ width: '80%' }}></div>
                  <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
                  <div className="skeleton skeleton-text" style={{ width: '70%' }}></div>
                  <div className="skeleton skeleton-text" style={{ width: '50%' }}></div>
                  <div className="store-stats-row">
                    <div className="skeleton skeleton-stat-box"></div>
                    <div className="skeleton skeleton-stat-box"></div>
                  </div>
                  <div className="skeleton skeleton-button"></div>
                </div>
              </div>
            ))
          ) : paginatedData.length > 0 ? (
            paginatedData.map((store) => (
              <div key={store.id} className="store-event-card">
                <div className="store-card-image-wrap">
                  <img src={store.image} alt={store.title}
                    onError={(e) => { e.target.src = "/assets/eventbg.jpg" }}
                  />
                  <div className={`store-booth-badge button-label ${getStatusClass(store.status)}`}>
                    {store.status}
                  </div>
                </div>
                <div className="store-card-details">
                  <h5 className="store-name-title">{store.title}</h5>
                  <div className="store-card-info small-body-text" style={{ color: 'var(--color-primary)', fontWeight: '600', marginBottom: '8px' }}>
                    <Icon icon="mdi:domain" />
                    <span>{store.industry}</span>
                  </div>
                  <div className="store-card-info small-body-text">
                    <Icon icon="mdi:calendar-blank-outline" />
                    <span>{store.eventTitle} • {store.date}</span>
                  </div>
                  <div className="store-card-info small-body-text">
                    <Icon icon="mdi:map-marker-outline" />
                    <span>{store.location}</span>
                  </div>
                  <div className="store-card-info small-body-text">
                    <Icon icon="mdi:storefront-outline" />
                    <span>{store.boothNumber}</span>
                  </div>

                  <div className="store-stats-row">
                    <div className="store-stat-item">
                      <span className="smaller-body-text stat-label">Products</span>
                      <span className="large-body-text stat-value">{store.products}</span>
                    </div>
                    <div className="store-stat-item">
                      <span className="smaller-body-text stat-label">Active Orders</span>
                      <span className="large-body-text stat-value">{store.activeOrders}</span>
                    </div>
                  </div>

                  <button
                    className={`primary-button store-manage-btn ${store.status === "Completed" ? "see-reports-btn" : ""}`}
                    onClick={() => {
                      navigate(`/sponsor/store/dashboard/${store.id}`, {
                        state: {
                          eventId: store._id || store.id,
                          eventName: store.eventTitle,
                          boothCode: store.boothCodeRaw,
                          isCompleted: store.status === "Completed"
                        }
                      });
                    }}
                  >
                    {store.status === "Completed" ? "See Reports" : "Manage Store"}
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
              className="pagination-btn small-body-text"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="pagination-info small-body-text">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="pagination-btn small-body-text"
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
