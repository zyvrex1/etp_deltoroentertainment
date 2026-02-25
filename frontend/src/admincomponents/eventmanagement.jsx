import { useEffect, useState, useRef } from "react";
import { Icon } from "@iconify/react";
import "./eventmanagement.css";
import CreateEventModal from "./modal/CreateEventModal";
import EditEventModal from "./modal/EditEventModal";

import { useEventsContext } from "../admincomponents/hooks/useEventsContext"
import { useAuthContext } from "./hooks/useAuthContext";

const formatEventDate = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  const sameMonth =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth();

  // Same exact day
  if (sameDay) {
    return start.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  }

  // Same month
  if (sameMonth) {
    return `${start.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
    })} - ${end.getDate().toString().padStart(2, "0")}, ${start.getFullYear()}`;
  }

  // Different month
  return `${start.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  })} - ${end.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  })}, ${start.getFullYear()}`;
};


const getEventStatus = (event) => {
  const now = new Date();
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  if (end < now) return "complete";
  if (start <= now) return "live";
  return "pending";
};

const EventManagement = ({ event }) => {
   const { events, dispatch } = useEventsContext();
    const { user, loading } = useAuthContext();

   const [isEditModalOpen, setIsEditModalOpen] = useState(false); // controls EditEventModal
const [selectedEvent, setSelectedEvent] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const itemsPerPage = 5;
  const filterDropdownRef = useRef(null);

  useEffect(() => {
  if (!user?.token) return; // wait until user exists

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events', {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      });

      const text = await response.text();
      const json = text ? JSON.parse(text) : [];

      if (response.ok) {
        // 🔥 No frontend filtering anymore
        dispatch({ type: 'SET_EVENTS', payload: json });
      } else {
        console.error("Failed to fetch events:", json);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    }
  };

  fetchEvents();
}, [user, dispatch]);

 const handleDeleteEvent = async (eventId) => {
  if (!window.confirm("Are you sure you want to delete this event?")) return;

  try {
    const response = await fetch(`/api/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    });

    const json = await response.json();

    if (response.ok) {
      dispatch({ type: 'DELETE_EVENT', payload: eventId });
    } else {
      alert(json.error || "Failed to delete event.");
    }
  } catch (error) {
    console.error(error);
    alert("Error deleting event.");
  }
};

const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setIsEditModalOpen(true);
  };


  // 2. Filter Logic (search + status)
  const filteredEvents = (events || []).filter((event) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      event?.title?.toLowerCase().includes(q) ||
      event?.venue?.name?.toLowerCase().includes(q) ||
      event?.category?.toLowerCase().includes(q);

    const status = getEventStatus(event);
    const matchesStatus =
      statusFilter === "all" || statusFilter === status;

    return matchesSearch && matchesStatus;
  });

  // 3. Pagination Logic
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setIsFilterDropdownOpen(false);
      }
    };

    if (isFilterDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFilterDropdownOpen]);

  const filterOptions = [
    { value: "all", label: "All Events" },
    { value: "pending", label: "Pending" },
    { value: "live", label: "Live" },
    { value: "complete", label: "Complete" },
  ];

  const getFilterLabel = () => {
    const option = filterOptions.find((opt) => opt.value === statusFilter);
    return option ? option.label : "All Events";
  };

  const handleFilterChange = (filter) => {
    setStatusFilter(filter);
    setCurrentPage(1);
    setIsFilterDropdownOpen(false);
  };

  return (
    <div className="event-management">
      {/* Header Section */}
      <div className="eventmanagement-header">
        <div>
          <h1>Event Management</h1>
          <p>Manage all events, tickets, and booth layouts.</p>
        </div>
        <div className="dashboard-actions">
          <button className="primary-button" onClick={() => setIsModalOpen(true)}>
            <Icon icon="mdi:plus" /> Create Event
          </button>
        </div>
      </div>

      <div className="em-content">
        <div className="em-toolbar">
          <div className="em-toolbar-left">
            <div className="em-search">
              <Icon icon="mdi:magnify" />
              <input
                type="text"
                placeholder="Search by title, venue, or category..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
          <div className="em-toolbar-right">
            <div className="em-filter-dropdown" ref={filterDropdownRef}>
              <button
                className="em-filter-dropdown-btn"
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              >
                <span>{getFilterLabel()}</span>
                <Icon
                  icon="mdi:chevron-down"
                  className={`dropdown-icon ${isFilterDropdownOpen ? "open" : ""}`}
                />
              </button>
              {isFilterDropdownOpen && (
                <div className="em-filter-dropdown-menu">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`em-filter-dropdown-item ${statusFilter === option.value ? "active" : ""}`}
                      onClick={() => handleFilterChange(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Venue</th>
                <th>Date & Time</th>
                <th>Status</th>
                <th>Price</th>
                <th>Sales Progress</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEvents.length > 0 ? (
                paginatedEvents.map((event) => {
                  const salesPercent = event.totalTickets 
                    ? Math.round((event.ticketsSold / event.totalTickets) * 100) 
                    : 0;
                  const eventStatus = getEventStatus(event);
                  const statusClass = eventStatus === "live" ? "status-live" : eventStatus === "pending" ? "status-pending" : "status-completed";

                  return (
                    <tr key={event._id}>
                      <td data-label="Event">
                        <div className="event-cell">
                          <h6 className="event-name">{event.title}</h6>
                          <p className="smaller-body-text event-category">
                            {event.category.toUpperCase()}
                          </p>
                        </div>
                      </td>
                      <td data-label="Venue">
                        <div className="venue-cell">
                          <p className="regular-body-text">{event.venue.name}</p>
                          <p className="smaller-body-text">{event.venue.city}</p>
                          <p className="smaller-body-text">{event.venue?.zipCode}</p>
                        </div>
                      </td>
                      <td data-label="Date" className="small-body-text">
                        <strong>{formatEventDate(event.startDate, event.endDate)}</strong>
                        <br/>
                        <span className="smaller-body-text" style={{ color: '#666' }}>
                          {event.startDate} to {event.endDate}
                        </span>
                      </td>
                      <td data-label="Status">
                        <span className={`status-badge ${statusClass}`}>{eventStatus}</span>
                      </td>
                      <td data-label="Price" className="regular-body-text">
                        ${event.ticketPrice}
                      </td>
                      <td data-label="Sales">
                        <div className="sales-cell">
                          <span className="small-body-text sales-label">
                            {event.ticketsSold} / {event.totalTickets} ({salesPercent}%)
                          </span>
                          <div className="sales-bar">
                            <div
                              className="sales-bar-inner"
                              style={{ width: `${salesPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td data-label="Actions">
                        <div className="em-actions">
                          <button 
                            className="em-action-btn" 
                            aria-label="Edit"
                            onClick={() => handleEditEvent(event)} // <-- add this
                          >
                            <Icon icon="mdi:edit" color="skye-blue" />
                          </button>
                          <button 
                            onClick={() => handleDeleteEvent(event._id)} 
                            className="em-action-btn" 
                            aria-label="Delete"
                          >
                            <Icon icon="mdi:delete" color="red" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                    No events found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
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

      <CreateEventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <EditEventModal 
        isOpen={isEditModalOpen}
        event={selectedEvent}
        onClose={() => { setIsEditModalOpen(false); setSelectedEvent(null); }}
      />
    </div>
  );
};

export default EventManagement;