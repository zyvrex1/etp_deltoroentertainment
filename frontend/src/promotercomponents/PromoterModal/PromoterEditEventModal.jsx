import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import "../../admincomponents/modal/CreateEventModal.css";
import { useAuthContext } from "../../hooks/useAuthContext";
import { useEventsContext } from "../../hooks/useEventsContext";
import {
    showSuccessAlert,
    showErrorAlert,
    showCreateConfirmAlert,
} from "../../utils/sweetAlert";
import { getImageUrl } from "../../utils/imageUrl";

const PromoterEditEventModal = ({ isOpen, onClose, event }) => {
    const { user } = useAuthContext();
    const { dispatch } = useEventsContext();
    const today = new Date().toISOString().split("T")[0];

    const [error, setError] = useState("");
    const [errors, setErrors] = useState({});

    const clearError = (fieldName) => {
        if (errors[fieldName]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });
        }
    };

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
        eventType: "General Admission",
        imageFile: null,
        imagePreviewUrl: null,
        seatMap: null,
        booths: [],
        assignedPromoter: null,
    });
    // const [promoters, setPromoters] = useState([]);

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
                eventType: event.eventType || "General Admission",
                imageFile: null,
                imagePreviewUrl: event.image ? getImageUrl(event.image) : null,
                seatMap: event.seatMap || null,
                booths: event.booths || [],
                assignedPromoter: event.assignedPromoter?._id || event.assignedPromoter || null,
            });
        }
    }, [event, today]);

    // useEffect(() => {
    //     if (!user?.token) return;
    //     const fetchPromoters = async () => {
    //         try {
    //             const response = await fetch('/api/admin/users', {
    //                 headers: { Authorization: `Bearer ${user.token}` }
    //             });
    //             const json = await response.json();
    //             if (response.ok) {
    //                 setPromoters(json.data ? json.data.filter(u => u.role === 'promoter') : json.filter(u => u.role === 'promoter'));
    //             }
    //         } catch (err) {
    //             console.error("Error fetching promoters:", err);
    //         }
    //     };
    //     fetchPromoters();
    // }, [user]);

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

        setError("");
        const newErrors = {};

        if (!formData.title?.trim()) newErrors.title = "Event Title is required";
        if (!formData.category?.trim()) newErrors.category = "Category is required";
        if (!formData.startDate) newErrors.startDate = "Start Date is required";
        if (!formData.endDate) newErrors.endDate = "End Date is required";
        if (!formData.startTime) newErrors.startTime = "Start Time is required";
        if (!formData.endTime) newErrors.endTime = "End Time is required";
        if (!formData.description?.trim()) newErrors.description = "Description is required";

        if (!formData.venue.name?.trim()) newErrors.venueName = "Venue Name is required";
        if (!formData.venue.address?.trim()) newErrors.venueAddress = "Street Address is required";
        if (!formData.venue.city?.trim()) newErrors.venueCity = "City is required";
        if (!formData.venue.zipCode?.trim()) newErrors.venueZip = "Zip Code is required";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setError("Please fill in all required fields.");
            return;
        }

        const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
        const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

        if (endDateTime <= startDateTime) {
            if (formData.startDate === formData.endDate) {
                newErrors.endTime = "End Time must be after Start Time";
            } else {
                newErrors.endDate = "End Date must be after Start Date";
            }
            setErrors(newErrors);
            return;
        }

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

    // const isReadOnly =
    //     event?.status === "cancelled" ||
    //     event?.status === "completed" ||
    //     (event?.status === "rejected" && (user?.role === "admin" || user?.role === "superadmin"));

    const creatorId = event?.createdBy?._id || event?.createdBy;
const isOwner = String(creatorId) === String(user?._id);

