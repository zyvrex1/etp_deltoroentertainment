import React, { useState } from "react";
import { Icon } from "@iconify/react";
import "./promoterannouncement.css";
import PromoterViewFullAnnouncement from "./PromoterModal/PromoterViewFullAnnouncement";

const announcementsData = [
  {
    id: 1,
    title: "Platform Maintenance Scheduled",
    date: "Oct 15, 2024",
    type: "Update",
    content: "The platform will undergo scheduled maintenance on October 20th from 2:00 AM to 6:00 AM EST. During this time, ticket sales and check-in features will be temporarily unavailable.\n\nDuring the maintenance window, the following services will be affected: Ticket purchasing and sales processing, QR code check-in scanning, Real-time analytics dashboard, Payment processing and refunds. All event pages will display a maintenance notice to visitors.\n\nWe recommend completing any urgent transactions before the maintenance window. If you have events scheduled during this period, please ensure all check-in preparations are completed in advance. For any concerns, contact support@eticketspro.com.",
    icon: "mdi:bullhorn-outline"
  },
  {
    id: 2,
    title: "New Feature: QR Code Batch Printing",
    date: "Oct 15, 2024",
    type: "Alert",
    content: "Governs the use of the eTicketsPro platform including event creation, ticket sales, and attendee management.",
    icon: "mdi:bullhorn-outline"
  },
  {
    id: 3,
    title: "New Feature: QR Code Batch Printing",
    date: "Oct 15, 2024",
    type: "Maintenance",
    content: "Governs the use of the eTicketsPro platform including event creation, ticket sales, and attendee management.",
    icon: "mdi:bullhorn-outline"
  },
  {
    id: 4,
    title: "New Feature: QR Code Batch Printing",
    date: "Oct 15, 2024",
    type: "News",
    content: "Governs the use of the eTicketsPro platform including event creation, ticket sales, and attendee management.",
    icon: "mdi:bullhorn-outline"
  },
  {
    id: 5,
    title: "New Feature: QR Code Batch Printing",
    date: "Oct 15, 2024",
    type: "General",
    content: "Governs the use of the eTicketsPro platform including event creation, ticket sales, and attendee management.",
    icon: "mdi:bullhorn-outline"
  }
];

const policiesData = [
  {
    id: 1,
    title: "Terms of Service",
    date: "Jan 1, 2024",
    content: "1. Acceptance of Terms\n\nBy accessing or using the eTicketsPro platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.\n\n2. Account Registration\n\nYou must register for an account to create events or purchase tickets. You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer. You agree to accept responsibility for all activities that occur under your account.\n\n3. Event Creation\n\nEvent organizers are responsible for the accuracy of event information, including dates, times, locations, and ticket prices. eTicketsPro reserves the right to remove any event that violates our community guidelines or local laws.\n\n4. Ticket Sales\n\nAll ticket sales are processed through our secure payment system.",
    icon: "mdi:file-document-outline"
  },
  {
    id: 2,
    title: "Privacy Policy",
    date: "Jan 1, 2024",
    content: "Governs the use of the eTicketsPro platform including event creation, ticket sales, and attendee management. event creation, ticket sales, and attendee management. event creation, ticket sales, and attendee management.",
    icon: "mdi:file-document-outline"
  },
  {
    id: 3,
    title: "Refund & Cancellation Policy",
    date: "Jan 1, 2024",
    content: "Governs the use of the eTicketsPro platform including event creation, ticket sales, and attendee management. event creation, ticket sales, and attendee management. event creation, ticket sales, and attendee management.",
    icon: "mdi:file-document-outline"
  },
  {
    id: 4,
    title: "Event Safety & Compliance",
    date: "Jan 1, 2024",
    content: "Governs the use of the eTicketsPro platform including event creation, ticket sales, and attendee management. event creation, ticket sales, and attendee management. event creation, ticket sales, and attendee management.",
    icon: "mdi:file-document-outline"
  },
  {
    id: 5,
    title: "Vendor & Sponsor Agreement",
    date: "Jan 1, 2024",
    content: "Governs the use of the eTicketsPro platform including event creation, ticket sales, and attendee management. event creation, ticket sales, and attendee management. event creation, ticket sales, and attendee management.",
    icon: "mdi:file-document-outline"
  },
  {
    id: 6,
    title: "Data Retention Policy",
    date: "Jan 1, 2024",
    content: "Governs the use of the eTicketsPro platform including event creation, ticket sales, and attendee management. event creation, ticket sales, and attendee management. event creation, ticket sales, and attendee management.",
    icon: "mdi:file-document-outline"
  }
];

const PromoterAnnouncement = () => {
  const [activeTab, setActiveTab] = useState("announcements");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterDropdownRef = React.useRef(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  React.useEffect(() => {
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

  const filteredAnnouncements = announcementsData.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesFilter = activeFilter === "All" || item.type === activeFilter;
    if (!matchesFilter) return false;
    if (!q) return true;
    return item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q);
  });

  const filteredPolicies = policiesData.filter((item) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q);
  });

  // Since we also need to implement the pop up, I should just set up the basic layout first.
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
            Announcements <span className={`pa-tab-count ${activeTab === 'announcements' ? 'active' : ''}`}>{announcementsData.length}</span>
          </button>
          <button 
            className={`pa-tab ${activeTab === 'policies' ? 'active' : ''}`} 
            onClick={() => {
              setActiveTab('policies');
              setSearchQuery('');
            }}
          >
            Policies <span className={`pa-tab-count ${activeTab === 'policies' ? 'active' : ''}`}>{policiesData.length}</span>
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

          <div className="pa-grid">
            {activeTab === 'announcements' && (
  filteredAnnouncements.length === 0 ? (
    <div className="empty-state">
      <Icon icon="mdi:magnify-close" width="48" />
      <h4>No Announcement(s) found</h4>
      <p className="small-body-text">
        No Announcement(s) match "<strong>{searchQuery}</strong>".
      </p>
    </div>
  ) : (
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
  )
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
