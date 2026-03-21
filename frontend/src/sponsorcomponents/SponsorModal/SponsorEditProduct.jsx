import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import "./SponsorEditProduct.css";

const SponsorEditProduct = ({ isOpen, onClose, product, onSave }) => {
  const [productData, setProductData] = useState({
    name: "",
    category: "Food",
    price: "",
    stock: "",
    active: true,
    description: "",
    image: null,
  });

  useEffect(() => {
    if (product) {
      setProductData({
        name: product.name || "",
        category: product.category || "Food",
        price: product.price ? product.price.replace('$', '') : "",
        stock: product.stock || "",
        active: product.active ?? true,
        description: product.description || "",
        image: product.image || null,
      });
    }
  }, [product]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = () => {
    const updatedProduct = {
      ...product,
      ...productData,
      price: `$${productData.price}`,
    };
    onSave(updatedProduct);
    onClose();
  };

  return (
    <div className="sep-modal-overlay" onClick={onClose}>
      <div className="sep-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="sep-modal-header">
          <h2>Edit Product</h2>
          <button className="sep-close-btn" onClick={onClose}>
            <Icon icon="mdi:close" />
          </button>
        </div>
        
        <div className="sep-modal-body">
          <div className="sep-form-group">
            <label>Product Name *</label>
            <input
              type="text"
              name="name"
              placeholder="e.g., Gourmet Burger"
              value={productData.name}
              onChange={handleChange}
            />
          </div>

          <div className="sep-form-row">
            <div className="sep-form-group half-width">
              <label>Category *</label>
              <select name="category" value={productData.category} onChange={handleChange}>
                <option value="Food">Food</option>
                <option value="Drinks">Drinks</option>
                <option value="Merch">Merch</option>
              </select>
            </div>
            <div className="sep-form-group half-width">
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

          <div className="sep-form-row">
            <div className="sep-form-group half-width">
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
            <div className="sep-form-group half-width">
              <label>Status</label>
              <div className="sep-status-toggle">
                <label className="sep-toggle-switch">
                  <input
                    type="checkbox"
                    name="active"
                    checked={productData.active}
                    onChange={handleChange}
                  />
                  <span className="sep-slider"></span>
                </label>
                <span className="sep-status-text">{productData.active ? 'Available' : 'Unavailable'}</span>
              </div>
            </div>
          </div>

          <div className="sep-form-group">
            <label>Product Image</label>
            <div className="sep-upload-box">
              <Icon icon="mdi:image-outline" className="sep-upload-icon" />
              <p className="sep-upload-text">
                <span className="sep-upload-link">Upload a file</span> or drag and drop
              </p>
              <p className="sep-upload-hint">PNG, JPG, GIF up to 10MB</p>
            </div>
            
             <div className="sep-image-success">
               <div className="sep-img-preview">
                 <img src={productData.image || "/assets/eventbg.jpg"} alt="preview" />
               </div>
               <span className="sep-success-text">Image uploaded successfully</span>
             </div>
          </div>

          <div className="sep-form-group">
            <label>Description</label>
            <textarea
              name="description"
              placeholder="Brief description of the product..."
              value={productData.description}
              onChange={handleChange}
            ></textarea>
          </div>
        </div>

        <div className="sep-modal-footer">
          <button className="sep-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="sep-submit-btn" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SponsorEditProduct;
