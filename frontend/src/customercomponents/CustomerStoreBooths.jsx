import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useAuthContext } from "../hooks/useAuthContext";
import reservationService from "../services/reservationService";
import merchandiseService from "../services/merchandiseService";
import "./CustomerStoreBooths.css";



const CustomerStoreBooths = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { eventId, eventName } = location.state || {
    eventId: null,
    eventName: "Event"
  };

  const [boothData, setBoothData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooths = async () => {
      if (!eventId || !user?.token) return;
      try {
        setLoading(true);
        
        // Fetch booths and products in parallel
        const [reservations, products] = await Promise.all([
          reservationService.getEventBooths(eventId, user.token),
          merchandiseService.getMerchandises(user.token, { eventId })
        ]);
        
        const mappedBooths = reservations.map(res => {
          const boothProducts = products.filter(p => p.boothCode?.trim() === res.boothCode?.trim());
          
          return {
            id: res._id,
            sponsorId: res.user?._id,
            boothNumber: res.boothCode || "N/A",
            storeName: res.storeSettings?.companyName || res.user?.companyName || `${res.user?.firstName} ${res.user?.lastName}`,
            industry: res.storeSettings?.industry || res.user?.industry || "Sponsor",
            products: boothProducts.length,
            logo: res.storeSettings?.logo ? (res.storeSettings.logo.startsWith('/') ? res.storeSettings.logo : `/uploads/${res.storeSettings.logo}`) : (res.user?.avatar ? (res.user.avatar.startsWith('/') ? res.user.avatar : `/uploads/${res.user.avatar}`) : '/assets/eventbg.jpg'),
            description: res.storeSettings?.description || "there is no description"
          };
        });
        
        setBoothData(mappedBooths);
      } catch (error) {
        console.error("Error fetching booths and products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooths();
  }, [eventId, user?.token]);

  const itemsPerPage = 8;

  const filteredBooths = boothData.filter((booth) => {
    return booth.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booth.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booth.boothNumber.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalPages = Math.ceil(filteredBooths.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredBooths.slice(startIndex, Math.min(startIndex + itemsPerPage, filteredBooths.length));

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="csb-container">
      <div className="csb-back-link" onClick={() => navigate("/customer/store")}>
        <Icon icon="mdi:arrow-left" /> Back to Events
      </div>

      <div className="csb-header-section">
        <div className="csb-header-title">
          <Icon icon="mdi:storefront-outline" className="csb-title-icon" />
          <div>
            <h1>Store Booths</h1>
            <p className="regular-body-text csb-title-desc">{eventName}</p>
          </div>
        </div>
        <p className="regular-body-text csb-subtitle">
          Explore sponsor booths and discover what they're selling at this event.
        </p>
      </div>

      <div className="csb-content-card">
        <div className="csb-toolbar">
          <div className="csb-toolbar-left">
            <div className="csb-search">
              <Icon icon="mdi:magnify" />
              <input
                type="text"
                placeholder="Search booths, sponsors..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="small-body-text"
              />
            </div>
          </div>
          <div className="csb-toolbar-right">
            <span className="csb-results-count small-body-text">
              {filteredBooths.length} booth{filteredBooths.length !== 1 ? "s" : ""} found
            </span>
          </div>
        </div>

        <div className="csb-grid">
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="csb-card" style={{ cursor: "default" }}>
                <div className="csb-card-image-wrap">
                  <div className="skeleton-image skeleton" style={{ height: "180px", borderRadius: "12px 12px 0 0" }} />
                </div>
                <div className="csb-card-details">
                  <div className="skeleton-text title skeleton" />
                  <div className="skeleton-text skeleton" style={{ width: "40%" }} />
                  <div className="skeleton-text skeleton" style={{ width: "90%", height: "30px", margin: "10px 0" }} />
                  <div className="csb-stats-row" style={{ marginTop: "15px" }}>
                    <div className="skeleton-text short skeleton" />
                  </div>
                  <div className="skeleton-button skeleton" style={{ marginTop: "15px" }} />
                </div>
              </div>
            ))
          ) : paginatedData.length > 0 ? (
            paginatedData.map((booth) => (
              <div
                key={booth.id}
                className="csb-card"
                onClick={() => navigate("/customer/store/products", {
                  state: {
                    eventId,
                    eventName,
                    sponsorId: booth.sponsorId,
                    boothName: booth.boothNumber,
                    storeName: booth.storeName
                  }
                })}
              >
                <div className="csb-card-image-wrap">
                  <img 
                    src={booth.logo} 
                    alt={booth.storeName} 
                    onError={(e) => { e.target.src = '/assets/eventbg.jpg'; }}
                  />
                  <div className="csb-booth-badge button-label">{booth.boothNumber}</div>
                </div>
                <div className="csb-card-details">
                  <h5 className="csb-company-name">{booth.storeName}</h5>
                  <div className="csb-card-info small-body-text">
                    <Icon icon="mdi:domain" />
                    <span>{booth.industry}</span>
                  </div>
                  <p className="csb-card-desc smaller-body-text">{booth.description}</p>

                  <div className="csb-stats-row">
                    <div className="csb-stat-item">
                      <span className="smaller-body-text stat-label">Products</span>
                      <span className="large-body-text stat-value">{booth.products}</span>
                    </div>
                  </div>

                  <button className="primary-button csb-visit-btn">
                    Visit Store <Icon icon="mdi:arrow-right" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="csb-empty-state">
              <Icon icon="mdi:storefront-remove-outline" width="48" />
              <h4>No booths found</h4>
              <p className="small-body-text">
                {searchQuery ? (
                  <>No booths match "<strong>{searchQuery}</strong>".</>
                ) : (
                  "There are no sponsor booths for this event yet."
                )}
              </p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="pagination-info">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="pagination-btn"
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

export default CustomerStoreBooths;
