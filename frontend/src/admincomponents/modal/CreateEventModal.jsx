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

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [venue, setVenue] = useState({
    name: "",
    address: "",
    city: "",
    zipCode: "",
  });
  const [seatMap, setSeatMap] = useState({ sections: [] });
  const [booths, setBooths] = useState([]);

  const [imageFile, setImageFile] = useState(null);
  const [imageDragActive, setImageDragActive] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);


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
      formData.append("venue", JSON.stringify(venue));
      // Sends seatMap if present
      formData.append(
        "seatMap",
        JSON.stringify(seatMap || null),
      );
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

          <form
            className="add-event-modal-body add-event-form"
            onSubmit={handleSubmit}
          >
              {/* Image Upload Area */}

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



        </div>
      </div>
  );
};

export default CreateEventModal;
