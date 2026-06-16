import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useAuthContext } from "../hooks/useAuthContext";
import { useCustomerCart } from "../context/CustomerCartContext";
import eventsService from "../services/eventsService";
import usePagination from "../hooks/usePagination";
import PaginationBar from "../components/PaginationBar";
import "./CustomerStore.css";



const CustomerStore = () => {
  const { user } = useAuthContext();
  const { purchaseHistory } = useCustomerCart();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [eventData, setEventData] = useState([]);
  const [loading, setLoading] = useState(true);

  const itemsPerPage = 8;
  const {
    page, totalPages, total,
    setTotal, goTo, next, prev,
    reset: resetPage,
  } = usePagination({ limit: itemsPerPage });
  const dropdownRef = useRef(null);

  const getStatusClass = (status) => {
    switch (status) {
      case "Live": return "live";
      case "Upcoming": return "upcoming";
      case "Completed": return "completed";
      default: return "";
    }
  };

  // Fetch and filter events
  // Fetch and filter events
  useEffect(() => {
    const fetchAndFilterEvents = async () => {
      if (!user?.token) return;

      try {
        setLoading(true);
        const allEvents = await eventsService.getEvents(user.token);

        // Get unique event IDs from customer's ticket purchases
        const validStatuses = ['confirmed', 'upcoming', 'completed'];
        const bookedEventIds = new Set(
          purchaseHistory
            .filter(item => validStatuses.includes(item.status?.toLowerCase()))
            .map(item => (item.event?._id || item.event?.id || item.event)?.toString())
            .filter(Boolean)
        );

        const bookedEvents = allEvents.filter(event =>
          bookedEventIds.has(event._id?.toString()) ||
          bookedEventIds.has(event.id?.toString())
        );

        // Fetch confirmed booth count per event from the dedicated endpoint
        const boothCountsPerEvent = await Promise.all(
          bookedEvents.map(async (event) => {
            try {
              const res = await fetch(`/api/reservations/event/${event._id}/booths`, {
                headers: { Authorization: `Bearer ${user.token}` }
              });
              const booths = await res.json();
              return { eventId: event._id, count: Array.isArray(booths) ? booths.length : 0 };
            } catch {
              return { eventId: event._id, count: 0 };
            }
          })
        );

        const boothCountMap = boothCountsPerEvent.reduce((acc, { eventId, count }) => {
          acc[eventId] = count;
          return acc;
        }, {});

        const mappedEvents = bookedEvents.map(event => {
          let status = "Live";
          if (event.status === "completed") {
            status = "Completed";
          } else if (event.status === "approved") {
            const now = new Date();
            const startDate = new Date(event.startDate);
            if (startDate > now) status = "Upcoming";
          }

          let priceRange = "N/A";
          if (event.priceLevels && event.priceLevels.length > 0) {
            const prices = event.priceLevels.map(pl => pl.facePrice);
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            priceRange = minPrice === maxPrice ? `$${minPrice}` : `$${minPrice} - $${maxPrice}`;
          }

          return {
            id: event._id,
            title: event.title,
            date: new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            location: event.venue?.name || "Unknown Location",
            price: priceRange,
            category: event.category,
            image: event.image ? `/uploads/${event.image}` : '/assets/eventbg.jpg',
            time: `${event.startTime} - ${event.endTime}`,
            availability: (event.totalTickets || 0) - (event.ticketsSold || 0),
            products: boothCountMap[event._id] || 0, // ✅ from real API
            status: status,
            _id: event._id
          };
        });

        setEventData(mappedEvents);
      } catch (error) {
        console.error("Error fetching events for store:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndFilterEvents();
  }, [user?.token, purchaseHistory]);


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

  useEffect(() => {
    setTotal({
      total: filteredEvents.length,
      totalPages: Math.ceil(filteredEvents.length / itemsPerPage) || 1,
    });
  }, [filteredEvents.length, setTotal]);

  const startIndex = (page - 1) * itemsPerPage;
  const paginatedData = filteredEvents.slice(startIndex, Math.min(startIndex + itemsPerPage, filteredEvents.length));

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
                  resetPage();
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
                        resetPage();
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
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="cs-event-card">
                <div className="cs-card-image-wrap">
                  <div className="skeleton-image skeleton" style={{ height: "180px", borderRadius: "12px 12px 0 0" }} />
                </div>
                <div className="cs-card-details">
                  <div className="skeleton-text title skeleton" />
                  <div className="skeleton-text skeleton" style={{ width: "50%" }} />
                  <div className="skeleton-text skeleton" style={{ width: "70%" }} />
                  <div className="cs-stats-row" style={{ marginTop: "15px" }}>
                    <div className="skeleton-text short skeleton" />
                  </div>
                  <div className="skeleton-button skeleton" style={{ marginTop: "15px" }} />
                </div>
              </div>
            ))
          ) : paginatedData.length > 0 ? (
            paginatedData.map((event) => (
              <div key={event.id} className="cs-event-card">
                <div className="cs-card-image-wrap">
                  <img
                    src={event.image}
                    alt={event.title}
                    onError={(e) => { e.target.src = '/assets/eventbg.jpg'; }}
                  />
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
                {searchQuery ? (
                  <>No events match "<strong>{searchQuery}</strong>".</>
                ) : (
                  "You haven't booked any events yet. Book an event to see available stores!"
                )}
              </p>
            </div>
          )}
        </div>

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
  );
};

export default CustomerStore;
