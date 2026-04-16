import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Stage,
  Layer,
  Rect,
  Circle,
  Text,
  Group,
  Transformer,
  Image as KonvaImage,
} from "react-konva";
import useImage from "use-image";
import { Icon } from "@iconify/react";
import { useEventsContext } from "../hooks/useEventsContext";
import { useAuthContext } from "../hooks/useAuthContext";

const BackgroundImage = React.forwardRef(
  ({ item, onClick, onDragEnd, dragBoundFunc, onTransformEnd }, ref) => {
    const [img] = useImage(item.imageUrl);
    const isBg = item.type === "Background";

    // Maintain your default logic
    const w = item.width || (isBg ? 400 : 45);
    const h = item.height || (isBg ? 300 : 45);

    if (!img) return null;

    return (
      <KonvaImage
        ref={ref}
        id={item.id.toString()}
        image={img}
        x={item.x}
        y={item.y}
        width={w}
        height={h}
        // ADD THESE TWO LINES:
        scaleX={item.scaleX || 1}
        scaleY={item.scaleY || 1}
        rotation={item.rotation || 0}
        draggable
        onClick={onClick}
        onDragEnd={onDragEnd}
        onTransformEnd={onTransformEnd}
        dragBoundFunc={dragBoundFunc}
        opacity={0.6}
      />
    );
  },
);

const BackgroundShape = React.forwardRef(
  ({ item, onClick, onDragEnd, dragBoundFunc, onTransformEnd }, ref) => {
    const isBg = item.type === "Background";
    const isElement = item.type === "Element";

    // Use the stored width/height directly
    const w = item.width;
    const h = item.height;

    return (
      <Group
        ref={ref}
        id={item.id.toString()}
        x={item.x}
        y={item.y}
        scaleX={item.scaleX || 1}
        scaleY={item.scaleY || 1}
        rotation={item.rotation || 0}
        draggable
        onClick={onClick}
        onDragEnd={onDragEnd}
        onTransformEnd={onTransformEnd}
        dragBoundFunc={dragBoundFunc}
      >
        <Rect
          width={w}
          height={h}
          fill={item.color || "#2196F3"}
          opacity={isBg ? 0.3 : 0.8}
          stroke={isElement ? "#333" : "transparent"}
          strokeWidth={1}
        />
        {/* Only show text for Elements (Stage, Bar), not Backgrounds */}
        {isElement && (
          <Text
            text={item.label || item.code || ""}
            width={w}
            height={h}
            align="center"
            verticalAlign="middle"
            fontSize={14}
            fill="black"
            fontStyle="bold"
            listening={false}
          />
        )}
      </Group>
    );
  },
);

