import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { showDeleteConfirmAlert, showSuccessAlert, showErrorAlert } from "../admincomponents/utils/sweetAlert";
import "./SponsorManageProduct.css";
import SponsorAddProduct from "./SponsorModal/SponsorAddProduct";
import SponsorEditProduct from "./SponsorModal/SponsorEditProduct";
import merchandiseService from "../services/merchandiseService";
import { useAuthContext } from "../admincomponents/hooks/useAuthContext";

const initialProducts = [
  { id: 1, image: "/assets/eventbg.jpg", category: "Food", name: "Gourmet Burger", price: "$12.99", description: "Premium beef patty with artisan cheese and house sauce.", stock: 40, stockStatus: "Medium Stock", active: true },
  { id: 2, image: "/assets/eventbg.jpg", category: "Food", name: "Loaded Nachos", price: "$9.99", description: "Crispy tortilla chips topped with melted cheese, jalapeños, and salsa.", stock: 25, stockStatus: "Medium Stock", active: true },
  { id: 3, image: "/assets/eventbg.jpg", category: "Food", name: "Caesar Wrap", price: "$8.49", description: "Grilled chicken, crisp romaine, and parmesan in a spinach wrap.", stock: 30, stockStatus: "Medium Stock", active: true },
  { id: 4, image: "/assets/eventbg.jpg", category: "Food", name: "Truffle Fries", price: "$7.99", description: "Crispy fries tossed in truffle oil and parmesan cheese.", stock: 50, stockStatus: "Medium Stock", active: true },
  { id: 5, image: "/assets/eventbg.jpg", category: "Drinks", name: "Craft Lemonade", price: "$4.99", description: "Freshly squeezed lemonade with a hint of mint.", stock: 100, stockStatus: "High Stock", active: true },
  { id: 6, image: "/assets/eventbg.jpg", category: "Drinks", name: "Cold Brew Coffee", price: "$5.99", description: "Smooth, slow-steeped cold brew coffee.", stock: 15, stockStatus: "Low Stock", active: true },
  { id: 7, image: "/assets/eventbg.jpg", category: "Merch", name: "Event T-Shirt", price: "$24.99", description: "Official event t-shirt. 100% cotton.", stock: 200, stockStatus: "High Stock", active: true },
  { id: 8, image: "/assets/eventbg.jpg", category: "Merch", name: "Ceramic Mug", price: "$14.99", description: "11oz ceramic mug with event logo.", stock: 0, stockStatus: "Out of Stock", active: false },
  { id: 9, image: "/assets/eventbg.jpg", category: "Drinks", name: "Bottled Water", price: "$2.99", description: "Spring water.", stock: 150, stockStatus: "High Stock", active: true },
];

const SponsorManageProduct = ({ eventId }) => {
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

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const itemsPerPage = 8;

  const fetchProducts = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Fetch products filter by event if eventId provided
      const filters = eventId ? { eventId } : {};
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
  }, [user, eventId]);

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

      <div className="smp-header-section">
        <div className="smp-header-left">
          <h1>Products Inventory</h1>
          <p className="regular-body-text">Manage your booth's food, drinks, and merchandise.</p>
        </div>
        <button 
          className="primary-button add-product-btn"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Icon icon="mdi:plus" /> Add Product
        </button>
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
          <div className="smp-loading">
            <Icon icon="mdi:loading" className="smp-spin" width="48" />
            <p>Loading inventory...</p>
          </div>
        ) : paginatedData.length > 0 ? (
          paginatedData.map((product) => (
            <div key={product._id} className="smp-card">
              <div className="smp-card-img-wrap">
                <img src={product.image || "/assets/eventbg.jpg"} alt={product.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
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
                    style={{width: `${Math.min((product.stock / 100) * 100, 100)}%`}}
                  ></div>
                </div>

                <div className="smp-card-actions">
                  
                  <div className="smp-action-icons">
                    <button className="smp-icon-btn" onClick={() => openEditModal(product)}>
                      <Icon icon="mdi:square-edit-outline" />
                    </button>
                    <button className="smp-icon-btn" onClick={() => handleDeleteProduct(product._id)}>
                      <Icon icon="mdi:trash-can-outline" />
                    </button>
                  </div>
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
