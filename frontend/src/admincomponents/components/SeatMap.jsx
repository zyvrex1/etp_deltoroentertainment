import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Stage,
  Layer,
  Group,
  Rect,
  Circle,
  Text,
  Image as KonvaImage,
} from "react-konva";
import useImage from "use-image";
import { Icon } from "@iconify/react";
import { useEventsContext } from "../hooks/useEventsContext";
import { useAuthContext } from "../hooks/useAuthContext";

const BackgroundImage = ({ item }) => {
  const [img] = useImage(item.imageUrl);
  if (!img) return null;

  return (
    <KonvaImage
      image={img}
      x={item.x}
      y={item.y}
      width={item.width || 400}
      height={item.height || 300}
      scaleX={item.scaleX || 1}
      scaleY={item.scaleY || 1}
      rotation={item.rotation || 0}
      opacity={0.6}
      listening={false}
    />
  );
};

const BackgroundShape = ({ item }) => {
  const isElement = item.type === "Element";
  return (
    <Group
      x={item.x}
      y={item.y}
      scaleX={item.scaleX || 1}
      scaleY={item.scaleY || 1}
      rotation={item.rotation || 0}
      listening={false}
    >
      <Rect
        width={item.width}
        height={item.height}
        fill={item.color || "#2196F3"}
        opacity={item.type === "Background" ? 0.3 : 0.8}
        stroke={isElement ? "#333" : "transparent"}
        strokeWidth={1}
      />
      {isElement && (
        <Text
          text={item.label || item.code || ""}
          width={item.width}
          height={item.height}
          align="center"
          verticalAlign="middle"
          fontSize={14}
          fill="black"
          fontStyle="bold"
        />
      )}
    </Group>
  );
};

const calculateTableSeats = (centerX, centerY, radius, seatCount) => {
  const seats = [];
  const distance = radius + 12;
  for (let i = 0; i < seatCount; i++) {
    const angle = (i * 2 * Math.PI) / seatCount;
    seats.push({
      x: centerX + distance * Math.cos(angle),
      y: centerY + distance * Math.sin(angle),
    });
  }
  return seats;
};

