import React, { useState, useRef } from "react";
import { Icon } from "@iconify/react";

const SeatMap = ({
  selectedEvent,
  setDetailPopup,
  setIsUploadModalOpen,
  setIsSeatLayoutOpen,
  setIsPricingModalOpen
}) => {
  const [selectedPriceLevelId, setSelectedPriceLevelId] = useState(null);
  const [seatMap, setSeatMap] = useState(selectedEvent?.seatMap);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(false);

  if (!selectedEvent) return null;

  const updateSeat = (sectionIndex, seatIndex, priceLevelId) => {
    const updated = { ...seatMap };
    updated.sections[sectionIndex].seats[seatIndex].priceLevelId = priceLevelId;
    setSeatMap(updated);
  };

  const handleSeatClick = (sectionIndex, seatIndex) => {
    if (!selectedPriceLevelId) {
      alert("Select a price level first");
      return;
    }
    updateSeat(sectionIndex, seatIndex, selectedPriceLevelId);
  };

  const handleRightClick = (e, sectionIndex, seatIndex) => {
    e.preventDefault();
    updateSeat(sectionIndex, seatIndex, null);
  };

  const handleMouseDown = () => {
    if (!selectedPriceLevelId) return;
    setIsDragging(true);
    dragRef.current = true;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragRef.current = false;
  };

  const handleMouseEnter = (sectionIndex, seatIndex) => {
    if (dragRef.current) {
      updateSeat(sectionIndex, seatIndex, selectedPriceLevelId);
    }
  };

  const handleSave = async () => {
    try {
      await fetch(`/api/events/${selectedEvent._id}/seatMap`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seatMap }),
      });
      alert("Seat map saved!");
    } catch (err) {
      console.error(err);
      alert("Failed to save seat map");
    }
  };

  return (
    <>
      <div className="bt-section" onMouseUp={handleMouseUp}>
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

        {/* PRICE LEVEL SELECTOR */}
        <div className="bt-price-legend">
          {selectedEvent.priceLevels?.map((p) => (
            <button
              key={p._id}
              className={`price-chip ${selectedPriceLevelId === p._id ? "active" : ""}`}
              style={{ backgroundColor: p.color }}
              onClick={() => setSelectedPriceLevelId(p._id)}
            >
              {p.priceName} - ₱{p.facePrice}
            </button>
          ))}
        </div>

        {/* SEAT LAYOUT */}
        <div className="bt-seat-layout">
          <div className="bt-stage">STAGE</div>

          <div className="bt-seat-grid">
            {seatMap?.sections?.map((section, sIndex) =>
              section.seats.map((seat, i) => {
                const priceLevel = selectedEvent.priceLevels.find(
                  (p) => p._id === seat.priceLevelId
                );

                return (
                  <button
                    key={seat.id}
                    className="bt-seat-cell"
                    style={{ backgroundColor: priceLevel?.color || "#ccc" }}
                    onMouseDown={handleMouseDown}
                    onMouseEnter={() => handleMouseEnter(sIndex, i)}
                    onClick={() => handleSeatClick(sIndex, i)}
                    onContextMenu={(e) => handleRightClick(e, sIndex, i)}
                  >
                    {seat.label || seat.id}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="bt-summary">
        <button
          className="outlined-button bt-btn"
          onClick={() => setIsPricingModalOpen({ isOpen: true })}
        >
          <Icon icon="mdi:tag-outline" /> Manage Pricing
        </button>

        
      </div>
    </>
  );
};

export default SeatMap;