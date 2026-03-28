import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import "./EditEventModal.css";
import { useAuthContext } from "../hooks/useAuthContext";
import { useEventsContext } from "../hooks/useEventsContext";
import {
  showSuccessAlert,
  showErrorAlert,
  showCreateConfirmAlert,
} from "../utils/sweetAlert";
import AddPriceLevelModal from "./AddPriceLevelModal";
import EditPriceLevelModal from "./EditPriceLevelModal";

const EditEventModal = ({ isOpen, onClose, event }) => {
  const { user } = useAuthContext();
  const { dispatch } = useEventsContext();
  const today = new Date().toISOString().split("T")[0];

  const [error, setError] = useState("");
  const [emptyFields, setEmptyFields] = useState([]);
  const [activeTab, setActiveTab] = useState("information");
  const [imageDragActive, setImageDragActive] = useState(false);

  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showEditPriceModal, setShowEditPriceModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  // Single formData state
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    startDate: today,
    endDate: today,
    startTime: "",
    endTime: "",
    eventType: "General Admission",
    priceLevels: [], // Hold price levels here
    venue: { name: "", address: "", city: "", zipCode: "" },
    imageFile: null,
    imagePreviewUrl: null,
    seatMap: null,
    booths: [],
  });

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
        eventType: event.eventType || "General Admission",
        priceLevels: event.priceLevels || [],
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
      });
    }
  }, [event, today]);

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
    setFormData({
      ...formData,
      imageFile: null,
      imagePreviewUrl: null
    });
  };

  

  // Price Level Handlers
  const handleDeletePriceLevel = (index) => {
    const updatedLevels = formData.priceLevels.filter((_, i) => i !== index);
    setFormData({ ...formData, priceLevels: updatedLevels });
  };

  const handleEditPriceLevel = (index) => {
    setEditingIndex(index);
    setShowEditPriceModal(true); // Open the specific Edit modal
  };

  // Logic to handle the updated data from EditPriceLevelModal
  const handleUpdatePriceLevel = (updatedLevelData) => {
    const updatedLevels = [...formData.priceLevels];
    updatedLevels[editingIndex] = updatedLevelData;
    
    setFormData({ ...formData, priceLevels: updatedLevels });
    setShowEditPriceModal(false);
    setEditingIndex(null);
  };

  const handleSavePriceLevel = (levelData) => {
    let updatedLevels = [...formData.priceLevels];

    if (editingIndex !== null) {
      // Update existing
      updatedLevels[editingIndex] = { ...levelData };
    } else {
      // Add new
      const newLevel = {
        ...levelData,
        tempId: `temp-${crypto.randomUUID()}`,
      };
      updatedLevels.push(newLevel);
    }

    setFormData({ ...formData, priceLevels: updatedLevels });
    setShowPriceModal(false);
    setEditingIndex(null);
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
      // Append basic fields
      Object.keys(formData).forEach(key => {
        if (['venue', 'priceLevels', 'booths', 'seatMap'].includes(key)) {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else if (key === 'imageFile' && formData.imageFile) {
          formDataToSend.append('image', formData.imageFile);
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

  return (
    <div className="general-modal-overlay">
      <div className="general-event-modal-container">
        <div className="general-modal-header">
          <h3>Edit Event</h3>
          <button className="close-btn" onClick={onClose}>
            <Icon icon="mdi:close" width="24" height="24" />
          </button>
        </div>

        <div className="em-content">
          <div className="tabs-container">
            <button className={`tab ${activeTab === "information" ? "active" : ""}`} onClick={() => setActiveTab("information")}>Information</button>
            <button className={`tab ${activeTab === "tickets" ? "active" : ""}`} onClick={() => setActiveTab("tickets")}>Tickets</button>
          </div>

            {activeTab === "information" && (
            <form
              className="add-event-modal-body add-event-form"
               onSubmit={handleSaveChanges}
            >
              <div className="add-event-form-group">
                <h6>Event Type</h6>
                <div style={{ display: "flex", gap: "20px", marginTop: "5px" }}>
              <label
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
                  value="General Admission"
                  checked={formData.eventType === "General Admission"}
                  onChange={() =>
                    setFormData({ ...formData, eventType: "General Admission" })
                  }
                />
                General Admission
              </label>
              <label
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
                  value="Seating Arrangement"
                  checked={formData.eventType === "Seating Arrangement"}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      eventType: "Seating Arrangement",
                    })
                  }
                />
                Assigned Seating
              </label>
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
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Event title..."
                    className={emptyFields.includes("title") ? "error" : ""}
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
                  className={
                    emptyFields.includes("venue.zipCode") ? "error" : ""
                  }
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
                  Save Changes
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
                  onClick={() => { setEditingIndex(null); setShowPriceModal(true); }}
                >
                  <Icon icon="mdi:plus" /> Add Level
                </button>
              </div>
             {formData.priceLevels.length === 0 ? (
                <p className="no-data-text">
                  No Price Levels added. Click "Add Level" to start.
                </p>
              ) : (
                <div className="price-levels-list">
                  {formData.priceLevels.map((level, index) => (
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
                            ₱{level.facePrice} (+₱{level.serviceCharge}) • Qty:{" "}
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
                          onClick={() => handleDeletePriceLevel(index)}
                        >
                          <Icon icon="mdi:trash-can" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* {formData.priceLevels.length === 0 ? (
                <p>No Price Level Added Yet.</p>
              ) : (
                formData.priceLevels.map((level, index) => (
                  <div key={index} className="ticket-level-card" style={{ display: "flex", justifyContent: "space-between", padding: "10px", border: "1px solid #eee", marginBottom: "10px" }}>
                    <div>
                      <strong>{level.priceName}</strong>
                      <p>${level.facePrice} + ${level.serviceCharge} Fee</p>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button type="button" onClick={() => handleEditPriceLevel(index)}>Edit</button>
                      <button type="button" style={{ color: "red" }} onClick={() => handleDeletePriceLevel(index)}>Delete</button>
                    </div>
                  </div>
                ))
              )} */}
            </div>
          )}
        </div>
      </div>

      {/* RENDER THE SUB-MODAL HERE */}
      {showPriceModal && (
    <AddPriceLevelModal
      isOpen={showPriceModal}
      onClose={() => setShowPriceModal(false)}
      onSave={handleSavePriceLevel}
    />
  )}

  {/* RENDER THE EDIT MODAL */}
  {showEditPriceModal && (
    <EditPriceLevelModal
      isOpen={showEditPriceModal}
      onClose={() => {
        setShowEditPriceModal(false);
        setEditingIndex(null);
      }}
      onSave={handleUpdatePriceLevel}
      initialData={formData.priceLevels[editingIndex]}
    />
  )}
    </div>
  );
};

export default EditEventModal;