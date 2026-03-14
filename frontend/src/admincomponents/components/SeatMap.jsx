import React from "react";
import { Icon } from "@iconify/react";

const SeatMap = ({
  selectedEvent, // <-- added
  setDetailPopup,
  setIsUploadModalOpen,
  setIsSeatLayoutOpen,
  setIsPricingModalOpen
}) => {
  if (!selectedEvent) return null;

  return (
    <>
      <div className="bt-section">
        <div className="bt-section-header">
          <h3 className="bt-section-title">{selectedEvent.title}</h3>

          <div className="bt-toolbar">
            <button
              className="outlined-button bt-btn"
              onClick={() => setIsUploadModalOpen(true)}
            >
              <Icon icon="mdi:upload" /> Upload Map
            </button>

            <button
              className="outlined-button bt-btn"
              onClick={() => setIsSeatLayoutOpen(true)}
            >
              <Icon icon="mdi:pencil" /> Edit Layout
            </button>
          </div>
        </div>

        <div className="bt-seat-layout">
          <div className="bt-stage">STAGE</div>
          <div className="bt-seat-grid">
            {selectedEvent.seatVariations && selectedEvent.seatVariations.length > 0 ? (
              selectedEvent.seatVariations.map((seat) => (
                <button
                  key={seat._id}
                  className={`bt-seat-cell ${seat.isAvailable ? "available" : "taken"}`}
                  onClick={() =>
                    setDetailPopup({
                      seatNumber: seat.seatNumber,
                      price: seat.price,
                      isAvailable: seat.isAvailable
                    })
                  }
                >
                  {seat.seatNumber}
                </button>
              ))
            ) : (
              <p>No seat variations available.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bt-summary">
        <button
          className="outlined-button bt-btn"
          onClick={() => setIsPricingModalOpen({ isOpen: true, type: "seat" })}
        >
          <Icon icon="mdi:tag-outline" />
          Manage Pricing
        </button>
      </div>
    </>
  );
};

export default SeatMap;