import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useAuthContext } from "../hooks/useAuthContext";
import "./CustomerStoreBooths.css";

const sampleBooths = [
  { id: 1, sponsorId: "s1", boothNumber: "Booth #102", companyName: "TechCorp Solutions", industry: "Technology", products: 12, logo: "/assets/eventbg.jpg", description: "Leading provider of enterprise software solutions and cloud services." },
  { id: 2, sponsorId: "s2", boothNumber: "Booth #205", companyName: "GreenLeaf Organics", industry: "Food & Beverage", products: 18, logo: "/assets/eventbg.jpg", description: "Premium organic food and refreshments from farm to table." },
  { id: 3, sponsorId: "s3", boothNumber: "Booth #310", companyName: "Urban Threads", industry: "Fashion & Apparel", products: 25, logo: "/assets/eventbg.jpg", description: "Trendy streetwear and custom event merchandise." },
  { id: 4, sponsorId: "s4", boothNumber: "Booth #118", companyName: "Pixel Gear", industry: "Electronics", products: 8, logo: "/assets/eventbg.jpg", description: "Latest gadgets, accessories, and tech merchandise." },
  { id: 5, sponsorId: "s5", boothNumber: "Booth #422", companyName: "FitLife Nutrition", industry: "Health & Wellness", products: 15, logo: "/assets/eventbg.jpg", description: "Energy drinks, protein bars, and health supplements." },
  { id: 6, sponsorId: "s6", boothNumber: "Booth #55", companyName: "Artisan Brews", industry: "Beverages", products: 10, logo: "/assets/eventbg.jpg", description: "Craft beverages and specialty coffees." },
  { id: 7, sponsorId: "s7", boothNumber: "Booth #77", companyName: "GameZone Merch", industry: "Entertainment", products: 30, logo: "/assets/eventbg.jpg", description: "Collectibles, posters, and exclusive gaming merchandise." },
  { id: 8, sponsorId: "s8", boothNumber: "Booth #90", companyName: "EcoWear", industry: "Sustainable Fashion", products: 20, logo: "/assets/eventbg.jpg", description: "Eco-friendly clothing and accessories made from recycled materials." },
];

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

  const itemsPerPage = 8;

  const filteredBooths = sampleBooths.filter((booth) => {
    return booth.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
          {paginatedData.length > 0 ? (
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
                    sponsorName: booth.companyName
                  }
                })}
              >
                <div className="csb-card-image-wrap">
                  <img src={booth.logo} alt={booth.companyName} />
                  <div className="csb-booth-badge button-label">{booth.boothNumber}</div>
                </div>
                <div className="csb-card-details">
                  <h5 className="csb-company-name">{booth.companyName}</h5>
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
