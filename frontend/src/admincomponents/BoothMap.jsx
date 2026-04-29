import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Stage,
  Layer,
  Rect,
  Circle,
  Text,
  Group,
  Line,
  Image as KonvaImage,
} from "react-konva";
import useImage from "use-image";
import { Icon } from "@iconify/react";
import { useEventsContext } from "../hooks/useEventsContext";
import { useAuthContext } from "../hooks/useAuthContext";
import "./LayoutBuilder.css";

const BackgroundImage = ({ item, onClick }) => {
  const [img] = useImage(item.imageUrl);
  const isBg = item.isBackground || item.type === "background";
  const w = item.width || (isBg ? 400 : 45);
  const h = item.height || (isBg ? 300 : 45);

  if (!img) return null;

  return (
    <KonvaImage
      id={item.id?.toString()}
      image={img}
      x={item.x}
      y={item.y}
      width={w}
      height={h}
      scaleX={item.scaleX || 1}
      scaleY={item.scaleY || 1}
      rotation={item.rotation || 0}
      onClick={onClick}
      opacity={0.6}
    />
  );
};

const BackgroundShape = ({ item, onClick }) => {
  const isBg = item.isBackground || item.type === "background";
  const isElement = item.isElement || item.type === "element";
  const w = item.width || 100;
  const h = item.height || 100;

  return (
    <Group
      id={item.id?.toString()}
      x={item.x}
      y={item.y}
      scaleX={item.scaleX || 1}
      scaleY={item.scaleY || 1}
      rotation={item.rotation || 0}
      onClick={onClick}
    >
      <Rect
        width={w}
        height={h}
        fill={item.color || (isBg ? "#f5f5f5" : "#90caf9")}
        opacity={isBg ? 0.3 : 0.8}
        stroke={isElement ? "#333" : "transparent"}
        strokeWidth={1}
      />
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
  const [priceLevels, setPriceLevels] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncBooths = async () => {
    if (!selectedEvent?._id || !user?.token) return;

    setIsSyncing(true);
    try {
      const response = await fetch(`/api/events/${selectedEvent._id}/sync-booths`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${user.token}`,
          "Content-Type": "application/json"
        }
      });
      const data = await response.json();
      if (response.ok) {
        // Update context with the synchronized event data
        if (data.event) {
          dispatch({ type: "UPDATE_EVENT", payload: data.event });
        }

        const { showSuccessAlert } = await import("../utils/sweetAlert");
        showSuccessAlert("Sync Complete", data.message || "Booth statuses have been reconciled with reservations.");
      } else {
        const { showErrorAlert } = await import("../utils/sweetAlert");
        showErrorAlert("Sync Failed", data.error || "Failed to reconcile booths.");
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  };
  const stageRef = useRef(null);

  const CANVAS_WIDTH = 1400;
  const CANVAS_HEIGHT = 800;
  const GRID_SIZE = 20;

  useEffect(() => {
    const fetchLayout = async () => {
      if (!selectedEvent?._id) return;
      try {
        const response = await fetch(`/api/events/${selectedEvent._id}`);
        const data = await response.json();

        let savedItems = [];
        if (data.layoutData && data.layoutData.items) {
          savedItems = data.layoutData.items;
        } else {
          savedItems = [
            ...(data.seatMap?.sections[0]?.seats || []),
            ...(data.seatMap?.elements || []),
            ...(data.seatMap?.backgrounds || []),
            ...(data.booths || []),
          ];
        }

        const normalizedItems = savedItems.map((item) => ({
          ...item,
          id: item._id || item.id,
          status: item.status || "available",
          type: item.type?.toLowerCase() || (item.isBooth ? "booth" : item.isElement ? "element" : "background"),
          categoryId: item.categoryId || item.priceLevelId,
        }));

        setLocalItems(normalizedItems);

        if (data.priceLevels) {
          const normalizedCategories = data.priceLevels.map(pl => ({
            _id: pl._id,
            priceName: pl.priceName,
            facePrice: pl.facePrice,
            quantityAvailable: pl.quantityAvailable,
            color: pl.color || "#666666",
            type: pl.type || "Seat (Circle)",
            boothSize: pl.boothSize || "",
            quantitySold: pl.quantitySold || 0
          }));
          setPriceLevels(normalizedCategories);
        }
      } catch (error) {
        console.error("Error loading layout:", error);
      }
    };
    fetchLayout();
  }, [selectedEvent?._id]);

  const sortedItems = useMemo(() => {
    return [...localItems].sort((a, b) => {
      const getWeight = (item) => {
        if (item.isBackground || item.type === "background") return 1;
        if (item.isElement || item.type === "element") return 2;
        return 3;
      };
      return getWeight(a) - getWeight(b);
    });
  }, [localItems]);

  const totalPlacedCount = localItems.filter(i => ["seat", "booth", "table"].includes(i.type)).length;
  const potentialRevenue = priceLevels.reduce((sum, p) => sum + ((p.facePrice || 0) * (p.quantityAvailable || 0)), 0);

  const currentRevenue = localItems.reduce((sum, item) => {
    if (item.status === 'sold' || item.status === 'partially-sold') {
      const cat = priceLevels.find(p => p._id === item.categoryId);
      return sum + (cat ? cat.facePrice : 0);
    }
    return sum;
  }, 0);

  const renderGrid = () => {
    const lines = [];
    for (let i = 0; i <= CANVAS_WIDTH / GRID_SIZE; i++) {
      lines.push(
        <Line
          key={`v-${i}`}
          points={[i * GRID_SIZE, 0, i * GRID_SIZE, CANVAS_HEIGHT]}
          stroke="#eee"
          strokeWidth={1}
        />
      );
    }
    for (let i = 0; i <= CANVAS_HEIGHT / GRID_SIZE; i++) {
      lines.push(
        <Line
          key={`h-${i}`}
          points={[0, i * GRID_SIZE, CANVAS_WIDTH, i * GRID_SIZE]}
          stroke="#eee"
          strokeWidth={1}
        />
      );
    }
    return lines;
  };

  return (
    <div className="layout-builder-container unified-view">
      <div className="builder-main">
        <div className="builder-sidebar" >
          {/* Ticket Categories Sidebar Area */}
          <div className="sidebar-card categories-card" style={{ borderBottom: '1px solid #eee', background: 'transparent' }}>
            <div className="sidebar-header">
              <h4 className="bt-section-title-layout">Ticket Categories</h4>
            </div>
            <div className="sidebar-categories-list" style={{ marginTop: '15px' }}>
              {priceLevels.length === 0 ? (
                <div className="sidebar-empty-state">No categories defined</div>
              ) : (
                priceLevels.map(cat => {
                  const itemsInCat = localItems.filter(i => i.categoryId === cat._id);
                  const placed = itemsInCat.length;
                  const sold = cat.quantitySold || 0;

                  return (
                    <div key={cat._id} className="sidebar-cat-item" style={{ padding: '10px' }}>
                      <div className="cat-palette-visual" style={{ backgroundColor: cat.color, width: '32px', height: '32px', fontSize: '16px' }}>
                        {cat.type?.includes("Seat") ? <Icon icon="mdi:circle" /> : <Icon icon="mdi:square" />}
                      </div>
                      <div className="cat-details">
                        <div className="cat-top">
                          <span className="cat-name">{cat.priceName}</span>
                          <span className="price">${cat.facePrice?.toFixed(2)}</span>
                        </div>
                        <div className="cat-meta" style={{ fontSize: '10px' }}>
                          <span>{placed} Placed</span>
                          <span>{cat.quantityAvailable - sold} Avail</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Inspector Card Area */}
          {selectedId && (
            <div className="sidebar-card inspector-card" style={{ borderBottom: '1px solid #eee', background: 'transparent' }}>
              <div className="sidebar-header">
                <h4 className="bt-section-title-layout">Shape Inspector</h4>
                <button className="close-btn" onClick={() => setSelectedId(null)}>
                  <Icon icon="mdi:close" />
                </button>
              </div>
              <div className="inspector-body">
                {(() => {
                  const item = localItems.find(i => i.id === selectedId);
                  if (!item) return null;
                  const category = priceLevels.find(pl => pl._id === item.categoryId);
                  return (
                    <>
                      <div className="inspector-header-main">
                        <span className="shape-id">{item.label || item.code}</span>
                        <span className={`value-badge type-${item.type}`}>{item.type?.toUpperCase()}</span>
                      </div>
                      <div className="summary-list">
                        <div className="summary-item">
                          <span className="label">Status</span>
                          <span className={`value status-${item.status}`}>{item.status?.toUpperCase()}</span>
                        </div>
                        {item.reservedBy && (
                          <>
                            <div className="summary-item">
                              <span className="label">Buyer</span>
                              <span className="value-bold" style={{ color: 'var(--color-green-primary)' }}>{item.reservedBy}</span>
                            </div>
                            {item.reservedByEmail && (
                              <div className="summary-item">
                                <span className="label">Email</span>
                                <span className="value" style={{ fontSize: '11px' }}>{item.reservedByEmail}</span>
                              </div>
                            )}
                            {item.reservedByPO && (
                              <div className="summary-item">
                                <span className="label">PO Number</span>
                                <span className="value">{item.reservedByPO}</span>
                              </div>
                            )}
                          </>
                        )}
                        {category && (
                          <>
                            <div className="summary-item">
                              <span className="label">Category</span>
                              <span className="value">{category.priceName}</span>
                            </div>
                            <div className="summary-item">
                              <span className="label">Price</span>
                              <span className="value-bold">${category.facePrice?.toFixed(2)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Summary Card Area */}
          <div className="sidebar-card summary-card" style={{ background: 'transparent' }}>
            <div className="sidebar-header">
              <h4 className="bt-section-title-layout">Venue Summary</h4>
            </div>
            <div className="summary-list">
              <div className="summary-item">
                <span className="label">Placed Items</span>
                <span className="value">{totalPlacedCount}</span>
              </div>
              <div className="summary-item">
                <span className="label">Current Rev</span>
                <span className="value">${currentRevenue.toLocaleString()}</span>
              </div>
              <div className="summary-item total">
                <span className="label">Potential</span>
                <span className="value-muted">${potentialRevenue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="canvas-area">
          <div className="canvas-toolbar">
            <h4 className="canvas-title">{selectedEvent?.venue?.name || "Venue Map"}</h4>
            <div className="zoom-controls">
              <button
                className={`bt-btn sync-btn ${isSyncing ? 'spinning' : ''}`}
                onClick={handleSyncBooths}
                disabled={isSyncing}
                title="Sync Booth Status with Database"
                style={{ marginRight: '10px' }}
              >
                <Icon icon={isSyncing ? "mdi:loading" : "mdi:sync"} className={isSyncing ? "spin" : ""} />
                <span style={{ marginLeft: '5px', fontSize: '12px' }}>{isSyncing ? 'Syncing...' : 'Sync Data'}</span>
              </button>
              <button className="bt-btn" onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))}>
                <Icon icon="mdi:minus" />
              </button>
              <span className="zoom-value">{Math.round(zoom * 100)}%</span>
              <button className="bt-btn" onClick={() => setZoom(z => Math.min(z + 0.1, 2))}>
                <Icon icon="mdi:plus" />
              </button>
            </div>
          </div>

          <div className="konva-container">
            <Stage
              width={1000} // This will be handled by container, but staging a fixed value
              height={600}
              ref={stageRef}
              scaleX={zoom}
              scaleY={zoom}
              draggable
              onDragStart={() => {
                if (stageRef.current) stageRef.current.container().style.cursor = 'grabbing';
              }}
              onDragEnd={() => {
                if (stageRef.current) stageRef.current.container().style.cursor = 'grab';
              }}
              onMouseEnter={() => {
                if (stageRef.current) stageRef.current.container().style.cursor = 'grab';
              }}
              onMouseLeave={() => {
                if (stageRef.current) stageRef.current.container().style.cursor = 'default';
              }}
              onMouseDown={(e) => {
                const clickedOnEmpty = e.target === e.target.getStage();
                if (clickedOnEmpty) setSelectedId(null);
              }}
            >
              <Layer>
                {renderGrid()}
                {sortedItems.map((item, i) => (
                  <React.Fragment key={item.id || i}>
                    {item.subType === "Image" || item.imageUrl ? (
                      <BackgroundImage
                        item={item}
                        onClick={() => setSelectedId(item.id)}
                      />
                    ) : (item.type === "seat" || item.type === "booth" || item.type === "table") ? (
                      <Group
                        id={item.id?.toString()}
                        x={item.x}
                        y={item.y}
                        scaleX={item.scaleX || 1}
                        scaleY={item.scaleY || 1}
                        rotation={item.rotation || 0}
                        onClick={() => setSelectedId(item.id)}
                      >
                        {item.type === "table" ? (
                          <>
                            <Circle
                              radius={25}
                              fill={priceLevels.find(c => c._id === item.categoryId)?.color || "#e0e0e0"}
                              stroke="white"
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
                                stroke="white"
                                strokeWidth={1}
                                strokeScaleEnabled={false}
                              />
                            ))}
                          </>
                        ) : item.type === "booth" ? (
                          <Rect
                            x={-20}
                            y={-20}
                            width={40}
                            height={40}
                            fill={item.status === 'sold' || item.status === 'reserved' ? '#22c55e' : (priceLevels.find(c => c._id === item.categoryId)?.color || "#e0e0e0")}
                            stroke="#000"
                            strokeWidth={1}
                            strokeScaleEnabled={false}
                          />
                        ) : (
                          /* Standard Seat - Exact Match to LayoutBuilder */
                          <Circle
                            radius={20}
                            fill={item.status === 'sold' || item.status === 'reserved' ? '#22c55e' : (priceLevels.find(c => c._id === item.categoryId)?.color || "#666666")}
                            stroke="white"
                            strokeWidth={1}
                          />
                        )}
                        <Text
                          text={item.label || item.code || ""}
                          fontSize={9}
                          fontStyle="bold"
                          fill="white"
                          align="center"
                          verticalAlign="middle"
                          x={0}
                          y={0}
                          offsetX={20}
                          offsetY={20}
                          width={40}
                          height={40}
                          scaleX={Math.min(item.scaleX || 1, item.scaleY || 1) / (item.scaleX || 1)}
                          scaleY={Math.min(item.scaleX || 1, item.scaleY || 1) / (item.scaleY || 1)}
                          shadowColor="black"
                          shadowBlur={2}
                          shadowOpacity={0.8}
                          shadowOffset={{ x: 1, y: 1 }}
                        />
                      </Group>
                    ) : (
                      <BackgroundShape
                        item={item}
                        onClick={() => setSelectedId(item.id)}
                      />
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

export default SeatAndBoothMap;