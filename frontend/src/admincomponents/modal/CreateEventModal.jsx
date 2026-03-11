import { useState } from "react";
import { Icon } from "@iconify/react";
import { useEventsContext } from "../hooks/useEventsContext";
import "./CreateEventModal.css";
import "./UploadMapModal.css";
import {
  showSuccessAlert,
  showCancelConfirmAlert,
  showErrorAlert,
  showCreateConfirmAlert,
} from "../utils/sweetAlert";
import { useAuthContext } from "../hooks/useAuthContext";

const CreateEventModal = ({ isOpen, onClose }) => {
  const { dispatch } = useEventsContext();
  const { user } = useAuthContext();

  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [eventType, setEventType] = useState("General Admission");
  const [ticketPrice, setTicketPrice] = useState("");
  const [totalTickets, setTotalTickets] = useState("");
  const [venue, setVenue] = useState({
    name: "",
    address: "",
    city: "",
    zipCode: "",
  });
  const [booths, setBooths] = useState([]);
  const [seatVariations, setSeatVariations] = useState([]);
  const [seatMap, setSeatMap] = useState(null);

  const [imageFile, setImageFile] = useState(null);
  const [imageDragActive, setImageDragActive] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  const [error, setError] = useState("");
  const [emptyFields, setEmptyFields] = useState([]);

  // Image handlers remain the same
  const handleImageDrag = (e) => { e.preventDefault(); e.stopPropagation(); setImageDragActive(e.type === "dragenter" || e.type === "dragover"); };
  const handleImageDrop = (e) => { e.preventDefault(); e.stopPropagation(); setImageDragActive(false); if(e.dataTransfer.files[0]){ const file=e.dataTransfer.files[0]; if(imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl); setImageFile(file); setImagePreviewUrl(URL.createObjectURL(file)); } };
  const handleImageChange = (e) => { e.preventDefault(); if(e.target.files[0]){ const file=e.target.files[0]; if(imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl); setImageFile(file); setImagePreviewUrl(URL.createObjectURL(file)); } };

  // Booths
  const addBooth = () => setBooths([...booths, { size: "", price: 0, quantity: 1 }]);
  const updateBooth = (index, field, value) => { const updated=[...booths]; updated[index][field]=value; setBooths(updated); };
  const removeBooth = (index) => { const updated=[...booths]; updated.splice(index,1); setBooths(updated); };

  // Seat Variations (for Seating Arrangement)
  const addSeat = () => setSeatVariations([...seatVariations, { seatNumber: "", price: "" }]);
  const updateSeat = (index, field, value) => { const updated=[...seatVariations]; updated[index][field]=value; setSeatVariations(updated); };
  const removeSeat = (index) => { const updated=[...seatVariations]; updated.splice(index,1); setSeatVariations(updated); };

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
    venueName: venue.name,
    venueAddress: venue.address,
    venueCity: venue.city,
    venueZip: venue.zipCode
  };

  if (eventType === "General Admission") fieldsToCheck.ticketPrice = ticketPrice;

  if (eventType === "Seating Arrangement") {
    fieldsToCheck.seatVariations = seatVariations.length > 0 ? "ok" : "";
    fieldsToCheck.seatMap = seatMap ? "ok" : "";
  }

  // Validate optional booths
  booths.forEach((b, index) => {
    if (!b.size || !b.price || !b.quantity) {
      fieldsToCheck[`booths[${index}]`] = "";
    }
  });

  const empty = Object.entries(fieldsToCheck)
    .filter(([_, value]) => !value || value === "")
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
  if (endDateTime <= startDateTime) {
    setError("End date/time must be after the start date/time.");
    return;
  }

  if (!user) {
    setError("You must be logged in");
    return;
  }

  const result = await showCreateConfirmAlert(
    "Create Event?",
    `Are you sure you want to create "${title}"?`
  );
  if (!result.isConfirmed) return;

  const eventPayload = {
    title,
    description,
    category,
    venue,
    startDate,
    endDate,
    startTime,
    endTime,
    eventType,
    ticketPrice: Number(ticketPrice) || 0,
    totalTickets: totalTickets
      ? Number(totalTickets)
      : seatVariations.length || 0,
    image: imageFile ? imageFile.name : null,
    seatMap,
    seatVariations: seatVariations.map((s) => ({
      seatNumber: s.seatNumber,
      price: Number(s.price)
    })),
    booths: booths.map((b) => ({
      size: b.size,
      price: Number(b.price),
      quantity: Number(b.quantity)
    })),
  };

  try {
    const response = await fetch("/api/events", {
      method: "POST",
      body: JSON.stringify(eventPayload),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`
      }
    });

    const json = await response.json();

    if (!response.ok) {
      setError(json.error || "Failed to create event.");
      setEmptyFields(json.emptyFields || []);
      await showErrorAlert(
        "Error Creating Event",
        json.error || "Failed to create event."
      );
      return;
    }

    setTitle("");
    setDescription("");
    setCategory("");
    setStartDate(today);
    setEndDate(today);
    setStartTime("");
    setEndTime("");
    setTicketPrice("");
    setTotalTickets("");

    setVenue({ name: "", address: "", city: "", zipCode: "" });
    setBooths([]);
    setSeatVariations([]);
    setSeatMap(null);

    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(null);
    setImagePreviewUrl(null);
    setError(null);
    setEmptyFields([]);

    await showSuccessAlert(
      "Event Created",
      "The event has been created successfully."
    );

    onClose();

    dispatch({ type: "CREATE_EVENT", payload: json.event });
  } catch (err) {
    setError("Network error. Please try again.");
    await showErrorAlert("Network Error", "Unable to connect to the server.");
  }
};

  if(!isOpen) return null;

  return (
    <div className="general-modal-overlay">
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
            if (result.isConfirmed) onClose();
          } else onClose();
        }}
      >
        <Icon icon="mdi:close" />
      </button>
    </div>

    <form className="add-event-modal-body add-event-form" onSubmit={handleSubmit}>
      
      {/* Event Image */}
      <div className="section-box">
        <h5 className="modal-section-title">Event Image</h5>
        <div
          className={`upload-area ${imageDragActive ? "drag-active" : ""}`}
          onDragEnter={handleImageDrag}
          onDragLeave={handleImageDrag}
          onDragOver={handleImageDrag}
          onDrop={handleImageDrop}
          onClick={() => document.getElementById("event-image-input")?.click()}
        >
          <input
            id="event-image-input"
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
                  style={{ width: "100%", maxHeight: "300px", objectFit: "contain", borderRadius: "8px" }}
                />
              ) : (
                <Icon icon="mdi:file-image" width="48" height="48" className="preview-icon" />
              )}
              <p className="file-name">{imageFile.name}</p>
              <p className="file-size">{((imageFile.size || 0) / 1024 / 1024).toFixed(2)} MB</p>
              <button type="button" className="remove-file-btn" onClick={(e) => {
                e.stopPropagation();
                if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
                setImageFile(null);
                setImagePreviewUrl(null);
              }}>Remove</button>
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

      {/* Title & Category */}
      <div className="add-event-form-row">
        <div className="add-event-form-group">
          <h6>Event Title</h6>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Tech Summit 2024" className={emptyFields.includes("title") ? "error" : ""} />
        </div>
        <div className="add-event-form-group">
          <h6>Category</h6>
          <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Concert, Conference, Festival" className={emptyFields.includes("category") ? "error" : ""} />
        </div>
      </div>

      {/* Dates */}
      <div className="add-event-form-row">
        <div className="add-event-form-group">
          <h6>Start Date</h6>
          <input type="date" min={today} value={startDate} onChange={(e) => { setStartDate(e.target.value); if (endDate < e.target.value) setEndDate(e.target.value); }} className={emptyFields.includes("startDate") ? "error" : ""} />
        </div>
        <div className="add-event-form-group">
          <h6>End Date</h6>
          <input type="date" min={startDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} className={emptyFields.includes("endDate") ? "error" : ""} />
        </div>
      </div>

      {/* Times */}
      <div className="add-event-form-row">
        <div className="add-event-form-group">
          <h6>Start Time</h6>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={emptyFields.includes("startTime") ? "error" : ""} />
        </div>
        <div className="add-event-form-group">
          <h6>End Time</h6>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={emptyFields.includes("endTime") ? "error" : ""} />
        </div>
      </div>

      {/* Description */}
      <div className="add-event-form-group add-event-full-width">
        <h6>About The Event</h6>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Event description..." rows="3" className={emptyFields.includes("description") ? "error" : ""}></textarea>
      </div>

      {/* Venue */}
      <div className="section-box">
        <h5 className="modal-section-title">Venue Details</h5>
        <div className="add-event-form-group">
          <input type="text" placeholder="Venue Name" value={venue.name} onChange={(e) => setVenue({ ...venue, name: e.target.value })} className={emptyFields.includes("venueName") ? "error" : ""} />
        </div>
        <div className="add-event-form-group">
          <input type="text" placeholder="Street Address" value={venue.address} onChange={(e) => setVenue({ ...venue, address: e.target.value })} className={emptyFields.includes("venueAddress") ? "error" : ""} />
        </div>
        <div className="add-event-form-row">
          <div className="add-event-form-group">
            <input type="text" placeholder="City" value={venue.city} onChange={(e) => setVenue({ ...venue, city: e.target.value })} className={emptyFields.includes("venueCity") ? "error" : ""} />
          </div>
          <div className="add-event-form-group">
            <input type="text" placeholder="Zip Code" value={venue.zipCode} onChange={(e) => setVenue({ ...venue, zipCode: e.target.value })} className={emptyFields.includes("venueZip") ? "error" : ""} />
          </div>
        </div>
      </div>

      {/* Event Type */}
      <div className="add-event-form-group">
  <h6>Event Type</h6>
  <div style={{ display: "flex", gap: "20px", marginTop: "5px" }}>
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "5px",
        cursor: "pointer",
        color: "black", // text color
      }}
    >
      <input
        type="radio"
        name="eventType"
        value="General Admission"
        checked={eventType === "General Admission"}
        onChange={() => setEventType("General Admission")}
      />
      General Admission
    </label>
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "5px",
        cursor: "pointer",
        color: "black", // text color
      }}
    >
      <input
        type="radio"
        name="eventType"
        value="Seating Arrangement"
        checked={eventType === "Seating Arrangement"}
        onChange={() => setEventType("Seating Arrangement")}
      />
      Assigned Seating
    </label>
  </div>
</div>

      {/* Ticket Price / Total Tickets */}
      {eventType === "General Admission" && (
        <div className="add-event-form-row">
          <div className="add-event-form-group">
            <h6>Ticket Price ($)</h6>
            <input type="number" min="0" value={ticketPrice === 0 ? "" : ticketPrice} onChange={(e) => setTicketPrice(e.target.value === "" ? "" : Number(e.target.value))} className={emptyFields.includes("ticketPrice") ? "error" : ""} />
          </div>
          <div className="add-event-form-group">
            <h6>Total Capacity</h6>
            <input type="number" min="1" value={totalTickets === 0 ? "" : totalTickets} onChange={(e) => setTotalTickets(e.target.value === "" ? "" : Number(e.target.value))} className={emptyFields.includes("totalTickets") ? "error" : ""} />
          </div>
        </div>
      )}

      {/* Seating Arrangement */}
      {eventType === "Seating Arrangement" && (
        <div className="section-box">
          <h5 className="modal-section-title">Seat Map & Variations</h5>
          {seatVariations.map((seat, index) => (
            <div key={index} className="booth-row">
              <input type="text" placeholder="Seat Number" value={seat.seatNumber} onChange={e => updateSeat(index, "seatNumber", e.target.value)} />
              <input type="number" placeholder="Price" value={seat.price} onChange={e => updateSeat(index, "price", e.target.value)} />
              <button type="button" onClick={() => removeSeat(index)}>Remove</button>
            </div>
          ))}
          <button type="button" onClick={addSeat}>Add Seat</button>
        </div>
      )}

      {/* Optional Booths */}
      <div className="section-box">
        <h5 className="modal-section-title">Booths (Optional)</h5>
        {booths.map((booth, index) => (
          <div key={index} className="booth-row">
            <input type="text" placeholder="Size" value={booth.size} onChange={e => updateBooth(index, "size", e.target.value)} />
            <input type="number" placeholder="Price" min="0" value={booth.price} onChange={e => updateBooth(index, "price", e.target.value)} />
            <input type="number" placeholder="Quantity" min="1" value={booth.quantity} onChange={e => updateBooth(index, "quantity", e.target.value)} />
            <button type="button" onClick={() => removeBooth(index)}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={addBooth}>Add Booth</button>
      </div>

      {error && <div className="error-message" style={{ color: "red", marginTop: "10px" }}>{error}</div>}

      <div className="general-event-modal-footer">
        <button type="button" className="button cancel-btn" onClick={onClose}>Cancel</button>
        <button type="submit" className="primary-button save-btn">Create Event</button>
      </div>
    </form>
  </div>
</div>
  );
};

export default CreateEventModal;
