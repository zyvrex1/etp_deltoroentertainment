import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";

import { useEventsContext } from "../hooks/useEventsContext";
import { useAuthContext } from "../hooks/useAuthContext";

const EventSelection = ({ setSelectedEvent }) => {
  const { events, dispatch } = useEventsContext();
  const { user } = useAuthContext();

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortFilter, setSortFilter] = useState("Recently Added");
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
  const eventDropdownRef = useRef(null);

  // Fetch events from API
  useEffect(() => {
    if (!user?.token) return;

    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/events?status=approved", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        const json = await response.json();

        if (response.ok) {
          dispatch({ type: "SET_EVENTS", payload: json });
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [user, dispatch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        eventDropdownRef.current &&
        !eventDropdownRef.current.contains(event.target)
      ) {
        setIsEventDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sort events
  const sortEvents = (eventsList) => {
    if (!eventsList) return [];

    const sorted = [...eventsList];

    switch (sortFilter) {
      case "A-Z":
        return sorted.sort((a, b) => a.title?.localeCompare(b.title));

      case "Z-A":
        return sorted.sort((a, b) => b.title?.localeCompare(a.title));

      case "Recently Added":
      default:
        return sorted.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
    }
  };

  // Filter events based on search
  const filteredEvents = sortEvents(
    events?.filter((event) =>
      event.status === "approved" && // Ensure only approved events are shown
      event.title?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="bt-event-selection-container">
      <div className="bt-header">
        <div>
          <h1>Booth & Ticket Control</h1>
          <p className="large-body-text">
            Select an event to manage venue layouts and ticket inventory.
          </p>
        </div>
      </div>

      <div className="bt-content-first-page">
        <div className="bt-toolbar">
          <div className="bt-toolbar-left">
            <div className="bt-search">
              <Icon icon="mdi:magnify" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="small-body-text bt-search-input"
              />
            </div>
          </div>

          <div className="bt-toolbar-right">
            <div className="bt-filter-dropdown" ref={eventDropdownRef}>
              <button
                className="bt-filter-dropdown-btn small-body-text"
                onClick={() =>
                  setIsEventDropdownOpen(!isEventDropdownOpen)
                }
              >
                <span className="truncate-text">{sortFilter}</span>
                <Icon
                  icon="mdi:chevron-down"
                  className={`dropdown-icon ${isEventDropdownOpen ? "open" : ""
                    }`}
                />
              </button>

              {isEventDropdownOpen && (
                <div className="bt-filter-dropdown-menu">
                  {["Recently Added", "A-Z", "Z-A"].map((option) => (
                    <button
                      key={option}
                      className={`bt-filter-dropdown-item small-body-text ${sortFilter === option ? "active" : ""
                        }`}
                      onClick={() => {
                        setSortFilter(option);
                        setIsEventDropdownOpen(false);
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

        <div className="bt-events-grid">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="bt-event-card skeleton-card">
                <div className="bt-card-image-wrap skeleton" style={{ height: '180px' }} />
                <div className="bt-card-details">
                  <div className="skeleton skeleton-text title" style={{ width: '80%' }} />
                  <div className="skeleton skeleton-text short" style={{ width: '40%', marginBottom: '15px' }} />
                  <div className="skeleton skeleton-text" style={{ width: '90%' }} />
                  <div className="skeleton skeleton-text" style={{ width: '70%' }} />
                  <div className="skeleton skeleton-text" style={{ width: '60%' }} />
                </div>
              </div>
            ))
          ) : filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <div
                key={event._id}
                className="bt-event-card"
                onClick={() => setSelectedEvent(event)}
              >
                <div className="bt-card-image-wrap">
                  <img
                    src={
                      event.image
                        ? `/uploads/${event.image}`
                        : "/assets/eventbg.jpg"
                    }
                    alt={event.title}
                    onError={(e) => {
                        e.target.src = '/assets/eventbg.jpg';
                        e.target.onerror = null;
                    }}
                  />
                </div>

                <div className="bt-card-details">
                  <div className="bt-card-info">
                    <h4>{event.title}</h4>
                  </div>

                  <div className="bt-card-info small-body-text">
                    <span>{event.category || "No category"}</span>
                  </div>

                  <div className="bt-card-info">
                    <Icon icon="mdi:calendar" />
                    <span className="event-dates small-body-text">
                      {new Date(event.startDate).toLocaleDateString()} -{" "}
                      {new Date(event.endDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="bt-card-info">
                    <Icon icon="mdi:clock-outline" />
                    <span className="event-times small-body-text">
                      {event.startTime || "N/A"} - {event.endTime || "N/A"}
                    </span>
                  </div>

                  <div className="bt-card-info">
                    <Icon icon="mdi:map-marker" />
                    <span className="small-body-text">{event.venue?.name || "No Venue"}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bt-empty-state">
              <Icon icon="mdi:magnify-close" width="48" />
              <h4>No events found</h4>
              <p className="small-body-text">
                No events match "<strong>{searchQuery}</strong>".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventSelection;