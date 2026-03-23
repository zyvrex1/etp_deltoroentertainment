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

  const addSeat = () => {
    setFormData({
      ...formData,
      seatVariations: [
        ...formData.seatVariations,
        { seatNumber: "", price: 0 }
      ]
    });
  };

  const updateSeat = (index, field, value) => {
    const updated = [...formData.seatVariations];
    updated[index][field] = value;

    setFormData({
      ...formData,
      seatVariations: updated
    });
  };

  const removeSeat = (index) => {
    const updated = [...formData.seatVariations];
    updated.splice(index, 1);

    setFormData({
      ...formData,
      seatVariations: updated
    });
  };

  const addBooth = () => {
    setFormData({
      ...formData,
      booths: [
        ...formData.booths,
        {
          code: null,
          type: "standard",
          status: "available",
          size: "",
          price: 0,
          quantity: 1,
        },
      ],
    });
  };

  const updateBooth = (index, field, value) => {
    const updated = [...formData.booths];
    updated[index][field] = value;
    setFormData({ ...formData, booths: updated });
  };

  const removeBooth = (index) => {
    const updated = [...formData.booths];
    updated.splice(index, 1);
    setFormData({ ...formData, booths: updated });
  };

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    startDate: today,
    endDate: today,
    startTime: "",
    endTime: "",
    eventType: "General Admission", // default event type
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
        eventType: event.eventType || "General Admission", // include eventType
        ticketPrice:
          event.ticketPrice !== undefined ? String(event.ticketPrice) : "",
        totalTickets:
          event.totalTickets !== undefined ? String(event.totalTickets) : "",
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
        seatMap: event.seatMap || null, // include seatMap
        seatVariations:
          event.seatVariations?.map((s) => ({
            seatNumber: s.seatNumber || "",
            price: s.price !== undefined ? String(s.price) : "",
          })) || [],
        booths: event.booths?.map((b) => ({
          code: b.code || "",
          type: b.type || "standard",
          status: b.status || "available",
          size: b.size || "",
          price: b.price !== undefined ? String(b.price) : "",
          quantity: b.quantity !== undefined ? String(b.quantity) : "",
        })) || [],
      });

      setError("");
      setEmptyFields([]);
    }
  }, [event, today]);

  if (!isOpen) return null;

  const handleSaveChanges = async (e) => {
    e.preventDefault();

    if (!user) {
      setError("You must be logged in");
      return;
    }

    const {
      title,
      category,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      eventType,
      ticketPrice,
      totalTickets,
      venue,
      seatMap,
      seatVariations,
      booths,
      imageFile,
    } = formData;

    // 1️⃣ Validate required fields
    let empty = [];

    if (!title?.trim()) empty.push("title");
    if (!category?.trim()) empty.push("category");
    if (!description?.trim()) empty.push("description");
    if (!startDate) empty.push("startDate");
    if (!endDate) empty.push("endDate");
    if (!startTime) empty.push("startTime");
    if (!endTime) empty.push("endTime");

    // Venue validation
    if (!venue?.name?.trim()) empty.push("venue.name");
    if (!venue?.address?.trim()) empty.push("venue.address");
    if (!venue?.city?.trim()) empty.push("venue.city");
    if (!venue?.zipCode?.trim()) empty.push("venue.zipCode");

    // Event type-specific validation
    if (eventType === "General Admission") {
      if (ticketPrice === "" || Number(ticketPrice) < 0) empty.push("ticketPrice");
    }

    if (eventType === "Seating Arrangement") {
      if (!seatVariations || seatVariations.length === 0)
        empty.push("seatVariations");

      seatVariations?.forEach((s, i) => {
        if (!s.seatNumber?.trim() || Number(s.price) < 0) {
          empty.push(`seatVariations[${i}]`);
        }
      });
    }

    // Booth validation
    booths?.forEach((b, i) => {
      if (
        !b.code?.trim() ||
        !b.size?.trim() ||
        Number(b.price) < 0 ||
        Number(b.quantity) < 1 ||
        !b.type?.trim() ||
        !b.status?.trim()
      ) {
        empty.push(`booths[${i}]`);
      }
    });

    if (empty.length > 0) {
      console.log("Empty fields detected:", empty);
      setEmptyFields(empty);
      setError("Please fill in all required fields.");
      return;
    }

    setEmptyFields([]);
    setError("");

    // 2️⃣ Validate start/end date
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);
    if (endDateTime <= startDateTime) {
      setError("End date/time must be after the start date/time.");
      return;
    }

    // 3️⃣ Confirm update
    const result = await showCreateConfirmAlert(
      "Update Event?",
      `Are you sure you want to update "${title}"?`,
    );
    if (!result.isConfirmed) return;

    // 4️⃣ Prepare FormData payload
    const formDataToSend = new FormData();

    formDataToSend.append("title", title.trim());
    formDataToSend.append("description", description.trim());
    formDataToSend.append("category", category.trim());
    formDataToSend.append("startDate", startDate);
    formDataToSend.append("endDate", endDate);
    formDataToSend.append("startTime", startTime);
    formDataToSend.append("endTime", endTime);
    formDataToSend.append("eventType", eventType);
    formDataToSend.append("ticketPrice", Number(ticketPrice) || 0);

    // totalTickets for seating arrangement
    const totalTicketsToSend =
      Number(totalTickets) || seatVariations?.length || 0;

    formDataToSend.append("totalTickets", totalTicketsToSend);

    // ✅ Send venue fields individually so backend parses correctly
    formDataToSend.append("venue[name]", venue.name?.trim() || "");
    formDataToSend.append("venue[address]", venue.address?.trim() || "");
    formDataToSend.append("venue[city]", venue.city?.trim() || "");
    formDataToSend.append("venue[zipCode]", venue.zipCode?.trim() || "");

    // Seating arrangement
    if (seatMap) formDataToSend.append("seatMap", JSON.stringify(seatMap));
    formDataToSend.append(
      "seatVariations",
      JSON.stringify(
        seatVariations?.map((s) => ({
          seatNumber: s.seatNumber,
          price: Number(s.price),
        })) || [],
      ),
    );

    // Booths
    formDataToSend.append(
      "booths",
      JSON.stringify(
        booths?.map((b) => ({
          code: b.code || null,
          type: b.type || "standard",
          status: b.status || "available",
          size: b.size || null,
          price: Number(b.price),
          quantity: Number(b.quantity),
        })) || []
      )
    );

    // Image fallback: send existing filename if no new file
    if (imageFile) {
      formDataToSend.append("image", imageFile);
    } else if (event.image) {
      formDataToSend.append("image", event.image);
    }

    // 5️⃣ Send PATCH request
    try {
      const response = await fetch(`/api/events/${event._id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error updating event");
      }

      const updatedEvent = await response.json();
      onClose();
      showSuccessAlert("Event updated successfully!");
    } catch (err) {
      console.error(err);
      showErrorAlert(err.message);
    }
  };

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

        <form
          className="add-event-modal-body add-event-form"
          onSubmit={handleSaveChanges}
        >
          {/* Event Image */}
          <div className="section-box">
            <h5 className="modal-section-title">Event Image</h5>
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

          {/* Dates & Times */}
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
            <h6>About The Event</h6>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows="3"
              className={emptyFields.includes("description") ? "error" : ""}
            ></textarea>
          </div>

          {/* Venue Details */}
          <div className="section-box">
            <h5 className="modal-section-title">Venue Details</h5>

            <div className="add-event-form-group">
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
            </div>

            <div className="add-event-form-group">
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
            </div>

            <div className="add-event-form-row">
              <div className="add-event-form-group">
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
              </div>

              <div className="add-event-form-group">
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

          {/* Tickets / Seating */}
          {formData.eventType === "General Admission" && (
            <div className="add-event-form-row">
              <div className="add-event-form-group">
                <h6>Ticket Price ($)</h6>
                <input
                  type="number"
                  min="0"
                  value={formData.ticketPrice === 0 ? "" : formData.ticketPrice}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ticketPrice:
                        e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="add-event-form-group">
                <h6>Total Capacity</h6>
                <input
                  type="number"
                  min="1"
                  value={
                    formData.totalTickets === 0 ? "" : formData.totalTickets
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      totalTickets:
                        e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          )}

          {formData.eventType === "Seating Arrangement" && (
            <div className="section-box">
              <h5 className="modal-section-title">Seat Map & Variations</h5>
              {formData.seatVariations.map((seat, index) => (
                <div key={index} className="booth-row">
                  <input
                    type="text"
                    placeholder="Seat Number"
                    value={seat.seatNumber}
                    onChange={(e) =>
                      updateSeat(index, "seatNumber", e.target.value)
                    }
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={seat.price}
                    onChange={(e) => updateSeat(index, "price", e.target.value)}
                  />
                  <button type="button" className="remove-boothseat-btn" onClick={() => removeSeat(index)}>
                    Remove
                  </button>
                </div>
              ))}
              <button type="button" className="add-boothseat-btn" onClick={addSeat}>
                Add Seat
              </button>
            </div>
          )}

          <div className="section-box">
            <h5 className="modal-section-title">Booths (Optional)</h5>
            {formData.booths.map((booth, index) => (
              <div key={index} className="booth-row">

                <div className="add-event-form-group">
                  <h6>Booth Code</h6>
                  <input
                    type="text"
                    placeholder="ex. VIP401"
                    value={booth.code || ""}
                    onChange={e => updateBooth(index, "code", e.target.value)}
                  />
                </div>

                <div className="add-event-form-group">
                  <h6>Size</h6>
                  <input
                    type="text"
                    placeholder="ex. 20x20"
                    value={booth.size || ""}
                    onChange={e => updateBooth(index, "size", e.target.value)}
                  />
                </div>

                <div className="add-event-form-group">
                  <h6>Price</h6>
                  <input
                    type="number"
                    min="0"
                    value={booth.price !== undefined ? booth.price : 0}
                    onChange={e => updateBooth(index, "price", Number(e.target.value))}
                  />
                </div>

                <div className="add-event-form-group">
                  <h6>Quantity</h6>
                  <input
                    type="number"
                    min="1"
                    value={booth.quantity !== undefined ? booth.quantity : 1}
                    onChange={e => updateBooth(index, "quantity", Number(e.target.value))}
                  />
                </div>

                <div className="add-event-form-group">
                  <h6>Type</h6>
                  <select
                    value={booth.type || "standard"}
                    onChange={e => updateBooth(index, "type", e.target.value)}
                  >
                    <option value="standard">Inline</option>
                    <option value="vip">VIP</option>
                    <option value="premium">Corner</option>
                  </select>
                </div>

                <div className="add-event-form-group">
                  <h6>Status</h6>
                  <select
                    value={booth.status || "available"}
                    onChange={e => updateBooth(index, "status", e.target.value)}
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>

                <button type="button" className="remove-boothseat-btn" onClick={() => removeBooth(index)}>
                  Remove
                </button>
              </div>
            ))}

            <button
              type="button"
              className="add-boothseat-btn"
              onClick={addBooth}
            >
              Add Booth
            </button>
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
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="primary-button save-btn">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEventModal;
