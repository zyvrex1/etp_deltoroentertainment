import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { useNavigate, useParams } from 'react-router-dom';
import { Stage, Layer, Rect, Circle, Text, Group, Line, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { useAuthContext } from '../hooks/useAuthContext';
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

    const [event, setEvent] = useState(null);
    const [localItems, setLocalItems] = useState([]);
    const [priceLevels, setPriceLevels] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [zoom, setZoom] = useState(0.8);
    const [isLoading, setIsLoading] = useState(true);
    const stageRef = useRef(null);
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight || 600
                });
            }
        };

        window.addEventListener('resize', updateDimensions);
        updateDimensions();
        // Trigger again after a small delay to ensure container has rendered
        setTimeout(updateDimensions, 100);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    const CANVAS_WIDTH = 1400;
    const CANVAS_HEIGHT = 800;

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

    const handleConfirm = () => {
        if (!selectedId) return;
        // Navigate to confirmation with state
        const selectedItem = localItems.find(i => i.id === selectedId);
        const category = priceLevels.find(pl => pl._id === selectedItem?.categoryId);
        navigate('/sponsor/sponsor-confirm-selection', {
            state: {
                event,
                booth: selectedItem,
                category
            }
        });
    };

    const selectedItemData = useMemo(() => {
        const item = localItems.find(i => i.id === selectedId);
        if (!item) return null;
        const cat = priceLevels.find(pl => pl._id === item.categoryId);
        return { ...item, category: cat };
    }, [selectedId, localItems, priceLevels]);

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

                    <div className="svl-map-container" ref={containerRef} style={{ padding: 0, overflow: 'hidden' }}>
                        <div className="svl-zoom-controls" style={{ zIndex: 10 }}>
                            <button onClick={() => setZoom(z => Math.min(z + 0.1, 2))} title="Zoom In"><Icon icon="mdi:magnify-plus-outline" /></button>
                            <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))} title="Zoom Out"><Icon icon="mdi:magnify-minus-outline" /></button>
                            <button onClick={() => setZoom(0.8)} title="Reset View"><Icon icon="mdi:refresh" /></button>
                        </div>

                        <div className="svl-map-wrapper" style={{ height: '100%', overflow: 'hidden' }}>
                            <Stage
                                width={dimensions.width}
                                height={dimensions.height}
                                ref={stageRef}
                                scaleX={zoom}
                                scaleY={zoom}
                                draggable
                            >
                                <Layer>
                                    {sortedItems.map((item, i) => (
                                        <React.Fragment key={item.id || i}>
                                            {item.imageUrl ? (
                                                <BackgroundImage item={item} onClick={() => {
                                                    if (item.type === "booth" || item.isBooth) setSelectedId(item.id);
                                                }} />
                                            ) : (item.type === "seat" || item.type === "booth") ? (
                                                <Group
                                                    x={item.x}
                                                    y={item.y}
                                                    scaleX={item.scaleX || 1}
                                                    scaleY={item.scaleY || 1}
                                                    rotation={item.rotation || 0}
                                                    onClick={() => {
                                                        // Only allow booths to be selected
                                                        if (item.status === 'available' && (item.type === 'booth' || item.isBooth)) {
                                                            setSelectedId(item.id);
                                                        }
                                                    }}
                                                >
                                                    {item.type === "booth" ? (
                                                        <Rect
                                                            x={-20}
                                                            y={-20}
                                                            width={40}
                                                            height={40}
                                                            fill={selectedId === item.id ? "#3b82f6" : (item.status === 'sold' || item.status === 'reserved' ? '#22c55e' : (item.status !== 'available' ? '#ef4444' : (priceLevels.find(c => c._id === item.categoryId)?.color || "#e0e0e0")))}
                                                            stroke="white"
                                                            strokeWidth={selectedId === item.id ? 2 : 1}
                                                            cornerRadius={4}
                                                        />
                                                    ) : (
                                                        <Circle
                                                            radius={20}
                                                            fill={priceLevels.find(c => c._id === item.categoryId)?.color || "#666666"}
                                                            stroke="white"
                                                            strokeWidth={1}
                                                            opacity={0.3} // Visual cue that seats are not for sponsors
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

                        {selectedItemData ? (
                            <>
                                <div className="svl-summary-header">
                                    <span className="blue-pill button-label">Selected</span>
                                    <h4 className="text-red">${(selectedItemData.category?.facePrice || 0).toLocaleString()}</h4>
                                </div>

                                <div className="svl-booth-title">
                                    <h3 className="text-primary">{selectedItemData.label || 'Booth'}</h3>
                                    <p className="smaller-body-text text-secondary mt-1">{selectedItemData.category?.priceName || 'Booth Category'}</p>
                                </div>

                                <hr className="svl-divider" />

                                <div className="svl-dim-row">
                                    <span className="smaller-body-text text-secondary">Dimensions</span>
                                    <span className="smaller-body-text text-secondary font-bold">{selectedItemData.category?.boothSize || selectedItemData.boothSize || 'Standard'}</span>
                                </div>

                                <div className="svl-features">
                                    <span className="smaller-body-text font-bold text-secondary">KEY FEATURES</span>
                                    <ul className="svl-feature-list">
                                        <li><span className="svl-dot-icon small-green small"></span><span className="smaller-body-text text-secondary">Premium Location</span></li>
                                        <li><span className="svl-dot-icon small-green small"></span><span className="smaller-body-text text-secondary">Electricity Access</span></li>
                                    </ul>
                                </div>

                                <button className="primary-button svl-confirm-btn" onClick={handleConfirm}>
                                    Confirm Selection
                                </button>
                            </>
                        ) : (
                            <div className="text-center py-5">
                                <Icon icon="mdi:cursor-default-click-outline" width="48" className="text-secondary opacity-20 mb-3" />
                                <p className="small-body-text text-secondary">Select a booth on the map to see details and pricing</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SponsorVenueLayout;
