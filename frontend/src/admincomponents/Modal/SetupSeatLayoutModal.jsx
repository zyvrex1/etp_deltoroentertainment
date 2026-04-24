import React, { useMemo, useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import "./SetupSeatLayoutModal.css";
import { showConfirmAlert, showSuccessAlert, showCancelConfirmAlert } from "../../utils/sweetAlert";
import { useDragScroll } from "../../utils/useDragScroll";

const BOOTH_TYPES = [
  { value: "vip", label: "VIP" },
  { value: "General Admission", label: "Gen Ad" },
];

const generateSeatCodes = (rows, cols) => {
  const result = [];
  const rowLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (let r = 0; r < rows; r += 1) {
    const rowLabel = rowLetters[r];
    const rowCodes = [];
    for (let c = 1; c <= cols; c += 1) {
      // Generate codes like A101, A102, A103... B201, B202, etc.
      const rowNum = r + 1;
      const seatNum = String(c).padStart(2, '0');
      const code = `${rowLabel}${rowNum}${seatNum}`;
      rowCodes.push({ code, rowLabel, rowIndex: r, colIndex: c - 1 });
    }
    result.push(rowCodes);
  }

  return result;
};

const SetupSeatLayoutModal = ({ isOpen, onClose, onSave }) => {
  const [boothType, setBoothType] = useState("vip");
  const [price, setPrice] = useState("3000");
  const [rows, setRows] = useState(9);
  const [cols, setCols] = useState(23);
  const [selectedSeats, setSelectedSeats] = useState(() => new Set());
  const gridScrollRef = useDragScroll();

  const quantity = useMemo(() => selectedSeats.size, [selectedSeats]);

  // Generate seat codes matrix dynamically based on current rows/cols
  const seatCodesMatrix = useMemo(() => generateSeatCodes(rows, cols), [rows, cols]);

  // Clean up selected seats that no longer exist when grid size changes
  useEffect(() => {
    const allCodes = new Set(seatCodesMatrix.flat().map(s => s.code));
    setSelectedSeats((prev) => {
      const filtered = new Set();
      prev.forEach((code) => {
        if (allCodes.has(code)) {
          filtered.add(code);
        }
      });
      return filtered;
    });
  }, [seatCodesMatrix]);

  if (!isOpen) return null;

  const toggleSeat = (code) => {
    setSelectedSeats((prev) => {
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
    setRows((prev) => Math.min(prev + 1, 26)); // Max 26 rows (A-Z)
  };

  const removeRow = () => {
    setRows((prev) => Math.max(prev - 1, 1)); // Min 1 row
  };

  const addCol = () => {
    setCols((prev) => Math.min(prev + 1, 50)); // Max 50 columns
  };

  const removeCol = () => {
    setCols((prev) => Math.max(prev - 1, 1)); // Min 1 column
  };

  const handleSave = async () => {
    const result = await showConfirmAlert(
      'Save Layout Changes?',
      `Are you sure you want to save this seat layout configuration? This will affect ${quantity} seats.`,
      'Yes, save changes',
      'Cancel'
    );
    
    if (!result.isConfirmed) {
      return;
    }
    
    const payload = {
      boothType,
      price: Number(price) || 0,
      quantity,
      selectedSeats: Array.from(selectedSeats),
      rows,
      cols,
    };

    try {
      if (onSave) {
        onSave(payload);
      }
      await showSuccessAlert('Layout Saved', 'The seat layout has been saved successfully.');
      onClose();
    } catch (error) {
      console.error('Error saving layout:', error);
    }
  };

  const handleCancel = async () => {
    const hasChanges = selectedSeats.size > 0 || price !== "3000" || boothType !== "vip" || rows !== 9 || cols !== 23;
    
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

  const rowLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

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
            <h3>Setup/Edit Seats Layout</h3>
            <p className="small-body-text">
              Define seat types, pricing, and layout for this venue.
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

        <div className="setup-seat-modal-body">
          <div className="setup-seat-form-row">
            <div className="setup-seat-field">
              <h6 htmlFor="booth-type">Seat Type</h6>
              <div className="setup-seat-select-wrapper">
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

            <div className="setup-seat-field">
              <h6 htmlFor="price">Price</h6>
              <div className="setup-seat-input-wrapper">
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

            <div className="setup-seat-field">
              <h6 htmlFor="quantity">Quantity</h6>
              <input
                id="quantity"
                type="number"
                value={quantity}
                readOnly
                className="setup-seat-quantity-input"
              />
              <p className="small-body-text quantity-hint">
                Automatically counts selected seats.
              </p>
            </div>
          </div>

          <div className="setup-seat-layout-wrapper">
            <div className="setup-seat-layout-header">
              <div>
                <h4 className="layout-title">Seat Layout</h4>
                <span className="smaller-body-text layout-meta">
                  Tap to select or deselect seat positions.
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
                      disabled={rows >= 26}
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
                      disabled={cols >= 50}
                      aria-label="Add column"
                    >
                      <Icon icon="mdi:plus" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="setup-seat-grid-container" ref={gridScrollRef}>
              <div className="setup-seat-grid-wrapper">
                
                {/* Main grid */}
                <div className="setup-seat-grid" style={{ gridTemplateColumns: `min-content repeat(${cols}, minmax(28px, 1fr)) min-content` }}>
                  {seatCodesMatrix.map((row, rowIndex) => (
                    <React.Fragment key={`row-${rowIndex}`}>
                      <div className="setup-seat-row-label">
                        {row[0]?.rowLabel}
                      </div>

                      {row.map((seat) => {
                        const isSelected = selectedSeats.has(seat.code);
                        return (
                          <button
                            key={seat.code}
                            type="button"
                            className={`setup-seat-cell${
                              isSelected ? " selected" : ""
                            }`}
                            onClick={() => toggleSeat(seat.code)}
                            aria-pressed={isSelected}
                            aria-label={`Seat ${seat.code} ${
                              isSelected ? "selected" : "not selected"
                            }`}
                          >
                            {seat.code.slice(1)}
                          </button>
                        );
                      })}

                      <div className="setup-seat-row-label">
                        {row[0]?.rowLabel}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
                
              </div>
            </div>

            <div className="setup-seat-legend">
              <div className="legend-item">
                <span className="legend-dot available" />
                <span className="small-body-text">Unavailable</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot selected" />
                <span className="small-body-text">Selected</span>
              </div>
            </div>
          </div>
        </div>

        <div className="setup-seat-modal-footer">
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

export default SetupSeatLayoutModal;
