import { useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import "./boothandticket.css";
import UploadMapModal from "./UploadMapModal";
import ManagePricingModal from "./ManagePricingModal";

const BoothandTicket = () => {
  const [activeTab, setActiveTab] = useState("booth-map");
  const [selectedEvent, setSelectedEvent] = useState("TechStart Summint 2026");
  const [detailPopup, setDetailPopup] = useState(null);
  const [currentPage, handlePageChange] = useState(1);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState({ isOpen: false, type: 'booth' });
  const itemsPerPage = 10;

  // Booth Map: 5x5 grid (5 columns, 5 rows). Each cell: null (empty) or { code, type, status, dimensions, bookedBy? }
  const boothGrid = [
    [{ code: "V1", type: "vip", status: "booked", dimensions: "20x20", bookedBy: "Acme Corp" }, { code: "V2", type: "vip", status: "available", dimensions: "20x20" }, null, null, null],
    [null, { code: "C1", type: "corner", status: "available", dimensions: "10x10" }, { code: "I1", type: "inline", status: "available", dimensions: "10x10" }, null, null],
    [null, null, null, { code: "I2", type: "inline", status: "booked", dimensions: "10x10", bookedBy: "TechStart Inc" }, null],
    [null, null, null, null, null],
    [null, null, null, null, null],
  ];

  // Seat Map: type 'vip' | 'standard', status 'available' | 'booked', optional bookedBy
  const seatRows = 5;
  const seatsPerRow = 18;
  const getSeatInfo = (row, col) => {
    const type = row === 0 ? "vip" : "standard";
    const bookedCols = row === 1 ? [1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15] : row === 3 ? [0, 4, 8, 12] : [];
    const isBooked = bookedCols.includes(col);
    const bookedBy = isBooked ? (row === 1 ? "Jane Smith" : "John Doe") : null;
    return { type, status: isBooked ? "booked" : "available", bookedBy };
  };

  const liveScans = [
    { id: 1, name: "Alice Brown", details: "VIP • Row A, Seat 9", tag: "SEATS", time: "10:45 AM", entrance: "Main Entrance", icon: "mdi:account-outline" },
    { id: 2, name: "Bob Wilson", details: "VIP Booth • Booth 102", tag: "BOOTH", time: "10:42 AM", entrance: "Main Entrance", icon: "mdi:office-building-outline" },
    { id: 3, name: "Carol Davis", details: "General Admission • Row C, Seat 1", tag: "SEATS", time: "10:40 AM", entrance: "Side Entrance", icon: "mdi:account-outline" },
    { id: 4, name: "David Lee", details: "Early Bird | General Admission • Row B, Seat 6", tag: "SEATS", time: "10:38 AM", entrance: "Main Entrance", icon: "mdi:account-outline" },
    { id: 5, name: "Emma Johnson", details: "Standard • Row D, Seat 12", tag: "SEATS", time: "10:35 AM", entrance: "Main Entrance", icon: "mdi:account-outline" },
    { id: 6, name: "Frank Martinez", details: "Corner Booth • Booth 205", tag: "BOOTH", time: "10:32 AM", entrance: "Side Entrance", icon: "mdi:office-building-outline" },
    { id: 7, name: "Grace Chen", details: "VIP • Row A, Seat 3", tag: "SEATS", time: "10:30 AM", entrance: "Main Entrance", icon: "mdi:account-outline" },
    { id: 8, name: "Henry Taylor", details: "General Admission • Row E, Seat 8", tag: "SEATS", time: "10:28 AM", entrance: "Side Entrance", icon: "mdi:account-outline" },
    { id: 9, name: "Isabella White", details: "Inline Booth • Booth 301", tag: "BOOTH", time: "10:25 AM", entrance: "Main Entrance", icon: "mdi:office-building-outline" },
    { id: 10, name: "Jack Anderson", details: "Standard • Row C, Seat 15", tag: "SEATS", time: "10:22 AM", entrance: "Main Entrance", icon: "mdi:account-outline" },
    { id: 11, name: "Katherine Moore", details: "VIP • Row A, Seat 7", tag: "SEATS", time: "10:20 AM", entrance: "Side Entrance", icon: "mdi:account-outline" },
    { id: 12, name: "Liam Thompson", details: "VIP Booth • Booth 108", tag: "BOOTH", time: "10:18 AM", entrance: "Main Entrance", icon: "mdi:office-building-outline" },
    { id: 13, name: "Mia Garcia", details: "General Admission • Row B, Seat 4", tag: "SEATS", time: "10:15 AM", entrance: "Main Entrance", icon: "mdi:account-outline" },
    { id: 14, name: "Noah Rodriguez", details: "Standard • Row D, Seat 9", tag: "SEATS", time: "10:12 AM", entrance: "Side Entrance", icon: "mdi:account-outline" },
    { id: 15, name: "Olivia Lewis", details: "Corner Booth • Booth 210", tag: "BOOTH", time: "10:10 AM", entrance: "Main Entrance", icon: "mdi:office-building-outline" },
    { id: 16, name: "Peter Walker", details: "VIP • Row A, Seat 12", tag: "SEATS", time: "10:08 AM", entrance: "Main Entrance", icon: "mdi:account-outline" },
    { id: 17, name: "Quinn Hall", details: "General Admission • Row E, Seat 3", tag: "SEATS", time: "10:05 AM", entrance: "Side Entrance", icon: "mdi:account-outline" },
    { id: 18, name: "Rachel Young", details: "Inline Booth • Booth 305", tag: "BOOTH", time: "10:02 AM", entrance: "Main Entrance", icon: "mdi:office-building-outline" },
    { id: 19, name: "Samuel King", details: "Standard • Row C, Seat 7", tag: "SEATS", time: "10:00 AM", entrance: "Main Entrance", icon: "mdi:account-outline" },
    { id: 20, name: "Tina Wright", details: "VIP • Row A, Seat 5", tag: "SEATS", time: "9:58 AM", entrance: "Side Entrance", icon: "mdi:account-outline" },
    { id: 21, name: "Victor Lopez", details: "VIP Booth • Booth 115", tag: "BOOTH", time: "9:55 AM", entrance: "Main Entrance", icon: "mdi:office-building-outline" },
    { id: 22, name: "Wendy Hill", details: "General Admission • Row B, Seat 11", tag: "SEATS", time: "9:52 AM", entrance: "Main Entrance", icon: "mdi:account-outline" },
    { id: 23, name: "Xavier Scott", details: "Standard • Row D, Seat 6", tag: "SEATS", time: "9:50 AM", entrance: "Side Entrance", icon: "mdi:account-outline" },
    { id: 24, name: "Yara Green", details: "Corner Booth • Booth 215", tag: "BOOTH", time: "9:48 AM", entrance: "Main Entrance", icon: "mdi:office-building-outline" },
    { id: 25, name: "Zachary Adams", details: "VIP • Row A, Seat 1", tag: "SEATS", time: "9:45 AM", entrance: "Main Entrance", icon: "mdi:account-outline" },
  ];

  // Get recent scans (first 4)
  const recentScans = liveScans.slice(0, 5);

  // Pagination calculations
  const totalPages = Math.ceil(liveScans.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentScans = liveScans.slice(startIndex, endIndex);

  const rowLabels = ["A", "B", "C", "D", "E"];

  const handlePricingSave = (data) => {
    console.log("Saving pricing data:", data);
    // Here you would typically update the state or make an API call
    setDetailPopup(null); // Just ensuring no other popups interfere
  };

  return (
    <div className="booth-ticket-page">
      <div className="bt-header">
        <div>
          <h1>Booth & Ticket Control</h1>
          <p>Manage venue layouts and ticket inventory.</p>
        </div>
        <div className="bt-event-select">
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="bt-event-dropdown"
          >
            <option>TechStart Summint 2026</option>
            <option>Creator Economy Expo 2025</option>
            <option>AI Innovation Conference 2025</option>
          </select>
          <Icon icon="mdi:chevron-down" className="bt-chevron" />
        </div>
      </div>

      <div className="bt-tabs">
        <button className={`bt-tab ${activeTab === "booth-map" ? "active" : ""}`} onClick={() => setActiveTab("booth-map")}>
          Booth Map
        </button>
        <button className={`bt-tab ${activeTab === "seat-map" ? "active" : ""}`} onClick={() => setActiveTab("seat-map")}>
          Seat Map
        </button>
        <button className={`bt-tab ${activeTab === "live-scanning" ? "active" : ""}`} onClick={() => setActiveTab("live-scanning")}>
          Live Scanning
        </button>
      </div>

      <div className="bt-main">
        <div className="bt-content">
          {activeTab === "booth-map" && (
            <>
              <div className="bt-section">
                <div className="bt-section-header">
                  <h3 className="bt-section-title">Exhibition Hall Layout</h3>
                  <div className="bt-toolbar">
                    <button className="outlined-button bt-btn bt-btn-upload" onClick={() => setIsUploadModalOpen(true)}>
                      <Icon icon="mdi:upload" />
                      Upload Map
                    </button>
                    <button className="outlined-button bt-btn bt-btn-edit">
                      <Icon icon="mdi:pencil" />
                      Edit Layout
                    </button>
                    <button className="outlined-button bt-btn bt-btn-icon" aria-label="Zoom in"><Icon icon="mdi:magnify-plus-outline" /></button>
                    <button className="outlined-button bt-btn bt-btn-icon" aria-label="Zoom out"><Icon icon="mdi:magnify-minus-outline" /></button>
                  </div>

                </div>
                <div className="bt-booth-grid">
                  {boothGrid.map((row, ri) =>
                    row.map((cell, ci) => (
                      <button
                        type="button"
                        key={`${ri}-${ci}`}
                        className={`bt-booth-cell ${cell ? `filled status-${cell.status} type-${cell.type}` : "empty"}`}
                        onClick={() => setDetailPopup(cell ? { tooltipKind: "booth", ...cell, ri, ci } : { tooltipKind: "booth-empty", ri, ci })}
                        aria-label={cell ? `Booth ${cell.code}, ${cell.type}, ${cell.status}` : `Empty slot row ${ri + 1} col ${ci + 1}`}
                      />
                    ))
                  )}
                </div>
                <div className="bt-legend">
                  <span className="small-body-text bt-legend-item"><span className="dot booth-vip" /> VIP Booth</span>
                  <span className="small-body-text bt-legend-item"><span className="dot booth-corner" /> Corner Booth</span>
                  <span className="small-body-text bt-legend-item"><span className="dot booth-inline" /> Inline Booth</span>
                  <span className="small-body-text bt-legend-item"><span className="dot booth-booked" /> Booked/Sold</span>
                </div>
              </div>
              <div className="bt-summary">
                <h3 className="bt-section-title right">Inventory Summary</h3>
                <div className="bt-summary-item">
                  <h6 className="bt-summary-label">VIP Booths</h6>
                  <span className="large-body-text bt-summary-value">$15,000.00</span>
                  <div className="bt-progress"><div className="bt-progress-inner purple" style={{ width: "60%" }} /></div>
                  <span className="small-body-text bt-summary-meta">3 / 5 booked</span>
                </div>
                <div className="bt-summary-item">
                  <h6 className="bt-summary-label">Corner Booths</h6>
                  <span className="large-body-text bt-summary-value">$6,000.00</span>
                  <div className="bt-progress"><div className="bt-progress-inner blue" style={{ width: "20%" }} /></div>
                  <span className="small-body-text bt-summary-meta">2 / 10 booked</span>
                </div>
                <div className="bt-summary-item">
                  <h6 className="bt-summary-label">Inline Booths</h6>
                  <span className="large-body-text bt-summary-value">$6,000.00</span>
                  <div className="bt-progress"><div className="bt-progress-inner green" style={{ width: "15%" }} /></div>
                  <span className="small-body-text bt-summary-meta">3 / 20 booked</span>
                </div>
                <button
                  className="outlined-button bt-btn bt-btn-manage"
                  onClick={() => setIsPricingModalOpen({ isOpen: true, type: 'booth' })}
                >
                  <Icon icon="mdi:tag-outline" /> Manage Pricing
                </button>
              </div>
            </>
          )}

          {activeTab === "seat-map" && (
            <>
              <div className="bt-section">
                <div className="bt-section-header">
                  <h3 className="bt-section-title">Auditorium Seating</h3>

                  <div className="bt-toolbar">
                    <button className="outlined-button bt-btn bt-btn-upload" onClick={() => setIsUploadModalOpen(true)}><Icon icon="mdi:upload" /> Upload Map</button>
                    <button className="outlined-button bt-btn bt-btn-edit"><Icon icon="mdi:pencil" /> Edit Layout</button>
                    <button className="outlined-button bt-btn bt-btn-icon" aria-label="Zoom in"><Icon icon="mdi:magnify-plus-outline" /></button>
                    <button className="outlined-button bt-btn bt-btn-icon" aria-label="Zoom out"><Icon icon="mdi:magnify-minus-outline" /></button>
                  </div>

                </div>
                <div className="bt-seat-layout">
                  <div className="bt-stage">STAGE</div>
                  <div className="bt-seat-grid">
                    {Array.from({ length: seatRows }).map((_, rowIndex) => {
                      const rowLabel = rowLabels[rowIndex];
                      const half = Math.floor(seatsPerRow / 2);
                      return (
                        <div key={rowIndex} className="bt-seat-row">
                          {/* Left block: seats 1–9 (cols 0–8) */}
                          <div className="bt-seat-row-block">
                            {Array.from({ length: half }).map((_, i) => {
                              const colIndex = i;
                              const info = getSeatInfo(rowIndex, colIndex);
                              const seatNum = colIndex + 1;
                              return (
                                <button
                                  type="button"
                                  key={`${rowIndex}-${colIndex}`}
                                  className={`bt-seat type-${info.type} status-${info.status}`}
                                  aria-label={`Row ${rowLabel} Seat ${seatNum} ${info.type} ${info.status}`}
                                  onClick={() => setDetailPopup({ tooltipKind: "seat", rowLabel, seatNum, ...info })}
                                />
                              );
                            })}
                          </div>
                          {/* Right block: seats 10–18 (cols 9–17) */}
                          <div className="bt-seat-row-block">
                            {Array.from({ length: seatsPerRow - half }).map((_, i) => {
                              const colIndex = half + i;
                              const info = getSeatInfo(rowIndex, colIndex);
                              const seatNum = colIndex + 1;
                              return (
                                <button
                                  type="button"
                                  key={`${rowIndex}-${colIndex}`}
                                  className={`bt-seat type-${info.type} status-${info.status}`}
                                  aria-label={`Row ${rowLabel} Seat ${seatNum} ${info.type} ${info.status}`}
                                  onClick={() => setDetailPopup({ tooltipKind: "seat", rowLabel, seatNum, ...info })}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="bt-legend">
                  <span className="small-body-text bt-legend-item"><span className="dot available" /> Available</span>
                  <span className="small-body-text bt-legend-item"><span className="dot booked" /> Booked/Sold</span>
                  <span className="small-body-text bt-legend-item"><span className="dot vip" /> VIP</span>
                </div>
              </div>
              <div className="bt-summary">
                <h3 className="bt-section-title right">Inventory Summary</h3>
                <div className="bt-summary-item">
                  <h6 className="bt-summary-label">VIP Seats</h6>
                  <span className="large-body-text bt-summary-value">$299.00</span>
                  <div className="bt-progress"><div className="bt-progress-inner red" style={{ width: "80%" }} /></div>
                  <span className="small-body-text bt-summary-meta">80 / 100 sold</span>
                </div>
                <div className="bt-summary-item">
                  <h6 className="bt-summary-label">Standard Seats</h6>
                  <span className="large-body-text bt-summary-value">$99.00</span>
                  <div className="bt-progress"><div className="bt-progress-inner blue" style={{ width: "45%" }} /></div>
                  <span className="small-body-text bt-summary-meta">225 / 500 sold</span>
                </div>
                <button
                  className="outlined-button bt-btn bt-btn-manage"
                  onClick={() => setIsPricingModalOpen({ isOpen: true, type: 'seat' })}
                >
                  <Icon icon="mdi:tag-outline" /> Manage Pricing
                </button>
              </div>
            </>
          )}

          {activeTab === "live-scanning" && (
            <>
              <div className="bt-content-row">
                <div className="bt-section bt-section-scan">
                  <h3 className="bt-section-title">Recent Live Scan Activity</h3>
                  <div className="bt-scan-list">
                    {recentScans.map((scan) => (
                      <div key={scan.id} className="bt-scan-card">
                        <div className="left">
                          <Icon icon={scan.icon} className={`bt-scan-icon bt-scan-icon-desktop ${scan.tag === "BOOTH" ? "blue" : "green"}`} />
                          <div className="bt-scan-body">

                            <h5 className="bt-scan-name">{scan.name}</h5>
                            <span className="smaller-body-text bt-scan-details">{scan.details}</span>
                          </div>
                        </div>
                        <div className="right">
                          <div className="bt-scan-body">
                            <span className={`button-label bt-scan-tag ${scan.tag === "BOOTH" ? "tag-booth" : "tag-seats"}`}>{scan.tag}</span>
                            <span className="smaller-body-text bt-scan-meta">{scan.time} • {scan.entrance}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bt-summary">
                  <h3 className="bt-section-title right">Inventory Summary</h3>
                  <div className="bt-summary-item">
                    <span className="small-body-text bt-summary-label">Seats</span>
                    <div className="bt-progress"><div className="bt-progress-inner green" style={{ width: "80%" }} /></div>
                    <span className="small-body-text bt-summary-meta">80 / 100 Scanned</span>
                  </div>
                  <div className="bt-summary-item">
                    <span className="large-body-text bt-summary-label">Booths</span>
                    <div className="bt-progress"><div className="bt-progress-inner blue" style={{ width: "10%" }} /></div>
                    <span className="small-body-text bt-summary-meta">5 / 50 Scanned</span>
                  </div>
                </div>
              </div>
              <div className="bt-allscan-section">
                <h3 className="bt-allscan-title">All Live Scan Activity</h3>

                <div className="bt-allscan-table-wrapper">
                  <table className="bt-allscan-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Details</th>
                        <th>Type</th>
                        <th>Time</th>
                        <th>Entrance</th>
                      </tr>
                    </thead>

                    <tbody>
                      {currentScans.map((scan) => (
                        <tr key={scan.id}>
                          <td>
                            <div className="all-scan-name-wrapper">
                              <Icon
                                icon={scan.icon}
                                className={`bt-scan-icon ${scan.tag === "BOOTH" ? "blue" : "green"}`}
                              />
                              <div className="bt-scan-body">
                                <h5 className="bt-allscan-name-text">{scan.name}</h5>
                              </div>
                            </div>
                          </td>

                          <td className="small-body-text bt-allscan-details">
                            <strong>{scan.details}</strong>
                          </td>

                          <td>
                            <span
                              className={`bt-allscan-tag ${scan.tag === "BOOTH"
                                ? "button-label bt-allscan-tag-booth"
                                : "button-label bt-allscan-tag-seats"
                                }`}
                            >
                              {scan.tag}
                            </span>
                          </td>

                          <td className="small-body-text">{scan.time}</td>
                          <td className="small-body-text">{scan.entrance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="pagination-btn"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>

                    <span className="pagination-info">
                      Page {currentPage} of {totalPages}
                    </span>

                    <button
                      className="pagination-btn"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>


            </>
          )}
        </div>
      </div>

      {detailPopup &&
        createPortal(
          <div
            className="bt-detail-popup-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bt-detail-popup-title"
            onClick={() => setDetailPopup(null)}
          >
            <div className="bt-detail-popup-box" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="bt-detail-popup-close"
                onClick={() => setDetailPopup(null)}
                aria-label="Close"
              >
                <Icon icon="mdi:close" />
              </button>
              <div className="bt-detail-popup-content">
                {detailPopup.tooltipKind === "booth" && (
                  <>
                    <strong id="bt-detail-popup-title">Booth {detailPopup.code}</strong>
                    <span>Type: {detailPopup.type}</span>
                    <span>Dimensions: {detailPopup.dimensions}</span>
                    <span>Status: {detailPopup.status}</span>
                    {detailPopup.bookedBy && <span>Booked by: {detailPopup.bookedBy}</span>}
                    <span>Position: Row {detailPopup.ri + 1}, Col {detailPopup.ci + 1}</span>
                  </>
                )}
                {detailPopup.tooltipKind === "booth-empty" && (
                  <>
                    <strong id="bt-detail-popup-title">Empty slot</strong>
                    <span>Position: Row {detailPopup.ri + 1}, Col {detailPopup.ci + 1}</span>
                    <span>Available for assignment</span>
                  </>
                )}
                {detailPopup.tooltipKind === "seat" && (
                  <>
                    <strong id="bt-detail-popup-title">Row {detailPopup.rowLabel}, Seat {detailPopup.seatNum}</strong>
                    <span>Type: {detailPopup.type === "vip" ? "VIP" : "Standard"}</span>
                    <span>Status: {detailPopup.status}</span>
                    {detailPopup.bookedBy && <span>Booked by: {detailPopup.bookedBy}</span>}
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      <UploadMapModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSave={(file) => console.log("Uploaded file:", file)}
      />

      <ManagePricingModal
        isOpen={isPricingModalOpen.isOpen}
        type={isPricingModalOpen.type}
        onClose={() => setIsPricingModalOpen({ ...isPricingModalOpen, isOpen: false })}
        onSave={handlePricingSave}
      />
    </div>
  );
};

export default BoothandTicket;
