import { useState, useRef, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import "./promoterevents.css";
import PromoterCreateEventModal from "./PromoterModal/PromoterCreateEventModal.jsx";
import PromoterEditEventModal from "./PromoterModal/PromoterEditEventModal.jsx";
import PromoterViewEvent from "./PromoterModal/PromoterViewEvent.jsx";
import { NavLink } from "react-router-dom";
import { useEventsContext } from "../hooks/useEventsContext";
import { useAuthContext } from "../hooks/useAuthContext";
import eventsService from "../services/eventsService";
import { showConfirmAlert, showSuccessAlert, showErrorAlert } from "../utils/sweetAlert";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const EventCardImage = ({ imageUrl, statusClass, evt, onEdit }) => {
  const [currentImg, setCurrentImg] = useState(imageUrl);
  const statusRaw = evt.status?.toLowerCase() || "";

  useEffect(() => {
    setCurrentImg(imageUrl);
  }, [imageUrl]);

  return (
    <div
      className="pe-card-image"
      style={{ backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.2), rgba(15, 23, 42, 0.6)), url(${currentImg})` }}
    >
      <img
        src={currentImg}
        style={{ display: 'none' }}
        onError={() => setCurrentImg("/assets/eventbg.jpg")}
        alt=""
      />
      <div className="pe-card-top">
        <span className={`button-label pe-status-pill ${statusClass}`}>
          {evt.status}
        </span>

      </div>
    </div>
  );
};

const PromoterEvents = () => {
  const { events, dispatch } = useEventsContext();
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedEventToEdit, setSelectedEventToEdit] = useState(null);
  const [selectedEventToView, setSelectedEventToView] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);

  // Pagination & Sorting state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [sortFilter, setSortFilter] = useState("Recently Added");

  const filterOptions = [
    { value: "all", label: "All Events" },
    { value: "active", label: "Active" },
    { value: "pending", label: "Pending" },
    { value: "rejected", label: "Rejected" },
    { value: "past", label: "Past" }
  ];

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
  }, [dispatch, user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setIsSortDropdownOpen(false);
      }
    };

    if (isDropdownOpen || isSortDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen, isSortDropdownOpen]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilter]);

  // Filter & Sort computing optimized with useMemo
  const processedEvents = useMemo(() => {
    const filtered = (events || []).filter((evt) => {
      if (evt.createdBy?._id !== user?._id) return false;

      const q = searchQuery.toLowerCase();
      const status = evt.status?.toLowerCase();

      const matchesFilter = (() => {
        if (activeFilter === "all") return true;
        if (activeFilter === "active") return status === "approved";
        if (activeFilter === "pending") return status === "pending";
        if (activeFilter === "rejected") return status === "rejected";
        if (activeFilter === "past") return status === "completed";
        return true;
      })();

      if (!matchesFilter) return false;
      if (!q) return true;

      const location = `${evt.venue?.name || ""} ${evt.venue?.city || ""}`.toLowerCase();
      return evt.title.toLowerCase().includes(q) || location.includes(q);
    });

    switch (sortFilter) {
      case "A-Z":
        return filtered.sort((a, b) => a.title?.localeCompare(b.title));
      case "Z-A":
        return filtered.sort((a, b) => b.title?.localeCompare(a.title));
      case "Recently Added":
      default:
        return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }, [events, user?._id, searchQuery, activeFilter, sortFilter]);

  // Pagination Calculations
  const totalItems = processedEvents.length + 1; // +1 includes the static Create Card 
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginatedEvents = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    // We only take up to itemsPerPage - 1 if the create card is on this page to leave room
    const isLastPage = currentPage === totalPages;
    const sliceCount = isLastPage ? itemsPerPage - 1 : itemsPerPage;

    return processedEvents.slice(startIdx, startIdx + sliceCount);
  }, [processedEvents, currentPage, totalPages, itemsPerPage]);

  const showCreateCardOnThisPage = currentPage === totalPages;

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteEvent = async (evt) => {
    const result = await showConfirmAlert(
      "Delete Event?",
      `Are you sure you want to delete "${evt.title}"?`
    );
    if (!result.isConfirmed) return;

    try {
      await eventsService.deleteEvent(evt._id, user.token);
      dispatch({ type: "DELETE_EVENT", payload: evt._id });
      showSuccessAlert("Event Deleted", "The event has been successfully deleted.");
    } catch (err) {
      console.error("Delete event error:", err);
      showErrorAlert("Delete Failed", err.response?.data?.error || err.message);
    }
  };

  const getStatusClass = (status) => {
    const statusRaw = status?.toLowerCase() || "";
    if (statusRaw === "approved") return "active";
    if (statusRaw === "completed") return "past";
    if (statusRaw === "rejected") return "draft";
    return statusRaw;
  };

  return (
    <div className="promoter-events-page">
      <div className="pe-header-row">
        <h1>My Events</h1>
        <div className="pe-header-actions">
          <button
            type="button"
            className="primary-button pe-create-btn"
            onClick={() => setIsCreateOpen(true)}
          >
            <span>Create Event</span>
          </button>
        </div>
      </div>
      <div className="pe-card-main">
        <div className="pe-toolbar">
          <div className="pe-toolbar-left">
            <div className="pe-search">
              <Icon icon="mdi:magnify" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="small-body-text"
              />
            </div>
          </div>

          <div className="pe-toolbar-right">
            <div className="pe-filter-dropdown" ref={dropdownRef}>
              <button
                className="pe-filter-dropdown-btn"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className="truncate-text">
                  {filterOptions.find(opt => opt.value === activeFilter)?.label || "All Events"}
                </span>
                <Icon
                  icon="mdi:chevron-down"
                  className={`dropdown-icon ${isDropdownOpen ? "open" : ""}`}
                />
              </button>

              {isDropdownOpen && (
                <div className="pe-filter-dropdown-menu">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`pe-filter-dropdown-item small-body-text ${activeFilter === option.value ? "active" : ""}`}
                      onClick={() => {
                        setActiveFilter(option.value);
                        setIsDropdownOpen(false);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pe-filter-dropdown" ref={sortDropdownRef}>
              <button
                className="pe-filter-dropdown-btn"
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
              >
                <span className="truncate-text">{sortFilter}</span>
                <Icon
                  icon="mdi:chevron-down"
                  className={`dropdown-icon ${isSortDropdownOpen ? "open" : ""}`}
                />
              </button>

              {isSortDropdownOpen && (
                <div className="pe-filter-dropdown-menu">
                  {["Recently Added", "A-Z", "Z-A"].map((option) => (
                    <button
                      key={option}
                      className={`pe-filter-dropdown-item small-body-text ${sortFilter === option ? "active" : ""}`}
                      onClick={() => {
                        setSortFilter(option);
                        setIsSortDropdownOpen(false);
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
          <div className="pe-grid">
            {[...Array(itemsPerPage)].map((_, i) => (
              <div key={i} className="pe-card skeleton-card">
                <div className="skeleton skeleton-rect" style={{ height: '180px', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }} />
                <div className="pe-card-body">
                  <div className="skeleton skeleton-text title" />
                  <div className="pe-card-meta">
                    <div className="skeleton skeleton-text short" />
                    <div className="skeleton skeleton-text short" />
                  </div>
                  <div className="pe-card-actions">
                    <div className="skeleton skeleton-rect" style={{ height: '36px', width: '80px', borderRadius: '8px' }} />
                    <div className="skeleton skeleton-rect" style={{ height: '36px', width: '80px', borderRadius: '8px' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : processedEvents.length === 0 && activeFilter === "all" && !searchQuery ? (
          <div className="pe-empty-wrapper">
            <div className="empty-state">
              <Icon icon="mdi:calendar-blank-outline" width="48" />
              <h4>No events created yet</h4>
              <p className="small-body-text">
                Start by creating your first event.{" "}
                <span className="pe-empty-add-btn" onClick={() => setIsCreateOpen(true)}>
                  Create Event
                </span>
              </p>
            </div>
          </div>
        ) : processedEvents.length === 0 ? (
          <div className="pe-empty-wrapper">
            <div className="empty-state">
              <Icon icon="mdi:magnify-close" width="48" />
              <h4>No events found</h4>
              <p className="small-body-text">
                No events match your current criteria.{" "}
                <span
                  className="pe-empty-add-btn"
                  onClick={() => {
                    setActiveFilter("all");
                    setSearchQuery("");
                  }}
                >
                  Clear filters
                </span>
              </p>
            </div>
          </div>
        ) : (
          <div className="pe-grid">
            {paginatedEvents.map((evt) => {
              const statusRaw = evt.status?.toLowerCase() || "";
              const statusClass = getStatusClass(evt.status);

              const overallTotal = (evt.totalTickets || 0) + (evt.totalBooths || 0);
              const overallSold = (evt.ticketsSold || 0) + (evt.boothsSold || 0);
              const percent = overallTotal > 0 ? Math.round((overallSold / overallTotal) * 100) : 0;

              const eventDate = new Date(evt.startDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
              });

              const eventLocation = evt.venue ? `${evt.venue.name}, ${evt.venue.city}` : "TBA";
              const imageUrl = evt.image ? `/uploads/${evt.image}` : "/assets/eventbg.jpg";

              return (
                <div key={evt._id} className="pe-card"

                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEventToView(evt);
                    setIsViewOpen(true);
                  }}>
                  <EventCardImage
                    imageUrl={imageUrl}
                    statusClass={statusClass}
                    evt={evt}
                  />

                  <div className="pe-card-body">
                    <h4>{evt.title}</h4>

                    <div className="pe-card-meta">
                      <div className="pe-meta-row">
                        <Icon icon="mdi:calendar-month-outline" />
                        <span className="small-body-text">{eventDate}</span>
                      </div>

                      <div className="pe-meta-row">
                        <Icon icon="mdi:map-marker-outline" />
                        <span className="small-body-text">{eventLocation}</span>
                      </div>
                    </div>

                    {overallTotal > 0 && (
                      <>
                        <div className="pe-progress-row">
                          <span className="small-body-text">
                            {overallSold} / {overallTotal} Overall Sales
                          </span>
                          <span>{percent}%</span>
                        </div>
                        <div className="pe-progress">
                          <div style={{ width: `${percent}%` }} />
                        </div>
                      </>
                    )}

                    <div className="pe-card-actions">
                      <NavLink
                        to="/promoter/promoter-eventmanagement"
                        state={{ event: evt }}
                        className={["completed", "cancelled", "pending", "rejected"].includes(statusRaw) ? "disabled-nav-link" : ""}
                        onClick={(e) => {
                          if (["completed", "cancelled", "pending", "rejected"].includes(statusRaw)) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <button
                          type="button"
                          className="primary-button pe-card-btn"
                          disabled={["completed", "cancelled", "pending", "rejected"].includes(statusRaw)}
                        >
                          Manage
                        </button>
                      </NavLink>
                      <button
                        type="button"
                        className="outlined-button pe-card-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEventToEdit(evt);
                          setIsEditOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="outlined-button pe-card-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEvent(evt);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {showCreateCardOnThisPage && (
              <button
                type="button"
                className="pe-card pe-create-card"
                onClick={() => setIsCreateOpen(true)}
              >
                <div className="pe-create-inner">
                  <div className="pe-create-icon">
                    <Icon icon="mdi:plus" />
                  </div>
                  <h4>Create New Event</h4>
                  <p className="small-body-text">
                    Start selling tickets for your next big experience.
                  </p>
                </div>
              </button>
            )}
          </div>
        )}

        {/* Pagination UI */}
        {!loading && totalPages > 1 && (
          <div className="pe-pagination">
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <Icon icon="mdi:chevron-left" />
              Previous
            </button>
            <div className="pagination-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  className={`pagination-number ${currentPage === num ? "active" : ""}`}
                  onClick={() => handlePageChange(num)}
                >
                  {num}
                </button>
              ))}
            </div>
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <Icon icon="mdi:chevron-right" />
            </button>
          </div>
        )}
      </div>

      <PromoterCreateEventModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
      <PromoterEditEventModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        event={selectedEventToEdit}
      />
      <PromoterViewEvent
        isOpen={isViewOpen}
        onClose={() => {
          setIsViewOpen(false);
          setSelectedEventToView(null);
        }}
        event={selectedEventToView}
      />
    </div>
  );
};

export default PromoterEvents;