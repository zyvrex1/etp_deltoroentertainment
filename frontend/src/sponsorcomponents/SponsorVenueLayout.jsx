import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { useNavigate, useParams } from 'react-router-dom';
import { Stage, Layer, Rect, Circle, Text, Group, Line, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { useAuthContext } from '../hooks/useAuthContext';
import { useSponsorCartContext } from '../context/SponsorCartContext';
import { showSuccessAlert } from '../utils/sweetAlert';
import eventsService from '../services/eventsService';
import './SponsorVenueLayout.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const BackgroundImage = ({ item, onClick }) => {
    const [img] = useImage(item.imageUrl?.startsWith('http') ? item.imageUrl : `${BACKEND_URL}/uploads/${item.imageUrl}`);
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
    const [containerSize, setContainerSize] = useState({ w: 1000, h: 600 });

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
            <div className="svl-header-top">
                <div className="svl-header-content">
                    <div className="svl-header-left">
                        <button className="svl-back-btn" onClick={() => navigate(-1)}>
                            <Icon icon="mdi:arrow-left" />
                        </button>
                        <div>
                            <h2 className="text-primary">Select Your Booth</h2>
                            <div className="svl-subtitle mt-1">
                                <span className="small-body-text text-secondary">{event?.title}</span>
                                <span className="svl-dot mx-2 text-secondary">•</span>
                                <div className="calendar-row">
                                    <Icon icon="mdi:calendar-blank-outline" className="text-secondary" />
                                    <span className="small-body-text text-secondary">
                                        {new Date(event?.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="svl-header-right">
                        <div className="svl-step-info">
                            <span className="small-body-text font-bold text-primary mr-4">Booth Selection</span>
                            <div className="svl-step-progress">
                                <span className="smaller-body-text text-secondary mb-1 block text-right">Step 1 of 4</span>
                                <div className="svl-progress-bar-container">
                                    <div className="svl-progress-bar" style={{ width: '25%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="svl-main-container">
                <div className="svl-content-left">
                    <div className="svl-info-box mb-4">
                        <Icon icon="mdi:information-outline" className="text-blue" />
                        <span className="small-body-text text-primary">
                            Click on any <span className="font-bold">available</span> booth to select it. Drag to pan and use controls to zoom.
                        </span>
                    </div>

                    <div className="svl-map-container" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
                        <div className="svl-zoom-controls" style={{ zIndex: 10 }}>
                            <button onClick={() => setZoom(z => Math.min(z + 0.1, fitScale * 4))} title="Zoom In"><Icon icon="mdi:magnify-plus-outline" /></button>
                            <button onClick={() => setZoom(z => Math.max(z - 0.1, fitScale * 0.3))} title="Zoom Out"><Icon icon="mdi:magnify-minus-outline" /></button>
                            <button onClick={() => {
                                setZoom(fitScale);
                                if (containerRef.current) {
                                    const { clientWidth, clientHeight } = containerRef.current;
                                    setStagePos({
                                        x: (clientWidth - canvasWidth * fitScale) / 2,
                                        y: (clientHeight - canvasHeight * fitScale) / 2,
                                    });
                                }
                            }} title="Reset View"><Icon icon="mdi:fit-to-screen-outline" /></button>
                        </div>

                        <div className="svl-map-wrapper" ref={containerRef} style={{ height: '100%', overflow: 'hidden', touchAction: 'none' }}>
                            <Stage
                                width={containerSize.w}
                                height={containerSize.h}
                                ref={stageRef}
                                scaleX={zoom}
                                scaleY={zoom}
                                x={stagePos.x}
                                y={stagePos.y}
                                onMouseDown={(e) => {
                                    // Only pan on empty canvas background, not on items
                                    if (e.target !== e.target.getStage()) return;
                                    isPanningRef.current = true;
                                    const pos = stageRef.current.getPointerPosition();
                                    lastPointerRef.current = { x: pos.x, y: pos.y };
                                    stageRef.current.container().style.cursor = 'grabbing';
                                    // Removed setSelectedId(null) to allow panning without clearing selection
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
                                    // Single-finger pan only
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
                                {/* Background image from layoutData */}
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
                                                            onClick={() => {
                                                                if (item.status === 'available') toggleSelection(item.id);
                                                            }}
                                                            onTap={() => {
                                                                if (item.status === 'available') toggleSelection(item.id);
                                                            }}
                                                        >
                                                            {isBooth ? (
                                                                <Rect
                                                                    x={-boothW / 2}
                                                                    y={-boothH / 2}
                                                                    width={boothW}
                                                                    height={boothH}
                                                                    fill={selectedIds.includes(item.id) ? "#3b82f6" : (item.status === 'sold' || item.status === 'reserved' ? '#22c55e' : (cat?.color || "#e0e0e0"))}
                                                                    stroke="white"
                                                                    strokeWidth={selectedIds.includes(item.id) ? 2 : 1}
                                                                    cornerRadius={4}
                                                                />
                                                            ) : (
                                                                <Circle
                                                                    radius={20}
                                                                    fill={selectedIds.includes(item.id) ? "#3b82f6" : (item.status === 'sold' || item.status === 'reserved' ? '#22c55e' : (cat?.color || "#666666"))}
                                                                    stroke="white"
                                                                    strokeWidth={selectedIds.includes(item.id) ? 2 : 1}
                                                                    opacity={1}
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

                        <div className="svl-legend">
                            <div className="svl-legend-item"><span className="svl-dot-icon gray" style={{ backgroundColor: '#e0e0e0' }}></span>Available</div>
                            <div className="svl-legend-item"><span className="svl-dot-icon green" style={{ backgroundColor: '#22c55e' }}></span>Sold</div>
                            <div className="svl-legend-item"><span className="svl-dot-icon blue" style={{ backgroundColor: '#3b82f6' }}></span>Selected</div>
                        </div>
                    </div>
                </div>

                <div className="svl-content-right">
                    <div className="svl-summary-card">
                        <h4 className="text-primary mb-4 block">Selection Summary</h4>

                        {selectedItemsData.length > 0 ? (
                            <>
                                <div className="svl-summary-header">
                                    <span className="blue-pill button-label">{selectedItemsData.length} Selected</span>
                                    <h4 className="text-red">
                                        ${selectedItemsData.reduce((acc, item) => acc + (item.category?.facePrice || 0), 0).toLocaleString()}
                                    </h4>
                                </div>

                                <div className="svl-selected-items-list" style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '16px' }}>
                                    {selectedItemsData.map((item, idx) => (
                                        <div key={item.id || idx} className="svl-booth-item-row" style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                                            <div className="svl-booth-title">
                                                <h5 className="text-primary m-0">{item.label || item.code || 'Booth'}</h5>
                                                <p className="smaller-body-text text-secondary">{item.category?.priceName || 'Booth Category'}</p>
                                            </div>
                                            <div style={{ textAlign: 'right', color: 'var(--color-black-primary)' }}>
                                                <span className="small-body-text font-bold">${(item.category?.facePrice || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <hr className="svl-divider" />

                                <div className="svl-dim-row">
                                    <span className="smaller-body-text text-secondary">Total Subtotal</span>
                                    <span className="smaller-body-text text-secondary font-bold">
                                        ${selectedItemsData.reduce((acc, item) => acc + (item.category?.facePrice || 0), 0).toLocaleString()}
                                    </span>
                                </div>

                                <div className="svl-features">
                                    <span className="smaller-body-text font-bold text-secondary">ESTIMATED FEES & TAXES</span>
                                    <p className="smaller-body-text text-secondary">Processing fees and taxes will be calculated at checkout.</p>
                                </div>

                                <button className="primary-button svl-confirm-btn" onClick={handleAddToCart}>
                                    Add {selectedItemsData.length} to Cart
                                </button>
                            </>
                        ) : (
                            <div className="text-center py-5">
                                <Icon icon="mdi:cursor-default-click-outline" width="48" className="text-secondary opacity-20 mb-3" />
                                <p className="small-body-text text-secondary">Select one or more booths on the map to see details and pricing</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SponsorVenueLayout;