const isReadOnly =
    !isOwner ||
    event?.status === "cancelled" ||
    event?.status === "completed" ||
    event?.status === "rejected";

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

                    {/* Title & Category & Type */}

                    <div className="add-event-form-row">
                        <div className="add-event-form-group add-event-full-width">
                            <h6>Event Type</h6>
                            <div className="event-type-options">
                                <label className={`event-type-option ${formData.eventType === "General Admission" ? "active" : ""}`}>
                                    <input
                                        type="radio"
                                        name="eventType"
                                        value="General Admission"
                                        checked={formData.eventType === "General Admission"}
                                        onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                                        disabled={isReadOnly}
                                    />
                                    <span>General Admission</span>
                                </label>
                                <label className={`event-type-option ${formData.eventType === "Reservation" ? "active" : ""}`}>
                                    <input
                                        type="radio"
                                        name="eventType"
                                        value="Reservation"
                                        checked={formData.eventType === "Reservation"}
                                        onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                                        disabled={isReadOnly}
                                    />
                                    <span>Reservation</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="add-event-form-row">
                        <div className={`add-event-form-group ${errors.title ? 'has-error' : ''}`}>
                            <h6>Event Title</h6>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => {
                                    setFormData({ ...formData, title: e.target.value });
                                    clearError("title");
                                }}
                                placeholder="Event title..."
                                disabled={isReadOnly}
                            />
                            {errors.title && <span className="error-message">{errors.title}</span>}
                        </div>

                        <div className={`add-event-form-group ${errors.category ? 'has-error' : ''}`}>
                            <h6>Category</h6>
                            <input
                                type="text"
                                value={formData.category}
                                onChange={(e) => {
                                    setFormData({ ...formData, category: e.target.value });
                                    clearError("category");
                                }}
                                placeholder="Enter category (e.g., Concert, Comedy)"
                                disabled={isReadOnly}
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
                                value={formData.startDate}
                                onChange={(e) => {
                                    const newStart = e.target.value;
                                    setFormData((prev) => ({
                                        ...prev,
                                        startDate: newStart,
                                        endDate: prev.endDate < newStart ? newStart : prev.endDate,
                                    }));
                                    clearError("startDate");
                                }}
                                disabled={isReadOnly}
                            />
                            {errors.startDate && <span className="error-message">{errors.startDate}</span>}
                        </div>
                        <div className={`add-event-form-group ${errors.endDate ? 'has-error' : ''}`}>
                            <h6>End Date</h6>
                            <input
                                type="date"
                                min={formData.startDate}
                                value={formData.endDate}
                                onChange={(e) => {
                                    setFormData({ ...formData, endDate: e.target.value });
                                    clearError("endDate");
                                }}
                                disabled={isReadOnly}
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
                                value={formData.startTime}
                                onChange={(e) => {
                                    setFormData({ ...formData, startTime: e.target.value });
                                    clearError("startTime");
                                }}
                                disabled={isReadOnly}
                            />
                            {errors.startTime && <span className="error-message">{errors.startTime}</span>}
                        </div>
                        <div className={`add-event-form-group ${errors.endTime ? 'has-error' : ''}`}>
                            <h6>End Time</h6>
                            <input
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => {
                                    setFormData({ ...formData, endTime: e.target.value });
                                    clearError("endTime");
                                }}
                                disabled={isReadOnly}
                            />
                            {errors.endTime && <span className="error-message">{errors.endTime}</span>}
                        </div>
                    </div>

                    {/* Description */}
                    <div className={`add-event-form-group add-event-full-width ${errors.description ? 'has-error' : ''}`}>
                        <h6>About the Event</h6>
                        <textarea
                            value={formData.description}
                            onChange={(e) => {
                                setFormData({ ...formData, description: e.target.value });
                                clearError("description");
                            }}
                            rows="3"
                            disabled={isReadOnly}
                        ></textarea>
                        {errors.description && <span className="error-message">{errors.description}</span>}
                    </div>

                    {/* Venue */}
                    <div className="add-event-form-group add-event-full-width">
                        <h6>Venue Details</h6>
                        <div className={`add-event-form-group ${errors.venueName ? 'has-error' : ''}`} style={{ gap: '4px' }}>
                            <input
                                type="text"
                                placeholder="Venue Name"
                                value={formData.venue.name}
                                onChange={(e) => {
                                    setFormData({
                                        ...formData,
                                        venue: { ...formData.venue, name: e.target.value },
                                    });
                                    clearError("venueName");
                                }}
                                disabled={isReadOnly}
                            />
                            {errors.venueName && <span className="error-message">{errors.venueName}</span>}
                        </div>

                        <div className={`add-event-form-group ${errors.venueAddress ? 'has-error' : ''}`} style={{ gap: '4px', marginTop: '12px' }}>
                            <input
                                type="text"
                                placeholder="Street Address"
                                value={formData.venue.address}
                                onChange={(e) => {
                                    setFormData({
                                        ...formData,
                                        venue: { ...formData.venue, address: e.target.value },
                                    });
                                    clearError("venueAddress");
                                }}
                                disabled={isReadOnly}
                            />
                            {errors.venueAddress && <span className="error-message">{errors.venueAddress}</span>}
                        </div>

                        <div className="add-event-form-row" style={{ marginTop: '12px', gap: '12px' }}>
                            <div className={`add-event-form-group ${errors.venueCity ? 'has-error' : ''}`} style={{ gap: '4px' }}>
                                <input
                                    type="text"
                                    placeholder="City"
                                    value={formData.venue.city}
                                    onChange={(e) => {
                                        setFormData({
                                            ...formData,
                                            venue: { ...formData.venue, city: e.target.value },
                                        });
                                        clearError("venueCity");
                                    }}
                                    disabled={isReadOnly}
                                />
                                {errors.venueCity && <span className="error-message">{errors.venueCity}</span>}
                            </div>
                            <div className={`add-event-form-group ${errors.venueZip ? 'has-error' : ''}`} style={{ gap: '4px' }}>
                                <input
                                    type="text"
                                    placeholder="Zip Code"
                                    value={formData.venue.zipCode}
                                    onChange={(e) => {
                                        setFormData({
                                            ...formData,
                                            venue: { ...formData.venue, zipCode: e.target.value },
                                        });
                                        clearError("venueZip");
                                    }}
                                    disabled={isReadOnly}
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

export default PromoterEditEventModal;