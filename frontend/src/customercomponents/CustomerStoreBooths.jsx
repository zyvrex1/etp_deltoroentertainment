import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useAuthContext } from "../hooks/useAuthContext";
import "./CustomerStoreBooths.css";

const sampleBooths = [
  { id: 1, sponsorId: "s1", boothNumber: "Booth #102", companyName: "Texas Home Pros", industry: "Home & Living", products: 12, logo: "/uploads/monday-content-post-1-0429260249.jpg", description: "Your one-stop shop for home renovation and interior design." },
  { id: 2, sponsorId: "s2", boothNumber: "Booth #205", companyName: "Laugh Out Loud Events", industry: "Entertainment", products: 18, logo: "/uploads/guey-funny-comedy-show-march-20-0429260231.jpg", description: "Specializing in comedy tours and live performances." },
  { id: 3, sponsorId: "s3", boothNumber: "Booth #310", companyName: "Tejano Beats", industry: "Music", products: 25, logo: "/uploads/grupo-siggno,-solido-and-secretto-flyers-2026-mock-up-0429260228.jpg", description: "The heart of Tejano music, merchandise, and exclusive vinyls." },
  { id: 4, sponsorId: "s4", boothNumber: "Booth #118", companyName: "Valley Harvest", industry: "Local Produce", products: 8, logo: "/uploads/weslaco-texas-onion-fest-0429260226.jpg", description: "Fresh produce and local favorites from the Rio Grande Valley." },
  { id: 5, sponsorId: "s5", boothNumber: "Booth #422", companyName: "Fanfair Express", industry: "Sports", products: 15, logo: "/uploads/siggno-advertising-poster-0429260219.jpg", description: "Exclusive sports memorabilia and fan gear for all ages." },
  { id: 6, sponsorId: "s6", boothNumber: "Booth #55", companyName: "Health First Texas", industry: "Health & Wellness", products: 10, logo: "/uploads/yhm-event-page-cover-pharr-1777152601031.jpg", description: "Commit to your health with our expert wellness programs." },
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
