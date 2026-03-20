import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import "./SponsorStoreDashboard.css";

import SponsorManageProduct from "./SponsorManageProduct";
import SponsorManageOrder from "./SponsorManageOrder";
import SponsorProductAnalytics from "./SponsorProductAnalytics";

const SponsorStoreDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Products");

  // Mock event data, but could be dynamic
  const eventName = "TechInnovate Summit 2024";

  return (
    <div className="ssd-container">
      <div className="ssd-back-link" onClick={() => navigate("/sponsor/store")}>
        <Icon icon="mdi:arrow-left" /> Back to Stores
      </div>
      
      <div className="ssd-header">
        <h1>Store Dashboard</h1>
        <p className="regular-body-text">{eventName}</p>
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
            className={`ssd-tab ${activeTab === 'Payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('Payments')}
          >
            <Icon icon="mdi:credit-card-outline" /> Payments
          </button>
        </div>
      </div>

      <div className="ssd-content">
        {activeTab === 'Products' && <SponsorManageProduct />}
        {activeTab === 'Orders' && <SponsorManageOrder />}
        {activeTab === 'Analytics' && <SponsorProductAnalytics />}
        {activeTab === 'Payments' && (
          <div style={{padding: '40px', textAlign: 'center', background: 'var(--color-white-primary)', borderRadius: '12px'}}>
            <h4>Payments Details</h4>
            <p className="regular-body-text">Coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SponsorStoreDashboard;
