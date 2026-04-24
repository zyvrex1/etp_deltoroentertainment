import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import "./EditEventModal.css";
import { useAuthContext } from "../../hooks/useAuthContext";
import { useEventsContext } from "../../hooks/useEventsContext";
import {
  showSuccessAlert,
  showErrorAlert,
  showCreateConfirmAlert,
} from "../../utils/sweetAlert";

const EditEventModal = ({ isOpen, onClose, event }) => {
  const { user } = useAuthContext();
  const { dispatch } = useEventsContext();
  const today = new Date().toISOString().split("T")[0];

  const [error, setError] = useState("");
  const [emptyFields, setEmptyFields] = useState([]);

  const [imageDragActive, setImageDragActive] = useState(false);

  // Single formData state
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    startDate: today,
    endDate: today,
    startTime: "",
    endTime: "",
    venue: { name: "", address: "", city: "", zipCode: "" },
    imageFile: null,
    imagePreviewUrl: null,
    seatMap: null,
    booths: [],
    assignedPromoter: null,
  });
  const [promoters, setPromoters] = useState([]);

  // Sync data when event prop changes
  useEffect(() => {
    if (event) {
      const formatDate = (isoDate) =>
        isoDate ? new Date(isoDate).toISOString().split("T")[0] : today;

      setFormData({
        title: event.title || "",
        category: event.category || "other",
        description: event.description || "",
        startDate: formatDate(event.startDate),
        endDate: formatDate(event.endDate),
        startTime: event.startTime || "",
        endTime: event.endTime || "",
        venue: {
          name: event.venue?.name || "",
          address: event.venue?.address || "",
          city: event.venue?.city || "",
          zipCode: event.venue?.zipCode || "",
        },
        imageFile: null,
        imagePreviewUrl: event.image ? `http://localhost:4000/uploads/${event.image}` : null,
        seatMap: event.seatMap || null,
        booths: event.booths || [],
        assignedPromoter: event.assignedPromoter?._id || event.assignedPromoter || null,
      });
    }
  }, [event, today]);

  useEffect(() => {
    if (!user?.token) return;
    const fetchPromoters = async () => {
      try {
        const response = await fetch('/api/admin/users', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const json = await response.json();
        if (response.ok) {
          setPromoters(json.filter(u => u.role === 'promoter'));
        }
      } catch (err) {
        console.error("Error fetching promoters:", err);
      }
    };
    fetchPromoters();
  }, [user]);

  // 1. Handle Drag Events (Prevent default to allow drop)
  const handleImageDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setImageDragActive(true);
    } else if (e.type === "dragleave") {
      setImageDragActive(false);
    }
  };

  // 2. Handle Drop Event
  const handleImageDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImageDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFormData({ 
        ...formData, 
        imageFile: file, 
        imagePreviewUrl: URL.createObjectURL(file) 
      });
    }
  };

  // 3. Handle Remove (Also missing based on your JSX)
  const handleImageRemove = () => {
  if (formData.imagePreviewUrl && formData.imagePreviewUrl.startsWith('blob:')) {
    URL.revokeObjectURL(formData.imagePreviewUrl);
  }
  setFormData({
    ...formData,
    imageFile: null,
    imagePreviewUrl: null
  });
};

  


  // Image Handlers
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ 
        ...formData, 
        imageFile: file, 
        imagePreviewUrl: URL.createObjectURL(file) 
      });
    }
  };

  const handleSaveChanges = async (e) => {
   e.preventDefault();
  if (!user) return setError("You must be logged in");

  const result = await showCreateConfirmAlert("Update Event?", `Update "${formData.title}"?`);
  if (!result.isConfirmed) return;

    try {
    const formDataToSend = new FormData();
    
    Object.keys(formData).forEach(key => {
      if (['venue', 'booths', 'seatMap'].includes(key)) {
        formDataToSend.append(key, JSON.stringify(formData[key]));
      } else if (key === 'imageFile') {
  if (formData.imageFile) {
    formDataToSend.append('image', formData.imageFile);
  } else if (!formData.imagePreviewUrl) {
    formDataToSend.append('image', ''); 
  }
} else if (key !== 'imagePreviewUrl') {
        formDataToSend.append(key, formData[key]);
      }
    });

      const response = await fetch(`/api/events/${event._id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${user.token}` },
        body: formDataToSend,
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.error);

      onClose();
      showSuccessAlert("Event updated!");
      dispatch({ type: "UPDATE_EVENT", payload: json.event });
    } catch (err) {
      showErrorAlert("Update Failed", err.message);
    }
  };

  if (!isOpen) return null;

  const isReadOnly =
    event?.status === "cancelled" ||
    event?.status === "completed" ||
    (event?.status === "rejected" && (user?.role === "admin" || user?.role === "superadmin"));

  return (
    <div className="general-modal-overlay">
      <div className="general-event-modal-container">
        <div className="general-modal-header">
          <h3>{isReadOnly ? "View Event" : "Edit Event"}</h3>
          <button className="close-btn" onClick={onClose}>
            <Icon icon="mdi:close" width="24" height="24" />
          </button>
        </div>

        <form
          className="add-event-modal-body add-event-form"
          onSubmit={handleSaveChanges}
        >
          <div className="section-box">
            <div
              className={`upload-area ${imageDragActive ? "drag-active" : ""} ${isReadOnly ? "readonly" : ""}`}
              onDragEnter={!isReadOnly ? handleImageDrag : undefined}
              onDragLeave={!isReadOnly ? handleImageDrag : undefined}
              onDragOver={!isReadOnly ? handleImageDrag : undefined}
              onDrop={!isReadOnly ? handleImageDrop : undefined}
              onClick={
                !isReadOnly
                  ? () => document.getElementById("event-image-input")?.click()
                  : undefined
              }
            >
              <input
                id="event-image-input"
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={!isReadOnly ? handleImageChange : undefined}
                style={{ display: "none" }}
                disabled={isReadOnly}
              />
              {formData.imageFile || formData.imagePreviewUrl ? (
                <div className="file-preview">
                  {formData.imagePreviewUrl ? (
                    <img
                      src={formData.imagePreviewUrl}
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

                  <p className="file-name">
                    {formData.imageFile
                      ? formData.imageFile.name
                      : event.image?.split("/").pop()}
                  </p>

                  {formData.imageFile && (
                    <p className="file-size">
                      {(formData.imageFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}

                  {!isReadOnly && (
                    <button
                      type="button"
                      className="remove-file-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageRemove();
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ) : (
                <div className="upload-placeholder">
                  <div className="icon-circle">
                    <Icon icon="mdi:image-area" width="32" height="32" />
                  </div>
                  <p className="upload-title">
                    {isReadOnly ? "No image provided" : "Click or drag an image here"}
                  </p>
                  {!isReadOnly && <p className="upload-subtitle">PNG, JPG, WEBP up to 5MB</p>}
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
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Event title..."
                className={emptyFields.includes("title") ? "error" : ""}
                disabled={isReadOnly}
              />
            </div>

            <div className="add-event-form-group">
              <h6>Category</h6>
              <input
                type="text"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className={emptyFields.includes("category") ? "error" : ""}
                placeholder="Enter category (e.g., Concert, Comedy)"
                disabled={isReadOnly}
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
                value={formData.startDate}
                onChange={(e) => {
                  const newStart = e.target.value;

                  setFormData((prev) => ({
                    ...prev,
                    startDate: newStart,
                    endDate: prev.endDate < newStart ? newStart : prev.endDate,
                  }));
                }}
                className={emptyFields.includes("startDate") ? "error" : ""}
                disabled={isReadOnly}
              />
            </div>
            <div className="add-event-form-group">
              <h6>End Date</h6>
              <input
                type="date"
                min={formData.startDate}
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className={emptyFields.includes("endDate") ? "error" : ""}
                disabled={isReadOnly}
              />
            </div>
          </div>

          {/* Times */}
          <div className="add-event-form-row">
            <div className="add-event-form-group">
              <h6>Start Time</h6>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                className={emptyFields.includes("startTime") ? "error" : ""}
                disabled={isReadOnly}
              />
            </div>
            <div className="add-event-form-group">
              <h6>End Time</h6>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
                className={emptyFields.includes("endTime") ? "error" : ""}
                disabled={isReadOnly}
              />
            </div>
          </div>

          {/* Description */}
          <div className="add-event-form-group add-event-full-width">
            <h6>About the Event</h6>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows="3"
              className={emptyFields.includes("description") ? "error" : ""}
              disabled={isReadOnly}
            ></textarea>
          </div>

          {/* Venue */}
          <div className="add-event-form-group add-event-full-width">
            <h6>Venue Details</h6>
            <input
              type="text"
              placeholder="Venue Name"
              value={formData.venue.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  venue: { ...formData.venue, name: e.target.value },
                })
              }
              className={emptyFields.includes("venue.name") ? "error" : ""}
              disabled={isReadOnly}
            />
            <input
              type="text"
              placeholder="Street Address"
              value={formData.venue.address}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  venue: { ...formData.venue, address: e.target.value },
                })
              }
              className={emptyFields.includes("venue.address") ? "error" : ""}
              disabled={isReadOnly}
            />
            <div className="add-event-form-row">
              <input
                type="text"
                placeholder="City"
                value={formData.venue.city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    venue: { ...formData.venue, city: e.target.value },
                  })
                }
                className={emptyFields.includes("venue.city") ? "error" : ""}
                disabled={isReadOnly}
              />
              <input
                type="text"
                placeholder="Zip Code"
                value={formData.venue.zipCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    venue: { ...formData.venue, zipCode: e.target.value },
                  })
                }
                className={emptyFields.includes("venue.zipCode") ? "error" : ""}
                disabled={isReadOnly}
              />
            </div>
          </div>

          {/* Display errors */}
          {error && (
            <div style={{ color: "red", marginTop: "10px" }}>{error}</div>
          )}

          <div className="general-event-modal-footer">
            {isReadOnly ? (
              <button
                type="button"
                className="primary-button save-btn"
                onClick={onClose}
                style={{ width: "100%" }}
              >
                Close
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="button cancel-btn"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button save-btn">
                  Save Changes
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEventModal;