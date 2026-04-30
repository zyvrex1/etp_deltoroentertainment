import React, { useState, useRef, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import { Stage, Layer, Circle, Text, Group, Rect, Line, Transformer, Image as KonvaImage } from "react-konva";
import { useAuthContext } from "../hooks/useAuthContext";
import { useEventsContext } from "../hooks/useEventsContext";
import "./LayoutBuilder.css";
import ManageCategoryModal from "./Modal/ManageCategoryModal";
import priceLevelService from "../services/priceLevelService";

import { showDeleteConfirmAlert, showSuccessAlert, showErrorAlert } from "../utils/sweetAlert";

const LayoutBuilder = ({ selectedEvent }) => {
  const { user } = useAuthContext();
  const { dispatch } = useEventsContext();
  const [isInspectorExpanded, setIsInspectorExpanded] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [placedItems, setPlacedItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [fitScale, setFitScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 });
  const [snapToGrid, setSnapToGrid] = useState(true);
  const stageRef = useRef(null);
  const trRef = useRef(null);
  const [isSyncing, setIsSyncing] = useState(false);

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
      const response = await fetch(`/api/events/${selectedEvent._id}/sync-booths`, {
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

  const handlePlaceItem = (category) => {
    const placedCount = placedItems.filter(i => i.categoryId === category.id).length;
    if (placedCount >= category.quantity) {
      showErrorAlert("Limit Reached", "All units for this category have been placed.");
      return;
    }

    const newItem = {
      id: `item-${Date.now()}`,
      categoryId: category.id,
      label: `${category.name.length > 5 ? category.name.substring(0, 3).toUpperCase() : category.name}-${placedCount + 1}`,
      x: 100,
      y: 100,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      type: category.type.includes("Seat") ? "seat" : "booth",
      isBooth: !category.type.includes("Seat"),
      isSeat: category.type.includes("Seat"),
    };

    pushHistory([...placedItems]);
    setPlacedItems([...placedItems, newItem]);
    setSelectedId(newItem.id);
  };

  useEffect(() => {
    if (trRef.current) {
      if (selectedId) {
        const node = stageRef.current.findOne(`#${selectedId}`);
        if (node) {
          trRef.current.nodes([node]);
          trRef.current.getLayer().batchDraw();
        }
      } else {
        trRef.current.nodes([]);
        trRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedId]);

  const handleTransformEnd = (e) => {
    const node = e.target;
    const id = node.id();

    pushHistory([...placedItems]);
    setPlacedItems(placedItems.map(item =>
      item.id === id ? {
        ...item,
        x: node.x(),
        y: node.y(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
        rotation: node.rotation(),
      } : item
    ));
  };

  const handleDragEnd = (id, x, y) => {
    let newX = x;
    let newY = y;

    if (snapToGrid) {
      newX = Math.round(x / GRID_SIZE) * GRID_SIZE;
      newY = Math.round(y / GRID_SIZE) * GRID_SIZE;
    }

    pushHistory([...placedItems]);
    setPlacedItems(placedItems.map(item =>
      item.id === id ? { ...item, x: newX, y: newY } : item
    ));
  };

  const handleSaveLayout = async () => {
    if (!user) return showErrorAlert("Unauthorized", "You must be logged in.");

    const priceLevels = categories.map(c => ({
      _id: (c.id && c.id.length === 24) ? c.id : undefined,
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

    const payload = {
      priceLevels,
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
      const response = await fetch(`/api/events/${selectedEvent._id}`, {
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
    const item = placedItems.find(i => i.id === id);
    if (item && (item.status === 'sold' || item.status === 'reserved')) {
      showErrorAlert("Protected Booth", "This booth has already been sold/reserved and cannot be removed from the map.");
      return;
    }
    pushHistory([...placedItems]);
    setPlacedItems(placedItems.filter(item => item.id !== id));
    setSelectedId(null);
  };

  const totalPlaced = placedItems.length;
  const potentialRevenue = categories.reduce((sum, c) => sum + (c.price * c.quantity), 0);
  const currentRevenue = placedItems.reduce((sum, item) => {
    const cat = categories.find(c => c.id === item.categoryId);
    return sum + (cat ? cat.price : 0);
  }, 0);

  // Keyboard shortcuts: Ctrl+Z = undo, Ctrl+Y = redo
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = e.target.tagName;
      // Don't intercept while typing in inputs
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.ctrlKey && e.key === 'z') {
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
      <div className="builder-main">
        <div className="builder-sidebar">
          <div className="sidebar-card categories-card">
            <div className="sidebar-header">
              <h4 className="bt-section-title-layout">Ticket Categories</h4>
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
            </div>

            <div className="sidebar-categories-list">
              {categories.length === 0 ? (
                <div className="sidebar-empty-state">
                  <p>No categories yet. Click "Add" to start.</p>
                </div>
              ) : (
                categories.map(cat => {
                  const placed = placedItems.filter(i => i.categoryId === cat.id).length;
                  const remaining = cat.quantity - placed;
                  const isFull = remaining <= 0;

                  return (
                    <div key={cat.id} className={`sidebar-cat-item ${isFull ? 'is-full' : ''}`}>
                      <div
                        className="cat-palette-visual"
                        style={{ backgroundColor: cat.color }}
                        onClick={() => !isFull && handlePlaceItem(cat)}
                        title={isFull ? "All units placed" : "Click to place on map"}
                      >
                        {cat.type.includes("Seat") ? <Icon icon="mdi:circle" /> : <Icon icon="mdi:square" />}
                      </div>

                      <div className="cat-details">
                        <div className="cat-top">
                          <span className="cat-name">{cat.name}</span>
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
                        </div>
                        <div className="cat-meta">
                          <span className="price">${cat.price.toFixed(2)}</span>
                          <span className="count">{placed}/{cat.quantity} units</span>
                          {cat.boothSize && <span className="size-badge">{cat.boothSize}</span>}
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${(placed / cat.quantity) * 100}%`,
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

          {selectedId && (
            <div className="sidebar-card inspector-card">
              <div className="sidebar-header">
                <h4 className="bt-section-title-layout">Shape Inspector</h4>
                <button className="close-btn" onClick={() => setSelectedId(null)}>
                  <Icon icon="mdi:close" />
                </button>
              </div>
              <div className="inspector-body">
                {(() => {
                  const item = placedItems.find(i => i.id === selectedId);
                  const cat = categories.find(c => c.id === item?.categoryId);
                  if (!item) return null;
                  return (
                    <>
                      <div className="inspector-header-main" onClick={() => setIsInspectorExpanded(!isInspectorExpanded)} style={{ cursor: 'pointer' }}>
                        <span className="shape-id">
                          {item.label}
                          <Icon icon={isInspectorExpanded ? "mdi:chevron-up" : "mdi:chevron-down"} className="mobile-only-icon" style={{ marginLeft: '4px', verticalAlign: 'middle', fontSize: '20px' }} />
                        </span>
                        <span className={`value-badge type-${item.type}`}>{cat?.type.toLowerCase().split(' ')[0]}</span>
                      </div>

                      <div className={`summary-list ${isInspectorExpanded ? 'expanded' : ''}`}>
                        <div className="summary-item">
                          <span className="label">Status</span>
                          <span className={`value status-${item.status || 'available'}`}>{item.status?.toUpperCase() || 'AVAILABLE'}</span>
                        </div>
                        {item.reservedBy && (
                          <>
                            <div className="summary-item mobile-collapsible">
                              <span className="label">Buyer</span>
                              <span className="value-semi" style={{ color: 'var(--color-green-primary)' }}>{item.reservedBy}</span>
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
                        <div className="summary-item mobile-collapsible">
                          <span className="label">Category</span>
                          <span className="value">{cat?.name}</span>
                        </div>
                        <div className="summary-item mobile-collapsible">
                          <span className="label">Price</span>
                          <span className="value-bold">${cat?.price.toFixed(2)}</span>
                        </div>
                        {cat?.boothSize && (
                          <div className="summary-item mobile-collapsible">
                            <span className="label">Size</span>
                            <span className="value">{cat.boothSize}</span>
                          </div>
                        )}
                      </div>
                      <button
                        className={`remove-shape-btn-side ${(item.status === 'sold' || item.status === 'reserved') ? 'disabled' : ''}`}
                        onClick={() => removePlacedItem(selectedId)}
                        disabled={item.status === 'sold' || item.status === 'reserved'}
                      >
                        <Icon icon="mdi:trash-can-outline" /> {(item.status === 'sold' || item.status === 'reserved') ? 'Sold (Locked)' : 'Remove from Map'}
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

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
            <h4 className="canvas-title">{selectedEvent?.venue?.name || "Venue Map"}</h4>
            <div className="toolbar-actions">
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

              <button
                className={`bt-btn ${snapToGrid ? 'active' : ''}`}
                onClick={() => setSnapToGrid(!snapToGrid)}
                title="Toggle Snap to Grid"
              >
                <Icon icon="mdi:grid" /> <span>Snap</span>
              </button>

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
              onClick={(e) => {
                if (e.target === e.target.getStage()) {
                  setSelectedId(null);
                }
              }}
              onTap={(e) => {
                if (e.target === e.target.getStage()) {
                  setSelectedId(null);
                }
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
                  const isSelected = selectedId === item.id;
                  const isBooth = item.type === 'booth';

                  return (
                    <Group
                      key={item.id}
                      id={item.id}
                      x={item.x}
                      y={item.y}
                      scaleX={item.scaleX}
                      scaleY={item.scaleY}
                      rotation={item.rotation}
                      draggable
                      dragBoundFunc={(pos) => {
                        // pos is in stage (screen) coords; convert to canvas coords
                        const canvasX = (pos.x - stagePos.x) / zoom;
                        const canvasY = (pos.y - stagePos.y) / zoom;

                        const pad = 20;
                        let clampedX = Math.max(pad, Math.min(canvasX, canvasWidth - pad));
                        let clampedY = Math.max(pad, Math.min(canvasY, canvasHeight - pad));

                        if (snapToGrid) {
                          clampedX = Math.round(clampedX / GRID_SIZE) * GRID_SIZE;
                          clampedY = Math.round(clampedY / GRID_SIZE) * GRID_SIZE;
                        }

                        // Convert back to stage coords
                        return {
                          x: clampedX * zoom + stagePos.x,
                          y: clampedY * zoom + stagePos.y,
                        };
                      }}
                      onDragEnd={(e) => handleDragEnd(item.id, e.target.x(), e.target.y())}
                      onTransformEnd={handleTransformEnd}
                      onClick={() => setSelectedId(item.id)}
                      onTap={() => setSelectedId(item.id)}
                    >
                      {isBooth ? (
                        <Rect
                          x={-20}
                          y={-20}
                          width={40}
                          height={40}
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
                  );
                })}
                {selectedId && (
                  <Transformer
                    ref={trRef}
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
      />

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

export default LayoutBuilder;
