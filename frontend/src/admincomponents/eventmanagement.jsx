import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import "./eventmanagement.css";
import CreateEventModal from "./modal/CreateEventModal";
// import EditEventModal from "./modal/EditEventModal"


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

const formatEventTime = (dateString) => {
  const date = new Date(dateString);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};


const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const itemsPerPage = 5;

  // 1. Fetch Data
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events');
        const json = await response.json();
        if (response.ok) {
          setEvents(json);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };
    fetchEvents();
  }, []);

  // 2. Filter Logic (Updated for your JSON keys)
  const filteredEvents = (events || []).filter((event) => {
    const q = searchQuery.toLowerCase();
    return (
      event?.title?.toLowerCase().includes(q) ||
      event?.venue?.name?.toLowerCase().includes(q) ||
      event?.category?.toLowerCase().includes(q)
    );
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
        {/* Toolbar Section */}
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
            <button className="em-filters-btn">
              <Icon icon="mdi:tune" />
              <span>Filters</span>
            </button>
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
                          {formatEventTime(event.startDate)} to {formatEventTime(event.endDate)}
                        </span>
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
                          <button className="em-action-btn" aria-label="Edit">
                            <Icon icon="mdi:square-edit-outline" />
                          </button>
                          <button className="em-action-btn" aria-label="More">
                            <Icon icon="mdi:dots-horizontal" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
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

      {/* Modals */}
      <CreateEventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {/* <EditEventModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} event={selectedEvent} /> */}
      {/* <AddPromoterModal
        isOpen={isAddPromoterModalOpen}
        onClose={() => setIsAddPromoterModalOpen(false)}
        event={selectedEvent}
        onAdd={onPromoterAdded}
      /> */}
    </div>
  );
};

export default EventManagement;