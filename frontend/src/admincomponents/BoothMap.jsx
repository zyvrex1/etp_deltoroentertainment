import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
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
  const [isInspectorExpanded, setIsInspectorExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [fitScale, setFitScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 });
  const [isSyncing, setIsSyncing] = useState(false);

  // Canvas & background image state (loaded from layoutData)
  const [canvasWidth, setCanvasWidth] = useState(1400);
  const [canvasHeight, setCanvasHeight] = useState(900);
  const [bgKonvaImage, setBgKonvaImage] = useState(null);
  const [bgOpacity, setBgOpacity] = useState(0.4);
  const [bgWidth, setBgWidth] = useState(null);
  const [bgHeight, setBgHeight] = useState(null);

  const containerRef = useRef(null);

  /**
   * Parse boothSize string (e.g. "10x10", "10x20") into pixel dimensions.
   * Base rule: "10x10" = 40×40 px (1 unit = 4 px), matching LayoutBuilder.
   */
  const parseBoothSizePx = useCallback((boothSize) => {
    const UNIT = 4;
    if (!boothSize || typeof boothSize !== 'string') return { w: 40, h: 40 };
    const parts = boothSize.toLowerCase().split('x');
    if (parts.length !== 2) return { w: 40, h: 40 };
    const wUnits = parseInt(parts[0], 10);
    const hUnits = parseInt(parts[1], 10);
    if (isNaN(wUnits) || isNaN(hUnits) || wUnits <= 0 || hUnits <= 0) return { w: 40, h: 40 };
    return { w: Math.max(20, wUnits * UNIT), h: Math.max(20, hUnits * UNIT) };
  }, []);

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

  const GRID_SIZE = 20;

  // Re-fit whenever the container or canvas size changes (mirrors LayoutBuilder)
  useEffect(() => {
    const recalc = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      setContainerSize({ w: clientWidth, h: clientHeight });
      const padding = 40;
      const scaleX = (clientWidth - padding) / canvasWidth;
      const scaleY = (clientHeight - padding) / canvasHeight;
      const fs = Math.min(scaleX, scaleY, 1);
      setFitScale(fs);
      setZoom(fs);
      setStagePos({
        x: (clientWidth - canvasWidth * fs) / 2,
        y: (clientHeight - canvasHeight * fs) / 2,
      });
    };
    const timer = setTimeout(recalc, 50);
    const ro = new ResizeObserver(recalc);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => { clearTimeout(timer); ro.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasWidth, canvasHeight]);

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

        // ── Load canvas size & background image from layoutData ──
        if (data.layoutData) {
          const ld = data.layoutData;
          const cw = ld.canvasWidth || 1400;
          const ch = ld.canvasHeight || 900;
          setCanvasWidth(cw);
          setCanvasHeight(ch);

          if (ld.backgroundImage) {
            setBgOpacity(ld.bgOpacity ?? 0.4);
            const img = new window.Image();
            img.src = ld.backgroundImage;
            img.onload = () => {
              setBgKonvaImage(img);
              setBgWidth(ld.bgWidth || cw);
              setBgHeight(ld.bgHeight || ch);
            };
          } else {
            setBgKonvaImage(null);
            setBgWidth(null);
            setBgHeight(null);
          }
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
    const extent = 5000;
    const MAJOR_GRID = 100;
    for (let i = -extent; i <= extent; i += GRID_SIZE) {
      const isMajor = i % MAJOR_GRID === 0;
      const isAxis = i === 0;
      const strokeColor = isAxis ? "#94a3b8" : (isMajor ? "#cbd5e1" : "#e5e7eb");
      const strokeWidth = isAxis ? 1.5 : (isMajor ? 1 : 0.5);
      lines.push(
        <Line key={`v-${i}`} points={[i, -extent, i, extent]} stroke={strokeColor} strokeWidth={strokeWidth} listening={false} />
      );
      lines.push(
        <Line key={`h-${i}`} points={[-extent, i, extent, i]} stroke={strokeColor} strokeWidth={strokeWidth} listening={false} />
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
                      <div className="inspector-header-main" onClick={() => setIsInspectorExpanded(!isInspectorExpanded)} style={{ cursor: 'pointer' }}>
                        <span className="shape-id">
                          {item.label || item.code}
                          <Icon icon={isInspectorExpanded ? "mdi:chevron-up" : "mdi:chevron-down"} className="mobile-only-icon" style={{ marginLeft: '4px', verticalAlign: 'middle', fontSize: '20px' }} />
                        </span>
                        <span className={`value-badge type-${item.type}`}>{item.type?.toUpperCase()}</span>
                      </div>
                      <div className={`summary-list ${isInspectorExpanded ? 'expanded' : ''}`}>
                        <div className="summary-item">
                          <span className="label">Status</span>
                          <span className={`value status-${item.status}`}>{item.status?.toUpperCase()}</span>
                        </div>
                        {item.reservedBy && (
                          <>
                            <div className="summary-item mobile-collapsible">
                              <span className="label">Buyer</span>
                              <span className="value-bold" style={{ color: 'var(--color-green-primary)' }}>{item.reservedBy}</span>
                            </div>
                            {item.reservedByEmail && (
                              <div className="summary-item mobile-collapsible">
                                <span className="label">Email</span>
                                <span className="value" style={{ fontSize: '11px' }}>{item.reservedByEmail}</span>
                              </div>
                            )}
                            {item.reservedByPO && (
                              <div className="summary-item mobile-collapsible">
                                <span className="label">PO Number</span>
                                <span className="value">{item.reservedByPO}</span>
                              </div>
                            )}
                          </>
                        )}
                        {category && (
                          <>
                            <div className="summary-item mobile-collapsible">
                              <span className="label">Category</span>
                              <span className="value">{category.priceName}</span>
                            </div>
                            <div className="summary-item mobile-collapsible">
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
              <button className="bt-btn" onClick={() => setZoom(z => Math.max(z - 0.1, fitScale * 0.3))} title="Zoom Out">
                <Icon icon="mdi:minus" />
              </button>
              <span
                className="zoom-value"
                title="Click to reset to fit"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setZoom(fitScale);
                  if (containerRef.current) {
                    const { clientWidth, clientHeight } = containerRef.current;
                    setStagePos({
                      x: (clientWidth - canvasWidth * fitScale) / 2,
                      y: (clientHeight - canvasHeight * fitScale) / 2,
                    });
                  }
                }}
              >
                {Math.round((zoom / fitScale) * 100)}%
              </span>
              <button className="bt-btn" onClick={() => setZoom(z => Math.min(z + 0.1, fitScale * 4))} title="Zoom In">
                <Icon icon="mdi:plus" />
              </button>
            </div>
          </div>

          <div className="konva-container" ref={containerRef}>
            <Stage
              width={containerSize.w}
              height={containerSize.h}
              ref={stageRef}
              scaleX={zoom}
              scaleY={zoom}
              x={stagePos.x}
              y={stagePos.y}
              draggable
              onDragEnd={(e) => {
                setStagePos({ x: e.target.x(), y: e.target.y() });
              }}
              onMouseDown={(e) => {
                const clickedOnEmpty = e.target === e.target.getStage();
                if (clickedOnEmpty) setSelectedId(null);
              }}
              onWheel={(e) => {
                e.evt.preventDefault();
                const stage = stageRef.current;
                const oldScale = zoom;
                const pointer = stage.getPointerPosition();
                const minScale = fitScale * 0.3;
                const maxScale = fitScale * 4;
                const direction = e.evt.deltaY > 0 ? -1 : 1;
                const newScale = Math.min(maxScale, Math.max(minScale, oldScale + direction * 0.05));
                const mousePointTo = {
                  x: (pointer.x - stagePos.x) / oldScale,
                  y: (pointer.y - stagePos.y) / oldScale,
                };
                const newPos = {
                  x: pointer.x - mousePointTo.x * newScale,
                  y: pointer.y - mousePointTo.y * newScale,
                };
                setZoom(newScale);
                setStagePos(newPos);
              }}
            >
              {/* Background image layer — pulled from layoutData.backgroundImage */}
              {bgKonvaImage && bgWidth && bgHeight && (
                <Layer>
                  <KonvaImage
                    image={bgKonvaImage}
                    x={0}
                    y={0}
                    width={bgWidth}
                    height={bgHeight}
                    opacity={bgOpacity}
                    listening={false}
                  />
                </Layer>
              )}
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
                      (() => {
                        const isBooth = item.type === "booth";
                        const cat = priceLevels.find(c => c._id === item.categoryId);
                        const { w: boothW, h: boothH } = isBooth
                          ? parseBoothSizePx(cat?.boothSize)
                          : { w: 40, h: 40 };
                        return (
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
                                  fill={cat?.color || "#e0e0e0"}
                                  stroke="white"
                                  strokeWidth={1}
                                />
                                {calculateTableSeats(0, 0, 25, item.seatCount || 4).map((seat, index) => (
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
                            ) : isBooth ? (
                              <Rect
                                x={-boothW / 2}
                                y={-boothH / 2}
                                width={boothW}
                                height={boothH}
                                fill={item.status === 'sold' || item.status === 'reserved' ? '#22c55e' : (cat?.color || "#e0e0e0")}
                                stroke="#000"
                                strokeWidth={1}
                                strokeScaleEnabled={false}
                              />
                            ) : (
                              <Circle
                                radius={20}
                                fill={item.status === 'sold' || item.status === 'reserved' ? '#22c55e' : (cat?.color || "#666666")}
                                stroke="white"
                                strokeWidth={1}
                              />
                            )}
                            <Text
                              text={item.label || item.code || ""}
                              fontSize={isBooth ? Math.max(8, Math.min(boothW, boothH) / 5) : 9}
                              fontStyle="bold"
                              fill="white"
                              align="center"
                              verticalAlign="middle"
                              x={0}
                              y={0}
                              offsetX={isBooth ? boothW / 2 : 20}
                              offsetY={isBooth ? boothH / 2 : 20}
                              width={isBooth ? boothW : 40}
                              height={isBooth ? boothH : 40}
                              scaleX={Math.min(item.scaleX || 1, item.scaleY || 1) / (item.scaleX || 1)}
                              scaleY={Math.min(item.scaleX || 1, item.scaleY || 1) / (item.scaleY || 1)}
                              shadowColor="black"
                              shadowBlur={2}
                              shadowOpacity={0.8}
                              shadowOffset={{ x: 1, y: 1 }}
                            />
                          </Group>
                        );
                      })()
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