const AssignPrice = ({ selectedEvent }) => {
  const { dispatch } = useEventsContext();
  const { user } = useAuthContext();
  const [localItems, setLocalItems] = useState([]);
  const [selectedPriceLevelId, setSelectedPriceLevelId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const stageRef = useRef(null);

  const STAGE_WIDTH = 1400;
  const STAGE_HEIGHT = 600;

  const seatMapString = JSON.stringify(selectedEvent?.seatMap);
  const boothsString = JSON.stringify(selectedEvent?.booths);

  useEffect(() => {
    if (selectedEvent?.seatMap && localItems.length === 0) {
      const savedItems = [
        ...(selectedEvent.seatMap.sections[0]?.seats || []).map((s) => ({
          ...s,
          type: s.type || "Seat",
        })),
        ...(selectedEvent.seatMap.elements || []),
        ...(selectedEvent.seatMap.backgrounds || []),
        ...(selectedEvent.booths || []),
        ...(selectedEvent.seatMap.tables || []).map((t) => ({
          ...t,
          type: t.type || "Table",
        })),
      ].map((item) => ({
        ...item,
        id: item._id || item.id,
      }));
      setLocalItems(savedItems);
    }
  }, [selectedEvent?._id, seatMapString, boothsString]);

  const handleItemClick = (itemId, seatIndex = null) => {
    if (!selectedPriceLevelId) {
      alert("Please select a Price Level or the Eraser!");
      return;
    }

    setLocalItems((prev) => {
      const clickedItem = prev.find((i) => i.id === itemId);
      if (!clickedItem) return prev;

      let newItems;

      // --- CASE 1: UNASSIGNING (ERASER) ---
      if (selectedPriceLevelId === "none") {
        newItems = prev.map((item) => {
          if (item.id !== itemId) return item;

          // If clicking a specific seat in a table or row
          if (
            (item.type === "Seat" || item.type === "Table") &&
            seatIndex !== null
          ) {
            const currentUnassigned = item.unassignedIndices || [];
            return {
              ...item,
              unassignedIndices: currentUnassigned.includes(seatIndex)
                ? currentUnassigned
                : [...currentUnassigned, seatIndex],
            };
          }
          // BULK UNASSIGN: If clicking the Table Circle or Row Label
          return { ...item, priceLevelId: null, unassignedIndices: [] };
        });
      } else {
        // --- CASE 2: ASSIGNING PRICE ---
        const selectedLevel = selectedEvent.priceLevels?.find(
          (p) => p._id === selectedPriceLevelId,
        );
        const limit = selectedLevel ? selectedLevel.quantityAvailable : 0;

        // Calculate how many seats we are TRYING to add
        let seatsToAdd = 0;
        if (seatIndex !== null) {
          // Just adding 1 specific seat back
          seatsToAdd = clickedItem.unassignedIndices?.includes(seatIndex)
            ? 1
            : 0;
          // If the item had a different price level before, we are changing the whole item's price
          if (clickedItem.priceLevelId !== selectedPriceLevelId) seatsToAdd = 1;
        } else {
          // BULK: Adding all seats in the table/row
          seatsToAdd = clickedItem.seatCount || 1;
        }

        const totalAssignedSeats = prev.reduce((acc, item) => {
          if (item.priceLevelId === selectedPriceLevelId) {
            const count = item.seatCount || 1;
            const gaps = item.unassignedIndices?.length || 0;
            return acc + (count - gaps);
          }
          return acc;
        }, 0);

        if (totalAssignedSeats + seatsToAdd > limit) {
          alert(
            `Limit exceeded! Only ${limit - totalAssignedSeats} spots left.`,
          );
          return prev;
        }

        newItems = prev.map((item) => {
          if (item.id !== itemId) return item;

          // If clicking a specific seat
          if (
            (item.type === "Seat" || item.type === "Table") &&
            seatIndex !== null
          ) {
            const currentUnassigned = item.unassignedIndices || [];
            return {
              ...item,
              priceLevelId: selectedPriceLevelId,
              unassignedIndices: currentUnassigned.filter(
                (idx) => idx !== seatIndex,
              ),
            };
          }

          // BULK ASSIGN: Clicking the Table circle or Row Label
          return {
            ...item,
            priceLevelId: selectedPriceLevelId,
            unassignedIndices: [], // Clear all "gaps" to make all seats active
          };
        });
      }

      // Sync to context (Keep your existing dispatch logic here)
      const updatedEvent = {
        ...selectedEvent,
        seatMap: {
          ...selectedEvent.seatMap,
          sections: selectedEvent.seatMap.sections.map((sec) => ({
            ...sec,
            seats: newItems.filter(
              (i) => i.type === "Seat" || i.type === "Table",
            ),
          })),
          elements: newItems.filter((i) => i.type === "Element"),
          backgrounds: newItems.filter(
            (i) => i.type === "Background" || i.subType === "Image",
          ),
        },
        booths: newItems.filter((i) => i.type === "Booth"),
      };
      dispatch({ type: "UPDATE_EVENT", payload: updatedEvent });

      return newItems;
    });
  };

  const handleSave = async () => {
    if (!selectedEvent?._id || !user?.token) {
      alert("You must be logged in to save.");
      return;
    }

    try {
      setIsSaving(true);

      const sanitizeItem = (item) => ({
        ...item,
        _id: item.id || item._id,
        // Ensure priceLevelId is actual null if unassigned
        priceLevelId:
          item.priceLevelId === "none" || !item.priceLevelId
            ? null
            : item.priceLevelId,
      });

      const payload = {
        seatMap: {
          ...selectedEvent.seatMap,
          sections: selectedEvent.seatMap.sections.map((sec) => ({
            ...sec,
            // Only send back seats and tables to the section.seats array
            seats: localItems
              .filter((i) => i.type === "Seat" || i.type === "Table")
              .map(sanitizeItem),
          })),
          elements: localItems
            .filter((i) => i.type === "Element")
            .map(sanitizeItem),
          backgrounds: localItems
            .filter((i) => i.type === "Background" || i.subType === "Image")
            .map(sanitizeItem),
        },
        booths: localItems.filter((i) => i.type === "Booth").map(sanitizeItem),
      };

      const response = await fetch(
        `/api/events/${selectedEvent._id}/assign-prices`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const json = await response.json();

      if (response.ok) {
        // 1. Update the global context (this flows back into selectedEvent)
        const updatedEvent = json.event || json;
        dispatch({ type: "UPDATE_EVENT", payload: updatedEvent });

        // 2. Force refresh localItems with the data returned from the server
        // This ensures IDs and unassignedIndices are perfectly in sync
        if (updatedEvent.seatMap) {
          const refreshedItems = [
            ...(updatedEvent.seatMap.sections[0]?.seats || []),
            ...(updatedEvent.seatMap.elements || []),
            ...(updatedEvent.seatMap.backgrounds || []),
            ...(updatedEvent.booths || []),
            // Map _id to id to maintain consistency with your onClick handlers
          ].map((item) => ({ ...item, id: item._id || item.id }));

          setLocalItems(refreshedItems);
        }

        alert("Prices successfully assigned and view refreshed!");
      } else {
        alert(json.message || "Failed to save.");
      }
    } catch (error) {
      console.error("Save Error:", error);
      alert("An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const getItemColor = (item) => {
    if (!item.priceLevelId || item.priceLevelId === "none") return "#e0e0e0";
    const level = selectedEvent.priceLevels?.find(
      (p) => p._id === item.priceLevelId,
    );
    return level ? level.color : "#e0e0e0";
  };

  const sortedItems = useMemo(() => {
    const weights = { Background: 1, Element: 2, Table: 3, Seat: 3, Booth: 3 };
    return [...localItems].sort(
      (a, b) => (weights[a.type] || 0) - (weights[b.type] || 0),
    );
  }, [localItems]);

  return (
    <div className="bt-section">
      <div className="bt-section-header">
        <h3 className="bt-section-title">
          {selectedEvent?.venue?.name || "Venue Layout"}
        </h3>
        <div className="bt-toolbar">
          <button
            className="outlined-button bt-btn"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Icon
              icon={
                isSaving ? "line-md:loading-twotone-loop" : "mdi:content-save"
              }
            />
            {isSaving ? " Saving..." : " Save Assigned Price"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
        <div className="bt-summary">
          <button className="outlined-button bt-btn" style={{ marginBottom: '15px', width: '100%' }}>
            <Icon icon="mdi:tag-outline" /> Manage Price Level
          </button>
           <p
              style={{ fontSize: "12px", color: "#666", marginBottom: "10px" }}
            >
              Select price, then click seats:
            </p>
            
          <div className="bt-price-legend">
            {selectedEvent.priceLevels?.map((p) => {
              const usedSeats = localItems.reduce((acc, item) => {
                if (item.priceLevelId === p._id) {
                  const total = item.seatCount || 1;
                  const gaps = item.unassignedIndices?.length || 0;
                  return acc + (total - gaps);
                }
                return acc;
              }, 0);
              const isFull = usedSeats >= p.quantityAvailable;

              return (
                <div
                  key={p._id}
                  className={`price-item ${selectedPriceLevelId === p._id ? "active" : ""}`}
                  onClick={() => setSelectedPriceLevelId(p._id)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px",
                    cursor: "pointer",
                    border:
                      selectedPriceLevelId === p._id
                        ? "2px solid #000"
                        : "1px solid #ddd",
                    borderRadius: "4px",
                    marginBottom: "5px",
                    background: isFull ? "#fff0f0" : "#fff",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span
                      style={{
                        backgroundColor: p.color,
                        width: "15px",
                        height: "15px",
                        marginRight: "10px",
                        borderRadius: "2px",
                      }}
                    ></span>
                    <span style={{ fontSize: "13px" }}>{p.priceName}</span>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: "bold" }}>
                    {usedSeats} / {p.quantityAvailable}
                  </span>
                </div>
              );
            })}

            <div
              className={`price-item ${selectedPriceLevelId === "none" ? "active" : ""}`}
              onClick={() => setSelectedPriceLevelId("none")}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px",
                cursor: "pointer",
                border:
                  selectedPriceLevelId === "none"
                    ? "2px solid #ff4d4d"
                    : "1px solid #ddd",
                borderRadius: "6px",
                marginTop: "15px",
                background:
                  selectedPriceLevelId === "none" ? "#fff5f5" : "#fff",
              }}
            >
              <Icon
                icon="mdi:eraser"
                style={{ marginRight: "12px", color: "#ff4d4d" }}
              />
              <span style={{ fontSize: "13px" }}>Unassign Price (Eraser)</span>
            </div>
          </div>
        </div>

        <div className="bt-grid-outer" style={{ flex: 1, overflow: "auto" }}>
          <div className="canvas-container venue-canvas-bg">
            <Stage width={STAGE_WIDTH} height={STAGE_HEIGHT} ref={stageRef}>
              <Layer
                key={localItems
                  .map(
                    (i) =>
                      `${i.id}-${i.priceLevelId}-${i.unassignedIndices?.length}`,
                  )
                  .join(",")}
              >
                {sortedItems.map((item, i) => (
                  <React.Fragment key={item.id || i}>
                    {item.subType === "Image" ? (
                      <BackgroundImage item={item} />
                    ) : item.type === "Table" ||
                      item.type === "Seat" ||
                      item.type === "Booth" ? (
                      <Group
                        x={item.x}
                        y={item.y}
                        scaleX={item.scaleX || 1}
                        scaleY={item.scaleY || 1}
                        rotation={item.rotation || 0}
                        // This allows clicking the Table circle or the general Row area to assign the whole group
                        onClick={() => handleItemClick(item.id)}
                      >
                        {item.type === "Table" ? (
                          <>
                            <Circle
                              radius={25}
                              fill={getItemColor(item)}
                              stroke="#555"
                              strokeWidth={1}
                            />

                            {calculateTableSeats(
                              0,
                              0,
                              25,
                              item.seatCount || 4,
                            ).map((seat, index) => {
                              const isUnassigned =
                                item.unassignedIndices?.includes(index);
                              const seatColor = isUnassigned
                                ? "#e0e0e0"
                                : getItemColor(item);

                              return (
                                <Rect
                                  key={index}
                                  x={seat.x - 6}
                                  y={seat.y - 6}
                                  width={12}
                                  height={12}
                                  fill={seatColor}
                                  listening={true}
                                  cornerRadius={2}
                                  strokeWidth={1}
                                  stroke="#555"
                                  onClick={(e) => {
                                    e.cancelBubble = true; // Prevents triggering the Group's bulk assign
                                    handleItemClick(item.id, index);
                                  }}
                                />
                              );
                            })}
                          </>
                        ) : item.type === "Booth" ? (
                          <Rect
                            x={-30}
                            y={-30}
                            width={60}
                            height={60}
                            fill={getItemColor(item)}
                            stroke="#555"
                            cornerRadius={3}
                          />
                        ) : (
                          <>
                            {Array.from({ length: item.seatCount || 1 }).map(
                              (_, idx) => {
                                const isUnassigned =
                                  item.unassignedIndices?.includes(idx);
                                const seatColor =
                                  idx < (item.occupiedSeats || 0)
                                    ? "#ff4d4d"
                                    : isUnassigned
                                      ? "#e0e0e0"
                                      : getItemColor(item);
                                return (
                                  <Rect
                                    key={idx}
                                    x={
                                      idx * 18 -
                                      ((item.seatCount || 1) * 18) / 2
                                    }
                                    y={-6}
                                    width={15}
                                    height={15}
                                    fill={seatColor}
                                    cornerRadius={2}
                                    stroke="#555"
                                    strokeWidth={0.5}
                                    onClick={(e) => {
                                      e.cancelBubble = true; // Prevents triggering the Group's bulk assign
                                      handleItemClick(item.id, idx);
                                    }}
                                  />
                                );
                              },
                            )}
                          </>
                        )}
                        <Text
                          text={item.label || item.code || ""}
                          x={-30}
                          y={item.type === "Seat" ? 12 : -5}
                          width={60}
                          align="center"
                          fontSize={10}
                          fontStyle="bold"
                          // Set listening to true so clicking the label also triggers the Group's bulk assign
                          listening={true}
                        />
                      </Group>
                    ) : (
                      <BackgroundShape item={item} />
                    )}
                  </React.Fragment>
                ))}
              </Layer>
            </Stage>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignPrice;