const haveIntersection = (r1, r2) => {
  const r1X = r1.shape === "Circle" ? r1.x - 20 : r1.x;
  const r1Y = r1.shape === "Circle" ? r1.y - 20 : r1.y;
  const r1W = r1.width || 40;
  const r1H = r1.height || 40;

  const r2X = r2.shape === "Circle" ? r2.x - 20 : r2.x;
  const r2Y = r2.shape === "Circle" ? r2.y - 20 : r2.y;
  const r2W = r2.width || 40;
  const r2H = r2.height || 40;

  return !(
    r2X > r1X + r1W ||
    r2X + r2W < r1X ||
    r2Y > r1Y + r1H ||
    r2Y + r2H < r1Y
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

const SeatAndBoothMap = ({ selectedEvent }) => {
  const { dispatch } = useEventsContext();
  const { user } = useAuthContext();
  const [localItems, setLocalItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
  });
  const [modal, setModal] = useState({
    visible: false,
    mode: "",
    type: "",
    config: {},
    editingId: null,
  });
  const stageRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedId, setSelectedId] = useState(null);
  const trRef = useRef(null);

  const STAGE_WIDTH = 1400;
  const STAGE_HEIGHT = 500;

  useEffect(() => {
    const fetchLayout = async () => {
      if (!selectedEvent?._id) return;
      try {
        const response = await fetch(`/api/events/${selectedEvent._id}`);
        const data = await response.json();

        // Ensure all types of items are flattened into one array for the canvas
        const savedItems = [
          ...(data.seatMap?.sections[0]?.seats || []),
          ...(data.seatMap?.elements || []), 
          ...(data.seatMap?.backgrounds || []), 
          ...(data.booths || []),
        ].map((item) => ({
          ...item,
          id: item._id || item.id,
          status: item.status || "available",
          occupiedSeats: item.occupiedSeats || 0, // Option B Field
        }));

        setLocalItems(savedItems);
      } catch (error) {
        console.error("Error loading layout:", error);
      }
    };
    fetchLayout();
  }, [selectedEvent?._id]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z") {
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        } else if (e.key === "y") {
          redo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [localItems, history, redoStack]); // Re-bind so functions have fresh state

  const undo = () => {
    if (history.length === 0) return;

    const previous = history[history.length - 1];
    const newHistory = history.slice(0, history.length - 1);

    setRedoStack([localItems, ...redoStack]);
    setLocalItems(previous);
    setHistory(newHistory);
  };

  const redo = () => {
    if (redoStack.length === 0) return;

    const next = redoStack[0];
    const newRedoStack = redoStack.slice(1);

    setHistory([...history, localItems]);
    setLocalItems(next);
    setRedoStack(newRedoStack);
  };

  const updateItemsWithHistory = (newItems) => {
    setHistory([...history, localItems]);
    setRedoStack([]); // Clear redo whenever a new action is taken
    setLocalItems(newItems);
  };

  const handleSaveLayout = async () => {
    if (!user) return alert("You must be logged in.");
    setLoading(true);
    try {
      const response = await fetch(`/api/events/${selectedEvent._id}/layout`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ items: localItems }),
      });

      const json = await response.json();

      if (response.ok) {
        dispatch({ type: "UPDATE_EVENT", payload: json });
        alert("Layout saved successfully!");

        if (json.seatMap) {
          const refreshedItems = [
            ...(json.seatMap.sections[0]?.seats || []),
            ...(json.seatMap.elements || []),
            ...(json.seatMap.backgrounds || []),
            ...(json.booths || []),
          ].map((it) => ({ 
            ...it, 
            id: it._id || it.id,
            status: it.status || "available",
            occupiedSeats: it.occupiedSeats || 0 
          }));
          setLocalItems(refreshedItems);
        }
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () =>
    setModal({
      visible: false,
      mode: "",
      type: "",
      config: {},
      editingId: null,
    });
  const closeContextMenu = () =>
    setContextMenu({ ...contextMenu, visible: false });

  const handleDragBound = (pos, item) => {
    const isBg = item.type === "Background";

    // IMPORTANT: This math MUST match the components exactly
    const w = item.width || (isBg ? 400 : 45);
    const h = item.height || (isBg ? 300 : 45);

    let newX, newY;

    if (item.shape === "Circle" && item.type !== "Table") {
      const radius = 20;
      newX = Math.max(radius, Math.min(STAGE_WIDTH - radius, pos.x));
      newY = Math.max(radius, Math.min(STAGE_HEIGHT - radius, pos.y));
    } else {
      // Math.min(Stage - ObjectSize) ensures it doesn't go off-screen
      newX = Math.max(0, Math.min(STAGE_WIDTH - w, pos.x));
      newY = Math.max(0, Math.min(STAGE_HEIGHT - h, pos.y));
    }

    // Skip collision detection for Background types so they don't get "stuck" on seats
    if (isBg) {
      return { x: newX, y: newY };
    }

    // Collision logic for Seats/Tables
    const isOverlapping = localItems.some((otherItem) => {
      if (otherItem.id === item.id || otherItem.type === "Background")
        return false;
      return haveIntersection(
        { ...item, x: newX, y: newY, width: w, height: h },
        otherItem,
      );
    });

    return isOverlapping ? { x: item.x, y: item.y } : { x: newX, y: newY };
  };

  const handleTransformEnd = (id, e) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    const updatedItems = localItems.map((item) => {
      if (item.id === id) {
        // TYPE A: Simple Shapes (Background/Element)
        // We "bake" the scale into width/height and reset scale to 1
        if (item.type === "Background" || item.type === "Element") {
          node.scaleX(1);
          node.scaleY(1);
          return {
            ...item,
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            width: Math.max(5, (item.width || 40) * scaleX),
            height: Math.max(5, (item.height || 40) * scaleY),
            scaleX: 1,
            scaleY: 1,
          };
        }

        // TYPE B: Complex Groups (Seat, Table, Booth)
        // We MUST keep the scaleX/scaleY values so the internal
        // shapes stay stretched. Do NOT reset node scales here.
        return {
          ...item,
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          scaleX: scaleX,
          scaleY: scaleY,
        };
      }
      return item;
    });

    updateItemsWithHistory(updatedItems);
  };

  const openAddModal = (type) => {
    setSelectedId(null);

    let defaultLabel = "";
    let defaultColor = "#e0e0e0";

    // Logic for new 'Element' vs 'Background'
    if (type === "Element") {
      defaultLabel = "STAGE";
      defaultColor = "#90caf9"; // Light blue
    } else if (type === "Background") {
      defaultLabel = "";
      defaultColor = "#f5f5f5"; // Very light gray
    } else {
      defaultLabel = "New " + type;
    }

    setModal({
      visible: true,
      mode: "ADD",
      type: type,
      config: {
        label: defaultLabel,
        color: defaultColor,
        shape: type === "Table" || type === "Seat" ? "Circle" : "Rect",
        seatCount: type === "Seat" ? 5 : 4,
        rotation: 0,
      },
    });
    closeContextMenu();
  };

  const openEditModal = (item) => {
    setModal({
      visible: true,
      mode: "EDIT",
      type: item.type,
      editingId: item.id,
      config: {
        label: item.label || item.code,
        color: item.color,
        shape: item.shape,
        seatCount: item.seatCount || 4,
        rotation: item.rotation || 0, // Fix: Added rotation here
      },
    });
  };

  const handleAddItem = () => {
    let spawnX = contextMenu.x;
    let spawnY = contextMenu.y;

    const newItem = {
      id: `temp_${Date.now()}`,
      type: modal.type,
      x: spawnX,
      y: spawnY,
      label: modal.config.label,
      code: modal.config.label,
      color: modal.config.color,
      shape: modal.config.shape,
      // Elements and Backgrounds get larger default sizes
      width:
        modal.type === "Background"
          ? 600
          : modal.type === "Element"
            ? 200
            : modal.type === "Booth"
              ? 60
              : 40,
      height:
        modal.type === "Background"
          ? 400
          : modal.type === "Element"
            ? 100
            : modal.type === "Booth"
              ? 60
              : 40,
      rotation: modal.config.rotation || 0,
      seatCount: modal.config.seatCount,
      scaleX: 1,
      scaleY: 1,
      // --- ADDED FOR OPTION B TRACKING ---
      status: "available",
      occupiedSeats: 0, 
    };

    // Only check collisions for "Physical" items (Seats, Tables, Booths)
    const physicalTypes = ["Seat", "Table", "Booth"];
    if (physicalTypes.includes(newItem.type)) {
      const isBlocked = localItems.some(
        (item) =>
          physicalTypes.includes(item.type) && haveIntersection(newItem, item),
      );
      if (isBlocked) {
        alert("Space is occupied!");
        return;
      }
    }

    updateItemsWithHistory([...localItems, newItem]);
    closeModal();
  };

  const handleUpdateItem = () => {
  const updatedItems = localItems.map((item) =>
    item.id === modal.editingId
      ? {
          ...item,
          label: modal.config.label,
          code: modal.config.label,
          color: modal.config.color,
          seatCount: modal.config.seatCount,
          rotation: modal.config.rotation,
        }
      : item
  );
  updateItemsWithHistory(updatedItems); 
  closeModal();
};

  const handleDeleteItem = () => {
    updateItemsWithHistory(
      localItems.filter((item) => item.id !== modal.editingId),
    );

    setSelectedId(null);

    closeModal();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const newItem = {
          id: Date.now(),
          type: "Background",
          subType: "Image",
          x: contextMenu.x,
          y: contextMenu.y,
          imageUrl: reader.result,
          width: 900,
          height: 250,
        };
        setLocalItems([...localItems, newItem]);
      };
      reader.readAsDataURL(file);
    }
    closeContextMenu();
  };

  const handleDragEnd = (id, e) => {
    const updatedItems = localItems.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          x: e.target.x(),
          y: e.target.y(),
        };
      }
      return item;
    });
    updateItemsWithHistory(updatedItems);
  };

  const sortedItems = useMemo(() => {
    return [...localItems].sort((a, b) => {
      const getWeight = (item) => {
        if (item.type === "Background") return 1;
        if (item.type === "Element") return 2;
        return 3;
      };
      return getWeight(a) - getWeight(b);
    });
  }, [localItems]);

  return (
    <div className="bt-section">
          <div className="bt-section-header">
            <h3 className="bt-section-title">
              {selectedEvent?.venue?.name || "Venue Layout"}
            </h3>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div
                className="history-buttons"
                style={{ display: "flex", gap: "5px" }}
              >
                <button
                  className="btn-secondary"
                  onClick={undo}
                  disabled={history.length === 0}
                  title="Undo (Ctrl+Z)"
                  style={{
                    padding: "8px 16px",
                    cursor: "pointer",
                    opacity: history.length === 0 ? 0.5 : 1,
                  }}
                >
                  <i className="fa fa-undo"></i> Undo
                </button>

                <button
                  className="btn-secondary"
                  onClick={redo}
                  disabled={redoStack.length === 0}
                  title="Redo (Ctrl+Y)"
                  style={{
                    padding: "8px 16px",
                    cursor: "pointer",
                    opacity: redoStack.length === 0 ? 0.5 : 1,
                  }}
                >
                  <i className="fa fa-redo"></i> Redo
                </button>
              </div>

              {/* Save Button */}
              <button
                className="btn-confirm"
                onClick={handleSaveLayout}
                disabled={loading}
                style={{ padding: "8px 16px", cursor: "pointer" }}
              >
                {loading ? "Saving..." : "Save Layout"}
              </button>
            </div>
          </div>
    
          <div style={{ display: "flex", gap: "20px" }}>
            <div className="bt-summary">
  <h5 className="bt-section-title" style={{ marginBottom: '15px', width: '100%' }}>
    Select your Action Here:
  </h5>

  <div className="bt-price-legend" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    
    {/* Seating Actions */}
    <button className="action-btn" onClick={() => openAddModal("Seat")}>
      <Icon icon="mdi:chair-rolling" className="action-icon" />
      <span>Add Seat Row/Column</span>
    </button>
    
    <button className="action-btn" onClick={() => openAddModal("Table")}>
      <Icon icon="mdi:table-restaurant" className="action-icon" />
      <span>Add Table with Seats</span>
    </button>
    
    <button className="action-btn" onClick={() => openAddModal("Booth")}>
      <Icon icon="mdi:sofa" className="action-icon" />
      <span>Add Booth</span>
    </button>

    <hr className="action-divider" />

    {/* Elements & Backgrounds */}
    <button className="action-btn" onClick={() => openAddModal("Element")}>
      <Icon icon="mdi:floor-plan" className="action-icon" />
      <span>Add Element</span>
    </button>
    
    <button className="action-btn" onClick={() => openAddModal("Background")}>
      <Icon icon="mdi:shape-outline" className="action-icon" />
      <span>Add Shape as Background</span>
    </button>
    
    <button className="action-btn" onClick={() => fileInputRef.current.click()}>
      <Icon icon="mdi:image-plus" className="action-icon" />
      <span>Upload Image Background</span>
    </button>

  </div>
</div>

            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept="image/*"
              onChange={handleImageUpload}
            />
    
            <div className="bt-grid-outer" style={{ flex: 1, overflow: "auto" }}>
              <div className="canvas-container venue-canvas-bg">
                        <Stage
                          width={STAGE_WIDTH}
                          height={STAGE_HEIGHT}
                          ref={stageRef}
                          onMouseDown={(e) => {
                            const clickedOnEmpty = e.target === e.target.getStage();
                            if (clickedOnEmpty) setSelectedId(null);
                          }}
                          onContextMenu={(e) => {
                            e.evt.preventDefault();
                            const pos = e.target.getStage().getPointerPosition();
                            setContextMenu({ visible: true, x: pos.x, y: pos.y });
                          }}
                        >
                          <Layer>
                            {sortedItems.map((item, i) => (
                              <React.Fragment key={item.id || i}>
                                {/* 1. UPLOADED IMAGES (Background Layer) */}
                                {item.subType === "Image" ? (
                                  <BackgroundImage
                                    ref={null} // Ref is handled by Transformer findOne
                                    item={item}
                                    onClick={() => {
                                      setSelectedId(item.id);
                                      openEditModal(item);
                                    }}
                                    onDragEnd={(e) => handleDragEnd(item.id, e)}
                                    onTransformEnd={(e) => handleTransformEnd(item.id, e)}
                                    dragBoundFunc={(pos) => handleDragBound(pos, item)}
                                  />
                                ) : item.type === "Table" ||
                                  item.type === "Seat" ||
                                  item.type === "Booth" ? (
                                  /* 2. INTERACTIVE UNITS (Top Layer) */
                                  <Group
                                    draggable
                                    id={item.id.toString()}
                                    x={item.x}
                                    y={item.y}
                                    scaleX={item.scaleX || 1}
                                    scaleY={item.scaleY || 1}
                                    rotation={item.rotation || 0}
                                    onDragEnd={(e) => handleDragEnd(item.id, e)}
                                    onTransformEnd={(e) => handleTransformEnd(item.id, e)}
                                    onClick={() => {
                                      setSelectedId(item.id);
                                      openEditModal(item);
                                    }}
                                    dragBoundFunc={(pos) => {
                                      const margin = 35;
                                      return {
                                        x: Math.max(
                                          margin,
                                          Math.min(STAGE_WIDTH - margin, pos.x),
                                        ),
                                        y: Math.max(
                                          margin,
                                          Math.min(STAGE_HEIGHT - margin, pos.y),
                                        ),
                                      };
                                    }}
                                  >
                                    {item.type === "Table" ? (
                                      <>
                                        <Circle
                                          radius={25}
                                          fill="#e0e0e0"
                                          stroke="#555"
                                          strokeWidth={1}
                                        />
                                        {calculateTableSeats(
                                          0,
                                          0,
                                          25,
                                          item.seatCount || 4,
                                        ).map((seat, index) => (
                                          <Rect
                                            key={index}
                                            x={seat.x - 6}
                                            y={seat.y - 6}
                                            width={12}
                                            height={12}
                                            fill="#bdbdbd"
                                            cornerRadius={2}
                                            stroke="#555"
                                            strokeWidth={1}
                                          />
                                        ))}
                                      </>
                                    ) : item.type === "Booth" ? (
                                      <Rect
                                        x={-30}
                                        y={-30}
                                        width={60}
                                        height={60}
                                        fill="#e0e0e0"
                                        stroke="#555"
                                        strokeWidth={2}
                                      />
                                    ) : (
                                      /* Seat Row */
                                      Array.from({ length: item.seatCount || 1 }).map(
                                        (_, idx) => (
                                          <Rect
                                            key={idx}
                                            x={idx * 18 - (item.seatCount * 18) / 2}
                                            y={-6}
                                            width={15}
                                            height={15}
                                            fill="#e0e0e0"
                                            cornerRadius={2}
                                            stroke="#555"
                                            strokeWidth={1}
                                          />
                                        ),
                                      )
                                    )}
                                    <Text
                                      text={item.label || item.code || ""}
                                      x={-30}
                                      y={
                                        item.type === "Booth"
                                          ? -5
                                          : item.type === "Table"
                                            ? -5
                                            : 12
                                      }
                                      width={60}
                                      align="center"
                                      fontSize={10}
                                      fill="black"
                                      fontStyle="bold"
                                    />
                                  </Group>
                                ) : (
                                  /* 3. STATIC SHAPES (Backgrounds & Elements) */
                                  <BackgroundShape
                                    item={item}
                                    onClick={() => {
                                      setSelectedId(item.id);
                                      openEditModal(item);
                                    }}
                                    onDragEnd={(e) => handleDragEnd(item.id, e)}
                                    onTransformEnd={(e) => handleTransformEnd(item.id, e)}
                                    dragBoundFunc={(pos) => handleDragBound(pos, item)}
                                  />
                                )}
                              </React.Fragment>
                            ))}
              
                            {selectedId && (
                              <Transformer
                                ref={(node) => {
                                  trRef.current = node;
                                  if (node && stageRef.current) {
                                    // Look for the node by ID (stringified)
                                    const selectedNode = stageRef.current.findOne(
                                      `#${selectedId}`,
                                    );
                                    if (selectedNode) {
                                      node.nodes([selectedNode]);
                                      node.getLayer().batchDraw();
                                    }
                                  }
                                }}
                                keepRatio={
                                  localItems.find((it) => it.id === selectedId)?.subType ===
                                  "Image"
                                }
                                boundBoxFunc={(oldBox, newBox) => {
                                  if (
                                    Math.abs(newBox.width) < 10 ||
                                    Math.abs(newBox.height) < 10
                                  )
                                    return oldBox;
                                  return newBox;
                                }}
                              />
                            )}
                          </Layer>
                        </Stage>
              
                        {/* {contextMenu.visible && (
                          <div
                            className="custom-context-menu"
                            style={{
                              top: contextMenu.y,
                              left: contextMenu.x,
                              position: "absolute",
                              zIndex: 1000,
                            }}
                          >
                            <ul className="context-menu-list">
                              <li
                                className="context-menu-item"
                                onClick={() => openAddModal("Seat")}
                              >
                                Add Seat Row/Column
                              </li>
                              <li
                                className="context-menu-item"
                                onClick={() => openAddModal("Table")}
                              >
                                Add Table with Seats
                              </li>
                              <li
                                className="context-menu-item"
                                onClick={() => openAddModal("Booth")}
                              >
                                Add Booth
                              </li>
                              <hr />
                              <li
                                className="context-menu-item"
                                onClick={() => openAddModal("Element")}
                              >
                                Add Element (Stage, Bar and etc.)
                              </li>
              
                              <li
                                className="context-menu-item"
                                onClick={() => openAddModal("Background")}
                              >
                                Add Shape as Background
                              </li>
                              <li
                                className="context-menu-item"
                                onClick={() => fileInputRef.current.click()}
                              >
                                Upload Image as Background
                              </li>
                            </ul>
                          </div>
                        )} */}
              
                        {modal.visible && (
                          <div className="venue-modal-overlay">
                            <div className="venue-modal-content">
                              <h4 className="modal-title">
                                {modal.mode === "EDIT"
                                  ? `Edit ${modal.type}`
                                  : `Add ${modal.type}`}
                              </h4>
              
                              <div className="form-group">
                                <label>Label:</label>
                                <input
                                  type="text"
                                  className="modal-input"
                                  value={modal.config.label}
                                  onChange={(e) =>
                                    setModal({
                                      ...modal,
                                      config: { ...modal.config, label: e.target.value },
                                    })
                                  }
                                />
                              </div>
              
                              {(modal.type === "Table" || modal.type === "Seat") && (
                                <>
                                  <div className="form-group">
                                    <label>
                                      Number of Seats (
                                      {modal.type === "Table" ? "1-10" : "1-20"}):
                                    </label>
                                    <input
                                      type="number"
                                      className="modal-input"
                                      min="1"
                                      max={modal.type === "Table" ? 10 : 20}
                                      value={modal.config.seatCount}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value) || 1;
                                        const max = modal.type === "Table" ? 10 : 20;
                                        setModal({
                                          ...modal,
                                          config: {
                                            ...modal.config,
                                            seatCount: Math.min(val, max),
                                          },
                                        });
                                      }}
                                    />
                                  </div>
                                  <div className="form-group">
                                    <label>Rotation:</label>
                                    <select
                                      className="modal-input"
                                      value={modal.config.rotation}
                                      onChange={(e) =>
                                        setModal({
                                          ...modal,
                                          config: {
                                            ...modal.config,
                                            rotation: parseInt(e.target.value),
                                          },
                                        })
                                      }
                                    >
                                      <option value="0">0° (Horizontal)</option>
                                      <option value="90">90° (Vertical)</option>
                                      <option value="180">180°</option>
                                      <option value="270">270°</option>
                                    </select>
                                  </div>
                                </>
                              )}
              
                              {/* ONLY SHOW COLOR PICKER FOR BACKGROUND SHAPES */}
                              {modal.type === "Background" && (
                                <div className="form-group">
                                  <label>Color:</label>
                                  <input
                                    type="color"
                                    className="modal-color-picker"
                                    value={modal.config.color}
                                    onChange={(e) =>
                                      setModal({
                                        ...modal,
                                        config: { ...modal.config, color: e.target.value },
                                      })
                                    }
                                  />
                                </div>
                              )}
              
                              <div className="modal-actions">
                                <button className="btn-cancel" onClick={closeModal}>
                                  Cancel
                                </button>
                                {modal.mode === "EDIT" ? (
                                  <>
                                    <button className="btn-delete" onClick={handleDeleteItem}>
                                      Delete
                                    </button>
                                    <button
                                      className="btn-confirm"
                                      onClick={handleUpdateItem}
                                    >
                                      Update
                                    </button>
                                  </>
                                ) : (
                                  <button className="btn-confirm" onClick={handleAddItem}>
                                    Create
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
            </div>
          </div>
        </div>
  );
};

export default SeatAndBoothMap;