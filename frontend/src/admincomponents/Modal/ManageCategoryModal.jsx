import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import "./CreateEventModal";

const ManageCategoryModal = ({ isOpen, onClose, onSave, editingCategory }) => {
  const [modalType, setModalType] = useState("Seat (Circle)");

  useEffect(() => {
    if (editingCategory) {
      setModalType(editingCategory.type || "Seat (Circle)");
    } else {
      setModalType("Seat (Circle)");
    }
  }, [editingCategory, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const categoryData = {
      name: formData.get("name"),
      type: formData.get("type"),
      quantity: parseInt(formData.get("quantity")),
      price: parseFloat(formData.get("price")),
      boothSize: formData.get("boothSize") || "",
      // Standardize color to the gray theme as requested
      color: "#666666", 
    };
    onSave(categoryData);
  };

  return (
    <div className="general-modal-overlay" style={{ zIndex: 2000 }}>
      <div className="general-event-modal-container" style={{ maxWidth: "500px" }}>
        <div className="general-modal-header">
          <h3>{editingCategory ? "Edit Category" : "Add New Category"}</h3>
          <button className="close-btn" onClick={onClose}>
            <Icon icon="mdi:close" />
          </button>
        </div>
        <form className="add-event-modal-body add-event-form" onSubmit={handleSubmit}>
          <div className="add-event-form-group">
            <h6>Category Name</h6>
            <input 
              name="name" 
              defaultValue={editingCategory?.name} 
              placeholder="e.g. VIP Seats, Premium Booths" 
              required 
            />
          </div>
          
          <div className="add-event-form-row">
            <div className="add-event-form-group">
              <h6>Type</h6>
              <select 
                name="type" 
                className="promoter-select-modal" 
                defaultValue={modalType}
                onChange={(e) => setModalType(e.target.value)}
              >
                <option>Seat (Circle)</option>
                <option>Booth (Square)</option>
              </select>
            </div>
            {modalType === "Booth (Square)" && (
              <div className="add-event-form-group">
                <h6>Booth Size</h6>
                <input 
                  name="boothSize" 
                  defaultValue={editingCategory?.boothSize} 
                  placeholder="e.g. 10x10, 5x5" 
                  required 
                />
              </div>
            )}
          </div>

          <div className="add-event-form-row">
            <div className="add-event-form-group">
              <h6>Quantity Available</h6>
              <input 
                name="quantity" 
                type="number" 
                min="1" 
                defaultValue={editingCategory?.quantity || 10} 
                required 
              />
            </div>
            <div className="add-event-form-group">
              <h6>Face Price ($)</h6>
              <input 
                name="price" 
                type="number" 
                step="0.01" 
                min="0" 
                defaultValue={editingCategory?.price || 99} 
                required 
              />
            </div>
          </div>

          <div className="general-event-modal-footer">
            <button type="button" className="button cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button save-btn">
              {editingCategory ? "Save Changes" : "Add Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManageCategoryModal;
