import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import merchandiseService from "../services/merchandiseService";
import { useAuthContext } from "../hooks/useAuthContext";
import "./CustomerStoreProducts.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const CustomerStoreProducts = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const { eventId, eventName, sponsorId, boothName, sponsorName } = location.state || {
    eventId: null,
    eventName: "Event",
    sponsorId: null,
    boothName: "Booth",
    sponsorName: "Sponsor"
  };

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All Categories");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const dropdownRef = useRef(null);

  const itemsPerPage = 8;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const filters = {};
        if (eventId) filters.eventId = eventId;
        if (sponsorId) filters.sponsorId = sponsorId;
        const data = await merchandiseService.getMerchandises(user?.token, filters);
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [user, eventId, sponsorId]);

  // Close dropdown when clicking outside
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
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
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

  const getProductImage = (image) => {
    if (!image) return "/assets/eventbg.jpg";
    if (image.startsWith("http") || image.startsWith("data:")) return image;
    return `${BACKEND_URL}/uploads/${image}`;
  };

  return (
    <div className="csp-container">
      <div className="csp-back-link" onClick={() => navigate("/customer/store/booths", {
        state: { eventId, eventName }
      })}>
        <Icon icon="mdi:arrow-left" /> Back to Booths
      </div>

      <div className="csp-header-section">
        <div className="csp-header-title">
          <Icon icon="mdi:shopping-outline" className="csp-title-icon" />
          <div>
            <h1>{sponsorName}</h1>
            <p className="regular-body-text csp-title-desc">{boothName} • {eventName}</p>
          </div>
        </div>
        <p className="regular-body-text csp-subtitle">
          Browse products and merchandise available at this booth.
        </p>
      </div>

      <div className="csp-content-card">
        <div className="csp-toolbar">
          <div className="csp-toolbar-left">
            <div className="csp-search">
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

          <div className="csp-toolbar-right">
            <div className="csp-filter-dropdown" ref={dropdownRef}>
              <button
                className="csp-filter-dropdown-btn small-body-text"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className="truncate-text">{filterCategory}</span>
                <Icon icon="mdi:chevron-down" className={`dropdown-icon ${isDropdownOpen ? "open" : ""}`} />
              </button>
              {isDropdownOpen && (
                <div className="csp-filter-dropdown-menu">
                  {["All Categories", "Food", "Drinks", "Merch"].map((option) => (
                    <button
                      key={option}
                      className={`csp-filter-dropdown-item small-body-text ${filterCategory === option ? "active" : ""}`}
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

        <div className="csp-grid">
          {loading ? (
            <div className="csp-loading">
              <Icon icon="mdi:loading" className="csp-spin" width="48" />
              <p>Loading products...</p>
            </div>
          ) : paginatedData.length > 0 ? (
            paginatedData.map((product) => (
              <div key={product._id || product.id} className="csp-card">
                <div className="csp-card-img-wrap">
                  <img src={getProductImage(product.image)} alt={product.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  <div className={`csp-category-badge button-label ${product.category.toLowerCase()}`}>{product.category}</div>
                </div>
                <div className="csp-card-content">
                  <div className="csp-title-row">
                    <h6 className="left-aligned">{product.name}</h6>
                    <span className="csp-price">${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}</span>
                  </div>
                  <p className="smaller-body-text csp-desc">{product.description}</p>

                  <div className="csp-stock-row small-body-text">
                    <span>
                      <Icon icon="mdi:package-variant-closed" /> Stock: {product.stock}
                    </span>
                    <span className={`csp-stock-status ${product.stock <= 0 ? 'out-of-stock' : product.stock <= 10 ? 'low-stock' : 'high-stock'}`}>
                      {product.stock <= 0 ? 'Out of Stock' : product.stock <= 10 ? 'Low Stock' : 'In Stock'}
                    </span>
                  </div>

                  <div className="csp-stock-progress">
                    <div
                      className={`csp-stock-bar ${product.stock <= 0 ? 'out-of-stock' : product.stock <= 10 ? 'low-stock' : 'high-stock'}`}
                      style={{width: `${Math.min((product.stock / 100) * 100, 100)}%`}}
                    ></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="csp-empty">
              <Icon icon="mdi:package-variant" width="48" />
              <p className="regular-body-text">No products available at this booth.</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="csp-pagination">
            <button
              className="csp-pagination-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="csp-pagination-info small-body-text">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="csp-pagination-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerStoreProducts;
