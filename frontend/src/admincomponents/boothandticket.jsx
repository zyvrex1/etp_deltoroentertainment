import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";

import BoothMap from "./components/BoothMap";
import SeatMap from "./components/SeatMap";
import LiveScanning from "./components/LiveScanning";
import EventSelection from "./components/EventSelection";

import "./boothandticket.css";

import UploadMapModal from "./Modal/UploadMapModal";
import ManagePricingModal from "./Modal/ManagePricingModal";
import SetupBoothLayoutModal from "./Modal/SetupBoothLayoutModal";
import SetupSeatLayoutModal from "./Modal/SetupSeatLayoutModal";
import EditEventModal from "./modal/EditEventModal";


const BoothandTicket = () => {
  const [activeTab, setActiveTab] = useState("booth-map");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailPopup, setDetailPopup] = useState(null);
    const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);


  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState({
    isOpen: false,
    type: "booth",
  });
  const [isSetupLayoutOpen, setIsSetupLayoutOpen] = useState(false);
  const [isSeatLayoutOpen, setIsSeatLayoutOpen] = useState(false);

  const [boothLayoutConfig, setBoothLayoutConfig] = useState(null);
  const [seatLayoutConfig, setSeatLayoutConfig] = useState(null);

  const [boothPricingQuantities, setBoothPricingQuantities] = useState({});
  const [seatPricingQuantities, setSeatPricingQuantities] = useState({});

  const handlePricingSave = (data) => {
    console.log("Saving pricing", data);
  };

  return (
    <div className="booth-ticket-page">
      {!selectedEvent && <EventSelection setSelectedEvent={setSelectedEvent} />}

      {selectedEvent && (
        <>
          <div className="bt-header">
            <div className="bt-header-left">
              <button
                className="bt-back-btn"
                onClick={() => setSelectedEvent(null)}
              >
                <Icon icon="mdi:arrow-left" width="24" />
              </button>

              <h1>{selectedEvent.title}</h1>
            </div>
          </div>

          <div className="bt-tabs">
            <button
              className={`bt-tab ${activeTab === "booth-map" ? "active" : ""}`}
              onClick={() => setActiveTab("booth-map")}
            >
              Booth Map
            </button>

            <button
              className={`bt-tab ${activeTab === "seat-map" ? "active" : ""}`}
              onClick={() => setActiveTab("seat-map")}
            >
              Seat Map
            </button>

            <button
              className={`bt-tab ${activeTab === "live-scanning" ? "active" : ""}`}
              onClick={() => setActiveTab("live-scanning")}
            >
              Live Scanning
            </button>
          </div>

          <div className="bt-main">
            <div className="bt-content">
              {activeTab === "booth-map" && (
                <BoothMap
    selectedEvent={selectedEvent}
    setDetailPopup={setDetailPopup}
    setIsUploadModalOpen={setIsUploadModalOpen}
    setIsSetupLayoutOpen={setIsSetupLayoutOpen}
    setIsPricingModalOpen={setIsPricingModalOpen}
    setIsEditEventModalOpen={setIsEditEventModalOpen} // ✅ new prop
    boothLayoutConfig={boothLayoutConfig}
  />
              )}

              {activeTab === "seat-map" && (
                <SeatMap
                  selectedEvent={selectedEvent}
                  setDetailPopup={setDetailPopup}
                  setIsUploadModalOpen={setIsUploadModalOpen}
                  setIsSeatLayoutOpen={setIsSeatLayoutOpen}
                  setIsPricingModalOpen={setIsPricingModalOpen}
                  seatLayoutConfig={seatLayoutConfig}
                />
              )}

              {activeTab === "live-scanning" && <LiveScanning />}
            </div>
          </div>
        </>
      )}

      {detailPopup &&
        createPortal(
          <div className="bt-detail-popup-overlay" onClick={() => setDetailPopup(null)}>
            <div className="bt-detail-popup-box" onClick={(e) => e.stopPropagation()}>
              <button className="bt-detail-popup-close" onClick={() => setDetailPopup(null)}>
                <Icon icon="mdi:close" />
              </button>

              <div className="bt-detail-popup-content">{JSON.stringify(detailPopup)}</div>
            </div>
          </div>,
          document.body
        )}

      <UploadMapModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />

      <ManagePricingModal
        isOpen={isPricingModalOpen.isOpen}
        type={isPricingModalOpen.type}
        quantities={
          isPricingModalOpen.type === "booth"
            ? boothPricingQuantities
            : seatPricingQuantities
        }
        onClose={() => setIsPricingModalOpen({ ...isPricingModalOpen, isOpen: false })}
        onSave={handlePricingSave}
      />

      <SetupBoothLayoutModal
        isOpen={isSetupLayoutOpen}
        onClose={() => setIsSetupLayoutOpen(false)}
        onSave={(config) => {
          setBoothLayoutConfig(config);
          setIsSetupLayoutOpen(false);
        }}
      />

      <SetupSeatLayoutModal
        isOpen={isSeatLayoutOpen}
        onClose={() => setIsSeatLayoutOpen(false)}
        onSave={(config) => {
          setSeatLayoutConfig(config);
          setIsSeatLayoutOpen(false);
        }}
      />

      <EditEventModal
  isOpen={isEditEventModalOpen}
  onClose={() => setIsEditEventModalOpen(false)}
  event={selectedEvent}
/>
    </div>
  );
};

export default BoothandTicket;