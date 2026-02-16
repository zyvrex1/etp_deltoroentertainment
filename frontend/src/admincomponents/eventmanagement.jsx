import { useState } from "react";
import { Icon } from "@iconify/react";
import "./eventmanagement.css";
import CreateEventModal from './CreateEventModal';


const EventManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const events = [
    {
      id: 1,
      name: "TechStart Summit 2024",
      location: "Moscone Center, SF",
      promoter: "Sarah Chen",
      date: "Oct 12, 2024",
      status: "live",
      sold: 450,
      total: 600,
      revenue: "$103,550.00",
    },
    {
      id: 2,
      name: "Creator Economy Expo",
      location: "Austin Convention Center",
      promoter: "David Kim",
      date: "Nov 25, 2024",
      status: "pending",
      sold: 0,
      total: 500,
      revenue: "$0.00",
    },
    {
      id: 3,
      name: "Summer Music Festival",
      location: "Hyde Park, London",
      promoter: "David Kim",
      date: "Jul 20, 2024",
      status: "completed",
      sold: 5000,
      total: 5000,
      revenue: "$250,000.00",
    },
    {
      id: 4,
      name: "AI Innovation Conference",
      location: "Javits Center, NYC",
      promoter: "Sarah Chen",
      date: "Dec 10, 2024",
      status: "live",
      sold: 300,
      total: 500,
      revenue: "$75,000.00",
    },
    {
      id: 5,
      name: "Startup Pitch Night",
      location: "WeWork, SF",
      promoter: "Maria Santos",
      date: "Oct 30, 2024",
      status: "live",
      sold: 30,
      total: 100,
      revenue: "$1,500.00",
    },
    {
      id: 6,
      name: "Global Marketing Summit",
      location: "Marina Bay Sands, Singapore",
      promoter: "Liam Carter",
      date: "Jan 15, 2025",
      status: "pending",
      sold: 120,
      total: 800,
      revenue: "$18,750.00",
    },
  ];

  const filteredEvents = events.filter((event) => {
    const q = searchQuery.toLowerCase();
    return (
      event.name.toLowerCase().includes(q) ||
      event.location.toLowerCase().includes(q) ||
      event.promoter.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getSalesPercent = (sold, total) => {
    if (!total) return 0;
    return Math.min(100, Math.round((sold / total) * 100));
  };

  const getStatusClass = (status) => {
    if (status === "live") return "button-label status-live";
    if (status === "pending") return "button-label status-pending";
    if (status === "completed") return "button-label status-completed";
    return "status-badge";
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="event-management">
      <div className="eventmanagement-header">
        <div>
          <h1>Event Management</h1>
          <p>Manage all events, tickets, and booth layouts.</p>
        </div>
        <div className="dashboard-actions">
          <button className="primary-button" onClick={() => setIsModalOpen(true)}>Create Event</button>

        </div>
      </div>

      <div className="em-content">
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

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Promoter</th>
                <th>Date</th>
                <th>Status</th>
                <th>Sales</th>
                <th>Revenue</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEvents.map((event) => (
                <tr key={event.id}>
                  <td data-label="Event">
                    <div className="event-cell">
                      <h6 className="event-name">{event.name}</h6>
                      <p className="smaller-body-text event-location">{event.location}</p>
                    </div>
                  </td>
                  <td data-label="Promoter" className="regular-body-text">{event.promoter}</td>
                  <td data-label="Date" className="small-body-text" >{event.date}</td>
                  <td data-label="Status">
                    <span className={getStatusClass(event.status)}>{event.status}</span>
                  </td>
                  <td data-label="Sales">
                    <div className="sales-cell">
                      <span className="small-body-text sales-label">
                        {event.sold} / {event.total}
                      </span>
                      <div className="sales-bar">
                        <div
                          className="sales-bar-inner"
                          style={{ width: `${getSalesPercent(event.sold, event.total)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td data-label="Revenue" className="regular-body-text revenue">{event.revenue}</td>
                  <td data-label="Actions">
                    <div className="em-actions">
                      <button className="em-action-btn" aria-label="Edit event">
                        <Icon icon="mdi:square-edit-outline" />
                      </button>
                      <button className="em-action-btn" aria-label="More actions">
                        <Icon icon="mdi:dots-horizontal" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
    </div>
  );
};

export default EventManagement;
