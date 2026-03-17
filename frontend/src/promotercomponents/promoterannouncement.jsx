import React, { useState } from "react";
import { Icon } from "@iconify/react";
import "./promoterannouncement.css";

const announcementsData = [
  {
    id: 1,
    title: "Platform Maintenance Scheduled",
    date: "Oct 15, 2024",
    type: "Update",
    content: "Governs the use of the eTicketsPro platform including event creation, ticket sales, and attendee management.",
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
    content: "Governs the use of the eTicketsPro platform including event creation, ticket sales, and attendee management. event creation, ticket sales, and attendee management. event creation, ticket sales, and attendee management.",
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
            onClick={() => setActiveTab('announcements')}
          >
            Announcements <span className={`pa-tab-count ${activeTab === 'announcements' ? 'active' : ''}`}>{announcementsData.length}</span>
          </button>
          <button 
            className={`pa-tab ${activeTab === 'policies' ? 'active' : ''}`} 
            onClick={() => setActiveTab('policies')}
          >
            Policies <span className={`pa-tab-count ${activeTab === 'policies' ? 'active' : ''}`}>{policiesData.length}</span>
          </button>
        </div>
      </div>

      <div className="pa-content">
        <div className="pa-grid">
          {activeTab === 'announcements' && announcementsData.map((item) => (
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
                <span className={`pa-badge ${item.type.toLowerCase()}`}>
                  {item.type}
                </span>
                <p className="pa-card-text">{item.content}</p>
                <button className="pa-read-more-btn">View Full Announcement</button>
              </div>
            </div>
          ))}

          {activeTab === 'policies' && policiesData.map((item) => (
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
                <p className="pa-card-text">{item.content}</p>
                <button className="pa-read-more-btn">View Full Policy</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromoterAnnouncement;
