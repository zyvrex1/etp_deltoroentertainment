import React, { useState } from "react";
import { Icon } from "@iconify/react";
import "./SponsorAddProduct.css";

const SponsorAddProduct = ({ isOpen, onClose, onAdd }) => {
  const [productData, setProductData] = useState({
    name: "",
    category: "Food",
    price: "",
    stock: "",
    active: true,
    description: "",
    image: null,
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAdd = () => {
    // Basic validation could go here
    onAdd(productData);
    onClose();
  };

  return (
    <div className="sap-modal-overlay" onClick={onClose}>
      <div className="sap-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="sap-modal-header">
          <h2>Add New Product</h2>
          <button className="sap-close-btn" onClick={onClose}>
            <Icon icon="mdi:close" />
          </button>
        </div>
        
        <div className="sap-modal-body">
          <div className="sap-form-group">
            <label>Product Name *</label>
            <input
              type="text"
              name="name"
              placeholder="e.g., Gourmet Burger"
              value={productData.name}
              onChange={handleChange}
            />
          </div>

          <div className="sap-form-row">
            <div className="sap-form-group half-width">
              <label>Category *</label>
              <select name="category" value={productData.category} onChange={handleChange}>
                <option value="Food">Food</option>
                <option value="Drinks">Drinks</option>
                <option value="Merch">Merch</option>
              </select>
            </div>
            <div className="sap-form-group half-width">
              <label>Price ($) *</label>
              <input
                type="number"
                name="price"
                min="0"
                step="0.01"
                placeholder="0"
                value={productData.price}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="sap-form-row">
            <div className="sap-form-group half-width">
              <label>Stock Quantity *</label>
              <input
                type="number"
                name="stock"
                min="0"
                placeholder="0"
                value={productData.stock}
                onChange={handleChange}
              />
            </div>
            <div className="sap-form-group half-width">
              <label>Status</label>
              <div className="sap-status-toggle">
                <label className="sap-toggle-switch">
                  <input
                    type="checkbox"
                    name="active"
                    checked={productData.active}
                    onChange={handleChange}
                  />
                  <span className="sap-slider"></span>
                </label>
                <span className="sap-status-text">{productData.active ? 'Available' : 'Unavailable'}</span>
              </div>
            </div>
          </div>

          <div className="sap-form-group">
            <label>Product Image</label>
            <div className="sap-upload-box">
              <Icon icon="mdi:image-outline" className="sap-upload-icon" />
              <p className="sap-upload-text">
                <span className="sap-upload-link">Upload a file</span> or drag and drop
              </p>
              <p className="sap-upload-hint">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>

          <div className="sap-form-group">
            <label>Description</label>
            <textarea
              name="description"
              placeholder="Brief description of the product..."
              value={productData.description}
              onChange={handleChange}
            ></textarea>
          </div>
        </div>

        <div className="sap-modal-footer">
          <button className="sap-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="sap-submit-btn" onClick={handleAdd}>
            Add Product
          </button>
        </div>
      </div>
    </div>
  );
};

export default SponsorAddProduct;
