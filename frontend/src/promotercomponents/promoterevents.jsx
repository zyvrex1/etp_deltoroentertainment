import { useState } from "react";
import { Icon } from "@iconify/react";
import "./promoterevents.css";
import PromoterCreateEventModal from "./PromoterModal/PromoterCreateEventModal.jsx";
import PromoterEditEventModal from "./PromoterModal/PromoterEditEventModal.jsx";
import { NavLink } from "react-router-dom";

const sampleEvents = [
  {
    id: 1,
    title: "TechStart Summit 2026",
    date: "Oct 12, 2026",
    location: "Moscone Center, San Francisco",
    ticketsSold: 450,
    totalTickets: 600,
    status: "Active",
    statusColor: "green",
  },
  {
    id: 2,
    title: "Creator Economy Expo",
    date: "Nov 05, 2024",
    location: "Austin Convention Center",
    ticketsSold: 120,
    totalTickets: 500,
    status: "Pending",
    statusColor: "green",
  },
  {
    id: 3,
    title: "Winter Music Festival",
    date: "Dec 15, 2024",
    location: "Central Park, New York",
    ticketsSold: 0,
    totalTickets: 0,
    status: "Draft",
    statusColor: "red",
  },
  {
    id: 4,
    title: "SaaS Growth Meetup",
    date: "Sep 10, 2024",
    location: "WeWork Downtown, Chicago",
    ticketsSold: 85,
    totalTickets: 100,
    status: "Past",
    statusColor: "gray",
  },
];

const PromoterEvents = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEventToEdit, setSelectedEventToEdit] = useState(null);

  const filteredEvents = sampleEvents.filter((evt) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "active") return evt.status === "Active";
    if (activeFilter === "pending") return evt.status === "Pending";
    if (activeFilter === "drafts") return evt.status === "Draft";
    if (activeFilter === "past") return evt.status === "Past";
    return true;
  });

  return (
    <div className="promoter-events-page">
      <div className="pe-header-row">
        <h1>My Event</h1>
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
        <div className="pe-filters-row">
          <div className="pe-filters">
            <button
              type="button"
              className={`pe-filter-pill ${activeFilter === "all" ? "active" : ""}`}
              onClick={() => setActiveFilter("all")}
            >
              <Icon icon="mdi:calendar-multiple" />
              <span>All Events</span>
              <span className="pe-count">4</span>
            </button>

            <button
              type="button"
              className={`pe-filter-pill ${activeFilter === "active" ? "active" : ""}`}
              onClick={() => setActiveFilter("active")}
            >
              <Icon icon="mdi:check-circle-outline" />
              <span>Active</span>
              <span className="pe-count">2</span>
            </button>

            <button
              type="button"
              className={`pe-filter-pill ${activeFilter === "pending" ? "active" : ""}`}
              onClick={() => setActiveFilter("pending")}
            >
              <Icon icon="mdi:check-circle-outline" />
              <span>Pending</span>
              <span className="pe-count">2</span>
            </button>

            <button
              type="button"
              className={`pe-filter-pill ${activeFilter === "drafts" ? "active" : ""}`}
              onClick={() => setActiveFilter("drafts")}
            >
              <Icon icon="mdi:file-document-edit-outline" />
              <span>Drafts</span>
              <span className="pe-count">1</span>
            </button>

            <button
              type="button"
              className={`pe-filter-pill ${activeFilter === "past" ? "active" : ""}`}
              onClick={() => setActiveFilter("past")}
            >
              <Icon icon="mdi:history" />
              <span>Past</span>
              <span className="pe-count">1</span>
            </button>
          </div>

          <div className="outlined-button pe-search">
            <Icon icon="mdi:magnify" />
            <input type="text" placeholder="Search events..." />
          </div>
        </div>

        <div className="pe-grid">
          {filteredEvents.map((evt) => {

            const status = evt?.status?.trim().toLowerCase() || "";

            const percent =
              evt.totalTickets > 0
                ? Math.round((evt.ticketsSold / evt.totalTickets) * 100)
                : 0;

            return (
              <div key={evt.id} className="pe-card">
                <div className="pe-card-image">

                  <div className="pe-card-top">
                    <span className={`button-label pe-status-pill ${status}`}>
                      {evt.status}
                    </span>

                    {["pending", "draft", "active"].includes(status) && (
                      <button className="pe-edit-top" onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEventToEdit(evt);
                        setIsEditOpen(true);
                      }}>
                        <Icon icon="mdi:pencil-outline" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="pe-card-body">
                  <h4>{evt.title}</h4>
                  <div className="pe-card-meta">
                    <div className="pe-meta-row">
                      <Icon icon="mdi:calendar-month-outline" />
                      <span className="small-body-text">{evt.date}</span>
                    </div>
                    <div className="pe-meta-row">
                      <Icon icon="mdi:map-marker-outline" />
                      <span className="small-body-text">{evt.location}</span>
                    </div>
                  </div>

                  {evt.totalTickets > 0 && (
                    <>
                      <div className="pe-progress-row">
                        <span className="small-body-text">
                          {evt.ticketsSold} / {evt.totalTickets} tickets
                        </span>
                        <span>{percent}%</span>
                      </div>
                      <div className="pe-progress">
                        <div style={{ width: `${percent}%` }} />
                      </div>
                    </>
                  )}

                  <div className="pe-card-actions">
                    <NavLink to="/promoter/promoter-ticketsetup"><button type="button" className="outlined-button pe-card-btn">
                      Tickets
                    </button></NavLink>
                    <NavLink to="/promoter/promoter-boothlayout"><button type="button" className="outlined-button pe-card-btn">
                      Booths
                    </button></NavLink>
                    {evt?.status?.toLowerCase() === "active" && (
                      <NavLink to="/promoter/promoter-scan"><button type="button" className="outlined-button pe-card-btn pe-scan-btn">
                        Scan
                      </button></NavLink>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

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
        </div>
      </div>
      <PromoterCreateEventModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
      <PromoterEditEventModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        initialEvent={selectedEventToEdit}
      />
    </div>
  );
};

export default PromoterEvents;

