import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import './EditEventModal.css';
import { useAuthContext } from '../hooks/useAuthContext';
import { useEventsContext } from '../hooks/useEventsContext';
import { showSuccessAlert, showErrorAlert, showCancelConfirmAlert } from '../utils/sweetAlert';

const EditEventModal = ({ isOpen, onClose, event }) => {
  const { user } = useAuthContext();
  const { dispatch } = useEventsContext();

  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    title: '',
    category: 'other',
    description: '',
    startDate: today,
    endDate: today,
    startTime: '',
    endTime: '',
    ticketPrice: '',
    totalTickets: '',
    venue: {
      name: '',
      address: '',
      city: '',
      zipCode: ''
    },
    imageFile: null,
    imagePreviewUrl: null,
    booths: []
  });

  const [error, setError] = useState('');
  const [emptyFields, setEmptyFields] = useState([]);

  // Populate formData when event changes
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        category: event.category || 'other',
        description: event.description || '',
        startDate: event.startDate || today,
        endDate: event.endDate || today,
        startTime: event.startTime || '',
        endTime: event.endTime || '',
        ticketPrice: event.ticketPrice || '',
        totalTickets: event.totalTickets || '',
        venue: {
          name: event.venue?.name || '',
          address: event.venue?.address || '',
          city: event.venue?.city || '',
          zipCode: event.venue?.zipCode || ''
        },
        imageFile: null,
        imagePreviewUrl: event.image ? `/uploads/${event.image}` : null,
        booths: event.booths || []
      });
      setError('');
      setEmptyFields([]);
    }
  }, [event, today]);

  if (!isOpen) return null;

  // Image handlers
  const handleImageChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      if (formData.imagePreviewUrl) URL.revokeObjectURL(formData.imagePreviewUrl);
      setFormData({ ...formData, imageFile: file, imagePreviewUrl: url });
    }
  };

  const handleImageRemove = () => {
    if (formData.imagePreviewUrl) URL.revokeObjectURL(formData.imagePreviewUrl);
    setFormData({ ...formData, imageFile: null, imagePreviewUrl: null });
  };

  // Submit handler
  const handleSaveChanges = async (e) => {
    e.preventDefault();

    if (!user) {
      setError("You must be logged in");
      return;
    }

    // Validate required fields
    const fieldsToCheck = {
      title: formData.title,
      category: formData.category,
      description: formData.description,
      startDate: formData.startDate,
      endDate: formData.endDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      ticketPrice: formData.ticketPrice,
      totalTickets: formData.totalTickets,
      venueName: formData.venue.name,
      venueAddress: formData.venue.address,
      venueCity: formData.venue.city,
      venueZip: formData.venue.zipCode
    };

    const empty = Object.entries(fieldsToCheck)
      .filter(([key, value]) => value === '' || value === null)
      .map(([key]) => key);

    if (empty.length > 0) {
      setEmptyFields(empty);
      setError("Please fill in all required fields.");
      return;
    }

    setEmptyFields([]);
    setError('');

    // Check date/time validity
    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
    if (endDateTime < startDateTime) {
      setError("End date/time cannot be earlier than start date/time.");
      return;
    }

    // Send PATCH request to update event
    const response = await fetch(`/api/events/${event._id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`
      },
      body: JSON.stringify({
        ...formData,
        ticketPrice: Number(formData.ticketPrice),
        totalTickets: Number(formData.totalTickets),
        image: formData.imageFile ? formData.imageFile.name : event.image
      })
    });

    const json = await response.json();

    if (!response.ok) {
      setError(json.error || 'Failed to update event');
      await showErrorAlert('Error Updating Event', json.error || 'Failed to update event.');
    } else {
      await showSuccessAlert('Event Updated', 'The event has been updated successfully.');
      dispatch({ type: 'UPDATE_EVENT', payload: json });
      onClose();
    }
  };

  return (
    <div className="edit-event-modal-overlay">
      <div className="edit-event-modal-container">
        <div className="edit-event-modal-header">
          <h3>Edit Event</h3>
          <button className="close-btn" onClick={async () => {
            const hasChanges = Object.values(formData).some(val =>
              typeof val === 'object' ? Object.values(val).some(v => v) : val
            );
            if (hasChanges) {
              const result = await showCancelConfirmAlert();
              if (result.isConfirmed) onClose();
            } else onClose();
          }}>
            <Icon icon="mdi:close" width="24" height="24" />
          </button>
        </div>

        <form className="edit-event-modal-body edit-event-form" onSubmit={handleSaveChanges}>
          {/* Title & Category */}
          <div className="form-row">
            <div className="form-group">
              <h6>Event Title</h6>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Event title..."
                className={emptyFields.includes("title") ? "error" : ""}
              />
            </div>
            <div className="form-group">
              <h6>Category</h6>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={emptyFields.includes("category") ? "error" : ""}
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

          {/* Dates & Times */}
          <div className="form-row">
            <div className="form-group">
              <h6>Start Date</h6>
              <input
                type="date"
                min={today}
                value={formData.startDate}
                onChange={(e) => {
                  setFormData({ ...formData, startDate: e.target.value });
                  if (formData.endDate < e.target.value) {
                    setFormData({ ...formData, endDate: e.target.value });
                  }
                }}
                className={emptyFields.includes("startDate") ? "error" : ""}
              />
            </div>
            <div className="form-group">
              <h6>End Date</h6>
              <input
                type="date"
                min={formData.startDate}
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className={emptyFields.includes("endDate") ? "error" : ""}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <h6>Start Time</h6>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className={emptyFields.includes("startTime") ? "error" : ""}
              />
            </div>
            <div className="form-group">
              <h6>End Time</h6>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className={emptyFields.includes("endTime") ? "error" : ""}
              />
            </div>
          </div>

          {/* Venue */}
          <div className="section-box">
            <h5 className="modal-section-title">Venue Details</h5>
            <div className="form-group">
              <input
                type="text"
                placeholder="Venue Name"
                value={formData.venue.name}
                onChange={(e) => setFormData({ ...formData, venue: { ...formData.venue, name: e.target.value } })}
                className={emptyFields.includes("venueName") ? "error" : ""}
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                placeholder="Street Address"
                value={formData.venue.address}
                onChange={(e) => setFormData({ ...formData, venue: { ...formData.venue, address: e.target.value } })}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <input
                  type="text"
                  placeholder="City"
                  value={formData.venue.city}
                  onChange={(e) => setFormData({ ...formData, venue: { ...formData.venue, city: e.target.value } })}
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Zip Code"
                  value={formData.venue.zipCode}
                  onChange={(e) => setFormData({ ...formData, venue: { ...formData.venue, zipCode: e.target.value } })}
                />
              </div>
            </div>
          </div>

          {/* Tickets */}
          <div className="form-row">
            <div className="form-group">
              <h6>Ticket Price ($)</h6>
              <input
                type="number"
                min="0"
                value={formData.ticketPrice}
                onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value === "" ? "" : Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <h6>Total Tickets</h6>
              <input
                type="number"
                min="1"
                value={formData.totalTickets}
                onChange={(e) => setFormData({ ...formData, totalTickets: e.target.value === "" ? "" : Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Description */}
          <div className="form-group full-width">
            <h6>About The Event</h6>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="4"
            ></textarea>
          </div>

          {/* Image */}
          <div className="form-group full-width">
            <h6>Event Image</h6>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {formData.imagePreviewUrl && (
              <div>
                <img src={formData.imagePreviewUrl} alt="Preview" style={{ maxWidth: '150px', marginTop: '5px' }} />
                <button type="button" onClick={handleImageRemove}>Remove</button>
              </div>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="edit-event-modal-footer">
            <button type="button" className="button cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button save-btn">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEventModal;