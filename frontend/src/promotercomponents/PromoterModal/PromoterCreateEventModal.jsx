import { useState } from "react";
import { Icon } from "@iconify/react";
import "./PromoterCreateEventModal.css"

import {
  showSuccessAlert,
  showCancelConfirmAlert,
  showErrorAlert,
  showCreateConfirmAlert,
} from "../../admincomponents/utils/sweetAlert";

const PromoterCreateEventModal = ({ isOpen, onClose }) => {
  // const { dispatch } = useEventsContext();

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

  const [imageFile, setImageFile] = useState(null);
  const [imageDragActive, setImageDragActive] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  const [error, setError] = useState("");
  const [emptyFields, setEmptyFields] = useState([]);

  const handleImageDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setImageDragActive(true);
    } else if (e.type === "dragleave") {
      setImageDragActive(false);
    }
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImageDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const url = URL.createObjectURL(file);
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      setImageFile(file);
      setImagePreviewUrl(url);
    }
  };

  const handleImageChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      setImageFile(file);
      setImagePreviewUrl(url);
    }
  };

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
      .filter(([, value]) => value === "" || value === null)
      .map(([key]) => key);

    if (empty.length > 0) {
      setEmptyFields(empty);
      setError("Please fill in all required fields.");
      return;
    }

    setEmptyFields([]);
    setError("");

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    if (endDate < startDate) {
      setError("End date cannot be earlier than start date.");
      return;
    }

    const result = await showCreateConfirmAlert(
      "Create Event?",
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
      imageUrl: imageFile ? imageFile.name : undefined,
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
      await showErrorAlert(
        "Error Creating Event",
        json.error || "Failed to create event."
      );
    } else {
      setTitle("");
      setDescription("");
      setVenue({ name: "", address: "", city: "", zipCode: "" });
      setStartTime("");
      setEndTime("");
      setStartDate(today);
      setEndDate(today);
      setTicketPrice("");
      setTotalTickets("");
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      setImageFile(null);
      setImagePreviewUrl(null);
      setError(null);
      setEmptyFields([]);
      await showSuccessAlert(
        "Event Created",
        "The event has been created successfully."
      );
      onClose();
      dispatch({ type: "CREATE_EVENT", payload: json });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="pe-general-modal-overlay">
      <div className="general-event-modal-container">
        <div className="general-modal-header">
          <h3>Create New Event</h3>
          <button
            className="close-btn"
            onClick={async () => {
              const hasChanges =
                title ||
                description ||
                venue.name ||
                startTime ||
                endTime ||
                ticketPrice ||
                totalTickets ||
                imageFile;
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
            <Icon icon="mdi:close" />
          </button>
        </div>

        <form
          className="add-event-modal-body add-event-form"
          onSubmit={handleSubmit}
        >
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
                onChange={(e) =>
                  setVenue({ ...venue, name: e.target.value })
                }
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
                  onChange={(e) =>
                    setVenue({ ...venue, city: e.target.value })
                  }
                  className={emptyFields.includes("venue") ? "error" : ""}
                />
              </div>
              <div className="add-event-form-group">
                <input
                  type="text"
                  placeholder="Zip Code"
                  value={venue.zipCode}
                  onChange={(e) =>
                    setVenue({ ...venue, zipCode: e.target.value })
                  }
                  className={emptyFields.includes("venue") ? "error" : ""}
                />
              </div>
            </div>
          </div>

          <div className="section-box">
            <h5 className="modal-section-title">Event Image</h5>
            <div
              className={`upload-area ${
                imageDragActive ? "drag-active" : ""
              }`}
              onDragEnter={handleImageDrag}
              onDragLeave={handleImageDrag}
              onDragOver={handleImageDrag}
              onDrop={handleImageDrop}
              onClick={() =>
                document.getElementById("promoter-event-image-input")?.click()
              }
            >
              <input
                id="promoter-event-image-input"
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />

              {imageFile ? (
                <div className="file-preview">
                  {imagePreviewUrl ? (
                    <img
                      src={imagePreviewUrl}
                      alt="Event Preview"
                      className="preview-image"
                    />
                  ) : (
                    <Icon
                      icon="mdi:file-image"
                      width="48"
                      height="48"
                      className="preview-icon"
                    />
                  )}
                  <p className="file-name">{imageFile.name}</p>
                  <p className="file-size">
                    {((imageFile.size || 0) / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    className="remove-file-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (imagePreviewUrl) {
                        URL.revokeObjectURL(imagePreviewUrl);
                      }
                      setImageFile(null);
                      setImagePreviewUrl(null);
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <div className="icon-circle">
                    <Icon icon="mdi:image-area" width="32" height="32" />
                  </div>
                  <p className="upload-title">Click or drag an image here</p>
                  <p className="upload-subtitle">PNG, JPG, WEBP up to 5MB</p>
                </div>
              )}
            </div>
          </div>

          <div className="add-event-form-group">
            <div className="add-event-form-group">
              <h6>Ticket Price ($)</h6>
              <input
                type="number"
                min="0"
                value={ticketPrice === 0 ? "" : ticketPrice}
                onChange={(e) => {
                  const val = e.target.value;
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
                const hasChanges =
                  title ||
                  description ||
                  venue.name ||
                  startTime ||
                  endTime ||
                  ticketPrice ||
                  totalTickets ||
                  imageFile;
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

export default PromoterCreateEventModal;

