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
import AddPriceLevelModal from "./AddPriceLevelModal";
import EditPriceLevelModal from "./EditPriceLevelModal";

const CreateEventModal = ({ isOpen, onClose }) => {
  const { dispatch } = useEventsContext();
  const { user } = useAuthContext();

  const today = new Date().toISOString().split("T")[0];

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [eventType, setEventType] = useState("");
  const [venue, setVenue] = useState({
    name: "",
    address: "",
    city: "",
    zipCode: "",
  });
  const [seatMap, setSeatMap] = useState({ sections: [] });
  const [booths, setBooths] = useState([]);
  const [priceLevels, setPriceLevels] = useState([]);

  const [imageFile, setImageFile] = useState(null);
  const [imageDragActive, setImageDragActive] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  const [activeTab, setActiveTab] = useState("information");
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);

  const [formData, setFormData] = useState({
    priceName: "",
    color: "#000000",
    facePrice: 0,
    serviceCharge: 0,
    quantityAvailable: 0,
    quantitySold: 0,
  });

  const [error, setError] = useState("");
  const [emptyFields, setEmptyFields] = useState([]);

  // Image handlers remain the same
  const handleImageDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImageDragActive(e.type === "dragenter" || e.type === "dragover");
  };
  const handleImageDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImageDragActive(false);
    if (e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };
  const handleImageChange = (e) => {
    e.preventDefault();
    if (e.target.files[0]) {
      const file = e.target.files[0];
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };


const handleSave = (levelData) => {
  const newLevel = {
    ...levelData,
    tempId: `temp-${crypto.randomUUID()}`,
  };
  setPriceLevels([...priceLevels, newLevel]);
  setShowPriceModal(false);
};

const handleEditPriceLevel = (index) => {
   setEditingIndex(index);
  setEditingLevel(priceLevels[index]); // Assuming 'priceLevels' is your array
  setIsEditModalOpen(true);
};

// Use this for Editing (which you already have)
const handleUpdatePriceLevel = (updatedData) => {
  const updatedList = [...priceLevels];
  updatedList[editingIndex] = updatedData;
  setPriceLevels(updatedList);
  setIsEditModalOpen(false);
  setEditingIndex(null); // Clear the index
};

const handleDelete = (index) => {
    setPriceLevels(priceLevels.filter((_, i) => i !== index));
  };

  

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setEmptyFields([]);

    const fieldsToCheck = {
      title,
      description,
      category,
      startDate,
      endDate,
      startTime,
      endTime,
      eventType,
      venueName: venue.name,
      venueAddress: venue.address,
      venueCity: venue.city,
      venueZip: venue.zipCode,
    };

    const empty = Object.entries(fieldsToCheck)
      .filter(
        ([_, value]) => value === "" || value === null || value === undefined,
      )
      .map(([key]) => key);

    if (empty.length > 0) {
      setEmptyFields(empty);
      setError("Please fill in all required fields.");
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    if (endDateTime <= startDateTime) {
      setError("End date/time must be after the start date/time.");
      return;
    }

    if (!user) {
      setError("You must be logged in.");
      return;
    }

    const priceLevelIds = priceLevels.map((p) => String(p.tempId || p._id));

    if (eventType === "General Admission" && priceLevels.length > 2) {
      setError("General Admission allows a maximum of 2 price levels only.");
      return;
    }

    if (
      eventType === "Seating Arrangement" &&
      seatMap &&
      seatMap.sections?.length > 0
    ) {
      for (const section of seatMap.sections) {
        const seats = section.seats || [];
        for (const seat of seats) {
          if (seat && !seat.id && !seat._id) {
            setError("Each seat in the map must have an identifier.");
            return;
          }
          if (
            seat.priceLevelId &&
            !priceLevelIds.includes(String(seat.priceLevelId))
          ) {
            setError("Invalid seat price level assignment.");
            return;
          }
        }
      }
    }

    if (booths && booths.length > 0) {
      for (const booth of booths) {
        if (
          booth.priceLevelId &&
          !priceLevelIds.includes(String(booth.priceLevelId))
        ) {
          setError(
            "One or more booths have an invalid price level assignment.",
          );
          return;
        }
      }
    }

    const result = await showCreateConfirmAlert(
      "Create Event?",
      `Are you sure you want to create "${title}"?`,
    );
    if (!result.isConfirmed) return;

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("startDate", startDate);
      formData.append("endDate", endDate);
      formData.append("startTime", startTime);
      formData.append("endTime", endTime);
      formData.append("eventType", eventType);
      formData.append("venue", JSON.stringify(venue));

      // Sends seatMap if Seating Arrangement, otherwise null
      formData.append(
        "seatMap",
        JSON.stringify(eventType === "Seating Arrangement" ? seatMap : null),
      );
      formData.append("priceLevels", JSON.stringify(priceLevels));
      formData.append("booths", JSON.stringify(booths || []));

      if (imageFile) formData.append("image", imageFile);

      const response = await fetch("/api/events", {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${user.token}` },
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.error || "Failed to create event.");
        await showErrorAlert(
          "Error Creating Event",
          json.error || "Failed to create event.",
        );
        return;
      }

      onClose();
      showSuccessAlert(
        "Event Created",
        "The event has been created successfully.",
      );
      dispatch({ type: "CREATE_EVENT", payload: json.event });
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
      await showErrorAlert("Network Error", "Unable to connect to the server.");
    }
  };

  if (!isOpen) return null;

  const eventDetailsTabs = [
    { id: "information", label: "Information" },
    { id: "tickets", label: "Tickets" },
  ];

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

        <div className="em-content">
          <div className="tabs-container">
            {eventDetailsTabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {activeTab === "information" && (
            <form
              className="add-event-modal-body add-event-form"
              onSubmit={handleSubmit}
            >
              <div className="add-event-form-group">
                <h6>Event Type</h6>
                <div style={{ display: "flex", gap: "20px" }}>
                  {["General Admission", "Seating Arrangement"].map((type) => (
                    <label
                      key={type}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        cursor: "pointer",
                        color: "black",
                      }}
                    >
                      <input
                        type="radio"
                        name="eventType"
                        value={type}
                        checked={eventType === type}
                        onChange={() => setEventType(type)}
                      />
                      {type === "Seating Arrangement"
                        ? "Assigned Seating"
                        : type}
                    </label>
                  ))}
                </div>
              </div>

              <div className="section-box">
                <div
                  className={`upload-area ${imageDragActive ? "drag-active" : ""}`}
                  onDragEnter={handleImageDrag}
                  onDragLeave={handleImageDrag}
                  onDragOver={handleImageDrag}
                  onDrop={handleImageDrop}
                  onClick={() =>
                    document.getElementById("event-image-input")?.click()
                  }
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
                          style={{
                            width: "100%",
                            maxHeight: "300px",
                            objectFit: "contain",
                            borderRadius: "8px",
                          }}
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
                          if (imagePreviewUrl)
                            URL.revokeObjectURL(imagePreviewUrl);
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
                      <p className="upload-title">
                        Click or drag an image here
                      </p>
                      <p className="upload-subtitle">
                        PNG, JPG, WEBP up to 5MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Title & Category */}
              <div className="add-event-form-row">
                <div className="add-event-form-group">
                  <h6>Event Title</h6>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Tech Summit 2024"
                    className={emptyFields.includes("title") ? "error" : ""}
                  />
                </div>

                <div className="add-event-form-group">
                  <h6>Category</h6>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Concert, Conference, Festival"
                    className={emptyFields.includes("category") ? "error" : ""}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="add-event-form-row">
                <div className="add-event-form-group">
                  <h6>Start Date</h6>
                  <input
                    type="date"
                    min={today}
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (endDate < e.target.value) setEndDate(e.target.value);
                    }}
                    className={emptyFields.includes("startDate") ? "error" : ""}
                  />
                </div>
                <div className="add-event-form-group">
                  <h6>End Date</h6>
                  <input
                    type="date"
                    min={startDate}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={emptyFields.includes("endDate") ? "error" : ""}
                  />
                </div>
              </div>

              {/* Times */}
              <div className="add-event-form-row">
                <div className="add-event-form-group">
                  <h6>Start Time</h6>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={emptyFields.includes("startTime") ? "error" : ""}
                  />
                </div>
                <div className="add-event-form-group">
                  <h6>End Time</h6>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={emptyFields.includes("endTime") ? "error" : ""}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="add-event-form-group add-event-full-width">
                <h6>About the Event</h6>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Event description..."
                  rows="3"
                  className={emptyFields.includes("description") ? "error" : ""}
                ></textarea>
              </div>

              {/* Venue */}
              <div className="add-event-form-group add-event-full-width">
                <h6>Venue Details</h6>
                <input
                  type="text"
                  placeholder="Venue Name"
                  value={venue.name}
                  onChange={(e) => setVenue({ ...venue, name: e.target.value })}
                  className={emptyFields.includes("venueName") ? "error" : ""}
                />
                <input
                  type="text"
                  placeholder="Street Address"
                  value={venue.address}
                  onChange={(e) =>
                    setVenue({ ...venue, address: e.target.value })
                  }
                  className={
                    emptyFields.includes("venueAddress") ? "error" : ""
                  }
                />
                <div className="add-event-form-row">
                  <input
                    type="text"
                    placeholder="City"
                    value={venue.city}
                    onChange={(e) =>
                      setVenue({ ...venue, city: e.target.value })
                    }
                    className={emptyFields.includes("venueCity") ? "error" : ""}
                  />
                  <input
                    type="text"
                    placeholder="Zip Code"
                    value={venue.zipCode}
                    onChange={(e) =>
                      setVenue({ ...venue, zipCode: e.target.value })
                    }
                    className={emptyFields.includes("venueZip") ? "error" : ""}
                  />
                </div>
              </div>

              {/* Display errors */}
              {error && (
                <div style={{ color: "red", marginTop: "10px" }}>{error}</div>
              )}
              <div className="general-event-modal-footer">
                <button
                  type="button"
                  className="button cancel-btn"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button save-btn">
                  Create Event
                </button>
              </div>
            </form>
          )}

          {activeTab === "tickets" && (
            <div className="add-event-modal-body">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                }}
              >
                <h6>Price Levels</h6>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    setEditingIndex(null); // Ensure we aren't in "edit mode"
                    setShowPriceModal(true);
                  }}
                >
                  <Icon icon="mdi:plus" /> Add Price Level
                </button>
              </div>

              {priceLevels.length === 0 ? (
                <p className="no-data-text">
                  No Price Levels added. Click "Add Level" to start.
                </p>
              ) : (
                <div className="price-levels-list">
                  {priceLevels.map((level, index) => (
                    <div
                      key={level.tempId || index}
                      className="ticket-level-card"
                    >
                      <div className="level-info">
                        <span
                          className="color-indicator"
                          style={{ backgroundColor: level.color }}
                        ></span>
                        <div>
                          <strong>{level.priceName}</strong>
                          <p>
                            ${level.facePrice} (+${level.serviceCharge}) • Qty:{" "}
                            {level.quantityAvailable}
                          </p>
                        </div>
                      </div>
                      <div className="level-actions">
                        <button
                          type="button"
                          className="edit-icon-btn"
                          onClick={() => handleEditPriceLevel(index)}
                        >
                          <Icon icon="mdi:pencil" />
                        </button>
                        <button
                          type="button"
                          className="delete-icon-btn"
                          onClick={() => handleDelete(index)}
                        >
                          <Icon icon="mdi:trash-can" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

         <AddPriceLevelModal
  isOpen={showPriceModal}
  onClose={() => setShowPriceModal(false)}
  onSave={handleSave}
/>

{/* KEEP THIS: This is your actual edit handler */}
<EditPriceLevelModal
  isOpen={isEditModalOpen}
  initialData={editingLevel}
  onClose={() => setIsEditModalOpen(false)}
  onSave={handleUpdatePriceLevel}
/>
        </div>
      </div>
    </div>
  );
};

export default CreateEventModal;
