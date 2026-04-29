import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import "./SponsorStoreDashboard.css";

import SponsorManageProduct from "./SponsorManageProduct";
import SponsorManageOrder from "./SponsorManageOrder";
import SponsorProductAnalytics from "./SponsorProductAnalytics";
import SponsorPaymentInfo from "./SponsorPaymentInfo";

const SponsorStoreDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("Products");

  // Get event data from navigation state
  const { eventId, eventName, boothCode } = location.state || { 
    eventId: null, 
    eventName: "General Inventory",
    boothCode: null
  };

  return (
    <div className="ssd-container">
      <div className="ssd-back-link" onClick={() => navigate("/sponsor/store")}>
        <Icon icon="mdi:arrow-left" /> Back to Stores
      </div>
      
      <div className="ssd-header">
        <h1>Store Dashboard</h1>
        <p className="regular-body-text">{eventName} {boothCode ? `- Booth ${boothCode}` : ''}</p>
      </div>

      <div className="ssd-tabs-container">
        <div className="ssd-tabs">
          <button 
            className={`ssd-tab ${activeTab === 'Products' ? 'active' : ''}`}
            onClick={() => setActiveTab('Products')}
          >
            <Icon icon="mdi:package-variant-closed" /> Products
          </button>
          <button 
            className={`ssd-tab ${activeTab === 'Orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('Orders')}
          >
            <Icon icon="mdi:shopping-outline" /> Orders
          </button>
          <button 
            className={`ssd-tab ${activeTab === 'Analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('Analytics')}
          >
            <Icon icon="mdi:chart-bar" /> Analytics
          </button>
          <button 
            className={`ssd-tab ${activeTab === 'Info' ? 'active' : ''}`}
            onClick={() => setActiveTab('Info')}
          >
            <Icon icon="mdi:information-outline" /> Info
          </button>
        </div>
      </div>

      <div className="ssd-content">
        {activeTab === 'Products' && <SponsorManageProduct eventId={eventId} boothCode={boothCode} />}
        {activeTab === 'Orders' && <SponsorManageOrder boothCode={boothCode} />}
        {activeTab === 'Analytics' && <SponsorProductAnalytics eventId={eventId} boothCode={boothCode} />}
        {activeTab === 'Info' && <SponsorPaymentInfo />}
      </div>
    </div>
  );
};

export default SponsorStoreDashboard;
