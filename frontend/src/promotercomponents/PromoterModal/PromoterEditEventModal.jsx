import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";
import "./PromoterEditEventModal.css";

import {
    showSuccessAlert,
    showCancelConfirmAlert,
    showErrorAlert,
    showConfirmAlert,
} from "../../utils/sweetAlert";
import { useAuthContext } from "../../hooks/useAuthContext";
import { useEventsContext } from "../../hooks/useEventsContext";

const PromoterEditEventModal = ({ isOpen, onClose, initialEvent }) => {
    const { user } = useAuthContext();
    const { dispatch } = useEventsContext();
    const today = new Date().toISOString().split("T")[0];

    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("other");
    const [description, setDescription] = useState("");
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

    const [imageFile, setImageFile] = useState(null);
    const [imageDragActive, setImageDragActive] = useState(false);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

    const [error, setError] = useState("");
    const [emptyFields, setEmptyFields] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialEvent && isOpen) {
            setTitle(initialEvent.title || "");
            setCategory(initialEvent.category || "other");
            setDescription(initialEvent.description || "");

            // Format dates for input[type="date"]
            if (initialEvent.startDate) {
                setStartDate(new Date(initialEvent.startDate).toISOString().split('T')[0]);
            }
            if (initialEvent.endDate) {
                setEndDate(new Date(initialEvent.endDate).toISOString().split('T')[0]);
            }

            setStartTime(initialEvent.startTime || "");
            setEndTime(initialEvent.endTime || "");

            setVenue({
                name: initialEvent.venue?.name || "",
                address: initialEvent.venue?.address || "",
                city: initialEvent.venue?.city || "",
                zipCode: initialEvent.venue?.zipCode || "",
            });

            if (initialEvent.image) {
                const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
                setImagePreviewUrl(`${backendUrl}/uploads/${initialEvent.image}`);
            } else {
                setImagePreviewUrl(null);
            }
            
            setImageFile(null);
            setError("");
            setEmptyFields([]);
        }
    }, [initialEvent, isOpen]);

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
            setImageFile(file);
            setImagePreviewUrl(url);
        }
    };

    const handleImageChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            setImageFile(file);
            setImagePreviewUrl(url);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const fieldsToCheck = {
            title,
            category,
            startDate,
            endDate,
            startTime,
            endTime,
            venueName: venue.name,
        };

        const empty = Object.entries(fieldsToCheck)
            .filter(([, value]) => value === "" || value === null)
            .map(([key]) => key);

        if (empty.length > 0) {
            setEmptyFields(empty);
            setError("Please fill in all required fields.");
            return;
        }

        if (endDate < startDate) {
            setError("End date cannot be earlier than start date.");
            return;
        }

        const result = await showConfirmAlert(
            "Save Changes?",
            `Are you sure you want to update "${title}"?`
        );

        if (!result.isConfirmed) return;

        setIsSubmitting(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('category', category);
            formData.append('description', description);
            formData.append('startDate', startDate);
            formData.append('endDate', endDate);
            formData.append('startTime', startTime);
            formData.append('endTime', endTime);
            formData.append('venue', JSON.stringify(venue));
            
            if (imageFile) {
                formData.append('image', imageFile);
            }

            const response = await axios.patch(
                `http://localhost:4000/api/events/${initialEvent._id}`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${user.token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            dispatch({ type: "UPDATE_EVENT", payload: response.data.event });
            
            onClose();
            await showSuccessAlert(
                "Event Updated",
                "The event has been updated successfully."
            );
        } catch (err) {
            console.error("Update Event Error:", err);
            setError(err.response?.data?.error || "Failed to update event.");
            showErrorAlert("Update Failed", err.response?.data?.error || "Could not update event.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const isReadOnly = initialEvent?.status === "completed";

    return (
        <div className="promoter-edit-event-modal-overlay">
            <div className="promoter-edit-event-modal-container">
                <div className="promoter-edit-event-modal-header">
                    <h3>{isReadOnly ? "View Event" : "Edit Event"}</h3>
                    <button
                        className="promoter-edit-event-close-btn"
                        onClick={async () => {
                            if (isReadOnly) {
                                onClose();
                                return;
                            }
                            const result = await showCancelConfirmAlert();
                            if (result.isConfirmed) {
                                onClose();
                            }
                        }}
                    >
                        <Icon icon="mdi:close" />
                    </button>
                </div>

                <form
                    className="promoter-edit-event-modal-body promoter-edit-event-form"
                    onSubmit={handleSubmit}
                >
                          <div className="promoter-edit-event-section-box">
                        <h5 className="modal-section-title">Event Image</h5>
                        <div
                            className={`promoter-edit-event-upload-area ${imageDragActive ? "drag-active" : ""
                                } ${isReadOnly ? "readonly" : ""}`}
                            onDragEnter={!isReadOnly ? handleImageDrag : undefined}
                            onDragLeave={!isReadOnly ? handleImageDrag : undefined}
                            onDragOver={!isReadOnly ? handleImageDrag : undefined}
                            onDrop={!isReadOnly ? handleImageDrop : undefined}
                            onClick={
                                !isReadOnly
                                    ? () => document.getElementById("promoter-edit-event-image-input")?.click()
                                    : undefined
                            }
                        >
                            <input
                                id="promoter-edit-event-image-input"
                                type="file"
                                accept="image/png, image/jpeg, image/webp"
                                onChange={!isReadOnly ? handleImageChange : undefined}
                                style={{ display: "none" }}
                                disabled={isReadOnly}
                            />

                            {imagePreviewUrl ? (
                                <div className="file-preview">
                                    <img
                                        src={imagePreviewUrl}
                                        alt="Event Preview"
                                        className="preview-image"
                                    />
                                    {imageFile && (
                                        <>
                                            <p className="file-name">{imageFile.name}</p>
                                            <p className="file-size">
                                                {((imageFile.size || 0) / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </>
                                    )}
                                    {!isReadOnly && (
                                        <button
                                            type="button"
                                            className="remove-file-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setImageFile(null);
                                                setImagePreviewUrl(null);
                                            }}
                                        >
                                            Remove/Change
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="upload-placeholder">
                                    <div className="icon-circle">
                                        <Icon icon="mdi:image-area" width="32" height="32" />
                                    </div>
                                    <p className="upload-title">
                                        {isReadOnly ? "No image provided" : "Click or drag an image here to update"}
                                    </p>
                                    {!isReadOnly && <p className="upload-subtitle">PNG, JPG, WEBP up to 5MB</p>}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="promoter-edit-event-form-row">
                        <div className="promoter-edit-event-form-group">
                            <h6>Event Title</h6>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Tech Summit 2024"
                                className={emptyFields.includes("title") ? "error" : ""}
                                disabled={isReadOnly}
                            />
                        </div>
                        <div className="promoter-edit-event-form-group">
                            <h6>Category</h6>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className={emptyFields.includes("category") ? "error" : ""}
                                disabled={isReadOnly}
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

                    <div className="promoter-edit-event-form-row">
                        <div className="promoter-edit-event-form-group">
                            <h6>Start Date</h6>
                            <input
                                type="date"
                                required
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    if (endDate < e.target.value) {
                                        setEndDate(e.target.value);
                                    }
                                }}
                                className={emptyFields.includes("startDate") ? "error" : ""}
                                disabled={isReadOnly}
                            />
                        </div>
                        <div className="promoter-edit-event-form-group">
                            <h6>End Date</h6>
                            <input
                                type="date"
                                required
                                min={startDate}
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className={emptyFields.includes("endDate") ? "error" : ""}
                                disabled={isReadOnly}
                            />
                        </div>
                    </div>

                    <div className="promoter-edit-event-form-row">
                        <div className="promoter-edit-event-form-group">
                            <h6>Start Time</h6>
                            <input
                                type="time"
                                required
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className={emptyFields.includes("startTime") ? "error" : ""}
                                disabled={isReadOnly}
                            />
                        </div>
                        <div className="promoter-edit-event-form-group">
                            <h6>End Time</h6>
                            <input
                                type="time"
                                required
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className={emptyFields.includes("endTime") ? "error" : ""}
                                disabled={isReadOnly}
                            />
                        </div>
                    </div>

                    <div className="promoter-edit-event-section-box">
                        <h5 className="modal-section-title">Venue Details</h5>
                        <div className="promoter-edit-event-form-group">
                            <input
                                type="text"
                                placeholder="Venue Name"
                                required
                                value={venue.name}
                                onChange={(e) =>
                                    setVenue({ ...venue, name: e.target.value })
                                }
                                className={emptyFields.includes("venueName") ? "error" : ""}
                                disabled={isReadOnly}
                            />
                        </div>

                        <div className="promoter-edit-event-form-group">
                            <input
                                type="text"
                                placeholder="Street Address"
                                value={venue.address}
                                onChange={(e) =>
                                    setVenue({ ...venue, address: e.target.value })
                                }
                                disabled={isReadOnly}
                            />
                        </div>

                        <div className="promoter-edit-event-form-row">
                            <div className="promoter-edit-event-form-group">
                                <input
                                    type="text"
                                    placeholder="City"
                                    value={venue.city}
                                    onChange={(e) =>
                                        setVenue({ ...venue, city: e.target.value })
                                    }
                                    disabled={isReadOnly}
                                />
                            </div>
                            <div className="promoter-edit-event-form-group">
                                <input
                                    type="text"
                                    placeholder="Zip Code"
                                    value={venue.zipCode}
                                    onChange={(e) =>
                                        setVenue({ ...venue, zipCode: e.target.value })
                                    }
                                    disabled={isReadOnly}
                                />
                            </div>
                        </div>
                    </div>

              

                    {/* About the Event */}

                    <div className="promoter-edit-event-form-group promoter-edit-event-full-width">
                        <h6>About The Event</h6>
                        <textarea
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Event description..."
                            rows="4"
                            className={emptyFields.includes("description") ? "error" : ""}
                            disabled={isReadOnly}
                        ></textarea>
                    </div>

                    {initialEvent?.status === "rejected" && initialEvent?.rejectionReason && (
                        <div className="rejection-reason-banner" style={{
                            backgroundColor: "#fff5f5",
                            border: "1px solid #feb2b2",
                            borderRadius: "8px",
                            padding: "12px 16px",
                            marginTop: "16px",
                            marginBottom: "16px",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "12px",
                            textAlign: "left",
                        }}>
                            <Icon icon="mdi:alert-circle-outline" width="24" style={{ color: "#f56565", flexShrink: 0 }} />
                            <div>
                                <h6 style={{ margin: 0, color: "#c53030", fontWeight: 600 }}>Rejection Reason</h6>
                                <p style={{ margin: "4px 0 0 0", color: "#742a2a", fontSize: "0.875rem" }}>
                                    {initialEvent.rejectionReason}
                                </p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div
                            className="error-message"
                            style={{ color: "red", marginTop: "10px" }}
                        >
                            {error}
                        </div>
                    )}

                    <div className="promoter-edit-event-modal-footer">
                        {isReadOnly ? (
                            <button
                                type="button"
                                className="primary-button promoter-edit-event-save-btn"
                                onClick={onClose}
                                style={{ width: "100%" }}
                            >
                                Close
                            </button>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    className="button promoter-edit-event-cancel-btn"
                                    disabled={isSubmitting}
                                    onClick={async () => {
                                        const result = await showCancelConfirmAlert();
                                        if (result.isConfirmed) {
                                            onClose();
                                        }
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="primary-button promoter-edit-event-save-btn"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Saving..." : "Save Changes"}
                                </button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PromoterEditEventModal;
