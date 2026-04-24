import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { showCancelConfirmAlert } from "../../utils/sweetAlert";

const EditPriceLevelModal = ({ isOpen, onClose, onSave, initialData }) => {
  // Local state for the form
  const [formData, setFormData] = useState(initialData || {});

  // Sync local state when initialData changes (e.g., when a different level is clicked)
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    // Pass the updated data back to the parent
    onSave(formData); 
    onClose();
  };

  const handleClose = async () => {
    // Check if any value has actually changed compared to the initial data
    const isDirty = Object.keys(formData).some(
      (key) => formData[key] !== initialData[key]
    );
    
    if (isDirty) {
      const result = await showCancelConfirmAlert();
      if (result.isConfirmed) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <div className="general-modal-overlay" style={{ zIndex: 2000 }}>
      <div className="general-event-modal-container" style={{ maxWidth: '500px' }}>
        <div className="general-modal-header">
          <h3>Edit Price Level</h3>
          <button type="button" className="close-btn" onClick={handleClose}>
            <Icon icon="mdi:close" />
          </button>
        </div>

        <form className="add-event-modal-body add-event-form" onSubmit={handleSubmit}>
          
          <div className="add-event-form-group">
            <h6>Price Name</h6>
            <input
              type="text"
              required
              placeholder="e.g. Early Bird, VIP, GA"
              value={formData.priceName || ""}
              onChange={(e) => setFormData({ ...formData, priceName: e.target.value })}
            />
          </div>

          <div className="add-event-form-row">
            <div className="add-event-form-group">
              <h6>Ticket Price ($)</h6>
              <input
                type="number"
                min="0"
                value={formData.facePrice || 0}
                onChange={(e) => setFormData({ ...formData, facePrice: Number(e.target.value) })}
              />
            </div>
            <div className="add-event-form-group">
              <h6>Service Charge ($)</h6>
              <input
                type="number"
                min="0"
                value={formData.serviceCharge || 0}
                onChange={(e) => setFormData({ ...formData, serviceCharge: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="add-event-form-row">
            <div className="add-event-form-group">
              <h6>Quantity</h6>
              <input
                type="number"
                min="1"
                required
                value={formData.quantityAvailable || 0}
                onChange={(e) => setFormData({ ...formData, quantityAvailable: Number(e.target.value) })}
              />
            </div>
            <div className="add-event-form-group">
              <h6>Tag Color</h6>
              <input
                type="color"
                value={formData.color || "#3b82f6"}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                style={{ height: '40px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className="general-event-modal-footer">
            <button type="button" className="button cancel-btn" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button save-btn">
              Update Price Level
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPriceLevelModal;