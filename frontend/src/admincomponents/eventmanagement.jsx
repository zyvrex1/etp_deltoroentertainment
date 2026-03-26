import { useEffect, useState, useRef } from "react";
import { Icon } from "@iconify/react";
import "./eventmanagement.css";
import CreateEventModal from "./modal/CreateEventModal";
import EditEventModal from "./Modal/EditEventModal";
import EventRejectionModal from "./Modal/EventRejectionModal";

import { useEventsContext } from "../admincomponents/hooks/useEventsContext"
import { useAuthContext } from "./hooks/useAuthContext";

import {
  showDeleteConfirmAlert,
  showSuccessAlert,
  showConfirmAlert
} from "./utils/sweetAlert";

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

const EventManagement = () => {
  const { events, dispatch } = useEventsContext();
  const { user } = useAuthContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionEvent, setRejectionEvent] = useState(null);

  const allEvents = events || [];
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const [activeTab, setActiveTab] = useState("all-events");
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setCurrentPage(1);
    setSearchQuery("");
    setExpandedRow(null);
  };

  useEffect(() => {
    if (!user?.token) return;

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

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setIsEditModalOpen(true);
  };

  const handleDeleteEvent = async (event) => {
    const result = await showDeleteConfirmAlert(
      "Delete Event",
      `Are you sure you want to delete "${event.title}"?`
    );

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/events/${event._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });

      const json = await response.json();

      if (response.ok) {
        dispatch({ type: 'DELETE_EVENT', payload: event._id });
        await showSuccessAlert("Deleted!", "Event deleted successfully.");
      } else {
        alert(json.error || "Failed to delete event.");
      }
    } catch (error) {
      console.error(error);
      alert("Error deleting event.");
    }
  };

  const handleApproveEvent = async (event) => {
    const result = await showConfirmAlert(
      "Approve Event",
      `Are you sure you want to approve "${event.title}"?`,
      "Yes, Approve It",
      "Cancel",
      true
    );

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/events/${event._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ status: "approved" }),
      });

      const json = await response.json();

      if (response.ok) {
        dispatch({ type: "UPDATE_EVENT", payload: json });
        await showSuccessAlert("Approved!", "Event has been approved.");
      } else {
        alert(json.error || "Failed to approve event.");
      }
    } catch (error) {
      console.error(error);
      alert("Error approving event.");
    }
  };

  const handleRejectEvent = (event) => {
    setRejectionEvent(event);
    setIsRejectionModalOpen(true);
  };

  const confirmRejection = async (reason) => {
    if (!rejectionEvent) return;

    try {
      const response = await fetch(`/api/events/${rejectionEvent._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ status: "rejected", rejectionReason: reason }),
      });

      const json = await response.json();

      if (response.ok) {
        dispatch({ type: "UPDATE_EVENT", payload: json });
        setIsRejectionModalOpen(false);
        setRejectionEvent(null);
        await showSuccessAlert("Rejected!", "Event has been rejected.");
      } else {
        alert(json.error || "Failed to reject event.");
      }
    } catch (error) {
      console.error(error);
      alert("Error rejecting event.");
    }
  };

  const handleCancelEvent = async (eventId) => {
    const result = await showConfirmAlert(
      "Cancel Event",
      "Are you sure you want to cancel this event? This action will set the status to cancelled.",
      "Yes, Cancel Event",
      "No, Keep It",
      false
    );

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ status: "cancelled" }),
      });

      const json = await response.json();

      if (response.ok) {
        dispatch({ type: "UPDATE_EVENT", payload: json });
        await showSuccessAlert("Cancelled!", "Event has been cancelled.");
      } else {
        alert(json.error || "Failed to cancel event.");
      }
    } catch (error) {
      console.error(error);
      alert("Error cancelling event.");
    }
  };

  const getTableData = () => {
    switch (activeTab) {
      case "all-events":
        return allEvents;

      case "pending-events":
        return allEvents.filter((e) => e.status === "pending");

      case "approved-events":
        return allEvents.filter((e) => e.status === "approved");

      case "rejected-events":
        return allEvents.filter((e) => e.status === "rejected");

      case "cancelled-events":
        return allEvents.filter((e) => e.status === "cancelled");

      case "completed-events":
        return allEvents.filter((e) => e.status === "completed");

      default:
        return [];
    }
  };

  const filteredData = getTableData().filter((item) => {
    const searchStr = searchQuery.toLowerCase();
    return (
      `${item.firstName || ""} ${item.lastName || ""}`
        .toLowerCase()
        .includes(searchStr) ||
      (item.email && item.email.toLowerCase().includes(searchStr))
    );
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const eventTabs = [
    { id: "all-events", label: "All Events", count: allEvents.length },

    {
      id: "pending-events",
      label: "Pending",
      count: allEvents.filter((e) => e.status === "pending").length,
    },

    {
      id: "approved-events",
      label: "Approved",
      count: allEvents.filter((e) => e.status === "approved").length,
    },

    {
      id: "rejected-events",
      label: "Rejected",
      count: allEvents.filter((e) => e.status === "rejected").length,
    },

    {
      id: "cancelled-events",
      label: "Cancelled",
      count: allEvents.filter((e) => e.status === "cancelled").length,
    },

    {
      id: "completed-events",
      label: "Completed",
      count: allEvents.filter((e) => e.status === "completed").length,
    },
  ];


  const renderTable = () => {
    return (
      <div className="table-wrapper">
        {paginatedData.length === 0 ? (
          // Empty state outside table for mobile-friendly display
          <div className="empty-state">
            <Icon icon="mdi:magnify-close" width="48" />
            <h4>No events found</h4>
            <p className="small-body-text">
              No events match "<strong>{searchQuery}</strong>".
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Venue</th>
                <th>Date & Time</th>
                <th>Status</th>
                <th>Sales Progress</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((event) => {
                  const salesPercent = event.totalTickets
                    ? Math.round((event.ticketsSold / event.totalTickets) * 100)
                    : 0;

                  const statusClass = `status-${event.status}`;

                  return (
                    <tr key={event._id} className={expandedRow === event._id ? "expanded" : ""}>
                      <td data-label="Event" className="id-td">
                        <div className="mobile-expand-icon" onClick={() => toggleRow(event._id)}>
                          <Icon icon={expandedRow === event._id ? "mdi:chevron-up" : "mdi:chevron-down"} />
                        </div>
                        <div className="event-cell">
                          <h5 className="event-name">{event.title}</h5>
                          <p className="smaller-body-text event-category">
                            {event.category || "No Category"}
                          </p>
                          <p className="smaller-body-text event-category">
                            {event.createdBy
                              ? `${event.createdBy.firstName} ${event.createdBy.lastName} (${event.createdBy.role})`
                              : "Unknown Creator"}
                          </p>
                        </div>
                      </td>

                      <td data-label="Venue" className="name-td">
                        <div className="venue-cell">
                          <p className="regular-body-text green-label">
                            {event.venue?.name || "No Venue"}
                          </p>
                          <p className="smaller-body-text">
                            {event.venue?.city || ""}
                          </p>
                          <p className="smaller-body-text">
                            {event.venue?.zipCode || ""}
                          </p>
                        </div>
                      </td>

                      <td data-label="Date" className="small-body-text">
                        <strong>
                          {formatEventDate(event.startDate, event.endDate)}
                        </strong>
                        <br />
                        <span className="smaller-body-text" style={{ color: "#666" }}>
                          {event.startTime} - {event.endTime}
                        </span>
                      </td>

                      <td data-label="Status">
                        <span className={`button-label ${statusClass}`}>
                          {event.status}
                        </span>
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
                          {event.createdBy._id === user._id ? (
                            // Current user owns this event → Edit/Delete
                            <>
                              <button
                                className="em-action-btn"
                                onClick={() => handleEditEvent(event)}
                                title="Edit Event"
                              >
                                <Icon icon="mdi:pencil" />
                              </button>

                              <button
                                className="em-action-btn"
                                onClick={() => handleDeleteEvent(event)}
                                title="Delete Event"
                              >
                                <Icon icon="mdi:delete" />
                              </button>
                            </>
                          ) : (
                            // Event is NOT owned by user → View + Approve (if pending & admin)
                            <>
                              <button
                                className="em-action-btn"
                                onClick={() => handleEditEvent(event)}
                                title="View Event"
                              >
                                <Icon icon="mdi:eye-outline" />
                              </button>

                              {event.status === "pending" && (user.role === "admin" || user.role === "superadmin") && (
                                <>
                                  <button
                                    className="em-action-btn approve-btn"
                                    onClick={() => handleApproveEvent(event)}
                                    title="Approve Event"
                                  >
                                    <Icon icon="mdi:check-circle-outline" />
                                  </button>
                                  <button
                                    className="em-action-btn reject-btn"
                                    onClick={() => handleRejectEvent(event)}
                                    title="Reject Event"
                                  >
                                    <Icon icon="mdi:close-circle-outline" />
                                  </button>
                                </>
                              )}

                              {event.status === "approved" && (user.role === "admin" || user.role === "superadmin") && (
                                <button
                                  className="em-action-btn cancel-btn"
                                  onClick={() => handleCancelEvent(event._id)}
                                  title="Cancel Event"
                                >
                                  <Icon icon="mdi:cancel" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  {/* <td colSpan="7" style={{ textAlign: "center", padding: "2rem" }}>
                No events found.
              </td> */}
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  return (
    <div className="user-management">
      <div className="usermanagement-header">
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
        {/* Tabs */}
        {/* Tabs */}
        <div className="tabs-container">
          {eventTabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <Icon
                icon={
                  tab.id === "all-events"
                    ? "mdi:calendar-multiple"
                    : tab.id === "pending-events"
                      ? "mdi:clock-outline"
                      : tab.id === "approved-events"
                        ? "mdi:check-circle-outline"
                        : tab.id === "rejected-events"
                          ? "mdi:close-circle-outline"
                          : tab.id === "cancelled-events"
                            ? "mdi:cancel"
                            : tab.id === "completed-events"
                              ? "mdi:flag-checkered"
                              : "mdi:calendar"
                }
              />
              <span>{tab.label}</span>
              <span className="badge-count">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Toolbar (like Payments) */}
        <div className="em-toolbar">
          <div className="em-toolbar-left">
            <div className="em-search">
              <Icon icon="mdi:magnify" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="small-body-text"
              />
            </div>
          </div>
        </div>

        {renderTable()}

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
      {isRejectionModalOpen && (
        <EventRejectionModal
          event={rejectionEvent}
          onClose={() => { setIsRejectionModalOpen(false); setRejectionEvent(null); }}
          onConfirm={confirmRejection}
        />
      )}
    </div>
  );
};

export default EventManagement;