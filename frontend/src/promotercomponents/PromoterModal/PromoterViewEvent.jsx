import React from "react";
import { Icon } from "@iconify/react";
import { getImageUrl } from "../../utils/imageUrl";
import "./PromoterViewEvent.css";

const PromoterViewEvent = ({ isOpen, onClose, event }) => {
  if (!isOpen || !event) return null;

  const statusRaw = event.status?.toLowerCase() || "";
  let statusClass = statusRaw;
  if (statusRaw === "approved") statusClass = "active";
  if (statusRaw === "completed") statusClass = "past";
  if (statusRaw === "rejected") statusClass = "draft";

  const eventDate = new Date(event.startDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const eventLocation = event.venue
    ? `${event.venue.name}, ${event.venue.address}, ${event.venue.city}, ${event.venue.zipCode}`
    : "TBA";

  const imageUrl = getImageUrl(event.image);

  return (
    <div className="promoter-view-event-overlay">
      <div className="promoter-view-event-container">
        <div className="promoter-view-event-header">
          <div className="pve-header-left">
            <h3>Event Details</h3>
            <span className={`pve-status-badge button-label ${statusClass}`}>
              {event.status}
            </span>
          </div>
          <button className="pve-close-btn" onClick={onClose}>
            <Icon icon="mdi:close" />
          </button>
        </div>

        <div className="promoter-view-event-body">
         

          <div className="pve-image-section">
            <img 
                src={imageUrl} 
                alt={event.title} 
                className="pve-event-image" 
                onError={(e) => {
                    e.target.src = '/assets/eventbg.jpg';
                    e.target.onerror = null;
                }}
            />
          </div>

          <div className="pve-info-grid">
            <div className="pve-info-item">
              <h6>Event Title</h6>
              <p className="large-body-text">{event.title}</p>
            </div>
            <div className="pve-info-item">
              <h6>Category</h6>
              <p className="regular-body-text">{event.category}</p>
            </div>
          </div>

          <div className="pve-info-grid">
            <div className="pve-info-item">
              <h6>Date</h6>
              <div className="pve-icon-text">
                <Icon icon="mdi:calendar-month-outline" />
                <p className="regular-body-text">{eventDate}</p>
              </div>
            </div>
            <div className="pve-info-item">
              <h6>Time</h6>
              <div className="pve-icon-text">
                <Icon icon="mdi:clock-outline" />
                <p className="regular-body-text">
                  {event.startTime} - {event.endTime}
                </p>
              </div>
            </div>
          </div>

          <div className="pve-info-item">
            <h6>Venue</h6>
            <div className="pve-icon-text">
              <Icon icon="mdi:map-marker-outline" />
              <p className="regular-body-text">{eventLocation}</p>
            </div>
          </div>

          <div className="pve-info-item">
            <h6>Description</h6>
            <p className="small-body-text pve-description">
              {event.description}
            </p>
          </div>

          <div className="pve-stats-row">
            <div className="pve-stat">
              <h6>Tickets Sold</h6>
              <p className="large-body-text ticket-sold">{event.ticketsSold || 0}</p>
            </div>
            <div className="pve-stat">
               <h6>Status</h6>
               <p className={`regular-body-text pve-status-${statusClass}`}>{event.status}</p>
            </div>
          </div>
           {(statusRaw === "rejected" || statusRaw === "approved") && (
            <div className={`pve-rejection-box ${statusRaw}`}>
              <div className={`pve-rejection-header ${statusRaw}`}>
                <Icon icon={statusRaw === "rejected" ? "mdi:alert-circle-outline" : "mdi:check-circle-outline"} />
                <h6>{statusRaw === "rejected" ? "Rejection Reason" : "Admin Feedback"}</h6>
              </div>
              <p className="small-body-text">
                {event.rejectionReason || (statusRaw === "approved" ? "The event has been approved by the administrator." : "No specific reason provided.")}
              </p>
            </div>
          )}
        </div>

        <div className="promoter-view-event-footer">
          <button className="primary-button pve-done-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromoterViewEvent;
