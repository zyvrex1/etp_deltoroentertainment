import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Circle, Text, Group, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { Icon } from '@iconify/react';
import { useNavigate, useParams } from 'react-router-dom';
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
    const { user } = useAuthContext();
    const { addToCart } = useCustomerCart();

    // State
    const [event, setEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [priceLevels, setPriceLevels] = useState([]);
    const [layoutItems, setLayoutItems] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState([]);

    // Canvas State
    const [zoom, setZoom] = useState(1);
    const [fitScale, setFitScale] = useState(1);
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [containerSize, setContainerSize] = useState({ w: 800, h: 500 });
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

    const subtotal = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
    const serviceFees = selectedSeats.length > 0 ? (selectedSeats.length * 10) : 0;
    const total = subtotal + serviceFees;

    const handleAddToCart = async () => {
        if (selectedSeats.length === 0) return;
        const result = await showAddToCartConfirmAlert(selectedSeats.length);
        if (result.isConfirmed) {
            addToCart(event, selectedSeats);
            showSuccessAlert('Added!', 'Ticket(s) added to your cart.');
            navigate('/customer/cart');
        }
    };

    const handleContinueBrowsing = () => navigate('/customer/browse-events');

    // Rendering Helpers
    const getSeatColor = (item) => {
        if (selectedSeats.find(s => s.id === item.id)) return "#2ECC71"; // Selected Green
        if (item.status === 'sold' || item.status === 'reserved' || item.status === 'blocked') return "#E0E0E0";
        const cat = priceLevels.find(c => c._id === item.categoryId);
        return cat?.color || "#666666";
    };

    if (isLoading) return <div className="cs-page-wrapper">Loading event layout...</div>;

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
                    <span className="small-body-text text-secondary">Tickets Selected</span>
                    <h2 className="text-red m-0">{selectedSeats.length}</h2>
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

                                    if (isSeat) {
                                        return (
                                            <Group
                                                key={item.id}
                                                x={item.x} y={item.y}
                                                rotation={item.rotation}
                                                onClick={() => toggleSeat(item)}
                                                onTap={() => toggleSeat(item)}
                                            >
                                                <Circle
                                                    radius={20}
                                                    fill={getSeatColor(item)}
                                                    stroke="#fff" strokeWidth={1}
                                                />
                                                <Text
                                                    text={item.label || ""}
                                                    fontSize={9} fill={item.status === 'available' ? "#fff" : "#888"}
                                                    align="center" verticalAlign="middle"
                                                    x={-20} y={-20} width={40} height={40}
                                                />
                                            </Group>
                                        );
                                    }

                                    if (isBooth) {
                                        return (
                                            <Group key={item.id} x={item.x} y={item.y} rotation={item.rotation} listening={false}>
                                                <Rect
                                                    width={50} height={50} x={-25} y={-25}
                                                    fill="#F5F5F5" stroke="#CCC" strokeWidth={1}
                                                    opacity={0.6}
                                                />
                                                <Text
                                                    text={item.code || "Booth"}
                                                    fontSize={10} fill="#AAA"
                                                    align="center" verticalAlign="middle"
                                                    x={-25} y={-25} width={50} height={50}
                                                />
                                            </Group>
                                        );
                                    }

                                    if (isElement) {
                                        return (
                                            <Group key={item.id} x={item.x} y={item.y} rotation={item.rotation} listening={false}>
                                                <Rect
                                                    width={item.width || 100} height={item.height || 40}
                                                    fill="#E8F1FF" stroke="#334155" strokeWidth={1}
                                                />
                                                <Text
                                                    text={item.label || ""}
                                                    fontSize={12} fill="#1E293B" fontStyle="bold"
                                                    align="center" verticalAlign="middle"
                                                    width={item.width || 100} height={item.height || 40}
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
                            <span className="cs-legend-dot" style={{ backgroundColor: '#2ECC71' }}></span>
                            <span className="smaller-body-text text-secondary">Selected</span>
                        </div>
                        <div className="cs-legend-item">
                            <span className="cs-legend-dot" style={{ backgroundColor: '#E0E0E0' }}></span>
                            <span className="smaller-body-text text-secondary">Occupied</span>
                        </div>
                        {/* {priceLevels.map(pl => (
                            <div className="cs-legend-item" key={pl._id}>
                                <span className="cs-legend-dot" style={{ backgroundColor: pl.color }}></span>
                                <span className="smaller-body-text text-secondary">{pl.priceName} (${pl.facePrice})</span>
                            </div>
                        ))} */}
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
};

export default CustomerSeats;
