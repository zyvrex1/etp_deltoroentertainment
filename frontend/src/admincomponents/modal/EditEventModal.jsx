import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import "./EditEventModal.css";
import { useAuthContext } from "../hooks/useAuthContext";
import { useEventsContext } from "../hooks/useEventsContext";
import {
  showSuccessAlert,
  showErrorAlert,
  showCancelConfirmAlert,
  showCreateConfirmAlert,
} from "../utils/sweetAlert";

const EditEventModal = ({ isOpen, onClose, event }) => {
  const { user } = useAuthContext();
  const { dispatch } = useEventsContext();
  const today = new Date().toISOString().split("T")[0];
  const [error, setError] = useState("");
  const [emptyFields, setEmptyFields] = useState([]);
  const [activeTab, setActiveTab] = useState("information");
  const [imageDragActive, setImageDragActive] = useState(false);

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
      if (formData.imagePreviewUrl)
        URL.revokeObjectURL(formData.imagePreviewUrl);
      setFormData({
        ...formData,
        imageFile: file,
        imagePreviewUrl: URL.createObjectURL(file),
      });
    }
  };

  const handleImageChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);

      // Revoke previous preview URL
      if (formData.imagePreviewUrl)
        URL.revokeObjectURL(formData.imagePreviewUrl);

      setFormData({ ...formData, imageFile: file, imagePreviewUrl: url });
    }
  };

  const handleImageRemove = () => {
    if (formData.imagePreviewUrl) URL.revokeObjectURL(formData.imagePreviewUrl);
    setFormData({ ...formData, imageFile: null, imagePreviewUrl: null });
  };

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    startDate: today,
    endDate: today,
    startTime: "",
    endTime: "",
    eventType: "", 
    ticketPrice: "",
    totalTickets: "",
    venue: {
      name: "",
      address: "",
      city: "",
      zipCode: "",
    },
    imageFile: null,
    imagePreviewUrl: null,
    seatMap: null,
    seatVariations: [], // for Seating Arrangement type
    booths: [],
  });

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
      
      // ✅ CRITICAL: Load Price Levels so the Ticket tab and validation work
      priceLevels: event.priceLevels || [], 

      ticketPrice: event.ticketPrice !== undefined ? String(event.ticketPrice) : "",
      totalTickets: event.totalTickets !== undefined ? String(event.totalTickets) : "",
      
      venue: {
        name: event.venue?.name || "",
        address: event.venue?.address || "",
        city: event.venue?.city || "",
        zipCode: event.venue?.zipCode || "",
      },
      
      imageFile: null,
      imagePreviewUrl: event.image
        ? `http://localhost:4000/uploads/${event.image}`
        : null,

      seatMap: event.seatMap || null, 
      
      // Ensure your seatVariations/booths maintain their priceLevelId references
      seatVariations: event.seatVariations?.map((s) => ({
        seatNumber: s.seatNumber || "",
        price: s.price !== undefined ? String(s.price) : "",
        priceLevelId: s.priceLevelId || null, // Keep the link!
      })) || [],

      booths: event.booths?.map((b) => ({
        code: b.code || "",
        type: b.type || "standard",
        status: b.status || "available",
        size: b.size || "",
        price: b.price !== undefined ? String(b.price) : "",
        quantity: b.quantity !== undefined ? String(b.quantity) : "",
        priceLevelId: b.priceLevelId || null, // Keep the link!
      })) || [],
    });

    setError("");
    setEmptyFields([]);
  }
}, [event, today]);

