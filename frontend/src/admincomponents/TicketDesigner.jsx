import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Stage,
  Layer,
  Rect,
  Circle,
  Text,
  Group,
  Image as KonvaImage,
  Transformer
} from "react-konva";
import useImage from "use-image";
import { Icon } from "@iconify/react";
import { useEventsContext } from "../hooks/useEventsContext";
import { useAuthContext } from "../hooks/useAuthContext";
import priceLevelService from "../services/priceLevelService";
import { showSuccessAlert, showErrorAlert } from "../utils/sweetAlert";
import brandLogo from "../assets/Logo1.png";


const TICKET_WIDTH = 2047;
const TICKET_HEIGHT = 1000;

const DynamicImage = ({ id, url, x, y, width, height, scaleX, scaleY, rotation, opacity = 1, draggable, onClick, onTap, onDragEnd, onTransformEnd }) => {
  const [img] = useImage(url);

  useEffect(() => {
    if (url) {
      console.log(`DynamicImage [${id}] attempting to load:`, url);
    }
  }, [url, id]);

  if (!img) {
    // Fallback if image fails to load
    return (
      <Rect
        id={id}
        x={x} y={y}
        width={width} height={height}
        fill="#F5F5F5" stroke="#DDD"
        draggable={draggable}
        onClick={onClick} onTap={onTap}
        onDragEnd={onDragEnd} onTransformEnd={onTransformEnd}
      />
    );
  }
  return (
    <KonvaImage
      id={id}
      image={img}
      x={x}
      y={y}
      width={width}
      height={height}
      scaleX={scaleX || 1}
      scaleY={scaleY || 1}
      rotation={rotation || 0}
      opacity={opacity}
      draggable={draggable}
      onClick={onClick}
      onTap={onTap}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
    />
  );
};

