import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useEventsContext } from "../../hooks/useEventsContext";
import "./CreateEventModal.css";
import "./UploadMapModal.css";
import {
  showSuccessAlert,
  showCancelConfirmAlert,
  showErrorAlert,
  showCreateConfirmAlert,
} from "../../utils/sweetAlert";
import { useAuthContext } from "../../hooks/useAuthContext";

const CreateEventModal = ({ isOpen, onClose }) => {
  const { dispatch } = useEventsContext();
  const { user } = useAuthContext();

  const today = new Date().toISOString().split("T")[0];
  const currentTime = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("General Admission");
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
  const [errors, setErrors] = useState({});

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const clearError = (fieldName) => {
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

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

// 1. Define the reset function outside handleSubmit so it's reusable
const resetForm = () => {
  setTitle("");
  setEventType("General Admission");
  setDescription("");
  setCategory("");
  setStartDate(today);
  setEndDate(today);
  setStartTime("");
  setEndTime("");
  setVenue({
    name: "",
    address: "",
    city: "",
    zipCode: "",
  });
  setSeatMap({ sections: [] });
  setBooths([]);
  setImageFile(null);
  setImagePreviewUrl(null);
  setError("");
  setErrors({});
};

const handleSubmit = async (e) => {
  e.preventDefault();

  setError("");
  const newErrors = {};

  if (!title?.trim()) newErrors.title = "Event Title is required";
  if (!category?.trim()) newErrors.category = "Category is required";
  if (!startDate) newErrors.startDate = "Start Date is required";
  if (!endDate) newErrors.endDate = "End Date is required";
  if (!startTime) newErrors.startTime = "Start Time is required";
  if (!endTime) newErrors.endTime = "End Time is required";
  if (!description?.trim()) newErrors.description = "Description is required";
  
  if (!venue.name?.trim()) newErrors.venueName = "Venue Name is required";
  if (!venue.address?.trim()) newErrors.venueAddress = "Street Address is required";
  if (!venue.city?.trim()) newErrors.venueCity = "City is required";
  if (!venue.zipCode?.trim()) newErrors.venueZip = "Zip Code is required";

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    setError("Please fill in all required fields.");
    return;
  }

  const startDateTime = new Date(`${startDate}T${startTime}`);
  const endDateTime = new Date(`${endDate}T${endTime}`);

  if (endDateTime <= startDateTime) {
    if (startDate === endDate) {
      newErrors.endTime = "End Time must be after Start Time";
    } else {
      newErrors.endDate = "End Date must be after Start Date";
    }
    setErrors(newErrors);
    return;
  }

  // Check if times are in the past for today
  const now = new Date();
  if (startDate === today && startTime < currentTime) {
    newErrors.startTime = "Start Time cannot be in the past";
    setErrors(newErrors);
    return;
  }
  if (endDate === today && endTime < currentTime) {
    newErrors.endTime = "End Time cannot be in the past";
    setErrors(newErrors);
    return;
  }

  if (!user) {
    setError("You must be logged in.");
    return;
  }

  if (booths && booths.length > 0) {
    for (const booth of booths) {
      if (booth.priceLevelId && !priceLevelIds.includes(String(booth.priceLevelId))) {
        setError("One or more booths have an invalid price level assignment.");
        return;
      }
    }
  }

  const result = await showCreateConfirmAlert(
    "Create Event?",
    `Are you sure you want to create "${title}"?`
  );
  if (!result.isConfirmed) return;

  try {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("eventType", eventType);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("startDate", startDate);
    formData.append("endDate", endDate);
    formData.append("startTime", startTime);
    formData.append("endTime", endTime);
    formData.append("venue", JSON.stringify(venue));
    formData.append("seatMap", JSON.stringify(seatMap || null));
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
      await showErrorAlert("Error Creating Event", json.error || "Failed to create event.");
      return;
    }

    // 2. SUCCESS: Reset fields before closing
    resetForm();
    onClose();

    showSuccessAlert("Event Created", "The event has been created successfully.");
    dispatch({ type: "CREATE_EVENT", payload: json.event });
  } catch (err) {
    console.error(err);
    setError("Network error. Please try again.");
    await showErrorAlert("Network Error", "Unable to connect to the server.");
  }
};

