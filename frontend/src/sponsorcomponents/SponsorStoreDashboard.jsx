import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import "./SponsorStoreDashboard.css";

import SponsorManageProduct from "./SponsorManageProduct";
import SponsorManageOrder from "./SponsorManageOrder";
import SponsorProductAnalytics from "./SponsorProductAnalytics";
import SponsorStoreSettings from "./SponsorStoreSettings";

import { useAuthContext } from "../hooks/useAuthContext";
import reservationService from "../services/reservationService";

const SponsorStoreDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const { reservationId: paramReservationId } = useParams();
  const [activeTab, setActiveTab] = useState("Products");
  const [resData, setResData] = useState(location.state || {});
  const [loading, setLoading] = useState(!location.state && !!paramReservationId);
  const reservationId = paramReservationId || resData.id || resData._id || location.state?.reservationId;

  useEffect(() => {
    const fetchReservationDetails = async () => {
      // Only fetch if we have a reservationId but no event details in state
      if (reservationId && !resData.eventName && user?.token) {
        try {
          setLoading(true);
          const data = await reservationService.getReservationById(reservationId, user.token);
          setResData({
            id: data._id,
            eventId: data.event?._id || data.event,
            eventName: data.event?.title || "Store Dashboard",
            boothCode: data.boothCode,
            companyName: data.storeSettings?.companyName || data.user?.companyName || `${data.user?.firstName || ''} ${data.user?.lastName || ''}`.trim(),
            isCompleted: new Date() > new Date(data.event?.endDate || data.event?.startDate)
          });
        } catch (error) {
          console.error("Error fetching reservation for dashboard:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchReservationDetails();
  }, [reservationId, user, resData.eventName]);

  const { eventId, eventName, boothCode, isCompleted, companyName } = resData;

  return (
    <div className="ssd-container">
      <div className="ssd-back-link" onClick={() => navigate("/sponsor/store")}>
        <Icon icon="mdi:arrow-left" /> Back to Stores
      </div>
      
      <div className="ssd-header">
        <h1>{companyName || "Store Dashboard"} {isCompleted && <span style={{ color: 'var(--color-black-tertiary)', fontSize: '0.6em', marginLeft: '10px' }}>(Closed)</span>}</h1>
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
            className={`ssd-tab ${activeTab === 'Settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('Settings')}
          >
            <Icon icon="mdi:cog-outline" /> Settings
          </button>
        </div>
      </div>

      <div className="ssd-content">
        {activeTab === 'Products' && <SponsorManageProduct eventId={eventId} boothCode={boothCode} isCompleted={isCompleted} />}
        {activeTab === 'Orders' && <SponsorManageOrder eventId={eventId} boothCode={boothCode} isCompleted={isCompleted} />}
        {activeTab === 'Analytics' && <SponsorProductAnalytics eventId={eventId} boothCode={boothCode} />}
        {activeTab === 'Settings' && <SponsorStoreSettings reservationId={reservationId} boothCode={boothCode} />}
      </div>
    </div>
  );
};

export default SponsorStoreDashboard;
