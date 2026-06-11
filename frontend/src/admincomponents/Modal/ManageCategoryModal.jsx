import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import "./CreateEventModal";

const ManageCategoryModal = ({ isOpen, onClose, onSave, editingCategory, eventType }) => {
  const isGA = eventType === "General Admission";

  const defaultType = isGA ? "General Fee" : "Seat (Circle)";

  const [modalType, setModalType] = useState(defaultType);
  const [price, setPrice] = useState("99");

  useEffect(() => {
    if (editingCategory) {
      setModalType(editingCategory.type || defaultType);
      setPrice(editingCategory.price?.toString() || "99");
    } else {
      setModalType(defaultType);
      setPrice("99");
    }
  }, [editingCategory, isOpen, eventType]);

  const handleTypeChange = (e) => {
    setModalType(e.target.value);
  };

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
              placeholder="e.g. VIP Section, General Admission"
              required
            />
          </div>

          <div className="add-event-form-row">
            <div className="add-event-form-group">
              <h6>Type</h6>
              <select
                name="type"
                className="promoter-select-modal"
                value={modalType}
                onChange={handleTypeChange}
              >
                {eventType === "General Admission" ? (
                  <>
                    <option value="General Fee">General Fee</option>
                    <option value="Booth (Square)">Booth (Square)</option>
                  </>
                ) : eventType === "Reservation" ? (
                  <>
                    <option value="Seat (Circle)">Seat (Circle)</option>
                    <option value="Booth (Square)">Booth (Square)</option>
                  </>
                ) : (
                  <>
                    <option value="General Fee">General Fee</option>
                    <option value="Seat (Circle)">Seat (Circle)</option>
                    <option value="Booth (Square)">Booth (Square)</option>
                  </>
                )}
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
                value={price}
                onChange={(e) => setPrice(e.target.value)}
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
