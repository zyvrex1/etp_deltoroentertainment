import { useState } from "react";
import { Icon } from "@iconify/react";
import { useEventsContext } from "../hooks/useEventsContext";
import "./CreateEventModal.css";
import { showSuccessAlert, showCancelConfirmAlert, showErrorAlert, showCreateConfirmAlert } from "../utils/sweetAlert";

const CreateEventModal = ({ isOpen, onClose }) => {
  const { dispatch } = useEventsContext();

  const today = new Date().toISOString().split("T")[0];

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("other");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [totalTickets, setTotalTickets] = useState("");
  const [venue, setVenue] = useState({
    name: "",
    address: "",
    city: "",
    zipCode: "",
  });

  const [error, setError] = useState("");
  const [emptyFields, setEmptyFields] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fieldsToCheck = {
      title,
      category,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      ticketPrice,
      totalTickets,
      venueName: venue.name,
      venueAddress: venue.address,
      venueCity: venue.city,
      venueZip: venue.zipCode,
    };

    const empty = Object.entries(fieldsToCheck)
      .filter(([key, value]) => value === "" || value === null)
      .map(([key]) => key);

    if (empty.length > 0) {
      setEmptyFields(empty);
      setError("Please fill in all required fields.");
      return;
    }

    setEmptyFields([]); // clear previous errors
    setError("");

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    if (endDate < startDate) {
      setError("End date cannot be earlier than start date.");
      return;
    }

    const result = await showCreateConfirmAlert(
      'Create Event?',
      `Are you sure you want to create "${title}"?`
    );

    if (!result.isConfirmed) {
      return;
    }

    const event = {
      title,
      description,
      category,
      venue: {
        name: venue.name,
        address: venue.address,
        city: venue.city,
        zipCode: venue.zipCode,
      },
      startDate,
      endDate,
      startTime: startDateTime,
      endTime: endDateTime,
      ticketPrice: Number(ticketPrice),
      totalTickets: Number(totalTickets),
    };

    const response = await fetch("/api/events", {
      method: "POST",
      body: JSON.stringify(event),
      headers: { "Content-Type": "application/json" },
    });

    const json = await response.json();

    if (!response.ok) {
      setError(json.error);
      setEmptyFields(json.emptyFields || []);
      await showErrorAlert('Error Creating Event', json.error || 'Failed to create event.');
    } else {
      // Reset form on success
      setTitle("");
      setDescription("");
      setVenue({ name: "", address: "", city: "", zipCode: "" });
      setStartTime("");
      setEndTime("");
      setStartDate(today);
      setEndDate(today);
      setTicketPrice("");
      setTotalTickets("");
      setError(null);
      setEmptyFields([]);
      await showSuccessAlert('Event Created', 'The event has been created successfully.');
      onClose();
      dispatch({ type: "CREATE_EVENT", payload: json });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="general-modal-overlay">
      <div className="general-event-modal-container">
        <div className="general-modal-header">
          <h3>Create New Event</h3>
          <button className="close-btn" onClick={async () => {
            const hasChanges = title || description || venue.name || startTime || endTime || ticketPrice || totalTickets;
            if (hasChanges) {
              const result = await showCancelConfirmAlert();
              if (result.isConfirmed) {
                onClose();
              }
            } else {
              onClose();
            }
          }}>
            <Icon icon="mdi:close" />
          </button>
        </div>

        <form className="add-event-modal-body add-event-form" onSubmit={handleSubmit}>
          <div className="add-event-form-row">
            <div className="add-event-form-group">
              <h6>Event Title</h6>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Tech Summit 2024"
                className={emptyFields.includes("title") ? "error" : ""}
              />
            </div>
            <div className="add-event-form-group">
              <h6>Category</h6>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={emptyFields.includes("category") ? "error" : ""}
              >
                <option value="concert">Concert</option>
                <option value="comedy">Comedy</option>
                <option value="festival">Festival</option>
                <option value="conference">Conference</option>
                <option value="sports">Sports</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="add-event-form-row">
            <div className="add-event-form-group">
              <h6>Start Date</h6>
              <input
                type="date"
                required
                min={today}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate < e.target.value) {
                    setEndDate(e.target.value);
                  }
                }}
                className={emptyFields.includes("startDate") ? "error" : ""}
              />
            </div>
            <div className="add-event-form-group">
              <h6>End Date</h6>
              <input
                type="date"
                required
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={emptyFields.includes("endDate") ? "error" : ""}
              />
            </div>
          </div>

          <div className="add-event-form-row">
            <div className="add-event-form-group">
              <h6>Start Time</h6>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={emptyFields.includes("startTime") ? "error" : ""}
              />
            </div>
            <div className="add-event-form-group">
              <h6>End Time</h6>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={emptyFields.includes("endTime") ? "error" : ""}
              />
            </div>
          </div>

          <div className="section-box">
            <h5 className="modal-section-title">Venue Details</h5>
            <div className="add-event-form-group">
              <input
                type="text"
                placeholder="Venue Name"
                required
                value={venue.name}
                onChange={(e) => setVenue({ ...venue, name: e.target.value })}
                className={emptyFields.includes("venue") ? "error" : ""}
              />
            </div>

            <div className="add-event-form-group">
              <input
                type="text"
                placeholder="Street Address"
                required
                value={venue.address}
                onChange={(e) =>
                  setVenue({ ...venue, address: e.target.value })
                }
                className={emptyFields.includes("venue") ? "error" : ""}
              />
            </div>

            <div className="add-event-form-row">
              <div className="add-event-form-group">
                <input
                  type="text"
                  placeholder="City"
                  value={venue.city}
                  onChange={(e) => setVenue({ ...venue, city: e.target.value })}
                  className={emptyFields.includes("venue") ? "error" : ""}
                />
              </div>
              <div className="add-event-form-group">
                <input
                  type="text"
                  placeholder="Zip Code"
                  value={venue.zipCode}
                  onChange={(e) => setVenue({ ...venue, zipCode: e.target.value })}
                  className={emptyFields.includes("venue") ? "error" : ""}
                />
              </div>
            </div>
          </div>

          <div className="add-event-form-group">
            <div className="add-event-form-group">
              <h6>Ticket Price ($)</h6>
              <input
                type="number"
                min="0"
                // Use an empty string if value is 0 or empty to keep the field clean
                value={ticketPrice === 0 ? "" : ticketPrice}
                onChange={(e) => {
                  const val = e.target.value;
                  // Allow empty string so user can backspace everything
                  setTicketPrice(val === "" ? "" : Number(val));
                }}
                className={emptyFields.includes("ticketPrice") ? "error" : ""}
              />
            </div>

            <div className="add-event-form-group">
              <h6>Total Capacity</h6>
              <input
                type="number"
                min="1"
                value={totalTickets === 0 ? "" : totalTickets}
                onChange={(e) => {
                  const val = e.target.value;
                  setTotalTickets(val === "" ? "" : Number(val));
                }}
                className={emptyFields.includes("totalTickets") ? "error" : ""}
              />
            </div>
          </div>

          <div className="add-event-form-group add-event-full-width">
            <h6>About The Event</h6>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Event description..."
              rows="4"
              className={emptyFields.includes("description") ? "error" : ""}
            ></textarea>
          </div>

          {error && (
            <div
              className="error-message"
              style={{ color: "red", marginTop: "10px" }}
            >
              {error}
            </div>
          )}

          <div className="general-event-modal-footer">
            <button
              type="button"
              className="button cancel-btn"
              onClick={async () => {
                const hasChanges = title || description || venue.name || startTime || endTime || ticketPrice || totalTickets;
                if (hasChanges) {
                  const result = await showCancelConfirmAlert();
                  if (result.isConfirmed) {
                    onClose();
                  }
                } else {
                  onClose();
                }
              }}
            >
              Cancel
            </button>
            <button type="submit" className="primary-button save-btn">
              Create Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;
