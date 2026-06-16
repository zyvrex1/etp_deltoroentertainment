import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { getImageUrl } from "../../utils/imageUrl";
import "./SponsorEditProduct.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const getProductImage = (image) => {
  if (!image) return null;
  return getImageUrl(image);
};

const SponsorEditProduct = ({ isOpen, onClose, product, onSave }) => {
  const [productData, setProductData] = useState({
    name: "",
    category: "Food",
    price: "",
    stock: "",
    active: true,
    description: "",
    image: null,
    fileName: "Current product image",
    fileSize: 0
  });

  const [imageDragActive, setImageDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setProductData({
        name: product.name || "",
        category: product.category || "Food",
        price: product.price || "",
        stock: product.stock || "",
        active: product.active ?? true,
        description: product.description || "",
        image: product.image || null,
        fileName: "Current product image",
        fileSize: 0
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
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handlePhotoChange = (e) => {
    if (e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Max 5MB.");
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setProductData({ 
        ...productData, 
        image: reader.result,
        fileName: file.name,
        fileSize: file.size
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setProductData({ ...productData, image: null, fileName: "", fileSize: 0 });
  };

  const handleSave = async () => {
    if (!productData.name || !productData.price || !productData.stock) {
      alert("Please fill in all required fields (Name, Price, and Stock).");
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedProduct = {
        ...product,
        ...productData,
        price: Number(productData.price) || 0,
        stock: Number(productData.stock) || 0
      };
      await onSave(updatedProduct);
      // Parent handles closing
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
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
            <div 
              className={`upload-area ${imageDragActive ? "drag-active" : ""}`}
              onDragEnter={handleImageDrag}
              onDragLeave={handleImageDrag}
              onDragOver={handleImageDrag}
              onDrop={handleImageDrop}
              onClick={() => document.getElementById("sep-photo-upload")?.click()}
            >
              <input 
                type="file" 
                id="sep-photo-upload" 
                hidden 
                accept="image/*"
                onChange={handlePhotoChange}
              />
              
              {productData.image ? (
                <div className="file-preview">
                  <img src={getProductImage(productData.image)} alt="preview" className="preview-image" />
                  <p className="file-name">{productData.fileName}</p>
                  {productData.fileSize > 0 && <p className="file-size">{(productData.fileSize / 1024 / 1024).toFixed(2)} MB</p>}
                  <button type="button" className="remove-file-btn" onClick={handleRemoveImage}>
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
          <button className="sep-submit-btn" onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Icon icon="mdi:loading" className="sap-spin" /> Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SponsorEditProduct;
