import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

import { useEventsContext } from "../hooks/useEventsContext"; 
import { useAuthContext } from "../hooks/useAuthContext";

const EventSelection = ({ setSelectedEvent }) => {
  const { events, dispatch } = useEventsContext();
  const { user } = useAuthContext();

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user?.token) return;

    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/events", {
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
      }
    };

    fetchEvents();
  }, [user, dispatch]);

  const filteredEvents =
    events?.filter((event) =>
      event.title?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  return (
    <div className="bt-event-selection-container">
      <div className="bt-header">
        <div>
          <h1>Booth & Ticket Control</h1>
          <p className="large-body-text">
            Select an event to manage venue layouts.
          </p>
        </div>
      </div>

      <div className="bt-events-grid">
        {filteredEvents.map((event) => (
          <div
  key={event._id}
  className="bt-event-card"
  onClick={() => setSelectedEvent(event)}
>
  <div className="bt-card-image-wrap">
    <img
      src={
        event.image
          ? `http://localhost:4000/uploads/${event.image}`
          : "/assets/eventbg.jpg"
      }
      alt={event.title}
    />
  </div>

  <div className="bt-card-details">
    <div className="bt-card-info">
        <h3>{event.title}</h3>
    </div>
    <div className="bt-card-info">
        <span>
            {event.category}
        </span>
    </div>

    <div className="bt-card-info">
      <Icon icon="mdi:calendar" />
      <span>
        {new Date(event.startDate).toLocaleDateString()}
      </span>
    </div>

    <div className="bt-card-info">
      <Icon icon="mdi:map-marker" />
      <span>{event.venue?.name || "No Venue"}</span>
    </div>
  </div>
</div>
        ))}
      </div>
    </div>
  );
};

export default EventSelection;