import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getImageUrl } from '../utils/imageUrl';
import { Icon } from '@iconify/react';
import { useNavigate, useParams } from 'react-router-dom';
import { Stage, Layer, Rect, Circle, Text, Group, Line, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { useAuthContext } from '../hooks/useAuthContext';
import { useSponsorCartContext } from '../context/SponsorCartContext';
import { showSuccessAlert } from '../utils/sweetAlert';
import eventsService from '../services/eventsService';
import axios from 'axios';
import './SponsorVenueLayout.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const BackgroundImage = ({ item, onClick }) => {
    const [img] = useImage(getImageUrl(item.imageUrl));
    const isBg = item.isBackground || item.type === "background" || item.subType === "Image";
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
            onTap={onClick}
            opacity={isBg ? 0.6 : 1}
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
            onTap={onClick}
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
                    align="center"
                    verticalAlign="middle"
                    fontSize={14}
                    fill="black"
                    fontStyle="bold"
                    listening={false}
                    scaleX={Math.min(item.scaleX || 1, item.scaleY || 1) / (item.scaleX || 1)}
                    scaleY={Math.min(item.scaleX || 1, item.scaleY || 1) / (item.scaleY || 1)}
                    width={w * (item.scaleX || 1) / Math.min(item.scaleX || 1, item.scaleY || 1)}
                    height={h * (item.scaleY || 1) / Math.min(item.scaleX || 1, item.scaleY || 1)}
                    x={0}
                    y={0}
                />
            )}
        </Group>
    );
};

