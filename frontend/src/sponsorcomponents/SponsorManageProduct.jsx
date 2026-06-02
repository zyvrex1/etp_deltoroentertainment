import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { showDeleteConfirmAlert, showSuccessAlert, showErrorAlert } from "../utils/sweetAlert";
import "./SponsorManageProduct.css";
import SponsorAddProduct from "./SponsorModal/SponsorAddProduct";
import SponsorEditProduct from "./SponsorModal/SponsorEditProduct";
import merchandiseService from "../services/merchandiseService";
import { useAuthContext } from "../hooks/useAuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";


const SponsorManageProduct = ({ eventId, boothCode, isCompleted }) => {
  const { user } = useAuthContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: "Total Products", value: "0", icon: "mdi:cube-outline", color: "blue" },
    { label: "Potential Revenue", value: "$0.00", icon: "mdi:currency-usd", color: "green" },
    { label: "Low Stock Items", value: "0", icon: "mdi:alert-outline", color: "orange" },
    { label: "Out of Stock", value: "0", icon: "mdi:close-circle-outline", color: "red" },
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All Categories");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const dropdownRef = useRef(null);

  const CATEGORY_DEFAULT_IMAGES = {
    food: '/assets/defaultfood.jpg',
    drinks: '/assets/defaultdrinks.jpg',
    merch: '/assets/defaultmerch.jpg',
  };
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const itemsPerPage = 8;

  const fetchProducts = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Fetch products filter by event and booth
      const filters = {};
      if (eventId) filters.eventId = eventId;
      if (boothCode) filters.boothCode = boothCode;

      const data = await merchandiseService.getMerchandises(user.token, filters);

      setProducts(data);
      updateStats(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      showErrorAlert("Error", "Failed to load products inventory.");
    } finally {
      setLoading(false);
    }
  };

  const getProductImage = (image) => {
    if (!image) return "/assets/eventbg.jpg";
    if (image.startsWith("http") || image.startsWith("data:") || image.startsWith("/assets/")) return image;
    return `${BACKEND_URL}/uploads/${image}`;
  };

  const updateStats = (items) => {
    const total = items.length;
    const revenue = items.reduce((sum, item) => sum + (item.price * item.stock), 0);
    const lowStock = items.filter(item => item.stock > 0 && item.stock <= 10).length;
    const outOfStock = items.filter(item => item.stock <= 0).length;

    setStats([
      { label: "Total Products", value: total.toString(), icon: "mdi:cube-outline", color: "blue" },
      { label: "Potential Revenue", value: `$${revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: "mdi:currency-usd", color: "green" },
      { label: "Low Stock Items", value: lowStock.toString(), icon: "mdi:alert-outline", color: "orange" },
      { label: "Out of Stock", value: outOfStock.toString(), icon: "mdi:close-circle-outline", color: "red" },
    ]);
  };

  useEffect(() => {
    fetchProducts();
  }, [user, eventId, boothCode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterCategory === "All Categories" || product.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleAddProduct = async (newProductData) => {
    try {
      if (!eventId) {
        showErrorAlert("Error", "No event selected. Please select a store first.");
        return;
      }

      const payload = {
        ...newProductData,
        eventId: eventId,
        boothCode: boothCode,
        status: newProductData.stock > 0 ? "Available" : "Out of Stock"
      };

      const response = await merchandiseService.createMerchandise(payload, user.token);
      setProducts([response, ...products]);
      updateStats([response, ...products]);
      showSuccessAlert("Success", "Product added to inventory.");
      setIsAddModalOpen(false);
    } catch (error) {
      showErrorAlert("Error", error.message || "Failed to add product.");
    }
  };

  const handleEditProduct = async (updatedProduct) => {
    try {
      const { _id, ...updateData } = updatedProduct;
      const response = await merchandiseService.updateMerchandise(_id, updateData, user.token);

      const newProducts = products.map(p => p._id === _id ? response : p);
      setProducts(newProducts);
      updateStats(newProducts);
      showSuccessAlert("Updated", "Product details updated.");
      setIsEditModalOpen(false);
    } catch (error) {
      showErrorAlert("Error", error.message || "Failed to update product.");
    }
  };

  const handleDeleteProduct = (productId) => {
    showDeleteConfirmAlert(
      "Delete Product?",
      "Are you sure you want to delete this product from your inventory?"
    ).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await merchandiseService.deleteMerchandise(productId, user.token);
          const newProducts = products.filter(p => p._id !== productId);
          setProducts(newProducts);
          updateStats(newProducts);
          showSuccessAlert("Deleted!", "Your product has been deleted successfully.");
        } catch (error) {
          showErrorAlert("Error", error.message || "Failed to delete product.");
        }
      }
    });
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  return (
    <div className="smp-container">
      {loading ? (
        <div className="smp-stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="smp-stat-card skeleton" style={{ minHeight: '100px' }}></div>
          ))}
        </div>
      ) : (
        <div className="smp-stats-grid">
          {stats.map((stat, idx) => (
            <div key={idx} className="smp-stat-card">
              <div className={`smp-stat-icon-wrap ${stat.color}`}>
                <Icon icon={stat.icon} />
              </div>
              <div className="smp-stat-text-wrap">
                <span className="smaller-body-text">{stat.label}</span>
                <h3>{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="smp-header-section">
        <div className="smp-header-left">
          <h1>Products Inventory</h1>
          <p className="regular-body-text">Manage your booth's food, drinks, and merchandise.</p>
        </div>
        {!isCompleted && (
          <button
            className="primary-button add-product-btn"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Icon icon="mdi:plus" /> Add Product
          </button>
        )}
      </div>

      <div className="smp-content-card">
        <div className="smp-toolbar">
          <div className="smp-toolbar-left">
            <div className="smp-search">
              <Icon icon="mdi:magnify" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="small-body-text"
              />
            </div>
          </div>

          <div className="smp-toolbar-right">
            <div className="smp-filter-dropdown" ref={dropdownRef}>
              <button
                className="smp-filter-dropdown-btn small-body-text"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className="truncate-text">{filterCategory}</span>
                <Icon icon="mdi:chevron-down" className={`dropdown-icon ${isDropdownOpen ? "open" : ""}`} />
              </button>
              {isDropdownOpen && (
                <div className="smp-filter-dropdown-menu">
                  {["All Categories", "Food", "Drinks", "Merch"].map((option) => (
                    <button
                      key={option}
                      className={`smp-filter-dropdown-item small-body-text ${filterCategory === option ? "active" : ""}`}
                      onClick={() => {
                        setFilterCategory(option);
                        setIsDropdownOpen(false);
                        setCurrentPage(1);
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="smp-grid">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="smp-card skeleton" style={{ minHeight: '340px' }}></div>
            ))
          ) : paginatedData.length > 0 ? (
            paginatedData.map((product) => (
              <div key={product._id} className="smp-card">
                <div className="smp-card-img-wrap">

                 <img src={product.image || CATEGORY_DEFAULT_IMAGES[product.category?.toLowerCase()] || '/assets/eventbg.jpg'} onError={(e) => {
                    e.target.onerror = null;
                    const category = product.category?.toLowerCase();
                    e.target.src = CATEGORY_DEFAULT_IMAGES[category] || '/assets/eventbg.jpg';
                  }} 

                  alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div className={`smp-category-badge button-label ${product.category.toLowerCase()}`}>{product.category}</div>
                </div>
                <div className="smp-card-content">
                  <div className="smp-title-row">
                    <h6 className="left-aligned">{product.name}</h6>
                    <span className="smp-price">${product.price.toFixed(2)}</span>
                  </div>
                  <p className="smaller-body-text smp-desc">{product.description}</p>

                  <div className="smp-stock-row small-body-text">
                    <span>
                      <Icon icon="mdi:package-variant-closed" /> Stock: {product.stock}
                    </span>
                    <span className={`smp-stock-status ${product.stock <= 0 ? 'out-of-stock' : product.stock <= 10 ? 'low-stock' : 'high-stock'}`}>
                      {product.stock <= 0 ? 'Out of Stock' : product.stock <= 10 ? 'Low Stock' : 'In Stock'}
                    </span>
                  </div>

                  {/* Simulated Stock Progress bar */}
                  <div className="smp-stock-progress">
                    <div
                      className={`smp-stock-bar ${product.stock <= 0 ? 'out-of-stock' : product.stock <= 10 ? 'low-stock' : 'high-stock'}`}
                      style={{ width: `${Math.min((product.stock / 100) * 100, 100)}%` }}
                    ></div>
                  </div>

                  <div className="smp-card-actions">

                    {!isCompleted && (
                      <div className="smp-action-icons">
                        <button className="smp-icon-btn" onClick={() => openEditModal(product)}>
                          <Icon icon="mdi:square-edit-outline" />
                        </button>
                        <button className="smp-icon-btn" onClick={() => handleDeleteProduct(product._id)}>
                          <Icon icon="mdi:trash-can-outline" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="smp-empty">
              <Icon icon="mdi:package-variant" width="48" />
              <p className="regular-body-text">No products found.</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="smp-pagination">
            <button
              className="smp-pagination-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="smp-pagination-info small-body-text">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="smp-pagination-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      <SponsorAddProduct
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddProduct}
      />

      <SponsorEditProduct
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        product={selectedProduct}
        onSave={handleEditProduct}
      />

    </div>
  );
};

export default SponsorManageProduct;
