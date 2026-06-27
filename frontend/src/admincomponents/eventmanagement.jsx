import { useEffect, useState, useRef } from "react";
import { Icon } from "@iconify/react";
import "./eventmanagement.css";
import CreateEventModal from "./Modal/CreateEventModal";
import EditEventModal from "./Modal/EditEventModal";
import EventRejectionModal from "./Modal/EventRejectionModal";
import EventCancellationModal from "./Modal/EventCancellationModal";
import AddPromoterModal from "./Modal/AddPromoterModal";
import usePagination from "../hooks/usePagination";
import PaginationBar from "../components/PaginationBar";

import { useEventsContext } from "../hooks/useEventsContext";
import { useAuthContext } from "../hooks/useAuthContext";
import eventsService from "../services/eventsService";

import {
  showDeleteConfirmAlert,
  showSuccessAlert,
  showConfirmAlert,
} from "../utils/sweetAlert";

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
  const [isCancellationModalOpen, setIsCancellationModalOpen] = useState(false);
  const [cancellationEvent, setCancellationEvent] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignEvent, setAssignEvent] = useState(null);

  const allEvents = events || [];
  const [searchQuery, setSearchQuery] = useState("");
  const [eventCounts, setEventCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0, cancelled: 0, completed: 0 });
  const itemsPerPage = 7;
  const {
    page, totalPages, total,
    setTotal, goTo, next, prev,
    reset: resetPage,
  } = usePagination({ limit: itemsPerPage });
  const [activeTab, setActiveTab] = useState("all-events");
  const [expandedRow, setExpandedRow] = useState(null);
  const [promoters, setPromoters] = useState([]);
  const [assigningId, setAssigningId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    resetPage();
    setSearchQuery("");
    setExpandedRow(null);
  };

  const fetchEvents = async () => {
    if (!user?.token) return;
    setIsLoading(true);
    try {
      const response = await eventsService.getEventsPaginated(user.token, {
        page,
        limit: itemsPerPage,
        search: searchQuery,
        status: activeTab === 'all-events' ? 'All' : activeTab
      });

      dispatch({ type: "SET_EVENTS", payload: response });

      if (response.counts) {
        setEventCounts(response.counts);
      }
      if (response.pagination) {
        setTotal(response.pagination);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchEvents();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [user, dispatch, page, searchQuery, activeTab]);

  useEffect(() => {
    if (!user?.token) return;
    const fetchPromoters = async () => {
      try {
        const response = await fetch("/api/admin/users?role=promoters&limit=500", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        const json = await response.json();
        if (response.ok) {
          const users = json.data || json;
          setPromoters(Array.isArray(users) ? users.filter((u) => u.role === "promoter") : []);
        }
      } catch (err) {
        console.error("Error fetching promoters:", err);
      }
    };
    fetchPromoters();
  }, [user]);

  const handleAssignPromoter = async (eventId, promoterId) => {
    setAssigningId(eventId);
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          assignedPromoter: promoterId === "" ? "none" : promoterId,
        }),
      });

      const json = await response.json();

      if (response.ok) {
        dispatch({ type: "UPDATE_EVENT", payload: json.event });
        await showSuccessAlert(
          "Assigned!",
          "Promoter has been assigned to this event.",
        );
      } else {
        alert(json.error || "Failed to assign promoter.");
      }
    } catch (error) {
      console.error(error);
      alert("Error assigning promoter.");
    } finally {
      setAssigningId(null);
    }
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setIsEditModalOpen(true);
  };

  const handleDeleteEvent = async (event) => {
    const result = await showDeleteConfirmAlert(
      "Delete Event",
      `Are you sure you want to delete "${event.title}"?`,
    );

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/events/${event._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const json = await response.json();

      if (response.ok) {
        dispatch({ type: "DELETE_EVENT", payload: event._id });
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
      true,
    );

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/events/${event._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          status: "approved",
          assignedPromoters:
            event.createdBy?.role === "promoter" &&
              !event.assignedPromoters?.some(
                (ap) => ap._id === event.createdBy?._id,
              )
              ? [
                ...(event.assignedPromoters?.map((ap) => ap._id) || []),
                event.createdBy._id,
              ]
              : undefined,
        }),
      });

      const json = await response.json();

      if (response.ok) {
        dispatch({ type: "UPDATE_EVENT", payload: json.event });
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
        dispatch({ type: "UPDATE_EVENT", payload: json.event });
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

  const handleCancelEvent = (event) => {
    setCancellationEvent(event);
    setIsCancellationModalOpen(true);
  };

  const confirmCancellation = async (reason) => {
    if (!cancellationEvent) return;

    try {
      const response = await fetch(`/api/events/${cancellationEvent._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          status: "cancelled",
          cancellationReason: reason,
        }),
      });

      const json = await response.json();

      if (response.ok) {
        dispatch({ type: "UPDATE_EVENT", payload: json.event });
        setIsCancellationModalOpen(false);
        setCancellationEvent(null);
        await showSuccessAlert("Cancelled!", "Event has been cancelled.");
      } else {
        alert(json.error || "Failed to cancel event.");
      }
    } catch (error) {
      console.error(error);
      alert("Error cancelling event.");
    }
  };

  const paginatedData = allEvents;

  const eventTabs = [
    { id: "all-events", label: "All Events", count: eventCounts.all },
    { id: "pending", label: "Pending", count: eventCounts.pending },
    { id: "approved", label: "Approved", count: eventCounts.approved },
    { id: "rejected", label: "Rejected", count: eventCounts.rejected },
    { id: "cancelled", label: "Cancelled", count: eventCounts.cancelled },
    { id: "completed", label: "Completed", count: eventCounts.completed },
  ];

  const renderTable = () => {
    return (
      <div className="table-wrapper">
        {isLoading ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Venue</th>
                <th>Date & Time</th>
                <th>Status</th>
                <th>Promoter</th>
                <th>Sales Progress</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(itemsPerPage)].map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  <td>
                    <div className="skeleton skeleton-text title" />
                    <div className="skeleton skeleton-text short" />
                  </td>
                  <td>
                    <div className="skeleton skeleton-text" />
                    <div className="skeleton skeleton-text short" />
                  </td>
                  <td>
                    <div className="skeleton skeleton-text" />
                    <div className="skeleton skeleton-text short" />
                  </td>
                  <td>
                    <div className="skeleton skeleton-badge" />
                  </td>
                  <td>
                    <div className="skeleton-avatar-group">
                      <div className="skeleton skeleton-avatar" />
                      <div className="skeleton skeleton-avatar" />
                      <div className="skeleton skeleton-avatar" />
                    </div>
                  </td>
                  <td>
                    <div className="skeleton skeleton-text short" />
                    <div className="skeleton skeleton-sales-bar" />
                  </td>
                  <td>
                    <div className="skeleton skeleton-avatar" style={{ width: '80%' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : paginatedData.length === 0 ? (
          // Empty state outside table for mobile-friendly display
          <div className="empty-state">
            <Icon
              icon={
                activeTab === "pending-events"
                  ? "mdi:clock-outline"
                  : activeTab === "approved-events"
                    ? "mdi:check-circle-outline"
                    : activeTab === "rejected-events"
                      ? "mdi:close-circle-outline"
                      : activeTab === "cancelled-events"
                        ? "mdi:cancel"
                        : activeTab === "completed-events"
                          ? "mdi:flag-checkered"
                          : "mdi:calendar-multiple"
              }
              style={{ fontSize: '48px', marginBottom: '16px' }}
            />
            <h4>{searchQuery ? "No events found" : `No ${activeTab.split('-')[0]} events yet`}</h4>
            <p className="small-body-text">
              {searchQuery
                ? <>No events match "<strong>{searchQuery}</strong>".</>
                : `There are currently no events in this category.`
              }
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
                <th>Promoter</th>
                <th>Sales Progress</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedData.map((event) => {
                const totalOverall = (event.totalTickets || 0) + (event.totalBooths || 0);
                const soldOverall = (event.ticketsSold || 0) + (event.boothsSold || 0);

                const salesPercent = totalOverall > 0
                  ? Math.round((soldOverall / totalOverall) * 100)
                  : 0;

                const statusClass = `status-${event.status}`;

                return (
                  <tr
                    key={event._id}
                    className={expandedRow === event._id ? "expanded" : ""}
                  >
                    <td data-label="Event" className="id-td">
                      <div
                        className="mobile-expand-icon"
                        onClick={() => toggleRow(event._id)}
                      >
                        <Icon
                          icon={
                            expandedRow === event._id
                              ? "mdi:chevron-up"
                              : "mdi:chevron-down"
                          }
                        />
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
                      <span
                        className="smaller-body-text"
                        style={{ color: "#666" }}
                      >
                        {event.startTime} - {event.endTime}
                      </span>
                    </td>

                    <td data-label="Status">
                      <span className={`button-label ${statusClass}`}>
                        {event.status}
                      </span>
                    </td>

                    <td data-label="Promoter">
                      <div className="promoter-assign-cell">
                        <div className="assigned-promoters-list">
                          <div className="promoter-avatars">
                            {/* CASE 1: If a promoter created the event, show their avatar first */}
                            {event.createdBy?.role === "promoter" && (
                              <div
                                className="promoter-avatar-tiny"
                                title={`${event.createdBy.firstName} ${event.createdBy.lastName}`}
                                style={{ border: "2px solid #4CAF50" }} // Optional: highlight the owner
                              >
                                {event.createdBy.firstName?.charAt(0)}
                                {event.createdBy.lastName?.charAt(0)}
                              </div>
                            )}

                            {/* CASE 2: Display assigned promoters (filtering out the creator if they are already shown) */}
                            {event.assignedPromoters
                              ?.filter((p) => p._id !== event.createdBy?._id) // Avoid duplicates if creator is also in assigned list
                              .slice(0, 3)
                              .map((p) => (
                                <div
                                  key={p._id}
                                  className="promoter-avatar-tiny"
                                  title={`${p.firstName} ${p.lastName}`}
                                >
                                  {p.firstName?.charAt(0)}
                                  {p.lastName?.charAt(0)}
                                </div>
                              ))}

                            {/* Show count for extra promoters */}
                            {event.assignedPromoters?.length > 3 && (
                              <div className="promoter-avatar-tiny extra">
                                +{event.assignedPromoters.length - 3}
                              </div>
                            )}

                            {/* Fallback if absolutely no one is assigned and creator is admin */}
                            {!event.assignedPromoters?.length &&
                              event.createdBy?.role !== "promoter" && (
                                <span
                                  className="smaller-body-text"
                                  style={{ color: "#999" }}
                                >
                                  Unassigned
                                </span>
                              )}
                          </div>

                          <button
                            className="assign-promoter-plus-btn"
                            onClick={() => {
                              setAssignEvent(event);
                              setIsAssignModalOpen(true);
                            }}
                            // Limit removed: Now only disables if the event isn't approved
                            disabled={event.status !== "approved"}
                            title={
                              event.status !== "approved"
                                ? "Approve the event first"
                                : "Manage Promoters"
                            }
                          >
                            <Icon icon="mdi:plus" />
                          </button>
                        </div>
                      </div>
                    </td>

                    <td data-label="Sales">
                      <div className="sales-cell">
                        <span className="small-body-text sales-label">
                          {soldOverall} / {totalOverall} (
                          {salesPercent}%)
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
                          onClick={() => handleEditEvent(event)}
                          title={event.createdBy?._id === user?._id ? "Edit Event" : "View Event"}
                        >
                          <Icon
                            icon={event.createdBy?._id === user?._id ? "mdi:square-edit-outline" : "mdi:eye-outline"}
                          />
                        </button>

                        {/* APPROVE/REJECT Logic */}
                        {event.status === "pending" && (event.createdBy?._id === user?._id || user.role === "admin" || user.role === "superadmin") && (
                          <>
                            <button className="em-action-btn approve-btn" onClick={() => handleApproveEvent(event)} title="Approve Event">
                              <Icon icon="mdi:check-circle-outline" />
                            </button>
                            <button className="em-action-btn reject-btn" onClick={() => handleRejectEvent(event)} title="Reject Event">
                              <Icon icon="mdi:close-circle-outline" />
                            </button>
                          </>
                        )}

                        {/* CANCEL Logic */}
                        {event.status === "approved" && (event.createdBy?._id === user?._id || user.role === "admin" || user.role === "superadmin") && (
                          <button className="em-action-btn cancel-btn" onClick={() => handleCancelEvent(event)} title="Cancel Event">
                            <Icon icon="mdi:cancel" />
                          </button>
                        )}

                        {/* DELETE Logic (Owner Only) */}
                        {event.createdBy?._id === user?._id && (
                          <button className="em-action-btn" onClick={() => handleDeleteEvent(event)} title="Delete Event">
                            <Icon icon="mdi:delete" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  return (
    <div className="event-management">

      <div className="eventmanagement-header">
        <div>
          <h1>Manage Events</h1>
          <p>Manage all events, tickets, and booth layouts.</p>
        </div>
        <div className="dashboard-actions">
          <button
            className="primary-button"
            onClick={() => setIsModalOpen(true)}
          >
            <Icon icon="mdi:plus" /> Create Event
          </button>
        </div>
      </div>

      <div className="em-content">
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
                  resetPage();
                }}
                className="small-body-text"
              />
            </div>
          </div>
        </div>

        {renderTable()}

        <PaginationBar
          page={page}
          totalPages={totalPages}
          total={total}
          onPrev={prev}
          onNext={next}
          onGoTo={goTo}
        />
      </div>
      <CreateEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <EditEventModal
        isOpen={isEditModalOpen}
        event={selectedEvent}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEvent(null);
        }}
      />
      {isRejectionModalOpen && (
        <EventRejectionModal
          event={rejectionEvent}
          onClose={() => {
            setIsRejectionModalOpen(false);
            setRejectionEvent(null);
          }}
          onConfirm={confirmRejection}
        />
      )}
      <AddPromoterModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setAssignEvent(null);
        }}
        event={assignEvent}
        allPromoters={promoters}
        user={user}
        onUpdate={(updatedEvent) => {
          dispatch({ type: "UPDATE_EVENT", payload: updatedEvent });
        }}
      />

      {isCancellationModalOpen && (
        <EventCancellationModal
          event={cancellationEvent}
          onClose={() => {
            setIsCancellationModalOpen(false);
            setCancellationEvent(null);
          }}
          onConfirm={confirmCancellation}
        />
      )}
    </div>
  );
};

export default EventManagement;