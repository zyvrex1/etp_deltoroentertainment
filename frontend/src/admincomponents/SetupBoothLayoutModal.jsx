import React, { useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import "./SetupBoothLayoutModal.css";

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

const generateBoothCodes = () => {
  const rows = 5;
  const cols = 7;
  const result = [];

  for (let r = 1; r <= rows; r += 1) {
    const rowCodes = [];
    for (let c = 1; c <= cols; c += 1) {
      const code = `${r}0${c}`;
      rowCodes.push(code);
    }
    result.push(rowCodes);
  }

  return result;
};

const boothCodesMatrix = generateBoothCodes();

const SetupBoothLayoutModal = ({ isOpen, onClose, onSave }) => {
  const [boothType, setBoothType] = useState("corner");
  const [dimension, setDimension] = useState("10x10");
  const [price, setPrice] = useState("3000");
  const [selectedCodes, setSelectedCodes] = useState(() => new Set());

  const quantity = useMemo(() => selectedCodes.size, [selectedCodes]);

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

  const handleSave = () => {
    const payload = {
      boothType,
      dimension,
      price: Number(price) || 0,
      quantity,
      selectedCodes: Array.from(selectedCodes),
    };

    if (onSave) {
      onSave(payload);
    }

    onClose();
  };

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="setup-booth-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="setup-booth-modal-title"
      onClick={handleOverlayClick}
    >
      <div className="setup-booth-modal-container">
        <div className="setup-booth-modal-header">
          <div>
            <h3 id="setup-booth-modal-title">Setup/Edit Booths Layout</h3>
            <p className="small-body-text">
              Define booth types, pricing, and layout for this venue.
            </p>
          </div>
          <button
            type="button"
            className="setup-booth-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon icon="mdi:close" />
          </button>
        </div>

        <div className="setup-booth-modal-body">
          <div className="setup-booth-form-row">
            <div className="setup-booth-field">
              <label htmlFor="booth-type">Booth Type</label>
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
              <label htmlFor="dimension">Dimension</label>
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
              <label htmlFor="price">Price</label>
              <div className="setup-booth-input-wrapper">
                <span className="prefix">$</span>
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
              <label htmlFor="quantity">Quantity</label>
              <input
                id="quantity"
                type="number"
                value={quantity}
                readOnly
                className="setup-booth-quantity-input"
              />
              <p className="small-body-text quantity-hint">
                Automatically counts selected booths.
              </p>
            </div>
          </div>

          <div className="setup-booth-layout-wrapper">
            <div className="setup-booth-layout-header">
              <h4 className="layout-title">Booth Layout</h4>
              <span className="small-body-text layout-meta">
                Tap to select or deselect booth positions.
              </span>
            </div>

            <div className="setup-booth-grid">
              {boothCodesMatrix.map((row, rowIndex) => (
                <div key={`row-${rowIndex}`} className="setup-booth-row">
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
                </div>
              ))}
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
            onClick={onClose}
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

