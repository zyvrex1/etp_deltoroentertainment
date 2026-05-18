import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import merchandiseService from "../services/merchandiseService";
import orderService from "../services/orderService";
import { useAuthContext } from "../hooks/useAuthContext";
import { useCustomerStoreCart } from "../context/CustomerStoreCartContext";
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from "../utils/sweetAlert";
import "./CustomerStoreProducts.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const CartModal = ({ isOpen, onClose, cartItems, totalAmount, onCheckout, onUpdateQty }) => {
  if (!isOpen) return null;

  return (
    <div className="cart-modal-overlay" onClick={onClose}>
      <div className="cart-modal-content" onClick={e => e.stopPropagation()}>
        <div className="cart-modal-header">
          <h3>Your Order Summary</h3>
          <Icon icon="mdi:close" className="close-btn" width="24" onClick={onClose} />
        </div>
        <div className="cart-modal-items">
          {cartItems.map(item => (
            <div key={item.id} className="cart-item">
              <div className="item-info">
                <h6>{item.name}</h6>
                <p className="item-booth">{item.boothName}</p>
                <div className="csp-qty-controls">
                  <button className="csp-qty-btn" onClick={() => onUpdateQty(item.id, -1)}>-</button>
                  <span className="csp-qty-value">{item.quantity}</span>
                  <button className="csp-qty-btn" onClick={() => onUpdateQty(item.id, 1)}>+</button>
                </div>
              </div>
              <div className="item-price-qty">
                <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                <p className="item-qty">{item.quantity} x ${item.price.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-modal-footer">
          <div className="footer-total">
            <span>Total Amount</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
          <button className="modal-checkout-btn" onClick={onCheckout}>
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

const CustomerStoreProducts = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    addToCart, 
    updateQuantity, 
    getItemQuantity, 
    cartItems, 
    getTotalAmount, 
    getTotalItems,
    clearCart
  } = useCustomerStoreCart();

  const { eventId, eventName, sponsorId, boothName, storeName } = location.state || {
    eventId: null,
    eventName: "Event",
    sponsorId: null,
    boothName: "Booth",
    storeName: "Store"
  };

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All Categories");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const dropdownRef = useRef(null);

  const itemsPerPage = 8;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await merchandiseService.getMerchandises(user?.token, { eventId });
        const filtered = data.filter(p => p.boothCode?.trim() === boothName?.trim());
        setProducts(filtered);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchProducts();
    }
  }, [user, eventId, boothName]);

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

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    setIsCartModalOpen(false);
    navigate("/customer/store/checkout", { state: { storeName, boothName } });
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
            <h1>{storeName}</h1>
            <p className="regular-body-text csp-title-desc">{boothName} • {eventName}</p>
          </div>
        </div>
        <p className="regular-body-text csp-subtitle">
          Select multiple products and merchandise to place your order.
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
            paginatedData.map((product) => {
              const qty = getItemQuantity(product._id || product.id);
              return (
                <div key={product._id || product.id} className="csp-card">
                  <div className="csp-card-img-wrap">
                    <img 
                      src={getProductImage(product.image)} 
                      alt={product.name} 
                      style={{width: '100%', height: '100%', objectFit: 'cover'}} 
                      onError={(e) => { e.target.src = '/assets/eventbg.jpg'; }}
                    />
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

                    {qty > 0 ? (
                      <div className="csp-qty-controls">
                        <button className="csp-qty-btn" onClick={() => updateQuantity(product._id || product.id, -1)}>-</button>
                        <span className="csp-qty-value">{qty} in cart</span>
                        <button className="csp-qty-btn" onClick={() => updateQuantity(product._id || product.id, 1)} disabled={qty >= product.stock}>+</button>
                      </div>
                    ) : (
                      <button 
                        className="csp-add-btn" 
                        disabled={product.stock <= 0}
                        onClick={() => addToCart(product, { eventId, eventName, sponsorName: storeName, boothName })}
                      >
                        <Icon icon="mdi:cart-plus" /> Add to Order
                      </button>
                    )}
                  </div>
                </div>
              );
            })
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

      {getTotalItems() > 0 && (
        <div className="csp-cart-bar">
          <div className="csp-cart-info">
            <div className="csp-cart-count">
              <Icon icon="mdi:shopping" width="24" />
              <span className="count-badge">{getTotalItems()}</span>
              <span>Items</span>
            </div>
            <div className="csp-cart-total">
              Total: ${getTotalAmount().toFixed(2)}
            </div>
          </div>
          <div className="csp-cart-actions">
            <button className="view-cart-btn" onClick={() => setIsCartModalOpen(true)}>
              View Details
            </button>
            <button className="checkout-btn" onClick={handleCheckout}>
              Place Order <Icon icon="mdi:arrow-right" />
            </button>
          </div>
        </div>
      )}

      <CartModal 
        isOpen={isCartModalOpen} 
        onClose={() => setIsCartModalOpen(false)}
        cartItems={cartItems}
        totalAmount={getTotalAmount()}
        onCheckout={handleCheckout}
        onUpdateQty={updateQuantity}
      />
    </div>
  );
};

export default CustomerStoreProducts;
