import React, { useState, useRef, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import { Stage, Layer, Circle, Text, Group, Rect, Line, Transformer, Image as KonvaImage } from "react-konva";
import { useAuthContext } from "../hooks/useAuthContext";
import { useEventsContext } from "../hooks/useEventsContext";
import "./promoterboothlayout.css";
import ManageCategoryModal from "../admincomponents/modal/ManageCategoryModal";
import priceLevelService from "../services/priceLevelService";

import { showDeleteConfirmAlert, showSuccessAlert, showErrorAlert } from "../utils/sweetAlert";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "";
const API_URL = `${BASE_URL}/api/events`;

const PromoterBoothLayout = ({ selectedEvent }) => {
    const { user } = useAuthContext();
    const { dispatch } = useEventsContext();
    const [isInspectorExpanded, setIsInspectorExpanded] = useState(false);
    const [categories, setCategories] = useState([]);
    const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const [placedItems, setPlacedItems] = useState([]);

    const isOwner = React.useMemo(() => {
        if (!user || !selectedEvent) return false;
        const userId = user._id || user.id;
        const creatorId = selectedEvent.createdBy?._id || selectedEvent.createdBy;
        return String(userId) === String(creatorId);
    }, [user, selectedEvent]);

    // Batch placement modal
    const [batchModal, setBatchModal] = useState(null); // null or { category }
    const [batchDirection, setBatchDirection] = useState('row');
    const [batchCount, setBatchCount] = useState(1);
    const [batchSpacing, setBatchSpacing] = useState(45);
    const [batchStartX, setBatchStartX] = useState(100);
    const [batchStartY, setBatchStartY] = useState(100);
    const [batchLabelStart, setBatchLabelStart] = useState(1);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const lastClickedIdRef = useRef(null);
    // drag-group refs — store start positions of all selected items when drag begins
    const dragStartPositions = useRef({});
    const [zoom, setZoom] = useState(1);
    const [fitScale, setFitScale] = useState(1);
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [containerSize, setContainerSize] = useState({ w: 800, h: 600 });
    const [snapToGrid, setSnapToGrid] = useState(true);
    const stageRef = useRef(null);
    const trRef = useRef(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // Manual panning refs — no React state = no re-render lag during pan
    const isPanningRef = useRef(false);
    const lastPointerRef = useRef({ x: 0, y: 0 });

    const [backgroundImage, setBackgroundImage] = useState(null);
    const [bgOpacity, setBgOpacity] = useState(0.4);
    const [bgKonvaImage, setBgKonvaImage] = useState(null);
    const [bgModalOpen, setBgModalOpen] = useState(false);
    const bgFileInputRef = useRef(null);

    const historyStack = useRef([]);
    const futureStack = useRef([]);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    const pushHistory = useCallback((snapshot) => {
        historyStack.current.push(snapshot);
        futureStack.current = [];
        setCanUndo(true);
        setCanRedo(false);
    }, []);

    const handleUndo = useCallback(() => {
        if (historyStack.current.length === 0) return;
        const prev = historyStack.current.pop();
        futureStack.current.push(placedItems);
        setPlacedItems(prev);
        setCanUndo(historyStack.current.length > 0);
        setCanRedo(true);
    }, [placedItems]);

    const handleRedo = useCallback(() => {
        if (futureStack.current.length === 0) return;
        const next = futureStack.current.pop();
        historyStack.current.push(placedItems);
        setPlacedItems(next);
        setCanUndo(true);
        setCanRedo(futureStack.current.length > 0);
    }, [placedItems]);

    const handleSyncBooths = async () => {
        if (!selectedEvent?._id || !user?.token) return;

        setIsSyncing(true);
        try {
            const response = await fetch(`${API_URL}/${selectedEvent._id}/sync-booths`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                    "Content-Type": "application/json"
                }
            });
            const data = await response.json();
            if (response.ok) {
                if (data.event) {
                    dispatch({ type: "UPDATE_EVENT", payload: data.event });
                }
                showSuccessAlert("Sync Complete", data.message || "Booth statuses synced.");
            } else {
                showErrorAlert("Sync Failed", data.error || "Failed to reconcile.");
            }
        } catch (err) {
            console.error("Sync error:", err);
        } finally {
            setIsSyncing(false);
        }
    };

    const [canvasWidth, setCanvasWidth] = useState(1400);
    const [canvasHeight, setCanvasHeight] = useState(900);
    const [canvasWInput, setCanvasWInput] = useState(1400);
    const [canvasHInput, setCanvasHInput] = useState(900);

    const [bgWidth, setBgWidth] = useState(null);
    const [bgHeight, setBgHeight] = useState(null);

    const containerRef = useRef(null);
    const GRID_SIZE = 20;

    /**
     * Parse a booth size string like "10x10", "10x20", "10x30" into pixel dimensions.
     * Base: "10x10" = 40×40 px  →  1 unit = 4 px.
     */
    const parseBoothSizePx = useCallback((boothSize) => {
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
    }, []);

    // Re-fit whenever the container or canvas size changes
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
            setZoom(fs); // reset to 100% (fit)
            // Center the canvas in the container
            setStagePos({
                x: (clientWidth - canvasWidth * fs) / 2,
                y: (clientHeight - canvasHeight * fs) / 2,
            });
        };
        // Run after mount (so containerRef is attached)
        const timer = setTimeout(recalc, 50);
        const ro = new ResizeObserver(recalc);
        if (containerRef.current) ro.observe(containerRef.current);
        return () => { clearTimeout(timer); ro.disconnect(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canvasWidth, canvasHeight]);

    useEffect(() => {
        if (selectedEvent?.priceLevels) {
            const normalizedCategories = selectedEvent.priceLevels.map(pl => ({
                id: pl._id,
                name: pl.priceName,
                price: pl.facePrice,
                quantity: pl.quantityAvailable,
                sold: pl.quantitySold || 0,
                color: pl.color || "#666666",
                type: pl.type || "Seat (Circle)",
                boothSize: pl.boothSize || ""
            }));
            setCategories(normalizedCategories);
        }

        else if (selectedEvent?.ticketCategories) {
            const normalizedCategories = selectedEvent.ticketCategories.map(cat => ({
                ...cat,
                id: cat._id || cat.id || Date.now().toString()
            }));
            setCategories(normalizedCategories);
        }

        if (selectedEvent?.layoutData) {
            historyStack.current = [];
            futureStack.current = [];
            setCanUndo(false);
            setCanRedo(false);
            setPlacedItems(selectedEvent.layoutData.items || []);

            const cw = selectedEvent.layoutData.canvasWidth || 1400;
            const ch = selectedEvent.layoutData.canvasHeight || 900;
            setCanvasWidth(cw); setCanvasWInput(cw);
            setCanvasHeight(ch); setCanvasHInput(ch);

            const savedBg = selectedEvent.layoutData.backgroundImage || null;
            setBackgroundImage(savedBg);
            setBgOpacity(selectedEvent.layoutData.bgOpacity ?? 0.4);
            if (savedBg) {
                const img = new window.Image();
                img.src = savedBg;
                img.onload = () => {
                    setBgKonvaImage(img);
                    setBgWidth(selectedEvent.layoutData.bgWidth || cw);
                    setBgHeight(selectedEvent.layoutData.bgHeight || ch);
                };
            } else {
                setBgKonvaImage(null);
                setBgWidth(null);
                setBgHeight(null);
            }
        }
    }, [selectedEvent]);

    const handleSaveCategory = async (categoryData) => {
        if (!selectedEvent?._id) return;
        if (!isOwner) return showErrorAlert("Access Denied", "Only the event creator can manage categories.");

        try {
            if (editingCategory) {
                const updatedPriceLevel = {
                    priceName: categoryData.name,
                    facePrice: categoryData.price,
                    quantityAvailable: categoryData.quantity,
                    color: categoryData.color,
                    type: categoryData.type,
                    boothSize: categoryData.boothSize,
                    isActive: true
                };

                const result = await priceLevelService.updatePriceLevel(
                    selectedEvent._id,
                    editingCategory.id,
                    updatedPriceLevel,
                    user.token
                );

                if (result) {
                    const updatedEvent = result.event || result;
                    const normalizedCategories = updatedEvent.priceLevels.map(pl => ({
                        id: pl._id,
                        name: pl.priceName,
                        price: pl.facePrice,
                        quantity: pl.quantityAvailable,
                        sold: pl.quantitySold || 0,
                        color: pl.color || "#666666",
                        type: pl.type || "Seat (Circle)",
                        boothSize: pl.boothSize || ""
                    }));
                    setCategories(normalizedCategories);
                    dispatch({ type: "UPDATE_EVENT", payload: updatedEvent });
                    showSuccessAlert("Updated", "Category has been updated successfully.");
                }
            } else {
                const newPriceLevel = {
                    priceName: categoryData.name,
                    facePrice: categoryData.price,
                    quantityAvailable: categoryData.quantity,
                    color: categoryData.color,
                    type: categoryData.type,
                    boothSize: categoryData.boothSize,
                    isActive: true
                };

                const result = await priceLevelService.addPriceLevels(
                    selectedEvent._id,
                    [newPriceLevel],
                    user.token
                );

                if (result) {
                    const updatedEvent = result.event || result;
                    const normalizedCategories = updatedEvent.priceLevels.map(pl => ({
                        id: pl._id,
                        name: pl.priceName,
                        price: pl.facePrice,
                        quantity: pl.quantityAvailable,
                        sold: pl.quantitySold || 0,
                        color: pl.color || "#666666",
                        type: pl.type || "Seat (Circle)",
                        boothSize: pl.boothSize || ""
                    }));
                    setCategories(normalizedCategories);

                    const matchedBack = updatedEvent.priceLevels.find(pl => pl.priceName === categoryData.name);
                    if (matchedBack) {
                        setPlacedItems(prev => prev.map(item =>
                            item.categoryId === categoryData.id ? { ...item, categoryId: matchedBack._id } : item
                        ));
                    }

                    dispatch({ type: "UPDATE_EVENT", payload: updatedEvent });
                    showSuccessAlert("Added", "New category has been created.");
                }
            }
            setEditingCategory(null);
            setIsAddCategoryModalOpen(false);
        } catch (error) {
            console.error("Save category error:", error);
            showErrorAlert("Error", error.message || "Failed to save category.");
        }
    };

    const deleteCategory = async (id) => {
        if (!selectedEvent?._id) return;
        if (!isOwner) return showErrorAlert("Access Denied", "You do not have permission to delete categories for this event.");

        const result = await showDeleteConfirmAlert(
            "Delete Category?",
            "Deleting this category will also remove all placed shapes associated with it from the map. This cannot be undone."
        );

        const hasSoldItems = placedItems.some(i => i.categoryId === id && (i.status === 'sold' || i.status === 'reserved'));
        if (hasSoldItems) {
            showErrorAlert("Cannot Delete", "This category contains sold booths and cannot be deleted.");
            return;
        }

        if (result.isConfirmed) {
            try {
                const response = await priceLevelService.deletePriceLevel(selectedEvent._id, id, user.token);
                if (response) {
                    const updatedEvent = response.event || response;
                    const normalizedCats = updatedEvent.priceLevels.map(pl => ({
                        id: pl._id,
                        name: pl.priceName,
                        price: pl.facePrice,
                        quantity: pl.quantityAvailable,
                        sold: pl.quantitySold || 0,
                        color: pl.color || "#666666",
                        type: pl.type || "Seat (Circle)",
                        boothSize: pl.boothSize || ""
                    }));

                    setCategories(normalizedCats);
                    setPlacedItems(prev => prev.filter(item => item.categoryId !== id));
                    dispatch({ type: "UPDATE_EVENT", payload: updatedEvent });
                    showSuccessAlert("Deleted", "Category and associated shapes have been removed.");
                }
            } catch (error) {
                console.error("Delete category error:", error);
                showErrorAlert("Error", error.message || "Failed to delete category.");
            }
        }
    };

    const openBatchModal = (category) => {
        if (!isOwner) return;
        const itemsInCat = placedItems.filter(i => i.categoryId === category.id);
        const remaining = category.quantity - itemsInCat.length;
        if (remaining <= 0) {
            showErrorAlert("Limit Reached", "All units for this category have been placed.");
            return;
        }

        // Find the max number currently used in labels for this category
        let maxNum = 0;
        itemsInCat.forEach(item => {
            if (item.label) {
                const match = item.label.match(/(\d+)$/);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (!isNaN(num) && num > maxNum) maxNum = num;
                }
            }
        });

        setBatchModal({ category });
        setBatchDirection('row');
        setBatchCount(Math.min(remaining, 10));
        setBatchSpacing(45);
        setBatchStartX(100);
        setBatchStartY(100);
        setBatchLabelStart(maxNum + 1);
    };

    const handleConfirmBatchPlace = () => {
        if (!batchModal) return;
        const { category } = batchModal;
        const placedCount = placedItems.filter(i => i.categoryId === category.id).length;
        const remaining = category.quantity - placedCount;
        const count = Math.max(1, Math.min(Number(batchCount) || 1, remaining));

        let spacing = Number(batchSpacing) || 45;
        let startX = Number(batchStartX);
        let startY = Number(batchStartY);

        if (snapToGrid) {
            startX = Math.round(startX / GRID_SIZE) * GRID_SIZE;
            startY = Math.round(startY / GRID_SIZE) * GRID_SIZE;
            // Snap spacing to GRID_SIZE to maintain uniform alignment
            spacing = Math.round(spacing / GRID_SIZE) * GRID_SIZE;
            if (spacing < GRID_SIZE) spacing = GRID_SIZE;
        }

        const prefix = category.name.length > 5 ? category.name.substring(0, 3).toUpperCase() : category.name;
        const newItems = [];
        for (let i = 0; i < count; i++) {
            const labelNum = Number(batchLabelStart) + i;
            let x = batchDirection === 'row' ? startX + i * spacing : startX;
            let y = batchDirection === 'row' ? startY : startY + i * spacing;

            newItems.push({
                id: `item-${Date.now()}-${i}`,
                categoryId: category.id,
                label: `${prefix}-${labelNum}`,
                x,
                y,
                scaleX: 1,
                scaleY: 1,
                rotation: 0,
                type: category.type.includes("Seat") ? "seat" : "booth",
                isBooth: !category.type.includes("Seat"),
                isSeat: category.type.includes("Seat"),
            });
        }
        pushHistory([...placedItems]);
        setPlacedItems(prev => [...prev, ...newItems]);
        setSelectedIds(new Set(newItems.map(i => i.id)));
        lastClickedIdRef.current = newItems[newItems.length - 1]?.id || null;
        setBatchModal(null);
    };

    useEffect(() => {
        if (!trRef.current || !stageRef.current) return;
        const nodes = [...selectedIds]
            .map(id => stageRef.current.findOne(`#${id}`))
            .filter(Boolean);
        trRef.current.nodes(nodes);
        trRef.current.getLayer()?.batchDraw();
    }, [selectedIds]);

    const handleTransformEnd = () => {
        if (!trRef.current) return;
        const nodes = trRef.current.nodes();
        if (nodes.length === 0) return;

        pushHistory([...placedItems]);

        const updates = {};
        nodes.forEach(node => {
            updates[node.id()] = {
                x: node.x(),
                y: node.y(),
                scaleX: node.scaleX(),
                scaleY: node.scaleY(),
                rotation: node.rotation(),
            };
        });

        setPlacedItems(prev => prev.map(item =>
            updates[item.id] ? { ...item, ...updates[item.id] } : item
        ));
    };

    // Called when ANY dragged item finishes — moves entire selection by the same delta
    const handleDragEnd = (draggedId, newX, newY) => {
        const startPos = dragStartPositions.current[draggedId];

        // If startPos is missing, fallback to finding the item in the current state
        const originalPos = startPos || placedItems.find(i => i.id === draggedId);
        if (!originalPos) return;

        // Calculate raw delta from original position
        let dx = newX - originalPos.x;
        let dy = newY - originalPos.y;

        // If snapping is on, snap the delta to GRID_SIZE increments
        if (snapToGrid) {
            dx = Math.round(dx / GRID_SIZE) * GRID_SIZE;
            dy = Math.round(dy / GRID_SIZE) * GRID_SIZE;
        }

        pushHistory([...placedItems]);
        setPlacedItems(prev => prev.map(item => {
            if (item.id === draggedId) return { ...item, x: originalPos.x + dx, y: originalPos.y + dy };
            if (!selectedIds.has(item.id)) return item;

            const orig = dragStartPositions.current[item.id];
            if (!orig) return item;

            // Apply the snapped delta to everyone in the selection
            return { ...item, x: orig.x + dx, y: orig.y + dy };
        }));
        dragStartPositions.current = {};
    };

    // Ctrl+Click = toggle, Shift+Click = range, plain click = single
    const handleItemClick = (itemId, e) => {
        const nativeEvt = e.evt;
        if (nativeEvt.ctrlKey || nativeEvt.metaKey) {
            // Toggle this item
            setSelectedIds(prev => {
                const next = new Set(prev);
                if (next.has(itemId)) { next.delete(itemId); }
                else { next.add(itemId); lastClickedIdRef.current = itemId; }
                return next;
            });
        } else if (nativeEvt.shiftKey && lastClickedIdRef.current) {
            // Range select from lastClickedId to itemId
            const ids = placedItems.map(i => i.id);
            const a = ids.indexOf(lastClickedIdRef.current);
            const b = ids.indexOf(itemId);
            const [from, to] = a < b ? [a, b] : [b, a];
            const rangeIds = ids.slice(from, to + 1);
            setSelectedIds(prev => new Set([...prev, ...rangeIds]));
        } else {
            // Plain click — single select
            setSelectedIds(new Set([itemId]));
            lastClickedIdRef.current = itemId;
        }
    };

    const handleSaveLayout = async () => {
        if (!user) return showErrorAlert("Unauthorized", "You must be logged in.");
        if (!isOwner) return showErrorAlert("Access Denied", "Only the event creator can save changes to the layout.");

        const priceLevels = categories.map(c => ({
            _id: c.id,
            priceName: c.name,
            facePrice: c.price,
            quantityAvailable: c.quantity,
            color: c.color,
            type: c.type,
            boothSize: c.boothSize,
            isActive: true
        }));

        const seats = placedItems
            .filter(i => i.type === 'seat' || (!i.isBooth && !i.isElement && !i.isBackground && i.type !== 'booth'))
            .map(item => {
                const cat = categories.find(c => c.id === item.categoryId);
                return {
                    id: item.id,
                    label: item.label,
                    priceLevelId: cat ? cat.id : "none",
                    status: "available",
                    x: item.x,
                    y: item.y,
                    scaleX: item.scaleX || 1,
                    scaleY: item.scaleY || 1,
                    rotation: item.rotation || 0
                };
            });

        const boothsData = placedItems
            .filter(i => i.type === 'booth' || i.isBooth)
            .map(item => {
                const cat = categories.find(c => c.id === item.categoryId);
                return {
                    id: item.id,
                    label: item.label,
                    priceLevelId: cat ? cat.id : "none",
                    status: "available",
                    x: item.x,
                    y: item.y,
                    scaleX: item.scaleX || 1,
                    scaleY: item.scaleY || 1,
                    rotation: item.rotation || 0,
                    boothType: item.type || "Booth (Square)",
                    boothSize: item.boothSize || "4x4",
                };
            });

        // Determine eventType based on placed items
        let autoEventType = selectedEvent?.eventType || "Seating Arrangement";
        const hasSeats = placedItems.some(i => i.type === 'seat' || i.isSeat);
        const hasBooths = placedItems.some(i => i.type === 'booth' || i.isBooth);

        if (hasSeats || hasBooths) {
            autoEventType = "Reservation";
        }

        const payload = {
            priceLevels,
            eventType: autoEventType,
            seatMap: {
                sections: [{ name: "Main Section", seats }]
            },
            booths: boothsData,
            ticketCategories: categories,
            layoutData: {
                items: placedItems,
                canvasWidth,
                canvasHeight,
                backgroundImage: backgroundImage || null,
                bgOpacity,
                bgWidth: bgWidth || null,
                bgHeight: bgHeight || null,
            }
        };

        if (!user || !user.token) {
            return showErrorAlert("Unauthorized", "Authentication token is missing. Please log in again.");
        }

        try {
            const response = await fetch(`${API_URL}/${selectedEvent._id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user.token}`,
                },
                body: JSON.stringify(payload),
            });

            const json = await response.json();

            if (response.ok) {
                dispatch({ type: "UPDATE_EVENT", payload: json.event || json });
                showSuccessAlert("Saved", "Layout configuration saved successfully.");
            } else {
                showErrorAlert("Save Failed", json.error || json.message || "Failed to save layout.");
            }
        } catch (error) {
            console.error("Save error:", error);
            showErrorAlert("Error", "An unexpected error occurred while saving the layout.");
        }
    };

    const removePlacedItem = (id) => {
        if (!isOwner) return showErrorAlert("Access Denied", "You do not have permission to modify this layout.");
        // If multiple selected, remove all selected; otherwise just the given id
        const toRemove = selectedIds.size > 1 ? [...selectedIds] : [id];
        const locked = toRemove.filter(rid => {
            const it = placedItems.find(i => i.id === rid);
            return it && (it.status === 'sold' || it.status === 'reserved');
        });
        if (locked.length > 0) {
            showErrorAlert("Protected", `${locked.length} item(s) are sold/reserved and cannot be removed.`);
            return;
        }
        pushHistory([...placedItems]);
        setPlacedItems(prev => prev.filter(item => !toRemove.includes(item.id)));
        setSelectedIds(new Set());
        lastClickedIdRef.current = null;
    };

    const totalPlaced = placedItems.length;
    const potentialRevenue = categories.reduce((sum, c) => sum + (c.price * c.quantity), 0);
    const currentRevenue = placedItems.reduce((sum, item) => {
        const cat = categories.find(c => c.id === item.categoryId);
        return sum + (cat ? cat.price : 0);
    }, 0);

    // Keyboard shortcuts: Ctrl+Z = undo, Ctrl+Y = redo, Escape = deselect
    useEffect(() => {
        const onKeyDown = (e) => {
            const tag = e.target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
            if (e.key === 'Escape') {
                setSelectedIds(new Set());
                lastClickedIdRef.current = null;
            } else if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                handleUndo();
            } else if (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) {
                e.preventDefault();
                handleRedo();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [handleUndo, handleRedo]);

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

    const computeFitDimensions = (img, cw = canvasWidth, ch = canvasHeight) => {
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const canvasAspect = cw / ch;
        if (imgAspect > canvasAspect) {
            return { w: cw, h: cw / imgAspect };
        } else {
            return { w: ch * imgAspect, h: ch };
        }
    };

    const handleBgImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target.result;
            setBackgroundImage(dataUrl);
            const img = new window.Image();
            img.src = dataUrl;
            img.onload = () => {
                setBgKonvaImage(img);
                const { w, h } = computeFitDimensions(img);
                setBgWidth(w);
                setBgHeight(h);
            };
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const handleFitToStage = () => {
        if (!bgKonvaImage) return;
        const { w, h } = computeFitDimensions(bgKonvaImage);
        setBgWidth(w);
        setBgHeight(h);
    };

    const handleRemoveBgImage = () => {
        setBackgroundImage(null);
        setBgKonvaImage(null);
        setBgWidth(null);
        setBgHeight(null);
    };

    const applyCanvasSize = () => {
        const w = Math.max(200, Math.min(5000, Number(canvasWInput) || 1400));
        const h = Math.max(200, Math.min(5000, Number(canvasHInput) || 900));
        setCanvasWidth(w);
        setCanvasHeight(h);
        setCanvasWInput(w);
        setCanvasHInput(h);
        if (bgKonvaImage) {
            const { w: bw, h: bh } = computeFitDimensions(bgKonvaImage, w, h);
            setBgWidth(bw);
            setBgHeight(bh);
        }
    };

    return (
        <div className="layout-builder-container unified-view">
            {!isOwner && (
                <div style={{
                    background: 'linear-gradient(90deg, #b45309, #92400e)',
                    color: '#fff',
                    padding: '8px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '13px',
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    borderBottom: '1px solid rgba(255,255,255,0.15)',
                }}>
                    <Icon icon="mdi:eye-outline" style={{ fontSize: '18px', flexShrink: 0 }} />
                    <span>View Only — You are assigned to this event. Only the event creator can edit the layout.</span>
                </div>
            )}
            <div className="builder-main">
                <div className="builder-sidebar">
                    <div className="sidebar-card categories-card">
                        <div className="sidebar-header">
                            <h4 className="bt-section-title-layout">Ticket Categories</h4>
                            {isOwner && (
                                <button
                                    className="add-category-btn-icon"
                                    onClick={() => {
                                        setEditingCategory(null);
                                        setIsAddCategoryModalOpen(true);
                                    }}
                                    title="Add New Category"
                                >
                                    <Icon icon="mdi:plus" />
                                </button>
                            )}
                        </div>

                        <div className="sidebar-categories-list">
                            {categories.length === 0 ? (
                                <div className="sidebar-empty-state">
                                    <p>No categories yet. Click "Add" to start.</p>
                                </div>
                            ) : (
                                categories.map(cat => {
                                    const placed = placedItems.filter(i => i.categoryId === cat.id).length;
                                    const remaining = cat.type === "General Fee" ? cat.quantity - (cat.sold || 0) : cat.quantity - placed;
                                    const isFull = remaining <= 0;

                                    return (
                                        <div key={cat.id} className={`sidebar-cat-item ${isFull ? 'is-full' : ''}`}>
                                            <div
                                                className="cat-palette-visual"
                                                style={{
                                                    backgroundColor: cat.color,
                                                    cursor: cat.type === "General Fee" ? 'not-allowed' : (isOwner ? 'pointer' : 'default'),
                                                    opacity: cat.type === "General Fee" ? 0.5 : 1
                                                }}
                                                onClick={() => isOwner && !isFull && cat.type !== "General Fee" && openBatchModal(cat)}
                                                title={
                                                    cat.type === "General Fee"
                                                        ? "General Fee categories don't require seat/booth placement"
                                                        : isOwner
                                                            ? (isFull ? "All units placed" : "Click to place seats/booths on map")
                                                            : ""
                                                }
                                            >
                                                {cat.type === "General Fee" ? (
                                                    <Icon icon="mdi:ticket-confirmation-outline" />
                                                ) : cat.type.includes("Seat") ? (
                                                    <Icon icon="mdi:circle" />
                                                ) : (
                                                    <Icon icon="mdi:square" />
                                                )}
                                            </div>

                                            <div className="cat-details">
                                                <div className="cat-top">
                                                    <span className="cat-name">{cat.name}</span>
                                                    {isOwner && (
                                                        <div className="cat-actions">
                                                            <button className="outlined-button" onClick={() => {
                                                                setEditingCategory(cat);
                                                                setIsAddCategoryModalOpen(true);
                                                            }}>
                                                                <Icon icon="mdi:pencil-outline" />
                                                            </button>
                                                            <button className="primary-button" onClick={() => deleteCategory(cat.id)}>
                                                                <Icon icon="mdi:trash-can-outline" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="cat-meta">
                                                    <span className="price">${cat.price.toFixed(2)}</span>
                                                    {cat.type === "General Fee" ? (
                                                        <span className="count">{(cat.quantity || 0) - (cat.sold || 0)}/{cat.quantity} avail</span>
                                                    ) : (
                                                        <span className="count">{placed}/{cat.quantity} units</span>
                                                    )}
                                                    {cat.boothSize && <span className="size-badge">{cat.boothSize}</span>}
                                                </div>
                                                <div className="progress-bar">
                                                    <div
                                                        className="progress-fill"
                                                        style={{
                                                            width: `${cat.type === "General Fee" ? ((cat.sold || 0) / (cat.quantity || 1)) * 100 : (placed / (cat.quantity || 1)) * 100}%`,
                                                            backgroundColor: cat.color
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {selectedIds.size > 0 && (() => {
                        const selArray = [...selectedIds];
                        const selItems = placedItems.filter(i => selectedIds.has(i.id));
                        const isSingle = selArray.length === 1;
                        const singleItem = isSingle ? selItems[0] : null;
                        const singleCat = singleItem ? categories.find(c => c.id === singleItem.categoryId) : null;
                        const anyLocked = selItems.some(i => i.status === 'sold' || i.status === 'reserved');
                        return (
                            <div className="sidebar-card inspector-card">
                                <div className="sidebar-header">
                                    <h4 className="bt-section-title-layout">
                                        {isSingle ? 'Shape Inspector' : `${selArray.length} Selected`}
                                    </h4>
                                    <button className="close-btn" onClick={() => { setSelectedIds(new Set()); lastClickedIdRef.current = null; }}>
                                        <Icon icon="mdi:close" />
                                    </button>
                                </div>
                                <div className="inspector-body">
                                    {isSingle ? (
                                        <>
                                            <div className="inspector-header-main" onClick={() => setIsInspectorExpanded(!isInspectorExpanded)} style={{ cursor: 'pointer' }}>
                                                <span className="shape-id">
                                                    {singleItem.label}
                                                    <Icon icon={isInspectorExpanded ? "mdi:chevron-up" : "mdi:chevron-down"} className="mobile-only-icon" style={{ marginLeft: '4px', verticalAlign: 'middle', fontSize: '20px' }} />
                                                </span>
                                                <span className={`value-badge type-${singleItem.type}`}>{singleCat?.type.toLowerCase().split(' ')[0]}</span>
                                            </div>
                                            <div className={`summary-list ${isInspectorExpanded ? 'expanded' : ''}`}>
                                                <div className="summary-item">
                                                    <span className="label">Status</span>
                                                    <span className={`value status-${singleItem.status || 'available'}`}>{singleItem.status?.toUpperCase() || 'AVAILABLE'}</span>
                                                </div>
                                                {singleItem.reservedBy && (
                                                    <>
                                                        <div className="summary-item mobile-collapsible">
                                                            <span className="label">Buyer</span>
                                                            <span className="value-semi" style={{ color: 'var(--color-green-primary)' }}>{singleItem.reservedBy}</span>
                                                        </div>
                                                        {singleItem.reservedByEmail && (
                                                            <div className="summary-item mobile-collapsible">
                                                                <span className="label">Email</span>
                                                                <span className="value" style={{ fontSize: '11px' }}>{singleItem.reservedByEmail}</span>
                                                            </div>
                                                        )}
                                                        {singleItem.reservedByPO && (
                                                            <div className="summary-item mobile-collapsible">
                                                                <span className="label">PO Number</span>
                                                                <span className="value">{singleItem.reservedByPO}</span>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                                <div className="summary-item mobile-collapsible">
                                                    <span className="label">Category</span>
                                                    <span className="value">{singleCat?.name}</span>
                                                </div>
                                                <div className="summary-item mobile-collapsible">
                                                    <span className="label">Price</span>
                                                    <span className="value-bold">${singleCat?.price.toFixed(2)}</span>
                                                </div>
                                                {singleCat?.boothSize && (
                                                    <div className="summary-item mobile-collapsible">
                                                        <span className="label">Size</span>
                                                        <span className="value">{singleCat.boothSize}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {isOwner && (
                                                <button
                                                    className={`remove-shape-btn-side ${anyLocked ? 'disabled' : ''}`}
                                                    onClick={() => removePlacedItem(singleItem.id)}
                                                    disabled={anyLocked}
                                                >
                                                    <Icon icon="mdi:trash-can-outline" /> {anyLocked ? 'Sold (Locked)' : 'Remove from Map'}
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        // Multi-select summary
                                        <>
                                            <div className="multiselect-summary">
                                                <Icon icon="mdi:cursor-pointer" className="multiselect-icon" />
                                                <span><strong>{selArray.length}</strong> items selected</span>
                                            </div>
                                            <div className="summary-list" style={{ marginTop: '10px' }}>
                                                {/* Group by category */}
                                                {Object.entries(
                                                    selItems.reduce((acc, it) => {
                                                        const cat = categories.find(c => c.id === it.categoryId);
                                                        const key = cat?.name || 'Unknown';
                                                        acc[key] = (acc[key] || 0) + 1;
                                                        return acc;
                                                    }, {})
                                                ).map(([catName, count]) => (
                                                    <div key={catName} className="summary-item">
                                                        <span className="label">{catName}</span>
                                                        <span className="value">{count} item{count !== 1 ? 's' : ''}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="multiselect-hint">
                                                <Icon icon="mdi:drag" /> {isOwner ? 'Drag any selected item to move the group' : 'Selection active'}
                                            </div>
                                            {isOwner && (
                                                <button
                                                    className={`remove-shape-btn-side ${anyLocked ? 'disabled' : ''}`}
                                                    onClick={() => removePlacedItem(selArray[0])}
                                                    disabled={anyLocked}
                                                >
                                                    <Icon icon="mdi:trash-can-outline" />
                                                    {anyLocked ? 'Some items locked' : `Remove ${selArray.length} items`}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    <div className="sidebar-card summary-card">
                        <h4 className="bt-section-title-layout">Layout Summary</h4>
                        <div className="summary-list">
                            <div className="summary-item">
                                <span className="label">Placed Units</span>
                                <span className="value">{totalPlaced} / {categories.reduce((a, b) => a + b.quantity, 0)}</span>
                            </div>
                            <div className="summary-item">
                                <span className="label">Current Revenue</span>
                                <span className="value">${currentRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="summary-item total">
                                <span className="label">Potential Total</span>
                                <span className="value-muted">${potentialRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="canvas-area">
                    <div className="canvas-toolbar">
                        <h4 className="canvas-title">
                            {/* {selectedEvent?.venue?.name || "Venue Map"} */}
                        </h4>
                        <div className="toolbar-actions">
                            {isOwner && (
                                <>
                                    <button
                                        className="bt-btn"
                                        onClick={handleUndo}
                                        disabled={!canUndo}
                                        title="Undo (Ctrl+Z)"
                                    >
                                        <Icon icon="mdi:undo" /> <span>Undo</span>
                                    </button>
                                    <button
                                        className="bt-btn"
                                        onClick={handleRedo}
                                        disabled={!canRedo}
                                        title="Redo (Ctrl+Y)"
                                    >
                                        <Icon icon="mdi:redo" /> <span>Redo</span>
                                    </button>
                                </>
                            )}

                            {isOwner && (
                                <>
                                    <input
                                        ref={bgFileInputRef}
                                        type="file" accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={handleBgImageUpload}
                                    />

                                    <button
                                        className={`bt-btn${backgroundImage ? ' bg-loaded' : ''}`}
                                        onClick={() => backgroundImage ? setBgModalOpen(true) : bgFileInputRef.current?.click()}
                                        title={backgroundImage ? 'Floor plan loaded — click to edit' : 'Upload floor plan image'}
                                    >
                                        <Icon icon={backgroundImage ? 'mdi:image-check-outline' : 'mdi:image-plus-outline'} />
                                        <span>Floor Plan</span>
                                    </button>
                                </>
                            )}

                            {isOwner && (
                                <button
                                    className={`bt-btn ${snapToGrid ? 'active' : ''}`}
                                    onClick={() => setSnapToGrid(!snapToGrid)}
                                    title="Toggle Snap to Grid"
                                >
                                    <Icon icon="mdi:grid" /> <span>Snap</span>
                                </button>
                            )}

                            <div className="zoom-controls">
                                {/* <button
                  className={`bt-btn sync-btn-small ${isSyncing ? 'spinning' : ''}`}
                  onClick={handleSyncBooths}
                  disabled={isSyncing}
                  title="Sync Booth Status with Database"
                  style={{ marginRight: '10px', display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 8px', height: 'auto' }}
                >
                  <Icon icon={isSyncing ? "mdi:loading" : "mdi:sync"} className={isSyncing ? "spin" : ""} />
                  <span style={{ fontSize: '11px' }}>{isSyncing ? 'Syncing...' : 'Sync Data'}</span>
                </button> */}
                                <button className="bt-btn" onClick={() => {
                                    setZoom(z => {
                                        const next = Math.max(z - 0.1, fitScale * 0.3);
                                        return next;
                                    });
                                }} title="Zoom Out">
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
                                <button className="bt-btn" onClick={() => {
                                    setZoom(z => Math.min(z + 0.1, fitScale * 4));
                                }} title="Zoom In">
                                    <Icon icon="mdi:plus" />
                                </button>
                            </div>

                            {isOwner && (
                                <>
                                    <button className="bt-btn clear" onClick={async () => {
                                        const result = await showDeleteConfirmAlert(
                                            "Clear Map?",
                                            "This will remove ALL shapes from the canvas. You will have to re-place items from the sidebar. This cannot be undone."
                                        );
                                        if (result.isConfirmed) {
                                            pushHistory([...placedItems]);
                                            setPlacedItems([]);
                                            showSuccessAlert("Cleared", "The map has been cleared.");
                                        }
                                    }} title="Clear All Items">
                                        <Icon icon="mdi:layers-off" /> <span>Clear</span>
                                    </button>

                                    <button className="bt-btn primary save-layout-btn" onClick={handleSaveLayout} title="Save Venue Layout">
                                        <Icon icon="mdi:check-circle-outline" /> <span>Save Layout</span>
                                    </button>
                                </>
                            )}
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
                            onClick={(e) => {
                                if (e.target === e.target.getStage()) {
                                    setSelectedIds(new Set());
                                    lastClickedIdRef.current = null;
                                }
                            }}
                            onTap={(e) => {
                                if (e.target === e.target.getStage()) {
                                    setSelectedIds(new Set());
                                    lastClickedIdRef.current = null;
                                }
                            }}
                            onMouseDown={(e) => {
                                // Only pan when clicking the empty stage background — never when an item is clicked
                                if (e.target !== e.target.getStage()) return;
                                isPanningRef.current = true;
                                const pos = stageRef.current.getPointerPosition();
                                lastPointerRef.current = { x: pos.x, y: pos.y };
                                stageRef.current.container().style.cursor = 'grabbing';
                            }}
                            onMouseMove={(e) => {
                                if (!isPanningRef.current) return;
                                const stage = stageRef.current;
                                const pos = stage.getPointerPosition();
                                const dx = pos.x - lastPointerRef.current.x;
                                const dy = pos.y - lastPointerRef.current.y;
                                lastPointerRef.current = { x: pos.x, y: pos.y };
                                // Move stage imperatively — no re-render, no flicker
                                stage.x(stage.x() + dx);
                                stage.y(stage.y() + dy);
                                stage.batchDraw();
                            }}
                            onMouseUp={() => {
                                if (!isPanningRef.current) return;
                                isPanningRef.current = false;
                                stageRef.current.container().style.cursor = 'default';
                                // Sync React state once panning is done
                                setStagePos({
                                    x: stageRef.current.x(),
                                    y: stageRef.current.y(),
                                });
                            }}
                            onMouseLeave={() => {
                                if (!isPanningRef.current) return;
                                isPanningRef.current = false;
                                stageRef.current.container().style.cursor = 'default';
                                setStagePos({
                                    x: stageRef.current.x(),
                                    y: stageRef.current.y(),
                                });
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
                            {bgKonvaImage && bgWidth && bgHeight && (
                                <Layer>
                                    <KonvaImage
                                        image={bgKonvaImage}
                                        x={0}
                                        y={0}
                                        width={bgWidth}
                                        height={bgHeight}
                                        opacity={bgOpacity}
                                        onClick={() => setBgModalOpen(true)}
                                        onTap={() => setBgModalOpen(true)}
                                    />
                                </Layer>
                            )}
                            <Layer>
                                {(() => {
                                    const lines = [];
                                    const extent = 5000;
                                    const MAJOR_GRID = 100;

                                    for (let i = -extent; i <= extent; i += GRID_SIZE) {
                                        const isMajor = i % MAJOR_GRID === 0;
                                        const isAxis = i === 0;

                                        const baseOpacity = snapToGrid ? 1 : 0.3;
                                        const strokeColor = isAxis ? "#94a3b8" : (isMajor ? "#cbd5e1" : "#e5e7eb");
                                        const strokeWidth = isAxis ? 1.5 : (isMajor ? 1 : 0.5);

                                        lines.push(
                                            <Line
                                                key={`v-${i}`}
                                                points={[i, -extent, i, extent]}
                                                stroke={strokeColor}
                                                strokeWidth={strokeWidth}
                                                opacity={baseOpacity}
                                                listening={false}
                                            />
                                        );
                                        lines.push(
                                            <Line
                                                key={`h-${i}`}
                                                points={[-extent, i, extent, i]}
                                                stroke={strokeColor}
                                                strokeWidth={strokeWidth}
                                                opacity={baseOpacity}
                                                listening={false}
                                            />
                                        );
                                    }
                                    return lines;
                                })()}
                                {placedItems.map(item => {
                                    const category = categories.find(c => c.id === item.categoryId);
                                    const isSelected = selectedIds.has(item.id);
                                    const isBooth = item.type === 'booth';
                                    const { w: boothW, h: boothH } = isBooth
                                        ? parseBoothSizePx(category?.boothSize)
                                        : { w: 40, h: 40 };

                                    return (
                                        <Group
                                            key={item.id}
                                            id={item.id}
                                            x={item.x}
                                            y={item.y}
                                            scaleX={item.scaleX}
                                            scaleY={item.scaleY}
                                            rotation={item.rotation}
                                            draggable={isOwner}
                                            onDragStart={() => {
                                                if (!isOwner) return;
                                                // Snapshot positions of all selected items at drag start
                                                const snap = {};
                                                placedItems.forEach(pi => {
                                                    if (selectedIds.has(pi.id)) snap[pi.id] = { x: pi.x, y: pi.y };
                                                });
                                                // If dragging an unselected item, select only it
                                                if (!selectedIds.has(item.id)) {
                                                    snap[item.id] = { x: item.x, y: item.y };
                                                    setSelectedIds(new Set([item.id]));
                                                    lastClickedIdRef.current = item.id;
                                                }
                                                dragStartPositions.current = snap;
                                            }}
                                            onDragMove={(e) => {
                                                const startPos = dragStartPositions.current[item.id];
                                                if (!startPos) return;

                                                let dx = e.target.x() - startPos.x;
                                                let dy = e.target.y() - startPos.y;

                                                // Real-time grid snapping
                                                if (snapToGrid) {
                                                    dx = Math.round(dx / GRID_SIZE) * GRID_SIZE;
                                                    dy = Math.round(dy / GRID_SIZE) * GRID_SIZE;
                                                    // Update leader position to stay on grid increments
                                                    e.target.x(startPos.x + dx);
                                                    e.target.y(startPos.y + dy);
                                                }

                                                // Move all other selected nodes in real-time imperatively
                                                if (selectedIds.size > 1) {
                                                    selectedIds.forEach(sid => {
                                                        if (sid === item.id) return;
                                                        const orig = dragStartPositions.current[sid];
                                                        if (!orig) return;
                                                        const node = stageRef.current?.findOne(`#${sid}`);
                                                        if (node) { node.x(orig.x + dx); node.y(orig.y + dy); }
                                                    });
                                                }
                                            }}
                                            onDragEnd={(e) => handleDragEnd(item.id, e.target.x(), e.target.y())}
                                            onClick={(e) => handleItemClick(item.id, e)}
                                            onTap={(e) => handleItemClick(item.id, e)}
                                        >
                                            {isBooth ? (
                                                <Rect
                                                    x={-boothW / 2}
                                                    y={-boothH / 2}
                                                    width={boothW}
                                                    height={boothH}
                                                    fill={item.status === 'sold' || item.status === 'reserved' ? '#22c55e' : (category?.color || '#666666')}
                                                    stroke={'#000'}
                                                    strokeWidth={1}
                                                    strokeScaleEnabled={false}
                                                    shadowBlur={isSelected ? 10 : 0}
                                                    shadowColor="#000"
                                                    shadowOpacity={0.2}
                                                />
                                            ) : (
                                                <Circle
                                                    radius={20}
                                                    fill={item.status === 'sold' || item.status === 'reserved' ? '#22c55e' : (category?.color || '#666666')}
                                                    stroke={'#fff'}
                                                    strokeWidth={1}
                                                    shadowBlur={isSelected ? 10 : 0}
                                                    shadowColor="#000"
                                                    shadowOpacity={0.2}
                                                />
                                            )}
                                            <Text
                                                text={item.label}
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
                                })}
                                {isOwner && selectedIds.size > 0 && (
                                    <Transformer
                                        ref={trRef}
                                        onTransformEnd={handleTransformEnd}
                                        rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
                                        boundBoxFunc={(oldBox, newBox) => {
                                            if (newBox.width < 10 || newBox.height < 10) return oldBox;
                                            return newBox;
                                        }}
                                    />
                                )}
                            </Layer>
                        </Stage>
                    </div>
                </div>
            </div>

            <ManageCategoryModal
                isOpen={isAddCategoryModalOpen}
                onClose={() => setIsAddCategoryModalOpen(false)}
                onSave={handleSaveCategory}
                editingCategory={editingCategory}
                eventType={selectedEvent?.eventType}
            />

            {/* ── Batch Placement Modal ── */}
            {batchModal && (() => {
                const cat = batchModal.category;
                const placedCount = placedItems.filter(i => i.categoryId === cat.id).length;
                const remaining = cat.quantity - placedCount;
                const safeCount = Math.max(1, Math.min(Number(batchCount) || 1, remaining));
                return (
                    <div className="batch-modal-overlay" onClick={() => setBatchModal(null)}>
                        <div className="batch-modal" onClick={e => e.stopPropagation()}>
                            <div className="batch-modal-header">
                                <div className="batch-modal-title">
                                    <span className="batch-cat-dot" style={{ background: cat.color }} />
                                    <h4>Place {cat.type.includes('Seat') ? 'Seats' : 'Booths'}</h4>
                                    <span className="batch-cat-name">{cat.name}</span>
                                </div>
                                <button className="batch-modal-close" onClick={() => setBatchModal(null)}>
                                    <Icon icon="mdi:close" />
                                </button>
                            </div>

                            <div className="batch-modal-body">
                                {/* Direction Toggle */}
                                <div className="batch-field">
                                    <label className="batch-label">Arrangement</label>
                                    <div className="batch-direction-toggle">
                                        <button
                                            className={`batch-dir-btn ${batchDirection === 'row' ? 'active' : ''}`}
                                            onClick={() => setBatchDirection('row')}
                                        >
                                            <Icon icon="mdi:arrow-right" />
                                            <span>Row (Horizontal)</span>
                                        </button>
                                        <button
                                            className={`batch-dir-btn ${batchDirection === 'column' ? 'active' : ''}`}
                                            onClick={() => setBatchDirection('column')}
                                        >
                                            <Icon icon="mdi:arrow-down" />
                                            <span>Column (Vertical)</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Preview strip */}
                                <div className="batch-preview">
                                    {Array.from({ length: Math.min(safeCount, 12) }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`batch-preview-dot ${batchDirection === 'column' ? 'col-mode' : ''}`}
                                            style={{
                                                background: cat.color,
                                                borderRadius: cat.type.includes('Seat') ? '50%' : '4px',
                                            }}
                                        />
                                    ))}
                                    {safeCount > 12 && <span className="batch-preview-more">+{safeCount - 12} more</span>}
                                </div>

                                <div className="batch-fields-grid">
                                    {/* Count */}
                                    <div className="batch-field">
                                        <label className="batch-label">
                                            <Icon icon="mdi:counter" /> Count
                                            <span className="batch-hint">max {remaining}</span>
                                        </label>
                                        <input
                                            id="batch-count"
                                            type="number" min="1" max={remaining}
                                            className="batch-input"
                                            value={batchCount}
                                            onChange={e => setBatchCount(Math.min(remaining, Math.max(1, Number(e.target.value))))}
                                        />
                                    </div>

                                    {/* Spacing */}
                                    <div className="batch-field">
                                        <label className="batch-label">
                                            <Icon icon="mdi:arrow-expand-horizontal" /> Spacing (px)
                                        </label>
                                        <input
                                            id="batch-spacing"
                                            type="number" min="20" max="500"
                                            className="batch-input"
                                            value={batchSpacing}
                                            onChange={e => setBatchSpacing(Number(e.target.value))}
                                        />
                                    </div>

                                    {/* Start X */}
                                    <div className="batch-field">
                                        <label className="batch-label">
                                            <Icon icon="mdi:map-marker" /> Start X
                                        </label>
                                        <input
                                            id="batch-start-x"
                                            type="number" min="0"
                                            className="batch-input"
                                            value={batchStartX}
                                            onChange={e => setBatchStartX(Number(e.target.value))}
                                        />
                                    </div>

                                    {/* Start Y */}
                                    <div className="batch-field">
                                        <label className="batch-label">
                                            <Icon icon="mdi:map-marker" /> Start Y
                                        </label>
                                        <input
                                            id="batch-start-y"
                                            type="number" min="0"
                                            className="batch-input"
                                            value={batchStartY}
                                            onChange={e => setBatchStartY(Number(e.target.value))}
                                        />
                                    </div>

                                    {/* Label start number */}
                                    <div className="batch-field">
                                        <label className="batch-label">
                                            <Icon icon="mdi:label-outline" /> Label Start #
                                        </label>
                                        <input
                                            id="batch-label-start"
                                            type="number" min="1"
                                            className="batch-input"
                                            value={batchLabelStart}
                                            onChange={e => setBatchLabelStart(Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                <div className="batch-info-row">
                                    <Icon icon="mdi:information-outline" />
                                    <span>Placing <strong>{safeCount}</strong> {cat.type.includes('Seat') ? 'seat' : 'booth'}{safeCount !== 1 ? 's' : ''} as a <strong>{batchDirection}</strong> — {remaining - safeCount} of {remaining} remaining units left after.</span>
                                </div>
                            </div>

                            <div className="batch-modal-footer">
                                <button className="batch-cancel-btn" onClick={() => setBatchModal(null)}>
                                    Cancel
                                </button>
                                <button className="batch-confirm-btn" onClick={handleConfirmBatchPlace}>
                                    <Icon icon="mdi:check-circle-outline" />
                                    Place {safeCount} {cat.type.includes('Seat') ? (safeCount === 1 ? 'Seat' : 'Seats') : (safeCount === 1 ? 'Booth' : 'Booths')}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {bgModalOpen && (
                <div className="bg-modal-overlay" onClick={() => setBgModalOpen(false)}>
                    <div className="bg-modal" onClick={(e) => e.stopPropagation()}>

                        <div className="bg-modal-header">
                            <h4><Icon icon="mdi:image-edit-outline" /> Floor Plan Settings</h4>
                            <button className="bg-modal-close" onClick={() => setBgModalOpen(false)}>
                                <Icon icon="mdi:close" />
                            </button>
                        </div>

                        <div className="bg-modal-body">
                            <img src={backgroundImage} alt="Floor plan" className="bg-modal-thumb" />

                            <button className="bg-fit-btn bg-fit-btn--full" onClick={handleFitToStage}>
                                <Icon icon="mdi:fit-to-screen-outline" />
                                <span>Fit to Canvas</span>
                            </button>

                            <label className="bg-opacity-label">
                                <Icon icon="mdi:opacity" />
                                <span>Opacity</span>
                                <span className="bg-opacity-value">{Math.round(bgOpacity * 100)}%</span>
                            </label>

                            <input
                                type="range" min="0.05" max="1" step="0.05"
                                value={bgOpacity}
                                onChange={(e) => setBgOpacity(parseFloat(e.target.value))}
                                className="bg-opacity-slider"
                            />

                            <div className="bg-modal-actions">
                                <button className="bt-btn" onClick={() => bgFileInputRef.current?.click()}>
                                    <Icon icon="mdi:image-edit-outline" /><span>Replace</span>
                                </button>
                                <button className="bt-btn clear" onClick={() => { handleRemoveBgImage(); setBgModalOpen(false); }}>
                                    <Icon icon="mdi:image-remove-outline" /><span>Remove</span>
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default PromoterBoothLayout;
