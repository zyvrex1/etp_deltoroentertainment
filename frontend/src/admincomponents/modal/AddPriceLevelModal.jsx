import { useState } from "react";
import { Icon } from "@iconify/react";
import { showCancelConfirmAlert } from "../utils/sweetAlert";

const AddPriceLevelModal = ({ isOpen, onClose, onSave }) => {
  // Define the blank state
  const initialState = {
    priceName: "",
    description: "",
    color: "#3b82f6",
    facePrice: 0,
    serviceCharge: 0,
    quantityAvailable: 0,
    minPerOrder: 1,
    maxPerOrder: 30,
    increment: 1,
  };

  const [formData, setFormData] = useState(initialState);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Pass the new data back to the parent
    onSave(formData); 
    
    // Reset the form so it's fresh for the next "Add" click
    setFormData(initialState);
    onClose();
  };

  const handleClose = async () => {
    // Check if the user has typed anything before showing a "Discard" warning
    const isDirty = formData.priceName !== "" || formData.facePrice !== 0;
    
    if (isDirty) {
      const result = await showCancelConfirmAlert();
      if (result.isConfirmed) {
        setFormData(initialState);
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
          <h3>Add New Price Level</h3>
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
              value={formData.priceName}
              onChange={(e) => setFormData({ ...formData, priceName: e.target.value })}
            />
          </div>

          <div className="add-event-form-row">
            <div className="add-event-form-group">
              <h6>Ticket Price ($)</h6>
              <input
                type="number"
                min="0"
                value={formData.facePrice}
                onChange={(e) => setFormData({ ...formData, facePrice: Number(e.target.value) })}
              />
            </div>
            <div className="add-event-form-group">
              <h6>Service Charge ($)</h6>
              <input
                type="number"
                min="0"
                value={formData.serviceCharge}
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
                value={formData.quantityAvailable}
                onChange={(e) => setFormData({ ...formData, quantityAvailable: Number(e.target.value) })}
              />
            </div>
            <div className="add-event-form-group">
              <h6>Tag Color</h6>
              <input
                type="color"
                value={formData.color}
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
              Add Price Level
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPriceLevelModal;