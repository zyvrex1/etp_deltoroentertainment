import React from "react";
import { Icon } from "@iconify/react";
import { useDragScroll } from "../utils/useDragScroll";

const BoothMap = ({
  selectedEvent,
  setDetailPopup,
  setIsUploadModalOpen,
  setIsSetupLayoutOpen,
  setIsPricingModalOpen,
  setIsEditEventModalOpen,
}) => {
  const boothGridScrollRef = useDragScroll();
  const booths = selectedEvent?.booths || []; // safe fallback

  return (
    <>
      <div className="bt-section">
        <div className="bt-section-header">
          <h3 className="bt-section-title">{selectedEvent?.title || "Event Name"}</h3>

          <div className="bt-toolbar">
            <button
              className="outlined-button bt-btn"
              onClick={() => setIsUploadModalOpen(true)}
            >
              <Icon icon="mdi:upload" /> Upload Map
            </button>

            <button
              className="outlined-button bt-btn"
              onClick={() => setIsSetupLayoutOpen(true)}
            >
              <Icon icon="mdi:pencil" /> Edit Layout
            </button>
          </div>
        </div>

        <div className="bt-grid-outer">
          <div className="bt-booth-grid-wrapper" ref={boothGridScrollRef}>
            <div className="bt-booth-grid">
              {booths.map((booth) => (
                <button
                  key={booth.code || Math.random()} // fallback key if code missing
                  className={`bt-booth-cell filled status-${booth.status || "available"} type-${booth.type || "standard"}`}
                  onClick={() => setDetailPopup(booth)}
                >
                  {booth.code || "N/A"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bt-summary">
        <h3 className="bt-section-title right">Booth Details</h3>

        <button
          className="outlined-button bt-btn"
          onClick={() => setIsEditEventModalOpen(true)}
        >
          <Icon icon="mdi:tag-outline" />
          Add Booth
        </button>

        {booths.length > 0 ? (
  <div className="booth-list" style={{ color: "#000" }}>
    {booths.map((booth) => (
      <div
        key={booth.code || Math.random()}
        className="booth-item"
        style={{ color: "#000" }}
      >
        <strong>{booth.code || "N/A"}</strong> — Size: {booth.size || "-"} — Price: ${booth.price || 0} — Qty: {booth.quantity || 0}
      </div>
    ))}
  </div>
) : (
  <p style={{ color: "#000" }}>No booths added yet.</p>
)}
      </div>
    </>
  );
};

export default BoothMap;