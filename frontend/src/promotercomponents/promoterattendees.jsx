import React, { useState, useRef, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import jsPDF from "jspdf";
import {
  loadLogo,
  addReportHeader,
  showExportToast,
  removeExportToast,
  drawTable,
  finalizeReport,
} from "../utils/pdfExport";
import { useAuthContext } from "../hooks/useAuthContext";
import Swal from "sweetalert2";
import QRScannerModal from "./QRScannerModal";
import "./promoterattendees.css";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const formatDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    : "—";

const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const mapReservation = (r) => {
  const customerName = `${r.user?.firstName || ""} ${r.user?.lastName || ""}`.trim() || "Unknown";

  const itemLabel = r.seatLabels?.length
    ? r.seatLabels.join(", ")
    : r.seatIds?.length
      ? `${r.seatIds.length} seat(s)`
      : "Ticket";

  const categoryName = r.categoryName || "Ticket";

  // Normalise checkIns array (may be absent on legacy records)
  const checkIns = Array.isArray(r.checkIns) ? r.checkIns : [];

  // Derive state from checkIns length
  const scanCount = checkIns.length;
  // 6-event cycle: In1 -> Out1 -> In2 -> Out2 -> In3 -> Out3
  const ACTION_LABELS = ["Check In", "Exit", "Check In 2", "Exit 2", "Check In 3", "Exit 3"];
  const nextAction = scanCount < 6 ? ACTION_LABELS[scanCount] : null;

  // Status label shown in the Status pill
  let status, statusType;
  if (scanCount === 0) { status = "Registered"; statusType = "pending"; }
  else if (scanCount % 2 === 1) {
    const num = Math.ceil(scanCount / 2);
    status = num === 1 ? "Checked In" : `Checked In (${num})`;
    statusType = "checked";
  } else {
    const num = scanCount / 2;
    status = num === 1 ? "Exited" : `Exited (${num})`;
    statusType = "exited";
  }

  const fmt = (entry) => entry?.time ? formatDateTime(entry.time) : null;

  return {
    id: r._id,
    initials: getInitials(customerName),
    name: customerName,
    email: r.user?.email || "—",
    typePill: categoryName,
    typeColor: "green",
    categoryName,
    item: itemLabel,
    purchaseDate: formatDate(r.createdAt),
    // Legacy compat
    checkedIn: r.checkedIn || false,
    checkedInAt: r.checkedInAt ? formatDateTime(r.checkedInAt) : "—",
    // Multi-scan
    checkIns,
    scanCount,
    nextAction,
    checkIn1: fmt(checkIns[0]),
    exitTime1: fmt(checkIns[1]),
    checkIn2: fmt(checkIns[2]),
    exitTime2: fmt(checkIns[3]),
    checkIn3: fmt(checkIns[4]),
    exitTime3: fmt(checkIns[5]),
    status,
    statusType,
  };
};

const PromoterAttendees = ({ selectedEvent }) => {
  const { user } = useAuthContext();

  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const itemsPerPage = 5;
  const filterDropdownRef = useRef(null);

  const fetchAttendees = useCallback(async () => {
    if (!selectedEvent?._id || !user?.token) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${BASE_URL}/api/reservations/event/${selectedEvent._id}/sales`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(
          res.status === 403
            ? "You are not assigned to this event."
            : body.error || "Failed to load attendee data."
        );
        setAttendees([]);
        return;
      }

      const { reservations, event: eventData } = await res.json();

      const priceMap = {};
      (eventData?.priceLevels || []).forEach((pl) => {
        priceMap[pl._id?.toString()] = pl.priceName;
      });

      const rows = (reservations || [])
        .filter((r) => r.type !== "booth")
        .map((r) => {
          let categoryName = null;
          const plId = r.priceLevelId?.toString();
          if (plId && priceMap[plId]) {
            categoryName = priceMap[plId];
          }
          return mapReservation({ ...r, categoryName });
        });

      setAttendees(rows);
    } catch (err) {
      console.error("PromoterAttendees fetch error:", err);
      setError("Could not load attendee data.");
      setAttendees([]);
    } finally {
      setLoading(false);
    }
  }, [selectedEvent?._id, user?.token]);

  useEffect(() => {
    fetchAttendees();
  }, [fetchAttendees]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(e.target)
      )
        setIsFilterDropdownOpen(false);
    };
    if (isFilterDropdownOpen)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFilterDropdownOpen]);

  const counts = {
    all: attendees.length,
    checked: attendees.filter((a) => a.scanCount >= 1).length,
    pending: attendees.filter((a) => a.scanCount === 0).length,
  };

  const categoryStats = (() => {
    const map = {};
    attendees.forEach((a) => {
      const key = a.categoryName || a.typePill;
      if (!map[key]) map[key] = { name: key, total: 0, checked: 0 };
      map[key].total += 1;
      if (a.scanCount >= 1) map[key].checked += 1;
    });
    return Object.values(map);
  })();

  const filteredData = attendees.filter((row) => {
    const q = searchQuery.toLowerCase();
    const matchesFilter =
      activeFilter === "All" ||
      (activeFilter === "Checked In" && row.scanCount >= 1) ||
      (activeFilter === "Registered" && row.scanCount === 0);
    if (!matchesFilter) return false;
    if (!q) return true;
    return (
      row.name.toLowerCase().includes(q) ||
      row.email.toLowerCase().includes(q) ||
      row.item.toLowerCase().includes(q) ||
      row.categoryName?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const toggleRow = (index) =>
    setExpandedRow(expandedRow === index ? null : index);

  const eventTitle = selectedEvent?.title || "—";
  const eventDate = selectedEvent?.startDate
    ? new Date(selectedEvent.startDate).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    : "—";
  const eventVenue = selectedEvent?.venue?.name || "—";

  const exportList = async () => {
    const loadingToast = showExportToast();
    const REPORT_TITLE = "Attendee List";
    try {
      const logoData = await loadLogo();
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const FOOTER_HEIGHT = 15;
      let y = 45;
      const lineHeight = 6;

      addReportHeader(pdf, REPORT_TITLE, logoData);

      pdf.setFontSize(12);
      pdf.setTextColor(30, 60, 114);
      pdf.setFont("helvetica", "bold");
      pdf.text("Summary", margin, y);
      y += lineHeight + 2;

      pdf.setFontSize(10);
      pdf.setTextColor(50, 50, 50);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Event: ${eventTitle}`, margin + 2, y);
      y += lineHeight;
      pdf.text(`Total Attendees: ${filteredData.length}`, margin + 2, y);
      y += lineHeight;
      pdf.text(`Checked In: ${counts.checked}`, margin + 2, y);
      y += lineHeight;
      pdf.text(`Registered (Pending): ${counts.pending}`, margin + 2, y);
      y += lineHeight + 4;

      pdf.setFontSize(12);
      pdf.setTextColor(30, 60, 114);
      pdf.setFont("helvetica", "bold");
      pdf.text("Attendees", margin, y);
      y += 8;

      const headers = [
        "Name",
        "Email",
        "Ticket Type",
        "Purchase Date",
        "Status",
        "Check-in Time",
      ];
      const rows = filteredData.map((row) => [
        row.name,
        row.email,
        `${row.typePill} | ${row.item}`,
        row.purchaseDate,
        row.status,
        row.checkedInAt,
      ]);

      y = drawTable(
        pdf,
        y,
        headers,
        rows,
        margin,
        pdfWidth,
        pdfHeight,
        FOOTER_HEIGHT,
        10,
        3,
        logoData,
        REPORT_TITLE
      );

      y += 10;
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        "Attendee list export. Check-in status reflects QR scan records.",
        margin,
        y,
        { maxWidth: pdfWidth - 2 * margin }
      );

      finalizeReport(pdf);
      pdf.save(`Attendees_List_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      removeExportToast(loadingToast);
    }
  };

  const handleManualCheckIn = async (reservationId) => {
    if (!reservationId || !user?.token) return;

    const row = attendees.find((a) => a.id === reservationId);
    if (!row) return;

    const actionLabel = row.nextAction || "Action";

    const confirm = await Swal.fire({
      title: `Confirm ${actionLabel}`,
      text: `Manually record "${actionLabel}" for ${row.name}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: `Yes, ${actionLabel}`,
      confirmButtonColor: "var(--color-red-primary)",
    });
    if (!confirm.isConfirmed) return;

    await performCheckIn(reservationId);
  };

  const handleScanSuccess = async (reservationId) => {
    setIsScannerOpen(false);
    if (!reservationId || !user?.token) return;
    await performCheckIn(reservationId);
  };

  const performCheckIn = async (reservationId) => {
    try {
      Swal.fire({
        title: "Processing...",
        didOpen: () => Swal.showLoading(),
        allowOutsideClick: false,
      });

      const res = await fetch(`${BASE_URL}/api/reservations/${reservationId}/checkin`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Check-in failed");
      }

      if (data.maxReached) {
        Swal.fire({
          icon: "info",
          title: "Max Check-ins Reached",
          text: "This ticket has already completed all 3 check-in/exit events.",
          confirmButtonColor: "var(--color-red-primary)",
        });
        return;
      }

      const actionType = data.actionType;
      const scanNumber = data.scanNumber;
      const firstName = data.reservation?.user?.firstName || "Attendee";

      const messages = {
        checkin: scanNumber === 1
          ? { icon: "success", title: "Check-in Successful!", text: `Welcome, ${firstName}!` }
          : { icon: "success", title: "Check-in 2 Recorded!", text: `${firstName} has re-entered the event.` },
        exit: { icon: "info", title: "Exit Recorded", text: `${firstName} has exited the event.` },
      };

      const msg = messages[actionType] || { icon: "success", title: "Done", text: data.message };

      Swal.fire({ ...msg, timer: 2500, showConfirmButton: false });
      fetchAttendees();
    } catch (err) {
      console.error("Check-in error:", err);
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: err.message,
        confirmButtonColor: "var(--color-red-primary)",
      });
    }
  };

  return (
    <div className="att-container">
      <div className="att-header">
        <div className="att-header-left">
          <h1 className="att-title">Attendee List</h1>
          <p className="small-body-text att-header-subtitle">
            Manage registered attendees
          </p>
        </div>
        <div className="att-header-controls">
          <button
            className="outlined-button att-export-btn"
            onClick={exportList}
            disabled={loading || attendees.length === 0}
          >
            <Icon icon="mdi:tray-arrow-down" className="export-icon" />
            Export List
          </button>
          <button
            className="primary-button att-scan-btn"
            onClick={() => setIsScannerOpen(true)}
            disabled={loading}
          >
            <Icon icon="mdi:qrcode-scan" className="scan-icon" />
            Scan Ticket
          </button>
        </div>
      </div>

      <div className="att-main-content">
        <div className="att-event-banner">
          <div className="att-banner-left">
            <h3>{eventTitle}</h3>
            <p className="small-body-text">
              {eventDate} &bull; {eventVenue}
            </p>
          </div>
          <div className="att-banner-stats">
            <div className="att-stat-item">
              <h3>{loading ? "—" : counts.all}</h3>
              <span className="att-stat-label smaller-body-text">
                Total Registered
              </span>
            </div>
            <div className="att-stat-item">
              <h3 className="text-green">{loading ? "—" : counts.checked}</h3>
              <span className="att-stat-label smaller-body-text">
                Checked In
              </span>
            </div>
            <div className="att-stat-item">
              <h3 className="text-red">{loading ? "—" : counts.pending}</h3>
              <span className="att-stat-label smaller-body-text">Pending</span>
            </div>
          </div>
        </div>

        {!loading && !error && categoryStats.length > 0 && (
          <div className="att-cards-container">
            {categoryStats.map((stat, idx) => (
              <div className="att-card" key={idx}>
                <p className="smaller-body-text att-card-title">{stat.name}</p>
                <h2>{stat.total}</h2>
                <p className="smaller-body-text att-card-sub">
                  {stat.checked} checked in
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Table Section ── */}
        <div className="att-table-container">
          <div className="att-toolbar">
            <div className="att-toolbar-left">
              <div className="att-search">
                <Icon icon="mdi:magnify" />
                <input
                  type="text"
                  placeholder="Search attendees..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="small-body-text"
                />
              </div>
            </div>

            <div className="att-toolbar-right">
              <div className="att-filter-dropdown" ref={filterDropdownRef}>
                <button
                  className="att-filter-dropdown-btn"
                  onClick={() =>
                    setIsFilterDropdownOpen(!isFilterDropdownOpen)
                  }
                >
                  <span className="truncate-text">{activeFilter}</span>
                  <Icon
                    icon="mdi:chevron-down"
                    className={`dropdown-icon ${isFilterDropdownOpen ? "open" : ""}`}
                  />
                </button>

                {isFilterDropdownOpen && (
                  <div className="att-filter-dropdown-menu">
                    {["All", "Checked In", "Registered"].map((option) => (
                      <button
                        key={option}
                        className={`att-filter-dropdown-item small-body-text ${activeFilter === option ? "active" : ""}`}
                        onClick={() => {
                          handleFilterChange(option);
                          setIsFilterDropdownOpen(false);
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="att-table-wrapper">
            {loading ? (
              <div className="empty-state">
                <Icon icon="mdi:loading" width="40" className="spin-icon" />
                <p className="small-body-text">Loading attendees…</p>
              </div>
            ) : error ? (
              <div className="empty-state">
                <Icon icon="mdi:alert-circle-outline" width="48" />
                <h4>Access Denied</h4>
                <p className="small-body-text">{error}</p>
              </div>
            ) : paginatedData.length === 0 ? (
              <div className="empty-state">
                <Icon icon="mdi:magnify-close" width="48" />
                <h4>No Attendee(s) found</h4>
                <p className="small-body-text">
                  {searchQuery
                    ? `No attendees match "${searchQuery}".`
                    : "No attendees have been registered for this event yet."}
                </p>
              </div>
            ) : (
              <table className="att-table">
                <thead>
                  <tr>
                    <th>Attendee</th>
                    <th>Type</th>
                    <th>Purchase Date</th>
                    <th>Status</th>
                    <th>Check-in Times</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, index) => (
                    <tr
                      key={row.id || index}
                      className={expandedRow === index ? "expanded" : ""}
                    >
                      {/* Attendee */}
                      <td className="id-td" data-label="Attendee">
                        <div
                          className="mobile-expand-icon"
                          onClick={() => toggleRow(index)}
                        >
                          <Icon
                            icon={
                              expandedRow === index
                                ? "mdi:chevron-up"
                                : "mdi:chevron-down"
                            }
                          />
                        </div>
                        <div className="user-info">
                          <div className="user-avatar">{row.initials}</div>
                          <div className="user-details">
                            <h6 className="user-name">{row.name}</h6>
                            <span className="user-email smaller-body-text">
                              {row.email}
                            </span>
                          </div>
                        </div>
                      </td>


                      <td className="type-cell" data-label="Ticket Type">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className={`type-pill pill-bg-${row.typeColor}`}>
                            {row.typePill} | {row.item}
                          </span>
                        </div>
                      </td>

                      <td
                        data-label="Purchase Date"
                        className="small-body-text date-col"
                      >
                        {row.purchaseDate}
                      </td>


                      <td className="status-cell" data-label="Status">
                        <span
                          className={`status-pill status-${row.statusType}`}
                        >
                          {row.status}
                        </span>
                      </td>


                      <td
                        data-label="Check-in Times"
                        className="small-body-text"
                      >
                        {(() => {
                          const eventEnd = selectedEvent?.endDate
                            ? new Date(selectedEvent.endDate)
                            : null;
                          const eventEnded = eventEnd && new Date() > eventEnd;
                          const isCurrentlyInside = row.scanCount > 0 && row.scanCount % 2 === 1;
                          const autoOutStr = eventEnded && isCurrentlyInside
                            ? formatDateTime(eventEnd)
                            : null;
                          return (
                            <div className="att-checkin-times">
                              {row.checkIn1 && (
                                <div className="att-time-entry">
                                  <span className="att-time-badge badge-checkin">In 1</span>
                                  <Icon icon="mdi:clock-outline" className="time-icon text-green" />
                                  <span className="text-green">{row.checkIn1}</span>
                                </div>
                              )}
                              {row.exitTime1 && (
                                <div className="att-time-entry">
                                  <span className="att-time-badge badge-exit">Out 1</span>
                                  <Icon icon="mdi:clock-outline" className="time-icon text-orange" />
                                  <span className="text-orange">{row.exitTime1}</span>
                                </div>
                              )}
                              {row.checkIn2 && (
                                <div className="att-time-entry">
                                  <span className="att-time-badge badge-checkin">In 2</span>
                                  <Icon icon="mdi:clock-outline" className="time-icon text-green" />
                                  <span className="text-green">{row.checkIn2}</span>
                                </div>
                              )}
                              {row.exitTime2 && (
                                <div className="att-time-entry">
                                  <span className="att-time-badge badge-exit">Out 2</span>
                                  <Icon icon="mdi:clock-outline" className="time-icon text-orange" />
                                  <span className="text-orange">{row.exitTime2}</span>
                                </div>
                              )}
                              {row.checkIn3 && (
                                <div className="att-time-entry">
                                  <span className="att-time-badge badge-checkin">In 3</span>
                                  <Icon icon="mdi:clock-outline" className="time-icon text-green" />
                                  <span className="text-green">{row.checkIn3}</span>
                                </div>
                              )}
                              {row.exitTime3 && (
                                <div className="att-time-entry">
                                  <span className="att-time-badge badge-exit">Out 3</span>
                                  <Icon icon="mdi:clock-outline" className="time-icon text-orange" />
                                  <span className="text-orange">{row.exitTime3}</span>
                                </div>
                              )}
                              {autoOutStr && (
                                <div className="att-time-entry att-auto-out">
                                  <span className="att-time-badge badge-auto-out">Auto Out</span>
                                  <Icon icon="mdi:clock-alert-outline" className="time-icon text-red" />
                                  <span className="text-red">{autoOutStr}</span>
                                </div>
                              )}
                              {row.scanCount === 0 && !autoOutStr && (
                                <span className="text-muted">—</span>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      <td data-label="Actions">
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          {row.nextAction ? (
                            <button
                              className={`action-btn action-checkin-btn ${
                                row.nextAction.startsWith("Exit") ? "action-exit" : "action-enter"
                              }`}
                              title={`Manual: ${row.nextAction}`}
                              onClick={() => handleManualCheckIn(row.id)}
                            >
                              <Icon
                                icon={
                                  row.nextAction.startsWith("Exit")
                                    ? "mdi:location-exit"
                                    : "mdi:qrcode-scan"
                                }
                              />
                              <span className="action-label">{row.nextAction}</span>
                            </button>
                          ) : (
                             <span className="att-max-badge" title="All 6 check-in events recorded">
                              <Icon icon="mdi:check-all" /> Done
                            </span>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
      </div>
      {/* QR Scanner Modal */}
      <QRScannerModal
        show={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
};

export default PromoterAttendees;