const SponsorVenueLayout = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuthContext();
    const { addToCart, addMultipleToCart } = useSponsorCartContext();

    const [event, setEvent] = useState(null);
    const [localItems, setLocalItems] = useState([]);
    const [priceLevels, setPriceLevels] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Canvas sizing (read from layoutData)
    const [canvasWidth, setCanvasWidth] = useState(1400);
    const [canvasHeight, setCanvasHeight] = useState(900);

    // Background image (read from layoutData)
    const [bgKonvaImage, setBgKonvaImage] = useState(null);
    const [bgOpacity, setBgOpacity] = useState(0.4);
    const [bgWidth, setBgWidth] = useState(null);
    const [bgHeight, setBgHeight] = useState(null);

    // Zoom + pan state (mirrors BoothMap / LayoutBuilder)
    const [zoom, setZoom] = useState(1);
    const [fitScale, setFitScale] = useState(1);
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [containerSize, setContainerSize] = useState({ w: 100, h: 100 });

    const stageRef = useRef(null);
    const containerRef = useRef(null);
    // Manual panning refs — no React state = no re-render lag during pan
    const isPanningRef = useRef(false);
    const lastPointerRef = useRef({ x: 0, y: 0 });

    /**
     * Parse boothSize string (e.g. "10x10", "10x20") into pixel dimensions.
     * Base rule: "10x10" = 40×40 px (1 unit = 4 px).
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

    /**
     * Shared recalc: reads the container's current dimensions and computes
     * fitScale, zoom and stagePos so the entire canvas fits in view.
     * Extracted as a useCallback so multiple effects can call it.
     */
    const recalc = useCallback(() => {
        if (!containerRef.current) return;
        const { clientWidth, clientHeight } = containerRef.current;
        if (!clientWidth || !clientHeight) return;
        setContainerSize({ w: clientWidth, h: clientHeight });
        const padding = 20;
        const scaleX = (clientWidth - padding) / canvasWidth;
        const scaleY = (clientHeight - padding) / canvasHeight;
        const fs = Math.min(scaleX, scaleY, 1);
        setFitScale(fs);
        setZoom(fs);
        setStagePos({
            x: (clientWidth - canvasWidth * fs) / 2,
            y: (clientHeight - canvasHeight * fs) / 2,
        });
    }, [canvasWidth, canvasHeight]);

    // Re-fit when canvas size changes or container is resized
    useEffect(() => {
        const t1 = setTimeout(recalc, 50);
        const t2 = setTimeout(recalc, 300);
        const ro = new ResizeObserver(recalc);
        if (containerRef.current) ro.observe(containerRef.current);
        return () => { clearTimeout(t1); clearTimeout(t2); ro.disconnect(); };
    }, [recalc]);

    /**
     * THE KEY FIX: when isLoading flips false, the map container mounts for
     * the first time. The canvasWidth/Height effect already fired while the
     * loading spinner was showing (containerRef was null → returned early).
     * We need a second recalc NOW that the DOM is ready.
     */
    useEffect(() => {
        if (isLoading) return;
        const t = setTimeout(recalc, 150);
        return () => clearTimeout(t);
    }, [isLoading, recalc]);

    const CANVAS_WIDTH = canvasWidth;
    const CANVAS_HEIGHT = canvasHeight;

    useEffect(() => {
        const fetchEventData = async () => {
            if (!id || !user?.token) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                // Sync booth/seat status first so expired pending reservations
                // are released before we render the map.
                try {
                    await axios.post(`/api/events/${id}/sync-booths`, {}, {
                        headers: { Authorization: `Bearer ${user.token}` }
                    });
                } catch (syncErr) {
                    console.warn('[SponsorVenueLayout] sync-booths failed (non-fatal):', syncErr.message);
                }

                const data = await eventsService.getEvent(id, user.token);
                if (!data) {
                    setIsLoading(false);
                    return;
                }
                setEvent(data);

                let savedItems = [];
                if (data.layoutData && data.layoutData.items) {
                    savedItems = data.layoutData.items;
                } else if (data.seatMap) {
                    savedItems = [
                        ...(data.seatMap.sections?.flatMap(s => s.seats) || []),
                        ...(data.seatMap.elements || []),
                        ...(data.seatMap.backgrounds || []),
                        ...(data.booths || []),
                    ];
                } else {
                    savedItems = data.booths || [];
                }

                const normalizedItems = (savedItems || [])
                    .filter(Boolean)
                    .map((item) => ({
                        ...item,
                        id: item._id || item.id,
                        status: item.status || "available",
                        type: item.type?.toLowerCase() || (item.isBooth ? "booth" : item.isElement ? "element" : "background"),
                        categoryId: item.categoryId || item.priceLevelId,
                    }));

                setLocalItems(normalizedItems);
                setPriceLevels(data.priceLevels || []);

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
                console.error("Error fetching event layout:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEventData();
    }, [id, user?.token]);

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

    const handleAddToCart = () => {
        if (selectedIds.length === 0) return;

        const itemsToAdd = selectedIds.map(id => {
            const selectedItem = localItems.find(i => i.id === id);
            if (!selectedItem) return null;

            const category = priceLevels.find(pl => pl._id === selectedItem.categoryId);

            const facePrice = category?.facePrice || 0;
            const processingFee = facePrice * 0.03;
            const estimatedTax = facePrice * 0.08;
            const total = facePrice + processingFee + estimatedTax;

            return { event, booth: selectedItem, category, total, facePrice, processingFee, estimatedTax };
        }).filter(Boolean);

        if (itemsToAdd.length > 0) {
            addMultipleToCart(itemsToAdd);
            showSuccessAlert('Added to Cart', `${itemsToAdd.length} booth(s) added to your cart.`);
            setSelectedIds([]);
        }
    };

    const selectedItemsData = useMemo(() => {
        return selectedIds.map(id => {
            const item = localItems.find(i => i.id === id);
            if (!item) return null;
            const cat = priceLevels.find(pl => pl._id === item.categoryId);
            return { ...item, category: cat };
        }).filter(Boolean);
    }, [selectedIds, localItems, priceLevels]);

    const toggleSelection = (id) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(i => i !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    if (isLoading) return <div className="sed-loading-container"><Icon icon="line-md:loading-twotone-loop" width="48" /></div>;

    if (!event) {
        return (
            <div className="sed-error-container">
                <Icon icon="mdi:alert-circle-outline" width="48" />
                <h3>Event layout not found</h3>
                <p className="small-body-text text-secondary mb-4">We couldn't retrieve the layout for this event. Please try again or select another event.</p>
                <button className="primary-button" onClick={() => navigate('/sponsor/sponsor-events')}>Browse Events</button>
            </div>
        );
    }

    return (
        <div className="svl-page-wrapper">
            <div className="svl-header-card">
                <div className="svl-header-left">
                    <button className="svl-back-btn" onClick={() => navigate(-1)}>
                        <Icon icon="mdi:arrow-left" width="24" />
                    </button>
                    <div>
                        <h2 className="text-black mb-1">{event.title}</h2>
                        <span className="small-body-text text-secondary">
                            {new Date(event.startDate).toLocaleDateString()} • {event.startTime || "TBA"} • {event.venue?.name || "TBA"}
                        </span>
                    </div>
                </div>
                <div className="svl-header-right">
                    <span className="small-body-text text-secondary">Booths Selected</span>
                    <h2 className="text-red m-0">{selectedIds.length}</h2>
                </div>
            </div>

            <div className="svl-main-container">
                <div className="svl-content-left">
                    <div className="svl-seats-instructions mb-4">
                        <h4 className="mb-2">Interactive Seat Map</h4>
                        <p className="regular-body-text text-secondary m-0">
                            Click on any available booth to select it. Booths are reference only for seats.
                        </p>
                    </div>

                    <div className="svl-map-canvas-container" ref={containerRef}>
                        <div className="svl-zoom-controls">
                            <button onClick={() => setZoom(z => Math.min(z + 0.1, fitScale * 4))} title="Zoom In">
                                <Icon icon="mdi:magnify-plus-outline" />
                            </button>
                            <button onClick={() => setZoom(z => Math.max(z - 0.1, fitScale * 0.3))} title="Zoom Out">
                                <Icon icon="mdi:magnify-minus-outline" />
                            </button>
                            <button onClick={() => {
                                setZoom(fitScale);
                                if (containerRef.current) {
                                    const { clientWidth, clientHeight } = containerRef.current;
                                    setStagePos({
                                        x: (clientWidth - canvasWidth * fitScale) / 2,
                                        y: (clientHeight - canvasHeight * fitScale) / 2,
                                    });
                                }
                            }} title="Reset View">
                                <Icon icon="mdi:fit-to-screen-outline" />
                            </button>
                        </div>

                        <Stage
                            width={containerSize.w}
                            height={containerSize.h}
                            ref={stageRef}
                            scaleX={zoom}
                            scaleY={zoom}
                            x={stagePos.x}
                            y={stagePos.y}
                            onMouseDown={(e) => {
                                if (e.target !== e.target.getStage()) return;
                                isPanningRef.current = true;
                                const pos = stageRef.current.getPointerPosition();
                                lastPointerRef.current = { x: pos.x, y: pos.y };
                                stageRef.current.container().style.cursor = 'grabbing';
                            }}
                            onMouseMove={() => {
                                if (!isPanningRef.current) return;
                                const stage = stageRef.current;
                                const pos = stage.getPointerPosition();
                                const dx = pos.x - lastPointerRef.current.x;
                                const dy = pos.y - lastPointerRef.current.y;
                                lastPointerRef.current = { x: pos.x, y: pos.y };
                                stage.x(stage.x() + dx);
                                stage.y(stage.y() + dy);
                                stage.batchDraw();
                            }}
                            onMouseUp={() => {
                                if (!isPanningRef.current) return;
                                isPanningRef.current = false;
                                stageRef.current.container().style.cursor = 'default';
                                setStagePos({ x: stageRef.current.x(), y: stageRef.current.y() });
                            }}
                            onMouseLeave={() => {
                                if (!isPanningRef.current) return;
                                isPanningRef.current = false;
                                stageRef.current.container().style.cursor = 'default';
                                setStagePos({ x: stageRef.current.x(), y: stageRef.current.y() });
                            }}
                            onTouchStart={(e) => {
                                if (e.evt.touches.length !== 1) return;
                                e.evt.preventDefault();
                                const touch = e.evt.touches[0];
                                isPanningRef.current = true;
                                lastPointerRef.current = { x: touch.clientX, y: touch.clientY };
                            }}
                            onTouchMove={(e) => {
                                if (!isPanningRef.current || e.evt.touches.length !== 1) return;
                                e.evt.preventDefault();
                                const touch = e.evt.touches[0];
                                const dx = touch.clientX - lastPointerRef.current.x;
                                const dy = touch.clientY - lastPointerRef.current.y;
                                lastPointerRef.current = { x: touch.clientX, y: touch.clientY };
                                const stage = stageRef.current;
                                stage.x(stage.x() + dx);
                                stage.y(stage.y() + dy);
                                stage.batchDraw();
                            }}
                            onTouchEnd={() => {
                                if (!isPanningRef.current) return;
                                isPanningRef.current = false;
                                setStagePos({ x: stageRef.current.x(), y: stageRef.current.y() });
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
                                setZoom(newScale);
                                setStagePos({
                                    x: pointer.x - mousePointTo.x * newScale,
                                    y: pointer.y - mousePointTo.y * newScale,
                                });
                            }}
                        >
                            {bgKonvaImage && bgWidth && bgHeight && (
                                <Layer>
                                    <KonvaImage
                                        image={bgKonvaImage}
                                        x={0} y={0}
                                        width={bgWidth}
                                        height={bgHeight}
                                        opacity={bgOpacity}
                                        listening={false}
                                    />
                                </Layer>
                            )}
                            <Layer>
                                {sortedItems.map((item, i) => (
                                    <React.Fragment key={item.id || i}>
                                        {item.imageUrl ? (
                                            <BackgroundImage item={item} onClick={() => {
                                                if (item.type === "booth" || item.isBooth) toggleSelection(item.id);
                                            }} />
                                        ) : (item.type === "seat" || item.type === "booth") ? (
                                            (() => {
                                                const isBooth = item.type === 'booth' || item.isBooth;
                                                const cat = priceLevels.find(c => c._id === item.categoryId);
                                                const { w: boothW, h: boothH } = isBooth
                                                    ? parseBoothSizePx(cat?.boothSize)
                                                    : { w: 40, h: 40 };
                                                return (
                                                    <Group
                                                        x={item.x}
                                                        y={item.y}
                                                        scaleX={item.scaleX || 1}
                                                        scaleY={item.scaleY || 1}
                                                        rotation={item.rotation || 0}
                                                        opacity={isBooth ? 1 : 0.35}
                                                        listening={isBooth ? true : false}
                                                        onMouseEnter={(e) => {
                                                            const stage = e.target.getStage();
                                                            if (item.status === 'available' || item.status === 'expired') {
                                                                stage.container().style.cursor = 'pointer';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.target.getStage().container().style.cursor = 'default';
                                                        }}
                                                        onClick={() => {
                                                            if (isBooth && (item.status === 'available' || item.status === 'expired')) toggleSelection(item.id);
                                                        }}
                                                        onTap={() => {
                                                            if (isBooth && (item.status === 'available' || item.status === 'expired')) toggleSelection(item.id);
                                                        }}
                                                    >
                                                        {isBooth ? (
                                                            <Rect
                                                                x={-boothW / 2}
                                                                y={-boothH / 2}
                                                                width={boothW}
                                                                height={boothH}
                                                                fill={selectedIds.includes(item.id) ? "#2563EB" : ((item.status === 'sold' || item.status === 'reserved') ? '#22c55e' : (cat?.color || "#e0e0e0"))}
                                                                stroke="#fff"
                                                                strokeWidth={1}
                                                                strokeScaleEnabled={false}
                                                                shadowBlur={selectedIds.includes(item.id) ? 10 : 0}
                                                                shadowColor="#000"
                                                                shadowOpacity={0.2}
                                                            />
                                                        ) : (
                                                            <Circle
                                                                radius={20}
                                                                fill={cat?.color || "#666666"}
                                                                stroke="#fff"
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
                                                            x={0} y={0}
                                                            offsetX={isBooth ? boothW / 2 : 20}
                                                            offsetY={isBooth ? boothH / 2 : 20}
                                                            width={isBooth ? boothW : 40}
                                                            height={isBooth ? boothH : 40}
                                                            shadowColor="black"
                                                            shadowBlur={2}
                                                            shadowOpacity={0.8}
                                                            shadowOffset={{ x: 1, y: 1 }}
                                                        />
                                                    </Group>
                                                );
                                            })()
                                        ) : (
                                            <BackgroundShape item={item} />
                                        )}
                                    </React.Fragment>
                                ))}
                            </Layer>
                        </Stage>
                    </div>

                    {/* Legend — mirrors cs-seat-legend exactly */}
                    <div className="svl-seat-legend">
                        <div className="svl-legend-item">
                            <span className="svl-legend-dot" style={{ backgroundColor: '#2563EB' }}></span>
                            <span className="smaller-body-text text-secondary">Selected</span>
                        </div>
                        <div className="svl-legend-item">
                            <span className="svl-legend-dot" style={{ backgroundColor: '#22c55e' }}></span>
                            <span className="smaller-body-text text-secondary">Sold / Occupied</span>
                        </div>
                        <div className="svl-legend-item">
                            <span className="svl-legend-dot" style={{ backgroundColor: '#666666' }}></span>
                            <span className="smaller-body-text text-secondary">Available</span>
                        </div>
                        <div className="svl-legend-item">
                            <span className="svl-legend-dot" style={{ backgroundColor: '#94a3b8', opacity: 0.4 }}></span>
                            <span className="smaller-body-text text-secondary">Seat (reference only)</span>
                        </div>
                    </div>
                </div>
                <div className="svl-content-right">
                    {/* Booth Categories Card — mirrors cs-categories-card */}
                    <div className="svl-categories-card mb-4">
                        <div className="svl-cat-card-header">
                            <h4 className="m-0">Booth Categories</h4>
                        </div>
                        <div className="svl-categories-list">
                            {priceLevels
                                .filter(cat => cat.type !== "Seat (Circle)" && cat.type !== "General Fee")
                                .map((cat) => {
                                    const isSeat = cat.type?.includes("Seat");
                                    const catType = cat.type || "Booth (Square)";

                                    return (
                                        <div
                                            key={cat._id || cat.id}
                                            className={`svl-cat-item ${isSeat ? 'svl-cat-disabled' : ''}`}
                                        >
                                            {/* Colored icon — circle for seats, square for booths */}
                                            <div
                                                className="svl-cat-palette-visual"
                                                style={{
                                                    backgroundColor: isSeat ? '#94a3b8' : (cat.color || '#666'),
                                                    borderRadius: isSeat ? '50%' : '10px'
                                                }}
                                            >
                                                <Icon
                                                    icon={isSeat ? "mdi:seat" : "mdi:storefront"}
                                                    color="white"
                                                    width="20"
                                                />
                                            </div>

                                            {/* Details */}
                                            <div className="svl-cat-details">
                                                <div className="svl-cat-top">
                                                    <span className="svl-cat-name">
                                                        {cat.priceName}
                                                    </span>
                                                    {isSeat ? (
                                                        <span className="svl-not-bookable-badge">Not bookable</span>
                                                    ) : (
                                                        <span className="svl-map-hint smaller-body-text text-secondary">Select on map</span>
                                                    )}
                                                </div>
                                                <div className="svl-cat-meta">
                                                    <span className={`svl-cat-price ${isSeat ? 'svl-cat-price-muted' : ''}`}>
                                                        ${(cat.facePrice || 0).toFixed(2)}
                                                    </span>
                                                    <span className="svl-cat-units">
                                                        {isSeat
                                                            ? 'Reference only'
                                                            : `${cat.quantityAvailable != null
                                                                ? cat.quantityAvailable - (cat.quantitySold || 0)
                                                                : '—'} available`
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>

                    {/* Order Summary Card — mirrors cs-order-summary-card */}
                    <div className="svl-summary-card">
                        <h4 className="mb-4">Selection Summary</h4>

                        <div className="svl-selected-list mb-4">
                            {selectedItemsData.length === 0 ? (
                                <p className="small-body-text text-secondary mb-3">No booths selected</p>
                            ) : (
                                selectedItemsData.map((item, idx) => (
                                    <div key={item.id || idx} className="svl-summary-row mb-2">
                                        <div style={{ textAlign: 'left' }}>
                                            <span className="small-body-text text-black d-block">
                                                {item.label || item.code || 'Booth'}
                                            </span>
                                            <span className="smaller-body-text text-secondary">
                                                {item.category?.priceName || 'Booth Category'}
                                            </span>
                                        </div>
                                        <span className="small-body-text text-black">
                                            ${(item.category?.facePrice || 0).toLocaleString()}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        <hr className="svl-divider mb-3" />

                        <div className="svl-summary-row mb-2">
                            <span className="small-body-text text-secondary">Subtotal</span>
                            <span className="small-body-text text-black">
                                ${selectedItemsData.reduce((acc, item) => acc + (item.category?.facePrice || 0), 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="svl-summary-row mb-3">
                            <span className="small-body-text text-secondary">Est. Fees & Taxes</span>
                            <span className="small-body-text text-black">At checkout</span>
                        </div>

                        <hr className="svl-divider mb-3" />

                        <div className="svl-summary-row mb-4">
                            <h4 className="m-0">Total</h4>
                            <h4 className="text-red m-0">
                                ${selectedItemsData.reduce((acc, item) => acc + (item.category?.facePrice || 0), 0).toLocaleString()}
                            </h4>
                        </div>

                        <button
                            className="primary-button svl-confirm-btn w-100 mb-3"
                            disabled={selectedItemsData.length === 0}
                            onClick={handleAddToCart}
                        >
                            Add {selectedItemsData.length} Booth{selectedItemsData.length !== 1 ? 's' : ''} to Cart
                        </button>

                        <button
                            className="outlined-button svl-continue-btn w-100 mb-3"
                            onClick={() => navigate('/sponsor/sponsor-events')}
                        >
                            Continue Browsing Events
                        </button>

                        <p className="smaller-body-text text-secondary text-center m-0">
                            Booths will be held for 10 minutes once added to cart
                        </p>
                    </div>
                </div>            </div>
        </div>
    );
};

export default SponsorVenueLayout;