const TicketDesigner = ({ selectedEvent }) => {
  const { dispatch } = useEventsContext();
  const { user } = useAuthContext();

  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [ticketItems, setTicketItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [zoom, setZoom] = useState(0.4);
  const [fitScale, setFitScale] = useState(0.4);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 });
  const [isStageDraggable, setIsStageDraggable] = useState(false);

  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const transformerRef = useRef(null);

  const selectedItem = useMemo(() =>
    ticketItems.find(i => i.id === selectedId),
    [ticketItems, selectedId]
  );

  // Handle Transformer
  useEffect(() => {
    if (selectedId && transformerRef.current) {
      const stage = transformerRef.current.getStage();
      const node = stage.findOne('#' + selectedId);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedId]);

  const handleAddText = () => {
    const newId = `text-${Date.now()}`;
    const newItem = {
      id: newId,
      type: 'text',
      x: 1000,
      y: 500,
      text: 'New Text',
      fontSize: 50,
      fill: '#000000',
      draggable: true
    };
    setTicketItems([...ticketItems, newItem]);
    setSelectedId(newId);
  };

  const handleDeleteItem = () => {
    if (!selectedId) return;
    setTicketItems(prev => prev.filter(i => i.id !== selectedId));
    setSelectedId(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return { dayName: 'Friday', day: '20', monthYear: 'Mar, 2026' };
    const d = new Date(dateStr);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const day = d.getDate().toString();
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return { dayName, day, monthYear: `${month}, ${year}` };
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '7:00 PM';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${minutes} ${ampm}`;
  };

  const priceLevels = useMemo(() => selectedEvent?.priceLevels || [], [selectedEvent]);
  const selectedCategory = useMemo(() =>
    priceLevels.find(pl => pl._id === selectedCategoryId),
    [priceLevels, selectedCategoryId]
  );

  // Auto-select category if there's only one and none is selected
  useEffect(() => {
    if (!selectedCategoryId && priceLevels.length > 0) {
      if (priceLevels.length === 1) {
        setSelectedCategoryId(priceLevels[0]._id);
      }
    }
  }, [priceLevels, selectedCategoryId]);

  // Initial load when category changes
  useEffect(() => {
    if (selectedCategoryId && selectedCategory) {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
      const eventImgUrl = selectedEvent?.image && selectedEvent.image !== "null"
        ? `${backendUrl}/uploads/${selectedEvent.image}`
        : "/assets/eventbg.jpg";

      const existingLayout = selectedEvent?.ticketLayouts?.find(l =>
        (l.priceLevelId?._id || l.priceLevelId)?.toString() === selectedCategoryId?.toString()
      );

      if (existingLayout && existingLayout.layout) {
        setTicketItems(existingLayout.layout);
      } else {
        // Create default template
        const eventDate = formatDate(selectedEvent?.startDate);
        const eventTime = formatTime(selectedEvent?.startTime);
        const venueStr = `${selectedEvent?.venue?.name || 'Venue'} - ${selectedEvent?.venue?.address || 'Address'}`;

        const defaultTemplate = [
          // Backgrounds
          { id: 'bg-border', type: 'rect', x: 0, y: 0, width: TICKET_WIDTH, height: TICKET_HEIGHT, fill: '#D32F2F', cornerRadius: 40 },
          { id: 'bg-main', type: 'rect', x: 20, y: 20, width: TICKET_WIDTH - 40, height: TICKET_HEIGHT - 40, fill: '#FFFFFF', cornerRadius: 30 },

          // Left Stripe
          { id: 'left-stripe', type: 'rect', x: 20, y: 20, width: 220, height: TICKET_HEIGHT - 40, fill: '#D32F2F', cornerRadius: { tl: 30, bl: 30 } },
          { id: 'brand-text', type: 'image', x: 30, y: 750, width: 500, height: 200, url: brandLogo, draggable: true, rotation: -90, fontStyle: 'bold' },

          // QR Code Area
          {
            id: 'qr-code',
            type: 'image',
            x: 300, y: 60,
            width: 350, height: 350,
            dynamicField: 'qrData',
            draggable: true
          },

          // Event Image
          {
            id: 'event-img',
            type: 'image',
            x: 300, y: 430,
            width: 350, height: 350,
            url: eventImgUrl,
            draggable: true
          },

          // Middle Content
          { id: 'event-title', type: 'text', x: 800, y: 100, text: selectedEvent?.title || 'Event Title', fontSize: 70, fontStyle: 'bold', width: 1000 },

          // Date & Time
          { id: 'date-label', type: 'text', x: 700, y: 220, text: formatDate(selectedEvent?.startDate).dayName, fontSize: 50 },
          { id: 'day-text', type: 'text', x: 700, y: 280, text: formatDate(selectedEvent?.startDate).day, fontSize: 100, fontStyle: 'bold' },
          { id: 'month-year', type: 'text', x: 700, y: 400, text: formatDate(selectedEvent?.startDate).monthYear, fontSize: 50 },
          { id: 'time-text', type: 'text', x: 700, y: 460, text: formatTime(selectedEvent?.startTime), fontSize: 50 },

          // Vertical Divider
          { id: 'divider-1', type: 'rect', x: 950, y: 220, width: 2, height: 300, fill: '#000' },

          // Seat Info
          { id: 'category-name', type: 'text', x: 1000, y: 220, text: selectedCategory.priceName || 'Category', fontSize: 70, fontStyle: 'bold' },
          { id: 'category-sub', type: 'text', x: 1000, y: 330, text: selectedCategory.type?.startsWith('Seat') ? 'Seat' : 'Booth', fontSize: 50, color: '#666' },
          { id: 'seat-label', type: 'text', x: 1000, y: 400, text: '1', fontSize: 60, fontStyle: 'bold' },
          { id: 'price-text', type: 'text', x: 1000, y: 470, text: selectedCategory.facePrice > 0 ? `$${selectedCategory.facePrice}` : 'FREE', fontSize: 60, fontStyle: 'bold' },

          // Venue
          { id: 'venue-name', type: 'text', x: 400, y: 800, width: 1400, text: `${selectedEvent?.venue?.name || 'Venue'} - ${selectedEvent?.venue?.address || 'Address'}`, fontSize: 50, align: 'center', fontStyle: 'bold' },
          { id: 'disclaimer', type: 'text', x: 400, y: 870, width: 1400, text: 'Print this e-Ticket in color or black/white or show it on your phone. You will not get admitted without this ticket.', fontSize: 30, align: 'center' },

          // Barcode Area
          {
            id: 'barcode-img',
            type: 'image',
            x: 1880, y: 150,
            width: 100, height: 700,
            dynamicField: 'qrData',
            draggable: true
          },
        ];
        setTicketItems(defaultTemplate);
      }
    } else {
      setTicketItems([]);
    }
  }, [selectedCategoryId]);

  // Sync dynamic data when event or category changes, WITHOUT wiping ticketItems
  useEffect(() => {
    if (!selectedCategoryId || ticketItems.length === 0) return;

    const eventDate = formatDate(selectedEvent?.startDate);
    const eventTime = formatTime(selectedEvent?.startTime);
    const venueStr = `${selectedEvent?.venue?.name || 'Venue'} - ${selectedEvent?.venue?.address || 'Address'}`;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
    const eventImgUrl = selectedEvent?.image && selectedEvent.image !== "null"
      ? `${backendUrl}/uploads/${selectedEvent.image}`
      : "/assets/eventbg.jpg";

    setTicketItems(prev => prev.map(item => {
      if (item.id === 'event-title') return { ...item, text: selectedEvent?.title || item.text };
      if (item.id === 'date-label') return { ...item, text: eventDate.dayName };
      if (item.id === 'day-text') return { ...item, text: eventDate.day };
      if (item.id === 'month-year') return { ...item, text: eventDate.monthYear };
      if (item.id === 'time-text') return { ...item, text: eventTime };
      if (item.id === 'venue-name') return { ...item, text: venueStr };
      if (item.id === 'category-name') return { ...item, text: selectedCategory?.priceName || item.text };
      if (item.id === 'category-sub') {
        const typePrefix = selectedCategory?.type?.startsWith('Seat') ? 'Seat' : 'Booth';
        return { ...item, text: typePrefix };
      }
      if (item.id === 'event-img') return { ...item, url: eventImgUrl };
      if (item.id === 'qr-code' || item.id === 'qr-placeholder') {
        // Use the selected category ID as a sample QR data for the preview
        const sampleQrData = selectedCategory?._id || '69fe2165325a962577aba0c9';
        return {
          ...item,
          id: 'qr-code',
          type: 'image',
          url: `https://bwipjs-api.metafloor.com/?bcid=qrcode&text=${sampleQrData}`,
          dynamicField: 'qrData'
        };
      }
      if (item.id === 'barcode-img') {
        const sampleQrData = selectedCategory?._id || '69fe2165325a962577aba0c9';
        return {
          ...item,
          url: `https://bwipjs-api.metafloor.com/?bcid=code128&text=${sampleQrData}&includetext=false&rotate=R`,
          dynamicField: 'qrData'
        };
      }
      if (item.id === 'price-text') return { ...item, text: selectedCategory?.facePrice > 0 ? `$${selectedCategory.facePrice}` : 'FREE' };
      if (item.id === 'brand-logo') return { ...item, url: brandLogo };
      return item;
    }));
  }, [selectedEvent, selectedCategory]);

  // Hidden QR Code Generator for local rendering consistency
  const [localQrUrl, setLocalQrUrl] = useState(null);
  useEffect(() => {
    // This creates a data URL from a temporary canvas to match QRCodeCanvas look
    const canvas = document.createElement('canvas');
    const qrText = "RESERVATION-QR-DATA";
    // We can't easily use QRCodeCanvas here without mounting it, 
    // so we'll stick to the URL for the Designer's internal Konva state 
    // BUT we will ensure the final output matches.
  }, []);

  // Handle Container Resize and Fit Scale
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const cw = containerRef.current.clientWidth;
        const ch = containerRef.current.clientHeight;
        setContainerSize({ w: cw, h: ch });

        // Calculate scale to fit 2047x1000 into cw x ch with some padding
        const padding = 40;
        const scaleX = (cw - padding) / TICKET_WIDTH;
        const scaleY = (ch - padding) / TICKET_HEIGHT;
        const newFitScale = Math.min(scaleX, scaleY);

        setFitScale(newFitScale);

        // If first load or category change, set to fit
        setZoom(newFitScale);
        setStagePos({
          x: (cw - TICKET_WIDTH * newFitScale) / 2,
          y: (ch - TICKET_HEIGHT * newFitScale) / 2
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedCategoryId]);

  const handleFitToScreen = useCallback(() => {
    setZoom(fitScale);
    setStagePos({
      x: (containerSize.w - TICKET_WIDTH * fitScale) / 2,
      y: (containerSize.h - TICKET_HEIGHT * fitScale) / 2
    });
  }, [fitScale, containerSize]);

  const handleSave = async () => {
    if (!selectedCategoryId || !user?.token) return;
    setIsSaving(true);
    const themeColor = ticketItems.find(i => i.id === 'bg-border')?.fill || '#D32F2F';
    try {
      const result = await priceLevelService.updatePriceLevel(
        selectedEvent._id,
        selectedCategoryId,
        {
          ticketDesign: ticketItems,
          themeColor: themeColor
        },
        user.token
      );

      // Update global context
      if (result.event) {
        dispatch({ type: 'UPDATE_EVENT', payload: result.event });
      }

      showSuccessAlert("Saved", "Ticket design updated successfully!");
    } catch (err) {
      console.error("Save error:", err);
      showErrorAlert("Error", err.message || "Failed to save ticket design.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncData = async () => {
    if (!selectedEvent?._id || !user?.token) return;
    setIsSyncing(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
      const response = await fetch(`${backendUrl}/api/events/${selectedEvent._id}`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      const data = await response.json();
      if (response.ok && data) {
        // Update global context first
        dispatch({ type: 'UPDATE_EVENT', payload: data });
        
        // Find the current category in the new data
        const updatedPriceLevels = data.priceLevels || [];
        const updatedCat = updatedPriceLevels.find(pl => pl._id === selectedCategoryId);
        
        if (updatedCat) {
            const eventDate = formatDate(data.startDate);
            const eventTime = formatTime(data.startTime);
            const venueStr = `${data.venue?.name || 'Venue'} - ${data.venue?.address || 'Address'}`;
            const eventImgUrl = data.image && data.image !== "null"
              ? `${backendUrl}/uploads/${data.image}`
              : "/assets/eventbg.jpg";

            setTicketItems(prev => prev.map(item => {
              if (item.id === 'event-title') return { ...item, text: data.title || item.text };
              if (item.id === 'date-label') return { ...item, text: eventDate.dayName };
              if (item.id === 'day-text') return { ...item, text: eventDate.day };
              if (item.id === 'month-year') return { ...item, text: eventDate.monthYear };
              if (item.id === 'time-text') return { ...item, text: eventTime };
              if (item.id === 'venue-name') return { ...item, text: venueStr };
              if (item.id === 'category-name') return { ...item, text: updatedCat.priceName || item.text };
              if (item.id === 'category-sub') {
                const typePrefix = updatedCat.type?.startsWith('Seat') ? 'Seat' : 'Booth';
                return { ...item, text: typePrefix };
              }
              if (item.id === 'event-img') return { ...item, url: eventImgUrl };
              if (item.id === 'qr-code' || item.id === 'qr-placeholder') {
                return {
                  ...item,
                  id: 'qr-code',
                  type: 'image',
                  url: `https://bwipjs-api.metafloor.com/?bcid=qrcode&text=${updatedCat._id}`,
                  dynamicField: 'qrData'
                };
              }
              if (item.id === 'barcode-img') {
                return {
                  ...item,
                  url: `https://bwipjs-api.metafloor.com/?bcid=code128&text=${updatedCat._id}&includetext=false&rotate=R`,
                  dynamicField: 'qrData'
                };
              }
              if (item.id === 'price-text') return { ...item, text: updatedCat.facePrice > 0 ? `$${updatedCat.facePrice}` : 'FREE' };
              return item;
            }));
        }

        showSuccessAlert("Synced", "Event data and ticket layout refreshed!");
      } else {
        throw new Error(data.message || "Failed to sync");
      }
    } catch (err) {
      console.error("Sync error:", err);
      showErrorAlert("Error", err.message || "Failed to sync event data.");
    } finally {
      setIsSyncing(false);
    }
  };

  const updateItem = (id, updates) => {
    setTicketItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleDragEnd = (e, id) => {
    updateItem(id, { x: e.target.x(), y: e.target.y() });
  };

  const handleTransformEnd = (e, id) => {
    const node = e.target;
    updateItem(id, {
      x: node.x(),
      y: node.y(),
      scaleX: node.scaleX(),
      scaleY: node.scaleY(),
      rotation: node.rotation(),
    });
  };

  return (
    <div className="layout-builder-container unified-view">
      <div className="builder-main">
        <div className="builder-sidebar">
          <div className="sidebar-card categories-card">
            <div className="sidebar-header">
              <h4 className="bt-section-title-layout">Ticket Categories</h4>
            </div>
            <div className="sidebar-categories-list" style={{ marginTop: '15px' }}>
              {priceLevels.length === 0 ? (
                <div className="sidebar-empty-state">No categories defined</div>
              ) : (
                priceLevels.map(cat => (
                  <div
                    key={cat._id}
                    className={`sidebar-cat-item ${selectedCategoryId === cat._id ? 'active' : ''}`}
                    onClick={() => setSelectedCategoryId(cat._id)}
                    style={{
                      padding: '12px',
                      cursor: 'pointer',
                      borderLeft: selectedCategoryId === cat._id ? `4px solid ${cat.color}` : '4px solid transparent',
                      background: selectedCategoryId === cat._id ? '#f0f7ff' : 'transparent'
                    }}
                  >
                    <div className="cat-palette-visual" style={{ backgroundColor: cat.color, width: '24px', height: '24px' }}></div>
                    <div className="cat-details">
                      <span className="cat-name" style={{ fontWeight: selectedCategoryId === cat._id ? 'bold' : 'normal' }}>
                        {cat.priceName}
                      </span>
                      <span className="price">${cat.facePrice?.toFixed(2)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {selectedCategoryId && (
            <div className="sidebar-card summary-card" style={{ marginTop: '20px' }}>
              <div className="sidebar-header">
                <h4 className="bt-section-title-layout">Designer Tools</h4>
              </div>
              <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button className="outlined-button w-100" style={{ color: 'var(--color-black-primary) ' }} onClick={handleAddText}>
                    <Icon icon="mdi:text-box-plus-outline" /> Text
                  </button>
                  <button
                    className="outlined-button w-100 text-red" style={{ color: 'var(--color-red-primary) ' }}
                    onClick={handleDeleteItem}
                    disabled={!selectedId || ['bg-border', 'bg-main', 'left-stripe'].includes(selectedId)}
                  >
                    <Icon icon="mdi:delete-outline" /> Delete
                  </button>
                </div>

                <div style={{ marginTop: '5px' }}>
                  <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Ticket Theme Color</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="color"
                      style={{ width: '45px', height: '35px', padding: '2px', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'transparent' }}
                      value={ticketItems.find(i => i.id === 'bg-border')?.fill || '#D32F2F'}
                      onChange={e => {
                        const themeColor = e.target.value;
                        setTicketItems(prev => prev.map(item =>
                          ['bg-border', 'left-stripe'].includes(item.id)
                            ? { ...item, fill: themeColor }
                            : item
                        ));
                      }}
                    />
                    <input
                      type="text"
                      style={{ flex: 1, padding: '8px', fontSize: '13px', borderRadius: '4px', border: '1px solid var(--color-black-primary)', backgroundColor: 'var(--color-white-primary)', color: 'var(--color-black-primary)' }}
                      value={ticketItems.find(i => i.id === 'bg-border')?.fill || 'none'}
                      onChange={e => {
                        const themeColor = e.target.value;
                        setTicketItems(prev => prev.map(item =>
                          ['left-stripe'].includes(item.id)
                            ? { ...item, fill: themeColor }
                            : item
                        ));
                      }}
                    />
                  </div>
                </div>

                <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #eee' }} />

                {selectedItem && (
                  <div className="properties-panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <h6 style={{ margin: '0', fontSize: '12px', textTransform: 'uppercase', color: '#999' }}>Properties</h6>

                    {selectedItem.type === 'text' && (
                      <>
                        <div>
                          <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Text Content</label>
                          <textarea
                            style={{ width: '100%', padding: '8px', fontSize: '13px', borderRadius: '4px', border: '1px solid #ddd' }}
                            value={selectedItem.text}
                            onChange={e => updateItem(selectedId, { text: e.target.value })}
                            rows={2}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Font Size</label>
                          <input
                            type="number"
                            style={{ width: '100%', padding: '8px', fontSize: '13px', borderRadius: '4px', border: '1px solid #ddd' }}
                            value={selectedItem.fontSize}
                            onChange={e => updateItem(selectedId, { fontSize: parseInt(e.target.value) || 10 })}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Font Style</label>
                          <select
                            style={{ width: '100%', padding: '8px', fontSize: '13px', borderRadius: '4px', border: '1px solid #ddd' }}
                            value={selectedItem.fontStyle || 'normal'}
                            onChange={e => updateItem(selectedId, { fontStyle: e.target.value })}
                          >
                            <option value="normal">Normal</option>
                            <option value="bold">Bold</option>
                            <option value="italic">Italic</option>
                            <option value="bold italic">Bold Italic</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Color</label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="color"
                              style={{ width: '45px', height: '35px', padding: '2px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                              value={selectedItem.fill}
                              onChange={e => updateItem(selectedId, { fill: e.target.value })}
                            />
                            <input
                              type="text"
                              style={{ flex: 1, padding: '8px', fontSize: '13px', borderRadius: '4px', border: '1px solid #ddd' }}
                              value={selectedItem.fill}
                              onChange={e => updateItem(selectedId, { fill: e.target.value })}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {selectedItem.type === 'rect' && (
                      <div>
                        <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Color</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="color"
                            style={{ width: '45px', height: '35px', padding: '2px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                            value={selectedItem.fill}
                            onChange={e => updateItem(selectedId, { fill: e.target.value })}
                          />
                          <input
                            type="text"
                            style={{ flex: 1, padding: '8px', fontSize: '13px', borderRadius: '4px', border: '1px solid #ddd' }}
                            value={selectedItem.fill}
                            onChange={e => updateItem(selectedId, { fill: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #eee' }} />

                <button
                  className="primary-button w-100"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Icon icon={isSaving ? "line-md:loading-twotone-loop" : "mdi:content-save"} />
                  {isSaving ? " Saving..." : " Save Template"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="canvas-area" style={{ background: '#f5f5f5' }}>
          <div className="canvas-toolbar">
            <h4 className="canvas-title">
              {selectedCategory ? `Designing: ${selectedCategory.priceName}` : "Select a category to design"}
            </h4>
            <div className="zoom-controls">
              <button
                className={`bt-btn sync-btn-small ${isSyncing ? 'spinning' : ''}`}
                onClick={handleSyncData}
                disabled={isSyncing}
                title="Sync Event Data with Database"
                style={{ marginRight: '10px', display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 8px', height: 'auto' }}
              >
                <Icon icon={isSyncing ? "mdi:loading" : "mdi:sync"} className={isSyncing ? "spin" : ""} />
                <span style={{ fontSize: '11px' }}>{isSyncing ? 'Syncing...' : 'Sync Data'}</span>
              </button>
              <button
                className={`bt-btn ${isStageDraggable ? 'active' : ''}`}
                onClick={() => setIsStageDraggable(!isStageDraggable)}
                title={isStageDraggable ? "Disable Stage Pan" : "Enable Stage Pan"}
              >
                <Icon icon={isStageDraggable ? "mdi:hand-back-right" : "mdi:hand-back-right-off"} />
              </button>
              <button className="bt-btn" onClick={handleFitToScreen} title="Fit to Screen">
                <Icon icon="mdi:fullscreen-exit" />
              </button>
              <button className="bt-btn" onClick={() => setZoom(z => Math.max(z - 0.05, 0.01))}>
                <Icon icon="mdi:minus" />
              </button>
              <span className="zoom-value">{Math.round(zoom * 100)}%</span>
              <button className="bt-btn" onClick={() => setZoom(z => Math.min(z + 0.05, 2))}>
                <Icon icon="mdi:plus" />
              </button>
            </div>
          </div>

          <div className="konva-container" ref={containerRef} style={{ overflow: 'hidden' }}>
            {selectedCategoryId ? (
              <Stage
                width={containerSize.w}
                height={containerSize.h}
                scaleX={zoom}
                scaleY={zoom}
                x={stagePos.x}
                y={stagePos.y}
                draggable={isStageDraggable}
                onDragEnd={e => {
                  if (e.target === stageRef.current) {
                    setStagePos({ x: e.target.x(), y: e.target.y() });
                  }
                }}
                onMouseDown={(e) => {
                  const clickedOnEmpty = e.target === e.target.getStage();
                  if (clickedOnEmpty) setSelectedId(null);
                }}
                onWheel={(e) => {
                  e.evt.preventDefault();
                  const stage = e.target.getStage();
                  const oldScale = zoom;
                  const pointer = stage.getPointerPosition();
                  const mousePointTo = {
                    x: (pointer.x - stage.x()) / oldScale,
                    y: (pointer.y - stage.y()) / oldScale,
                  };
                  const newScale = Math.min(1, Math.max(0.05, e.evt.deltaY > 0 ? oldScale - 0.02 : oldScale + 0.02));
                  setZoom(newScale);
                  setStagePos({
                    x: pointer.x - mousePointTo.x * newScale,
                    y: pointer.y - mousePointTo.y * newScale,
                  });
                }}
              >
                <Layer>
                  {ticketItems.map(item => {
                    if (item.type === 'rect') {
                      return (
                        <Rect
                          key={item.id}
                          id={item.id}
                          {...item}
                          draggable={!['bg-border', 'bg-main', 'left-stripe'].includes(item.id)}
                          onClick={() => setSelectedId(item.id)}
                          onTap={() => setSelectedId(item.id)}
                          onDragEnd={e => handleDragEnd(e, item.id)}
                          onTransformEnd={e => handleTransformEnd(e, item.id)}
                        />
                      );
                    }
                    if (item.type === 'text') {
                      return (
                        <Text
                          key={item.id}
                          id={item.id}
                          {...item}
                          draggable
                          onClick={() => setSelectedId(item.id)}
                          onTap={() => setSelectedId(item.id)}
                          onDragEnd={e => handleDragEnd(e, item.id)}
                          onTransformEnd={e => handleTransformEnd(e, item.id)}
                        />
                      );
                    }
                    if (item.type === 'image') {
                      return (
                        <DynamicImage
                          key={item.id}
                          {...item}
                          draggable
                          onClick={() => setSelectedId(item.id)}
                          onTap={() => setSelectedId(item.id)}
                          onDragEnd={e => handleDragEnd(e, item.id)}
                          onTransformEnd={e => handleTransformEnd(e, item.id)}
                        />
                      );
                    }
                    if (item.type === 'placeholder') {
                      return (
                        <Group
                          key={item.id}
                          id={item.id}
                          x={item.x} y={item.y}
                          draggable
                          onClick={() => setSelectedId(item.id)}
                          onTap={() => setSelectedId(item.id)}
                          onDragEnd={e => handleDragEnd(e, item.id)}
                          onTransformEnd={e => handleTransformEnd(e, item.id)}
                        >
                          <Rect
                            width={item.width} height={item.height}
                            fill="#F0F0F0" stroke="#999" strokeDash={[5, 5]}
                          />
                          <Text
                            width={item.width} height={item.height}
                            text={item.subType?.toUpperCase()}
                            align="center" verticalAlign="middle"
                            fontSize={20}
                          />
                        </Group>
                      );
                    }
                    return null;
                  })}
                  {selectedId && (
                    <Transformer
                      ref={transformerRef}
                      boundBoxFunc={(oldBox, newBox) => {
                        if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
                          return oldBox;
                        }
                        return newBox;
                      }}
                    />
                  )}
                </Layer>
              </Stage>
            ) : (
              <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999'
              }}>
                <Icon icon="mdi:ticket-outline" width="64" />
                <p>Select a ticket category from the sidebar to start designing</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDesigner;
