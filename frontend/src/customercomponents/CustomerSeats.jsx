import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Circle, Text, Group, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { Icon } from '@iconify/react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';
import { useCustomerCart } from '../context/CustomerCartContext';
import eventsService from '../services/eventsService';
import { showAddToCartConfirmAlert, showSuccessAlert, showQuestionAlert } from '../utils/sweetAlert';
import './CustomerSeats.css';

const BackgroundImage = ({ imageUrl, opacity, width, height }) => {
    const [img] = useImage(imageUrl);
    if (!img) return null;
    return <KonvaImage image={img} x={0} y={0} width={width} height={height} opacity={opacity} listening={false} />;
};

const CustomerSeats = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthContext();
    const { addToCart } = useCustomerCart();

    const stateEvent = location.state?.event;

    // State
    const [event, setEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [priceLevels, setPriceLevels] = useState([]);
    const [layoutItems, setLayoutItems] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [ticketQuantities, setTicketQuantities] = useState({}); // { categoryId: quantity } for GA

    // Canvas State
    const [zoom, setZoom] = useState(1);
    const [fitScale, setFitScale] = useState(1);
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [containerSize, setContainerSize] = useState({ w: 100, h: 100 });
    const [canvasSize, setCanvasSize] = useState({ w: 1400, h: 900 });
    const [bgConfig, setBgConfig] = useState(null);

    const containerRef = useRef(null);
    const stageRef = useRef(null);
    const isPanningRef = useRef(false);
    const lastPointerRef = useRef({ x: 0, y: 0 });

    // Fetch Event Data
    useEffect(() => {
        const fetchEventData = async () => {
            setIsLoading(true);
            try {
                const data = await eventsService.getEvent(id, user?.token);
                setEvent(data);

                // Parse Price Levels
                if (data.priceLevels) {
                    setPriceLevels(data.priceLevels);
                }

                // Parse Layout Data
                if (data.layoutData) {
                    const ld = data.layoutData;
                    setCanvasSize({ w: ld.canvasWidth || 1400, h: ld.canvasHeight || 900 });

                    if (ld.backgroundImage) {
                        setBgConfig({
                            url: ld.backgroundImage,
                            opacity: ld.bgOpacity ?? 0.4,
                            w: ld.bgWidth || ld.canvasWidth,
                            h: ld.bgHeight || ld.canvasHeight
                        });
                    }

                    // Normalize Items
                    const items = (ld.items || []).map(item => ({
                        ...item,
                        id: item.id || item._id,
                        type: item.type?.toLowerCase() || "element",
                        status: item.status || "available"
                    }));
                    setLayoutItems(items);
                }
            } catch (error) {
                console.error("Error loading event layout:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchEventData();
    }, [id, user?.token]);

    // Handle Auto-Fit Canvas
    useEffect(() => {
        const handleResize = () => {
            if (!containerRef.current) return;
            const { clientWidth, clientHeight } = containerRef.current;
            setContainerSize({ w: clientWidth, h: clientHeight });

            const padding = 40;
            const scaleX = (clientWidth - padding) / canvasSize.w;
            const scaleY = (clientHeight - padding) / canvasSize.h;
            const fs = Math.min(scaleX, scaleY, 1);

            setFitScale(fs);
            setZoom(fs);
            setStagePos({
                x: (clientWidth - canvasSize.w * fs) / 2,
                y: (clientHeight - canvasSize.h * fs) / 2
            });
        };

        handleResize();
        const timer = setTimeout(handleResize, 100);
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timer);
        };
    }, [canvasSize, isLoading]);

    // Selection Logic
    const toggleSeat = (seat) => {
        if (seat.status !== 'available') return;

        const isSelected = selectedSeats.find(s => s.id === seat.id);
        if (isSelected) {
            setSelectedSeats(selectedSeats.filter(s => s.id !== seat.id));
        } else {
            if (selectedSeats.length >= 6) return;

            const category = priceLevels.find(pl => pl._id === seat.categoryId);
            setSelectedSeats([...selectedSeats, {
                ...seat,
                price: category?.facePrice || 0,
                categoryName: category?.priceName || "General"
            }]);
        }
    };

    const handleBack = () => navigate(-1);

    // Consolidated price calculation
    const getSelectedTicketsPrice = () => {
        const seatsPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
        const gaPrice = Object.entries(ticketQuantities).reduce((sum, [catId, qty]) => {
            const cat = priceLevels.find(pl => pl._id === catId || pl.id === catId);
            return sum + ((cat?.facePrice || 0) * qty);
        }, 0);
        return seatsPrice + gaPrice;
    };

    const getSelectedTicketsCount = () => {
        const gaCount = Object.values(ticketQuantities).reduce((a, b) => a + b, 0);
        return selectedSeats.length + gaCount;
    };

    const subtotal = getSelectedTicketsPrice();
    const totalCount = getSelectedTicketsCount();
    const serviceFees = totalCount > 0 ? (totalCount * 10) : 0;
    const total = subtotal + serviceFees;

    const updateGAQuantity = (categoryId, delta) => {
        setTicketQuantities(prev => {
            const current = prev[categoryId] || 0;
            const next = Math.max(0, current + delta);
            return { ...prev, [categoryId]: next };
        });
    };

    const handleAddToCart = async () => {
        const totalItemsCount = getSelectedTicketsCount();
        if (totalItemsCount === 0) return;

        const result = await showAddToCartConfirmAlert(totalItemsCount);
        if (result.isConfirmed) {
            const allSelectedItems = [...selectedSeats];

            // Add GA tickets from quantities
            Object.entries(ticketQuantities).forEach(([catId, qty]) => {
                const category = priceLevels.find(pl => pl._id === catId || pl.id === catId);
                for (let i = 0; i < qty; i++) {
                    allSelectedItems.push({
                        id: `GA-${catId}-${Date.now()}-${i}`,
                        label: `${category?.priceName || "General"} Ticket`,
                        categoryId: catId,
                        categoryName: category?.priceName || "General",
                        price: category?.facePrice || 0
                    });
                }
            });

            addToCart(event, allSelectedItems);
            showSuccessAlert('Added!', 'Ticket(s) added to your cart.');
            setSelectedSeats([]);
            setTicketQuantities({});
        }
    };

    const handleContinueBrowsing = () => navigate('/customer/browse-events');

    // Rendering Helpers — match Admin LayoutBuilder exactly
    const parseBoothSizePx = (boothSize) => {
        const UNIT = 4;
        if (!boothSize || typeof boothSize !== 'string') return { w: 40, h: 40 };
        const parts = boothSize.toLowerCase().split('x');
        if (parts.length !== 2) return { w: 40, h: 40 };
        const wUnits = parseInt(parts[0], 10);
        const hUnits = parseInt(parts[1], 10);
        if (isNaN(wUnits) || isNaN(hUnits) || wUnits <= 0 || hUnits <= 0) return { w: 40, h: 40 };
        return {
            w: Math.max(20, wUnits * UNIT),
            h: Math.max(20, hUnits * UNIT),
        };
    };

    const getSeatColor = (item) => {
        if (selectedSeats.find(s => s.id === item.id)) return "#2563EB"; // Selected Blue
        if (item.status === 'sold' || item.status === 'reserved' || item.status === 'blocked') return "#22c55e"; // Occupied Green (matches Admin)
        const cat = priceLevels.find(c => c._id === item.categoryId);
        return cat?.color || "#666666";
    };

    const displayEvent = event || stateEvent;

    if (isLoading) {
        return (
            <div className="cs-page-wrapper">
                <div className="cs-header-card">
                    <div className="cs-header-left">
                        <button className="cs-back-btn" disabled>
                            <Icon icon="mdi:arrow-left" width="24" />
                        </button>
                        <div>
                            {displayEvent ? (
                                <>
                                    <h2 className="text-black mb-1">{displayEvent.title}</h2>
                                    <span className="small-body-text text-secondary">
                                        {new Date(displayEvent.startDate).toLocaleDateString()} • {displayEvent.startTime || "TBA"} • {displayEvent.venue?.name || "TBA"}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <div className="cs-skeleton-box mb-1" style={{ width: '250px', height: '32px' }}></div>
                                    <div className="cs-skeleton-box" style={{ width: '300px', height: '16px' }}></div>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="cs-header-right">
                        <span className="small-body-text text-secondary">Seats Selected</span>
                        <h2 className="text-red m-0">{selectedSeats.length}</h2>
                    </div>
                </div>

                <div className="cs-main-container">
                    <div className="cs-content-left">
                        <div className="cs-seats-instructions mb-4">
                            <div className="cs-skeleton-box mb-2" style={{ width: '200px', height: '24px' }}></div>
                            <div className="cs-skeleton-box m-0" style={{ width: '350px', height: '16px' }}></div>
                        </div>

                        <div className="cs-map-canvas-container" style={{ position: 'relative' }}>
                            <div className="cs-zoom-controls">
                                <button disabled title="Zoom In">
                                    <Icon icon="mdi:magnify-plus-outline" />
                                </button>
                                <button disabled title="Zoom Out">
                                    <Icon icon="mdi:magnify-minus-outline" />
                                </button>
                                <button disabled title="Reset View">
                                    <Icon icon="mdi:fit-to-screen-outline" />
                                </button>
                            </div>

                            <div className="cs-skeleton-box" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}></div>
                        </div>

                        <div className="cs-seat-legend">
                            <div className="cs-legend-item">
                                <span className="cs-legend-dot" style={{ backgroundColor: '#E2E8F0' }}></span>
                                <div className="cs-skeleton-box" style={{ width: '60px', height: '16px' }}></div>
                            </div>
                            <div className="cs-legend-item">
                                <span className="cs-legend-dot" style={{ backgroundColor: '#E2E8F0' }}></span>
                                <div className="cs-skeleton-box" style={{ width: '100px', height: '16px' }}></div>
                            </div>
                            <div className="cs-legend-item">
                                <span className="cs-legend-dot" style={{ backgroundColor: '#E2E8F0' }}></span>
                                <div className="cs-skeleton-box" style={{ width: '60px', height: '16px' }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="cs-content-right">
                        <div className="cs-order-summary-card">
                            <h4 className="mb-4 text-black">Order Summary</h4>

                            <div className="cs-selected-list mb-4">
                                {selectedSeats.length === 0 ? (
                                    <p className="small-body-text text-secondary mb-3">No seats selected</p>
                                ) : (
                                    selectedSeats.map((seat, index) => (
                                        <div key={index} className="cs-summary-row mb-2">
                                            <div style={{ textAlign: 'left' }}>
                                                <span className="small-body-text text-black d-block">{seat.label}</span>
                                                <span className="smaller-body-text text-secondary">{seat.categoryName}</span>
                                            </div>
                                            <span className="small-body-text text-black">${seat.price.toFixed(2)}</span>
                                        </div>
                                    ))
                                )}
                            </div>

                            <hr className="cs-divider mb-3" />

                            <div className="cs-summary-row mb-2">
                                <span className="small-body-text text-secondary">Subtotal</span>
                                <span className="small-body-text text-black">${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="cs-summary-row mb-3">
                                <span className="small-body-text text-secondary">Service Fees</span>
                                <span className="small-body-text text-black">${serviceFees.toFixed(2)}</span>
                            </div>

                            <hr className="cs-divider mb-3" />

                            <div className="cs-summary-row mb-4">
                                <h4 className="m-0 text-black">Total</h4>
                                <h4 className="text-red m-0">${total.toFixed(2)}</h4>
                            </div>

                            <button
                                className="primary-button cs-submit-btn w-100 mb-3"
                                disabled={selectedSeats.length === 0}
                                onClick={handleAddToCart}
                            >
                                Add {selectedSeats.length} Tickets to Cart
                            </button>

                            <button
                                className="outlined-button cs-continue-btn w-100 mb-3"
                                onClick={handleContinueBrowsing}
                            >
                                Continue Browsing events
                            </button>

                            <p className="smaller-body-text text-secondary text-center m-0">
                                Seats will be held for 10 minutes once added to cart
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="cs-page-wrapper">
                <h3>Event not found</h3>
                <button onClick={() => navigate('/customer/browse-events')}>Back to Browse</button>
            </div>
        );
    }

    return (
        <div className="cs-page-wrapper">
            <div className="cs-header-card">
                <div className="cs-header-left">
                    <button className="cs-back-btn" onClick={handleBack}>
                        <Icon icon="mdi:arrow-left" width="24" />
                    </button>
                    <div>
                        <h2 className="text-black mb-1">{event.title}</h2>
                        <span className="small-body-text text-secondary">
                            {new Date(event.startDate).toLocaleDateString()} • {event.startTime} • {event.venue?.name}
                        </span>
                    </div>
                </div>
                <div className="cs-header-right">
                    <span className="small-body-text text-secondary">Seats Selected</span>
                    <h2 className="text-red m-0">{getSelectedTicketsCount()}</h2>
                </div>
            </div>

            <div className="cs-main-container">
                <div className="cs-content-left">
                    <div className="cs-seats-instructions mb-4">
                        <h4 className="mb-2 text-black">Interactive Seat Map</h4>
                        <p className="regular-body-text text-secondary m-0">
                            Select your preferred seats from the map below. Booths are reference only.
                        </p>
                    </div>

                    <div className="cs-map-canvas-container" ref={containerRef}>
                        <div className="cs-zoom-controls">
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
                                        x: (clientWidth - canvasSize.w * fitScale) / 2,
                                        y: (clientHeight - canvasSize.h * fitScale) / 2,
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
                                isPanningRef.current = false;
                                setStagePos({ x: stageRef.current.x(), y: stageRef.current.y() });
                            }}
                            onMouseLeave={() => {
                                isPanningRef.current = false;
                                setStagePos({ x: stageRef.current.x(), y: stageRef.current.y() });
                            }}
                            onTouchStart={(e) => {
                                if (e.evt.touches.length !== 1) return;
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
                            {bgConfig && (
                                <Layer>
                                    <BackgroundImage {...bgConfig} />
                                </Layer>
                            )}
                            <Layer>
                                {layoutItems.map((item) => {
                                    const isSeat = item.type === "seat";
                                    const isBooth = item.type === "booth";
                                    const isElement = item.type === "element";
                                    const isSelected = !!selectedSeats.find(s => s.id === item.id);
                                    const category = priceLevels.find(c => c._id === item.categoryId || c.id === item.categoryId);

                                    // Dynamic booth size — identical to Admin parseBoothSizePx
                                    const { w: boothW, h: boothH } = isBooth
                                        ? parseBoothSizePx(category?.boothSize)
                                        : { w: 40, h: 40 };

                                    if (isSeat) {
                                        return (
                                            <Group
                                                key={item.id}
                                                x={item.x} y={item.y}
                                                scaleX={item.scaleX || 1}
                                                scaleY={item.scaleY || 1}
                                                rotation={item.rotation || 0}
                                                onClick={() => toggleSeat(item)}
                                                onTap={() => toggleSeat(item)}
                                                onMouseEnter={(e) => {
                                                    const stage = e.target.getStage();
                                                    if (item.status === 'available') stage.container().style.cursor = 'pointer';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.getStage().container().style.cursor = 'default';
                                                }}
                                            >
                                                <Circle
                                                    radius={20}
                                                    fill={getSeatColor(item)}
                                                    stroke="#fff"
                                                    strokeWidth={1}
                                                    shadowBlur={isSelected ? 10 : 0}
                                                    shadowColor="#000"
                                                    shadowOpacity={0.2}
                                                />
                                                <Text
                                                    text={item.label || ""}
                                                    fontSize={9}
                                                    fontStyle="bold"
                                                    fill="white"
                                                    align="center"
                                                    verticalAlign="middle"
                                                    x={0} y={0}
                                                    offsetX={20} offsetY={20}
                                                    width={40} height={40}
                                                    shadowColor="black"
                                                    shadowBlur={2}
                                                    shadowOpacity={0.8}
                                                    shadowOffset={{ x: 1, y: 1 }}
                                                />
                                            </Group>
                                        );
                                    }

                                    if (isBooth) {
                                        return (
                                            <Group
                                                key={item.id}
                                                x={item.x} y={item.y}
                                                scaleX={item.scaleX || 1}
                                                scaleY={item.scaleY || 1}
                                                rotation={item.rotation || 0}
                                                listening={false}
                                                opacity={0.4}  // ← add this: makes the whole booth look dimmed/disabled
                                            >
                                                <Rect
                                                    x={-boothW / 2}
                                                    y={-boothH / 2}
                                                    width={boothW}
                                                    height={boothH}
                                                    fill={category?.color || '#94a3b8'}  // ← muted fallback color
                                                    stroke="#94a3b8"                      // ← gray stroke instead of black
                                                    strokeWidth={1}
                                                    strokeScaleEnabled={false}
                                                />
                                                <Text
                                                    text={item.label || item.code || ""}
                                                    fontSize={Math.max(8, Math.min(boothW, boothH) / 5)}
                                                    fontStyle="bold"
                                                    fill="white"
                                                    align="center"
                                                    verticalAlign="middle"
                                                    x={0} y={0}
                                                    offsetX={boothW / 2}
                                                    offsetY={boothH / 2}
                                                    width={boothW}
                                                    height={boothH}
                                                />
                                            </Group>
                                        );
                                    }
                                    if (isElement) {
                                        return (
                                            <Group key={item.id} x={item.x} y={item.y} rotation={item.rotation || 0} listening={false}>
                                                <Rect
                                                    width={item.width || 100}
                                                    height={item.height || 40}
                                                    fill="#E8F1FF"
                                                    stroke="#334155"
                                                    strokeWidth={1}
                                                />
                                                <Text
                                                    text={item.label || ""}
                                                    fontSize={12}
                                                    fontStyle="bold"
                                                    fill="#1E293B"
                                                    align="center"
                                                    verticalAlign="middle"
                                                    width={item.width || 100}
                                                    height={item.height || 40}
                                                />
                                            </Group>
                                        );
                                    }
                                    return null;
                                })}
                            </Layer>
                        </Stage>
                    </div>

                    <div className="cs-seat-legend">
                        <div className="cs-legend-item">
                            <span className="cs-legend-dot" style={{ backgroundColor: '#2563EB' }}></span>
                            <span className="smaller-body-text text-secondary">Selected</span>
                        </div>
                        <div className="cs-legend-item">
                            <span className="cs-legend-dot" style={{ backgroundColor: '#22c55e' }}></span>
                            <span className="smaller-body-text text-secondary">Sold / Occupied</span>
                        </div>
                        <div className="cs-legend-item">
                            <span className="cs-legend-dot" style={{ backgroundColor: '#666666' }}></span>
                            <span className="smaller-body-text text-secondary">Available</span>
                        </div>
                        {/* Add this */}
                        <div className="cs-legend-item">
                            <span className="cs-legend-dot" style={{ backgroundColor: '#94a3b8', opacity: 0.4 }}></span>
                            <span className="smaller-body-text text-secondary">Booth (reference only)</span>
                        </div>
                    </div>
                </div>

                <div className="cs-content-right">
                    {/* Ticket Categories List - same design as Admin/Promoter */}
                    <div className="cs-categories-card mb-4">
                        <div className="cs-cat-card-header mb-4">
                            <h4 className="m-0 text-black">Ticket Categories</h4>
                        </div>
                        <div className="cs-categories-list">
                            {priceLevels.map((cat) => {
                                const isGA = event.eventType === "General Admission";
                                const isGeneralFee = cat.type === "General Fee";
                                const isDirectQty = isGA || isGeneralFee;
                                const qty = ticketQuantities[cat._id || cat.id] || 0;
                                const catType = cat.type || "Seat (Circle)";

                                return (
                                    <div
                                        key={cat._id || cat.id}
                                        className={`cs-sidebar-cat-item mb-2 ${catType === "Booth (Square)" ? "cs-cat-disabled" : ""}`}
                                        style={catType === "Booth (Square)" ? { opacity: 0.5, pointerEvents: 'none' } : {}}
                                    >
                                        {/* Coloured icon */}
                                        <div
                                            className="cs-cat-palette-visual"
                                            style={{ backgroundColor: catType === "Booth (Square)" ? '#94a3b8' : (cat.color || '#666') }}
                                        >
                                            {catType === "General Fee" ? (
                                                <Icon icon="mdi:ticket-confirmation-outline" />
                                            ) : catType.includes("Seat") ? (
                                                <Icon icon="mdi:circle" />
                                            ) : (
                                                <Icon icon="mdi:square" />
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="cs-cat-details">
                                            <div className="cs-cat-top">
                                                <span className="cs-cat-name">
                                                    {cat.priceName === 'General Fee' ? 'Entrance Fee' : cat.priceName}
                                                </span>
                                                {catType === "Booth (Square)" ? (
                                                    // ← Replaces "Select on map" for booths
                                                    <span
                                                        className="smaller-body-text"
                                                        style={{
                                                            color: '#ef4444',
                                                            backgroundColor: '#fef2f2',
                                                            border: '1px solid #fecaca',
                                                            borderRadius: '4px',
                                                            padding: '1px 6px',
                                                            fontWeight: 600,
                                                            fontSize: '10px'
                                                        }}
                                                    >
                                                        Not bookable
                                                    </span>
                                                ) : !isDirectQty ? (
                                                    <span className="cs-map-hint smaller-body-text text-secondary">Select on map</span>
                                                ) : null}
                                            </div>

                                            {/* Price + availability meta */}
                                            <div className="cs-cat-meta">
                                                <span className="cs-cat-price" style={catType === "Booth (Square)" ? { color: '#94a3b8' } : {}}>
                                                    ${(cat.facePrice || 0).toFixed(2)}
                                                </span>
                                                <span className="cs-cat-units">
                                                    {catType === "Booth (Square)"
                                                        ? "Reference only"
                                                        : cat.quantityAvailable != null
                                                            ? (cat.quantityAvailable - (cat.quantitySold || 0)) - qty
                                                            : cat.quantity != null
                                                                ? (cat.quantity - (cat.quantitySold || 0)) - qty
                                                                : '—'} {catType !== "Booth (Square)" && "available"}
                                                </span>
                                            </div>

                                            {/* Progress bar — hidden for booths */}
                                            {isDirectQty && cat.quantityAvailable > 0 && catType !== "Booth (Square)" && (
                                                <div className="cs-progress-bar">
                                                    <div
                                                        className="cs-progress-fill"
                                                        style={{
                                                            width: `${Math.min((qty / (Math.max(1, cat.quantityAvailable - (cat.quantitySold || 0)))) * 100, 100)}%`,
                                                            backgroundColor: cat.color || '#666'
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            {/* Stepper — hidden for booths */}
                                            {isDirectQty && catType !== "Booth (Square)" && (
                                                <div className="cs-quantity-selector" style={{ marginTop: '12px' }}>
                                                    <button
                                                        className="cs-qty-btn"
                                                        onClick={() => updateGAQuantity(cat._id || cat.id, -1)}
                                                        disabled={qty === 0}
                                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    >
                                                        <Icon icon="mdi:minus" width="20" height="20" />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        className="cs-qty-input"
                                                        value={qty}
                                                        min="0"
                                                        max={cat.quantityAvailable != null ? Math.max(0, cat.quantityAvailable - (cat.quantitySold || 0)) : 9999}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value) || 0;
                                                            const maxAvailable = cat.quantityAvailable != null ? Math.max(0, cat.quantityAvailable - (cat.quantitySold || 0)) : 9999;
                                                            const clamped = Math.max(0, Math.min(val, maxAvailable));
                                                            setTicketQuantities(prev => ({
                                                                ...prev,
                                                                [cat._id || cat.id]: clamped
                                                            }));
                                                        }}
                                                        style={{ flex: 1 }}
                                                    />
                                                    <button
                                                        className="cs-qty-btn"
                                                        onClick={() => updateGAQuantity(cat._id || cat.id, 1)}
                                                        disabled={cat.quantityAvailable != null && qty >= Math.max(0, cat.quantityAvailable - (cat.quantitySold || 0))}
                                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    >
                                                        <Icon icon="mdi:plus" width="20" height="20" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="cs-order-summary-card">
                        <h4 className="mb-4 text-black">Order Summary</h4>

                        <div className="cs-selected-list mb-4">
                            {getSelectedTicketsCount() === 0 ? (
                                <p className="small-body-text text-secondary mb-3">No Seats Selected</p>
                            ) : (
                                <>
                                    {/* Physical Seats */}
                                    {selectedSeats.map((seat, index) => (
                                        <div key={`seat-${index}`} className="cs-summary-row mb-2">
                                            <div style={{ textAlign: 'left' }}>
                                                <span className="small-body-text text-black d-block">{seat.label}</span>
                                                <span className="smaller-body-text text-secondary">{seat.categoryName}</span>
                                            </div>
                                            <span className="small-body-text text-black">${seat.price.toFixed(2)}</span>
                                        </div>
                                    ))}

                                    {/* GA / General Fee Tickets */}
                                    {Object.entries(ticketQuantities).map(([catId, qty]) => {
                                        if (qty === 0) return null;
                                        const cat = priceLevels.find(pl => pl._id === catId || pl.id === catId);
                                        return (
                                            <div key={`ga-${catId}`} className="cs-summary-row mb-2">
                                                <div style={{ textAlign: 'left' }}>
                                                    <span className="small-body-text text-black d-block">{cat?.priceName} x {qty}</span>
                                                    <span className="smaller-body-text text-secondary">
                                                        {cat?.type === "General Fee" ? "General Fee" : "General Admission"}
                                                    </span>
                                                </div>
                                                <span className="small-body-text text-black">${((cat?.facePrice || 0) * qty).toFixed(2)}</span>
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </div>

                        <hr className="cs-divider mb-3" />

                        <div className="cs-summary-row mb-2">
                            <span className="small-body-text text-secondary">Subtotal</span>
                            <span className="small-body-text text-black">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="cs-summary-row mb-3">
                            <span className="small-body-text text-secondary">Service Fees</span>
                            <span className="small-body-text text-black">${serviceFees.toFixed(2)}</span>
                        </div>

                        <hr className="cs-divider mb-3" />

                        <div className="cs-summary-row mb-4">
                            <h4 className="m-0 text-black">Total</h4>
                            <h4 className="text-red m-0">${total.toFixed(2)}</h4>
                        </div>

                        <button
                            className="primary-button cs-submit-btn w-100 mb-3"
                            disabled={getSelectedTicketsCount() === 0}
                            onClick={handleAddToCart}
                        >
                            Add {getSelectedTicketsCount()} Tickets to Cart
                        </button>

                        <button
                            className="outlined-button cs-continue-btn w-100 mb-3"
                            onClick={handleContinueBrowsing}
                        >
                            Continue Browsing events
                        </button>

                        <p className="smaller-body-text text-secondary text-center m-0">
                            Seats will be held for 10 minutes once added to cart
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerSeats;
