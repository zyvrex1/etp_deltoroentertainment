import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import "./promoterannouncement.css";
import PromoterViewFullAnnouncement from "./PromoterModal/PromoterViewFullAnnouncement";
import announcementService from "../services/announcementService";
import policyService from "../services/policyService";

const PromoterAnnouncement = () => {
  const [activeTab, setActiveTab] = useState("announcements");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [announcements, setAnnouncements] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [annData, polData] = await Promise.all([
        announcementService.getAnnouncements(),
        policyService.getPolicies()
      ]);
      
      // Map backend names/fields to match UI expectations
      const mappedAnn = annData.map(ann => ({
        id: ann._id,
        title: ann.title,
        date: new Date(ann.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        type: ann.contentcategory,
        content: ann.content,
        icon: "mdi:bullhorn-outline"
      }));

      const mappedPol = polData.map(pol => ({
        id: pol._id,
        title: pol.title,
        date: new Date(pol.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        content: pol.content,
        key: pol.policyKey,
        icon: "mdi:file-document-outline"
      }));

      setAnnouncements(mappedAnn);
      setPolicies(mappedPol);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setIsFilterDropdownOpen(false);
      }
    };

    if (isFilterDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFilterDropdownOpen]);

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  const handleOpenModal = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const filteredAnnouncements = announcements.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesFilter = activeFilter === "All" || item.type === activeFilter;
    if (!matchesFilter) return false;
    if (!q) return true;
    return item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q);
  });

  const filteredPolicies = policies.filter((item) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q);
  });

  return (
    <div className="pa-container">
      <div className="pa-header">
        <h1>Announcements & Policies</h1>
        <p className="pa-subtitle">Stay updated with the latest admin announcements and policy changes.</p>
      </div>

      <div className="pa-tabs-container">
        <div className="pa-tabs">
          <button
            className={`pa-tab ${activeTab === 'announcements' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('announcements');
              setSearchQuery('');
              setActiveFilter('All');
            }}
          >
            Announcements <span className={`pa-tab-count ${activeTab === 'announcements' ? 'active' : ''}`}>{announcements.length}</span>
          </button>
          <button
            className={`pa-tab ${activeTab === 'policies' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('policies');
              setSearchQuery('');
            }}
          >
            Policies <span className={`pa-tab-count ${activeTab === 'policies' ? 'active' : ''}`}>{policies.length}</span>
          </button>
        </div>
      </div>

      <div className="pa-content">
        <div className="pa-table-container">
          <div className="pa-toolbar">
            <div className="pa-toolbar-left">
              <div className="pa-search">
                <Icon icon="mdi:magnify" />
                <input
                  type="text"
                  placeholder={activeTab === 'announcements' ? "Search announcements..." : "Search policies..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="small-body-text"
                />
              </div>
            </div>

            {activeTab === 'announcements' && (
              <div className="pa-toolbar-right">
                <div className="pa-filter-dropdown" ref={filterDropdownRef}>
                  <button
                    className="pa-filter-dropdown-btn"
                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                  >
                    <span className="truncate-text">
                      {activeFilter}
                    </span>
                    <Icon
                      icon="mdi:chevron-down"
                      className={`dropdown-icon ${isFilterDropdownOpen ? "open" : ""}`}
                    />
                  </button>

                  {isFilterDropdownOpen && (
                    <div className="pa-filter-dropdown-menu">
                      {["All", "Update", "Alert", "Maintenance", "News", "General"].map((option) => (
                        <button
                          key={option}
                          className={`pa-filter-dropdown-item small-body-text ${activeFilter === option ? "active" : ""}`}
                          onClick={() => {
                            handleFilterChange(option);
                            setIsFilterDropdownOpen(false);
                          }}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {loading ? (
             <div className="pa-loading-state" style={{ padding: "80px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                <Icon icon="line-md:loading-twotone-loop" width="48" style={{ color: "var(--color-red-primary)" }} />
                <p className="large-body-text">Loading {activeTab}...</p>
             </div>
          ) : (
            <>
              {/* Announcements Empty State (No Announcements at all) */}
              {activeTab === 'announcements' && announcements.length === 0 && (
                <div className="empty-state">
                  <Icon icon="mdi:announcement-outline" width="48" />
                  <h4>There is no announcement yet</h4>
                  <p className="small-body-text">Check back later for important platform updates.</p>
                </div>
              )}

              {/* Policies Empty State (No Policies at all) */}
              {activeTab === 'policies' && policies.length === 0 && (
                <div className="empty-state">
                  <Icon icon="mdi:file-document-outline" width="48" />
                  <h4>There is no policy yet</h4>
                  <p className="small-body-text">Platform policies will appear here once published.</p>
                </div>
              )}

              {/* Search Result Empty States */}
              {activeTab === 'announcements' && announcements.length > 0 && filteredAnnouncements.length === 0 && (
                <div className="empty-state">
                  <Icon icon="mdi:magnify-close" width="48" />
                  <h4>No Announcement(s) found</h4>
                  <p className="small-body-text">
                    No Announcement(s) match "<strong>{searchQuery}</strong>".
                  </p>
                </div>
              )}

              {activeTab === 'policies' && policies.length > 0 && filteredPolicies.length === 0 && (
                <div className="empty-state">
                  <Icon icon="mdi:magnify-close" width="48" />
                  <h4>No Policy(s) found</h4>
                  <p className="small-body-text">
                    No Policy(s) match "<strong>{searchQuery}</strong>".
                  </p>
                </div>
              )}

              {(activeTab === 'announcements' && filteredAnnouncements.length > 0) || (activeTab === 'policies' && filteredPolicies.length > 0) ? (
                <div className="pa-grid">
                  {activeTab === 'announcements' && (
                    filteredAnnouncements.map((item) => (
                      <div key={item.id} className="pa-card">
                        <div className="pa-card-top">
                          <div className="pa-card-icon-container">
                            <Icon icon={item.icon} className="pa-card-icon" />
                          </div>
                          <div className="pa-card-meta">
                            <h3 className="pa-card-title">{item.title}</h3>
                            <span className="pa-date">
                              <Icon icon="mdi:calendar-outline" /> {item.date}
                            </span>
                          </div>
                        </div>
                        <div className="pa-card-body">
                          <span className={`pa-badge button-label ${item.type.toLowerCase()}`}>
                            {item.type}
                          </span>
                          <p className="pa-card-text">
                            {item.content.length > 150
                              ? item.content.substring(0, 150) + '...'
                              : item.content}
                          </p>
                          <button
                            className="pa-read-more-btn"
                            onClick={() => handleOpenModal(item)}
                          >
                            View Full Announcement
                          </button>
                        </div>
                      </div>
                    ))
                  )}

                  {activeTab === 'policies' && filteredPolicies.map((item) => (
                    <div key={item.id} className="pa-card">
                      <div className="pa-card-top align-start">
                        <div className="pa-card-icon-container document-icon">
                          <Icon icon={item.icon} className="pa-card-icon" />
                        </div>
                        <div className="pa-card-meta">
                          <h3 className="pa-card-title">{item.title}</h3>
                          <span className="pa-date">
                            Updated Last: {item.date}
                          </span>
                        </div>
                      </div>
                      <div className="pa-card-body">
                        <p className="pa-card-text">{item.content.length > 100 ? item.content.substring(0, 100) + '...' : item.content}</p>
                        <button className="pa-read-more-btn" onClick={() => handleOpenModal(item)}>View Full Policy</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      <PromoterViewFullAnnouncement
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={selectedItem}
        type={activeTab === 'announcements' ? 'announcement' : 'policy'}
      />
    </div>
  );
};

export default PromoterAnnouncement;


