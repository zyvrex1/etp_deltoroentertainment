import React, { useState, useRef, useEffect } from "react";
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
import { useEventsContext } from "../hooks/useEventsContext";
import { useAuthContext } from "../hooks/useAuthContext";

const BackgroundImage = React.forwardRef(
  ({ item, onClick, onDragEnd, dragBoundFunc, onTransformEnd }, ref) => {
    const [img] = useImage(item.imageUrl);
    const isBg = item.type === "Background";
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
    const w = item.width || (isBg ? 400 : 45);
    const h = item.height || (isBg ? 300 : 45);

    return (
      <Rect
        ref={ref}
        id={item.id.toString()}
        x={item.x}
        y={item.y}
        width={w}
        height={h}
        fill={item.color || "#2196F3"}
        opacity={isBg ? 0.3 : 1}
        draggable
        onClick={onClick}
        onDragEnd={onDragEnd}
        onTransformEnd={onTransformEnd}
        dragBoundFunc={dragBoundFunc}
      />
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
  const [loading, setLoading] = useState(false); // New: Loading state
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
        const savedItems = [
          ...(data.seatMap?.sections[0]?.seats || []),
          ...(data.seatMap?.layoutItems || []),
          ...(data.booths || [])
        ].map(item => ({
          ...item,
          id: item._id || item.id // Ensure we have a consistent ID
        }));
        
        setLocalItems(savedItems);
      } catch (error) {
        console.error("Error loading layout:", error);
      }
    };

    fetchLayout();
  }, [selectedEvent?._id]);

  const handleSaveLayout = async () => {
  // 1. Safety check for the user
  if (!user) {
    alert("You must be logged in to save changes.");
    return;
  }

  setLoading(true);
  try {
    const response = await fetch(`/api/events/${selectedEvent._id}/layout`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // 2. Use the token from the AuthContext
        'Authorization': `Bearer ${user.token}` 
      },
      body: JSON.stringify({ localItems }) 
    });

    const json = await response.json();

    if (response.ok) {
      // 3. Update the global state so other parts of the admin panel sync up
      dispatch({ type: 'UPDATE_EVENT', payload: json });
      alert("Layout saved successfully!");
    } else {
      alert(`Save failed: ${json.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error("Save error:", error);
    alert("Network error while saving.");
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

  const handleTransformEnd = (index, e) => {
  const node = e.target;

  // We no longer reset scale to 1. 
  // We keep the node's visual scale and save it to our state.
  const updatedItems = [...localItems];
  updatedItems[index] = {
    ...updatedItems[index],
    x: node.x(),
    y: node.y(),
    rotation: node.rotation(),
    // Save the scale values directly
    scaleX: node.scaleX(),
    scaleY: node.scaleY(),
    // We still update width/height for bounding box logic, 
    // but the Group uses scaleX/Y for the visual look.
    width: node.width(),
    height: node.height(),
  };

  setLocalItems(updatedItems);
};

  const openAddModal = (type) => {
    setSelectedId(null); // Clear selection when adding something new
    setModal({
      visible: true,
      mode: "ADD",
      type: type,
      config: {
        label: type === "Background" ? "" : "New " + type,
        // Default to gray for non-backgrounds
        color: type === "Background" ? "#2196F3" : "#e0e0e0",
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
        label: item.code,
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
      id: Date.now(),
      type: modal.type,
      x: spawnX,
      y: spawnY,
      label: modal.config.label, // Use 'label' to match seatSchema
      code: modal.config.label,  // Keep 'code' for booths/compat
      color: modal.config.color,
      shape: modal.config.shape,
      width: modal.type === "Booth" ? 60 : 40,
      height: modal.type === "Booth" ? 60 : 40,
      rotation: modal.config.rotation || 0,
      seatCount: modal.config.seatCount,
    };

    if (newItem.type !== "Background") {
      const isBlocked = localItems.some(
        (item) => item.type !== "Background" && haveIntersection(newItem, item),
      );
      if (isBlocked) {
        alert("Space is occupied!");
        return;
      }
    }

    setLocalItems([...localItems, newItem]);
    closeModal();
  };

  const handleUpdateItem = () => {
    setLocalItems(
      localItems.map((item) =>
        item.id === modal.editingId
          ? {
              ...item,
              code: modal.config.label,
              color: modal.config.color,
              shape: modal.config.shape,
              seatCount: modal.config.seatCount,
              rotation: modal.config.rotation, // Fix: Save rotation on update
            }
          : item,
      ),
    );
    closeModal();
  };

  const handleDeleteItem = () => {
    setLocalItems(localItems.filter((item) => item.id !== modal.editingId));

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

  const handleDragEnd = (index, e) => {
    const updatedItems = [...localItems];
    updatedItems[index] = {
      ...updatedItems[index],
      x: e.target.x(),
      y: e.target.y(),
    };
    setLocalItems(updatedItems);
  };

  return (
    <div className="bt-section relative-wrapper" onClick={closeContextMenu}>
      <div className="bt-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="bt-section-title">{selectedEvent.venue?.name}</h3>
          
          {/* NEW: Save Button */}
          <button 
            className="btn-confirm" 
            onClick={handleSaveLayout}
            disabled={loading}
            style={{ padding: '8px 16px', cursor: 'pointer' }}
          >
            {loading ? "Saving..." : "Save Layout"}
          </button>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleImageUpload}
      />

      <div className="bt-grid-outer">
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
  {localItems
    .sort((a, b) => (a.type === "Background" ? -1 : 1))
    .map((item, i) => (
      <React.Fragment key={item.id || i}>
        {/* 1. UPLOADED IMAGES */}
        {item.subType === "Image" ? (
          <BackgroundImage
            item={item}
            onClick={() => {
              setSelectedId(item.id);
              openEditModal(item);
            }}
            onDragEnd={(e) => handleDragEnd(i, e)}
            onTransformEnd={(e) => handleTransformEnd(i, e)}
            dragBoundFunc={(pos) => handleDragBound(pos, item)}
          />
        ) : 
        
        /* 2. INTERACTIVE UNITS (TABLES, SEATS, BOOTHS) */
        item.type === "Table" || item.type === "Seat" || item.type === "Booth" ? (
<Group
  draggable
  id={item.id.toString()}
  x={item.x}
  y={item.y}
  // NEW: Pull scale from the item data (defaults to 1)
  scaleX={item.scaleX || 1}
  scaleY={item.scaleY || 1}
  rotation={item.rotation || 0}
  onDragEnd={(e) => handleDragEnd(i, e)}
  // NEW: Add the transform end handler here
  onTransformEnd={(e) => handleTransformEnd(i, e)}
  onClick={() => {
    setSelectedId(item.id);
    openEditModal(item);
  }}
  dragBoundFunc={(pos) => {
    const margin = 35;
    return {
      x: Math.max(margin, Math.min(STAGE_WIDTH - margin, pos.x)),
      y: Math.max(margin, Math.min(STAGE_HEIGHT - margin, pos.y)),
    };
  }}
>
  {item.type === "Table" ? (
    <>
      <Circle radius={25} fill="#e0e0e0" stroke="#555" strokeWidth={2} />
      {calculateTableSeats(0, 0, 25, item.seatCount || 4).map((seat, index) => (
        <Rect
          key={index}
          x={seat.x - 6} y={seat.y - 6}
          width={12} height={12}
          fill="#bdbdbd"
          cornerRadius={2} stroke="#555" strokeWidth={1}
        />
      ))}
    </>
  ) : item.type === "Booth" ? (
    <Rect
      x={-30} y={-30}
      width={60} height={60}
      fill="#e0e0e0"
      cornerRadius={5} stroke="#555" strokeWidth={2}
    />
  ) : (
    /* Seat Row - Your Original Logic Maintained */
    Array.from({ length: item.seatCount || 1 }).map((_, idx) => (
      <Rect
        key={idx}
        x={idx * 18 - (item.seatCount * 18) / 2}
        y={-6}
        width={15} height={15}
        fill="#e0e0e0"
        cornerRadius={3} stroke="#555" strokeWidth={1}
      />
    ))
  )}
  <Text
    text={item.code}
    x={-30}
    y={item.type === "Booth" ? -5 : (item.type === "Table" ? -5 : 12)}
    width={60}
    align="center"
    fontSize={10}
    fill="black"
    fontStyle="bold"
  />
</Group>
        ) : (
          

          <BackgroundShape
            item={item}
            onClick={() => {
              setSelectedId(item.id);
              openEditModal(item);
            }}
            onDragEnd={(e) => handleDragEnd(i, e)}
            onTransformEnd={(e) => handleTransformEnd(i, e)}
            dragBoundFunc={(pos) => handleDragBound(pos, item)}
          />
        )}
      </React.Fragment>
    ))}

  {selectedId && (
    <Transformer
      ref={(node) => {
        trRef.current = node;
        if (node) {
          const exists = localItems.some((it) => it.id === selectedId);
          const selectedNode = stageRef.current.findOne(`#${selectedId}`);
          if (selectedNode && exists) {
            node.nodes([selectedNode]);
            node.getLayer().batchDraw();
          } else {
            node.nodes([]);
          }
        }
      }}
      keepRatio={localItems.find((it) => it.id === selectedId)?.subType === "Image"}
      boundBoxFunc={(oldBox, newBox) => {
        if (newBox.width < 10 || newBox.height < 10) return oldBox;
        return newBox;
      }}
    />
  )}
</Layer>
          </Stage>

          {contextMenu.visible && (
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
          )}

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
              Number of Seats ({modal.type === "Table" ? "1-10" : "1-20"}):
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
            <button className="btn-confirm" onClick={handleUpdateItem}>
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
  );
};

export default SeatAndBoothMap;
