import React, { useMemo, useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import "./SetupBoothLayoutModal.css";
import { showConfirmAlert, showSuccessAlert, showCancelConfirmAlert } from "../utils/sweetAlert";

const BOOTH_TYPES = [
  { value: "vip", label: "VIP Booth" },
  { value: "inline", label: "Inline Booth" },
  { value: "corner", label: "Corner Booth" },
];

const DIMENSIONS = [
  { value: "10x10", label: "10 × 10" },
  { value: "10x20", label: "10 × 20" },
  { value: "20x20", label: "20 × 20" },
];

const generateBoothCodes = (rows, cols) => {
  const result = [];

  for (let r = 1; r <= rows; r += 1) {
    const rowCodes = [];
    for (let c = 1; c <= cols; c += 1) {
      // Generate codes like 101, 102, 103... 201, 202, etc.
      const code = `${r}${String(c).padStart(2, '0')}`;
      rowCodes.push(code);
    }
    result.push(rowCodes);
  }

  return result;
};

const SetupBoothLayoutModal = ({ isOpen, onClose, onSave }) => {
  const [boothType, setBoothType] = useState("corner");
  const [dimension, setDimension] = useState("10x10");
  const [price, setPrice] = useState("3000");
  const [rows, setRows] = useState(5);
  const [cols, setCols] = useState(7);
  const [selectedCodes, setSelectedCodes] = useState(() => new Set());

  const quantity = useMemo(() => selectedCodes.size, [selectedCodes]);

  // Generate booth codes matrix dynamically based on current rows/cols
  const boothCodesMatrix = useMemo(() => generateBoothCodes(rows, cols), [rows, cols]);

  // Clean up selected codes that no longer exist when grid size changes
  useEffect(() => {
    const allCodes = new Set(boothCodesMatrix.flat());
    setSelectedCodes((prev) => {
      const filtered = new Set();
      prev.forEach((code) => {
        if (allCodes.has(code)) {
          filtered.add(code);
        }
      });
      return filtered;
    });
  }, [boothCodesMatrix]);

  if (!isOpen) return null;

  const toggleCode = (code) => {
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const addRow = () => {
    setRows((prev) => Math.min(prev + 1, 20)); // Max 20 rows
  };

  const removeRow = () => {
    setRows((prev) => Math.max(prev - 1, 1)); // Min 1 row
  };

  const addCol = () => {
    setCols((prev) => Math.min(prev + 1, 20)); // Max 20 columns
  };

  const removeCol = () => {
    setCols((prev) => Math.max(prev - 1, 1)); // Min 1 column
  };

  const handleSave = async () => {
    const result = await showConfirmAlert(
      'Save Layout Changes?',
      `Are you sure you want to save this booth layout configuration? This will affect ${quantity} booths.`,
      'Yes, save changes',
      'Cancel'
    );
    
    if (!result.isConfirmed) {
      return;
    }
    
    const payload = {
      boothType,
      dimension,
      price: Number(price) || 0,
      quantity,
      selectedCodes: Array.from(selectedCodes),
    };

    try {
      if (onSave) {
        onSave(payload);
      }
      await showSuccessAlert('Layout Saved', 'The booth layout has been saved successfully.');
      onClose();
    } catch (error) {
      console.error('Error saving layout:', error);
    }
  };

  const handleCancel = async () => {
    const hasChanges = selectedCodes.size > 0 || price !== "3000" || boothType !== "corner" || dimension !== "10x10";
    
    if (hasChanges) {
      const result = await showCancelConfirmAlert();
      if (result.isConfirmed) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleOverlayClick = async (event) => {
    if (event.target === event.currentTarget) {
      await handleCancel();
    }
  };

  return (
    <div
      className="general-modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={handleOverlayClick}
    >
      <div className="general-modal-container">
        <div className="general-modal-header">
          <div>
            <h3>Setup/Edit Booths Layout</h3>
            <p className="small-body-text">
              Define booth types, pricing, and layout for this venue.
            </p>
          </div>
          <button
            type="button"
            className="close-btn"
            onClick={handleCancel}
            aria-label="Close"
          >
            <Icon icon="mdi:close" />
          </button>
        </div>

        <div className="setup-booth-modal-body">
          <div className="setup-booth-form-row">
            <div className="setup-booth-field">
              <h6 htmlFor="booth-type">Booth Type</h6>
              <div className="setup-booth-select-wrapper">
                <select
                  id="booth-type"
                  value={boothType}
                  onChange={(e) => setBoothType(e.target.value)}
                >
                  {BOOTH_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Icon icon="mdi:chevron-down" className="select-chevron" />
              </div>
            </div>

            <div className="setup-booth-field">
              <h6 htmlFor="dimension">Dimension</h6>
              <div className="setup-booth-select-wrapper">
                <select
                  id="dimension"
                  value={dimension}
                  onChange={(e) => setDimension(e.target.value)}
                >
                  {DIMENSIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Icon icon="mdi:chevron-down" className="select-chevron" />
              </div>
            </div>

            <div className="setup-booth-field">
              <h6 htmlFor="price">Price</h6>
              <div className="setup-booth-input-wrapper">
                <input
                  id="price"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="setup-booth-field">
              <h6 htmlFor="quantity">Quantity</h6>
              <input
                id="quantity"
                type="number"
                value={quantity}
                readOnly
                className="setup-booth-quantity-input"
              />
              <p className="smaller-body-text quantity-hint">
                Automatically counts selected booths.
              </p>
            </div>
          </div>

          <div className="setup-booth-layout-wrapper">
            <div className="setup-booth-layout-header">
              <div>
                <h4 className="layout-title">Booth Layout</h4>
                <span className="small-body-text layout-meta">
                  Tap to select or deselect booth positions.
                </span>
              </div>
              <div className="grid-controls">
                <div className="grid-control-group">
                  <label className="small-body-text">Rows:</label>
                  <div className="grid-control-buttons">
                    <button
                      type="button"
                      className="grid-control-btn"
                      onClick={removeRow}
                      disabled={rows <= 1}
                      aria-label="Remove row"
                    >
                      <Icon icon="mdi:minus" />
                    </button>
                    <span className="grid-control-value">{rows}</span>
                    <button
                      type="button"
                      className="grid-control-btn"
                      onClick={addRow}
                      disabled={rows >= 20}
                      aria-label="Add row"
                    >
                      <Icon icon="mdi:plus" />
                    </button>
                  </div>
                </div>
                <div className="grid-control-group">
                  <label className="small-body-text">Columns:</label>
                  <div className="grid-control-buttons">
                    <button
                      type="button"
                      className="grid-control-btn"
                      onClick={removeCol}
                      disabled={cols <= 1}
                      aria-label="Remove column"
                    >
                      <Icon icon="mdi:minus" />
                    </button>
                    <span className="grid-control-value">{cols}</span>
                    <button
                      type="button"
                      className="grid-control-btn"
                      onClick={addCol}
                      disabled={cols >= 20}
                      aria-label="Add column"
                    >
                      <Icon icon="mdi:plus" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="setup-booth-grid-wrapper">
              <div className="setup-booth-grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(28px, 1fr))` }}>
                {boothCodesMatrix.map((row, rowIndex) => (
                  <React.Fragment key={`row-${rowIndex}`}>
                    {row.map((code) => {
                      const isSelected = selectedCodes.has(code);
                      return (
                        <button
                          key={code}
                          type="button"
                          className={`setup-booth-cell${
                            isSelected ? " selected" : ""
                          }`}
                          onClick={() => toggleCode(code)}
                          aria-pressed={isSelected}
                          aria-label={`Booth ${code} ${
                            isSelected ? "selected" : "not selected"
                          }`}
                        >
                          {code}
                        </button>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="setup-booth-legend">
              <div className="legend-item">
                <span className="legend-dot available" />
                <span className="small-body-text">Available</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot selected" />
                <span className="small-body-text">Selected</span>
              </div>
            </div>
          </div>
        </div>

        <div className="setup-booth-modal-footer">
          <button
            type="button"
            className="button cancel-btn"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="primary-button save-btn"
            onClick={handleSave}
            disabled={quantity === 0}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetupBoothLayoutModal;