const handleSaveChanges = async (e) => {
  e.preventDefault();

  if (!user) {
    setError("You must be logged in");
    return;
  }

  setError("");
  setEmptyFields([]);

  // 1️⃣ Define fields to validate
  const fieldsToCheck = {
    title: formData.title,
    description: formData.description,
    category: formData.category,
    startDate: formData.startDate,
    endDate: formData.endDate,
    startTime: formData.startTime,
    endTime: formData.endTime,
    eventType: formData.eventType,
    venueName: formData.venue?.name,
    venueAddress: formData.venue?.address,
    venueCity: formData.venue?.city,
    venueZip: formData.venue?.zipCode,
  };

  // 2️⃣ Run dynamic validation
  const empty = Object.entries(fieldsToCheck)
    .filter(([_, value]) => value === "" || value === null || value === undefined)
    .map(([key]) => key);

  if (empty.length > 0) {
    setEmptyFields(empty);
    setError("Please fill in all required fields.");
    return;
  }

  // 3️⃣ Date Logic
  const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
  const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
  
  if (endDateTime <= startDateTime) {
    setError("End date/time must be after the start date/time.");
    return;
  }

  // 4️⃣ Data Preparation & Cleanup
  const priceLevels = formData.priceLevels || [];
  const priceLevelIds = priceLevels.map((p) => String(p.tempId || p._id));

  // Cleanup SeatMap: Ensure every seat has at least "none"
  const cleanedSeatMap = formData.seatMap ? {
    ...formData.seatMap,
    sections: formData.seatMap.sections.map(section => ({
      ...section,
      seats: section.seats.map(seat => ({
        ...seat,
        priceLevelId: seat.priceLevelId || "none" 
      }))
    }))
  } : null;

  // 5️⃣ Confirmation
  const result = await showCreateConfirmAlert(
    "Update Event?",
    `Are you sure you want to update "${formData.title}"?`
  );
  if (!result.isConfirmed) return;

  // 6️⃣ Execute Request
  try {
    const formDataToSend = new FormData(); // Move this ABOVE the appends

    formDataToSend.append("title", formData.title);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("category", formData.category);
    formDataToSend.append("startDate", formData.startDate);
    formDataToSend.append("endDate", formData.endDate);
    formDataToSend.append("startTime", formData.startTime);
    formDataToSend.append("endTime", formData.endTime);
    formDataToSend.append("eventType", formData.eventType);
    
    formDataToSend.append("venue", JSON.stringify(formData.venue));
    formDataToSend.append("priceLevels", JSON.stringify(priceLevels));
    formDataToSend.append("booths", JSON.stringify(formData.booths || []));
    
    // Use the CLEANED seat map here
    formDataToSend.append(
      "seatMap", 
      JSON.stringify(formData.eventType === "Seating Arrangement" ? cleanedSeatMap : null)
    );

    if (formData.imageFile) {
      formDataToSend.append("image", formData.imageFile);
    }

    const response = await fetch(`/api/events/${event._id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${user.token}` },
      body: formDataToSend,
    });

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error || "Error updating event");
    }

    onClose();
    showSuccessAlert("Event updated successfully!");
    dispatch({ type: "UPDATE_EVENT", payload: json.event });
    
  } catch (err) {
    console.error(err);
    setError(err.message);
    showErrorAlert("Update Failed", err.message);
  }
};

  const eventDetailsTabs = [
    { id: "information", label: "Information" },
    { id: "tickets", label: "Tickets" },
  ];

  if (!isOpen) return null;

  return (
    <div className="general-modal-overlay">
      <div className="general-event-modal-container">
        <div className="general-modal-header">
          <h3>Edit Event</h3>
          <button
            className="close-btn"
            onClick={onClose} // directly call onClose
          >
            <Icon icon="mdi:close" width="24" height="24" />
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
    <h6>Price Levels</h6>

    {priceLevels.length === 0 ? (
      <p>No Price Level Added Yet.</p>
    ) : (
      priceLevels.map((level, index) => (
  <div
    key={level.tempId || index}
          className="ticket-level-card"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            border: "1px solid #ccc",
            padding: "10px",
            marginBottom: "10px",
            borderRadius: "5px",
          }}
        >
          <div>
            <strong>{level.priceName}</strong>
            <p style={{ margin: 0 }}>
              ₱{level.facePrice} (+{level.serviceCharge})
            </p>
          </div>

          <div style={{ display: "flex", gap: "5px" }}>
            <button type="button" onClick={() => handleEdit(index)}>
              Edit
            </button>

            <button
              type="button"
              onClick={() => handleDelete(index)}
              style={{ background: "red", color: "#fff" }}
            >
              Delete
            </button>
          </div>
        </div>
      ))
    )}

    <button
      type="button"
      className="primary-button"
      onClick={() => {
        setEditingIndex(null);
        setFormData({
          priceName: "",
          color: "#000000",
          facePrice: 0,
          serviceCharge: 0,
          quantityAvailable: 0,
          quantitySold: 0,
        });
        setShowPriceModal(true);
      }}
    >
      Add Price Level
    </button>
  </div>
)}

{/* {showPriceModal && (
  <div className="general-modal-overlay">
    <div className="general-event-modal-container">
      <h3>{editingIndex !== null ? "Edit" : "Add"} Price Level</h3>

      <div className="add-event-form-group">
        <h6>Price Name</h6>
        <input
          type="text"
          value={formData.priceName}
          onChange={(e) =>
            setFormData({ ...formData, priceName: e.target.value })
          }
        />
      </div>

      <div className="add-event-form-group">
        <h6>Color</h6>
        <input
          type="color"
          value={formData.color}
          onChange={(e) =>
            setFormData({ ...formData, color: e.target.value })
          }
        />
      </div>

      <div className="add-event-form-group">
        <h6>Face Price</h6>
        <input
          type="number"
          value={formData.facePrice}
          onChange={(e) =>
            setFormData({
              ...formData,
              facePrice: Number(e.target.value),
            })
          }
        />
      </div>

      <div className="add-event-form-group">
        <h6>Service Charge</h6>
        <input
          type="number"
          value={formData.serviceCharge}
          onChange={(e) =>
            setFormData({
              ...formData,
              serviceCharge: Number(e.target.value),
            })
          }
        />
      </div>

      <div className="add-event-form-group">
        <h6>Quantity Available</h6>
        <input
          type="number"
          value={formData.quantityAvailable}
          onChange={(e) =>
            setFormData({
              ...formData,
              quantityAvailable: Number(e.target.value),
            })
          }
        />
      </div>

      <div className="add-event-form-group">
        <h6>Quantity Sold</h6>
        <input
          type="number"
          value={formData.quantitySold}
          onChange={(e) =>
            setFormData({
              ...formData,
              quantitySold: Number(e.target.value),
            })
          }
        />
      </div>

      <div style={{ marginTop: "15px" }}>
        <button onClick={handleSave} className="primary-button">
          Save
        </button>

        <button
          onClick={() => setShowPriceModal(false)}
          style={{ marginLeft: "10px" }}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)} */}
        </div>
      </div>
    </div>
    
  );
};

export default EditEventModal;