// 3. Update your manual "Cancel" button or "X" button logic
const handleManualClose = () => {
  resetForm();
  onClose();
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
                <div className={`add-event-form-group ${errors.title ? 'has-error' : ''}`}>
                  <h6>Event Title</h6>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      clearError("title");
                    }}
                    placeholder="e.g. Tech Summit 2024"
                  />
                  {errors.title && <span className="error-message">{errors.title}</span>}
                </div>

                <div className={`add-event-form-group ${errors.category ? 'has-error' : ''}`}>
                  <h6>Category</h6>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      clearError("category");
                    }}
                    placeholder="e.g. Concert, Conference, Festival"
                  />
                  {errors.category && <span className="error-message">{errors.category}</span>}
                </div>
              </div>

              {/* Dates */}
              <div className="add-event-form-row">
                <div className={`add-event-form-group ${errors.startDate ? 'has-error' : ''}`}>
                  <h6>Start Date</h6>
                  <input
                    type="date"
                    min={today}
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (endDate < e.target.value) setEndDate(e.target.value);
                      clearError("startDate");
                    }}
                  />
                  {errors.startDate && <span className="error-message">{errors.startDate}</span>}
                </div>
                <div className={`add-event-form-group ${errors.endDate ? 'has-error' : ''}`}>
                  <h6>End Date</h6>
                  <input
                    type="date"
                    min={startDate}
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      clearError("endDate");
                    }}
                  />
                  {errors.endDate && <span className="error-message">{errors.endDate}</span>}
                </div>
              </div>

              {/* Times */}
              <div className="add-event-form-row">
                <div className={`add-event-form-group ${errors.startTime ? 'has-error' : ''}`}>
                  <h6>Start Time</h6>
                  <input
                    type="time"
                    value={startTime}
                    min={startDate === today ? currentTime : undefined}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      clearError("startTime");
                    }}
                  />
                  {errors.startTime && <span className="error-message">{errors.startTime}</span>}
                </div>
                <div className={`add-event-form-group ${errors.endTime ? 'has-error' : ''}`}>
                  <h6>End Time</h6>
                  <input
                    type="time"
                    value={endTime}
                    min={
                      startDate === endDate
                        ? startTime
                        : (endDate === today ? currentTime : undefined)
                    }
                    onChange={(e) => {
                      setEndTime(e.target.value);
                      clearError("endTime");
                    }}
                  />
                  {errors.endTime && <span className="error-message">{errors.endTime}</span>}
                </div>
              </div>

              {/* Description */}
              <div className={`add-event-form-group add-event-full-width ${errors.description ? 'has-error' : ''}`}>
                <h6>About the Event</h6>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    clearError("description");
                  }}
                  placeholder="Event description..."
                  rows="3"
                ></textarea>
                {errors.description && <span className="error-message">{errors.description}</span>}
              </div>

              {/* Venue */}
              <div className="add-event-form-group add-event-full-width">
                <h6>Venue Details</h6>
                <div className={`add-event-form-group ${errors.venueName ? 'has-error' : ''}`} style={{gap: '4px'}}>
                  <input
                    type="text"
                    placeholder="Venue Name"
                    value={venue.name}
                    onChange={(e) => {
                      setVenue({ ...venue, name: e.target.value });
                      clearError("venueName");
                    }}
                  />
                  {errors.venueName && <span className="error-message">{errors.venueName}</span>}
                </div>
                
                <div className={`add-event-form-group ${errors.venueAddress ? 'has-error' : ''}`} style={{gap: '4px', marginTop: '12px'}}>
                  <input
                    type="text"
                    placeholder="Street Address"
                    value={venue.address}
                    onChange={(e) => {
                      setVenue({ ...venue, address: e.target.value });
                      clearError("venueAddress");
                    }}
                  />
                  {errors.venueAddress && <span className="error-message">{errors.venueAddress}</span>}
                </div>

                <div className="add-event-form-row" style={{marginTop: '12px', gap: '12px'}}>
                  <div className={`add-event-form-group ${errors.venueCity ? 'has-error' : ''}`} style={{gap: '4px'}}>
                    <input
                      type="text"
                      placeholder="City"
                      value={venue.city}
                      onChange={(e) => {
                        setVenue({ ...venue, city: e.target.value });
                        clearError("venueCity");
                      }}
                    />
                    {errors.venueCity && <span className="error-message">{errors.venueCity}</span>}
                  </div>
                  <div className={`add-event-form-group ${errors.venueZip ? 'has-error' : ''}`} style={{gap: '4px'}}>
                    <input
                      type="text"
                      placeholder="Zip Code"
                      value={venue.zipCode}
                      onChange={(e) => {
                        setVenue({ ...venue, zipCode: e.target.value });
                        clearError("venueZip");
                      }}
                    />
                    {errors.venueZip && <span className="error-message">{errors.venueZip}</span>}
                  </div>
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
