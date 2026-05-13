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

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

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
  });
};

/* Map a raw reservation document → attendee table row */
const mapReservation = (r) => {
  const isBooth = r.type === "booth";
  const customerName = r.user?.companyName
    ? r.user.companyName
    : `${r.user?.firstName || ""} ${r.user?.lastName || ""}`.trim() || "Unknown";

  const itemLabel = isBooth
    ? r.boothCode || r.boothId || "Booth"
    : r.seatLabels?.length
      ? r.seatLabels.join(", ")
      : r.seatIds?.length
        ? `${r.seatIds.length} seat(s)`
        : "Ticket";

  // Determine which price category name to display
  const categoryName = r.categoryName || (isBooth ? "Booth" : "Ticket");

  return {
    id: r._id,
    initials: getInitials(customerName),
    name: customerName,
    email: r.user?.email || "—",
    typePill: isBooth ? "Booth" : "Ticket",
    typeColor: isBooth ? "purple" : "green",
    categoryName,
    item: itemLabel,
    purchaseDate: formatDate(r.createdAt),
    checkedIn: r.checkedIn || false,
    checkedInAt: r.checkedInAt ? formatDateTime(r.checkedInAt) : "—",
    status: r.checkedIn ? "Checked In" : "Registered",
    statusType: r.checkedIn ? "checked" : "pending",
  };
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Component                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

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

  /* ── Fetch attendees from the sales endpoint ── */
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

      // Build a quick priceName lookup from the event's priceLevels
      const priceMap = {};
      (eventData?.priceLevels || []).forEach((pl) => {
        priceMap[pl._id?.toString()] = pl.priceName;
      });

      const rows = (reservations || []).map((r) => {
        // Resolve the ticket category name from seatLabels/seatIds/priceLevelId
        let categoryName = null;
        if (r.type !== "booth") {
          // For general admission, look up the price level from the items' categoryId
          // We can try to use a priceLevelId from the reservation if present
          const plId = r.priceLevelId?.toString();
          if (plId && priceMap[plId]) {
            categoryName = priceMap[plId];
          }
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

  /* ── Close dropdown on outside click ── */
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

  /* ── Derived counts ── */
  const counts = {
    all: attendees.length,
    checked: attendees.filter((a) => a.checkedIn).length,
    pending: attendees.filter((a) => !a.checkedIn).length,
  };

  /* ── Ticket-category stats cards ── */
  const categoryStats = (() => {
    const map = {};
    attendees.forEach((a) => {
      const key = a.categoryName || a.typePill;
      if (!map[key]) map[key] = { name: key, total: 0, checked: 0 };
      map[key].total += 1;
      if (a.checkedIn) map[key].checked += 1;
    });
    return Object.values(map);
  })();

  /* ── Filtering & search ── */
  const filteredData = attendees.filter((row) => {
    const q = searchQuery.toLowerCase();
    const matchesFilter =
      activeFilter === "All" ||
      (activeFilter === "Checked In" && row.checkedIn) ||
      (activeFilter === "Registered" && !row.checkedIn);
    if (!matchesFilter) return false;
    if (!q) return true;
    return (
      row.name.toLowerCase().includes(q) ||
      row.email.toLowerCase().includes(q) ||
      row.item.toLowerCase().includes(q) ||
      row.categoryName?.toLowerCase().includes(q)
    );
  });

  /* ── Pagination ── */
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

  /* ── Event display helpers ── */
  const eventTitle = selectedEvent?.title || "—";
  const eventDate = selectedEvent?.startDate
    ? new Date(selectedEvent.startDate).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    : "—";
  const eventVenue = selectedEvent?.venue?.name || "—";

  /* ── PDF Export ── */
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

  /* ── QR Check-in Logic ── */
  const handleScanSuccess = async (reservationId) => {
    setIsScannerOpen(false);
    if (!reservationId || !user?.token) return;

    try {
      Swal.fire({
        title: "Processing Check-in...",
        didOpen: () => Swal.showLoading(),
        allowOutsideClick: false,
      });

      const res = await fetch(`${BASE_URL}/api/reservations/${reservationId}/checkin`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Check-in failed");
      }

      if (data.alreadyCheckedIn) {
        Swal.fire({
          icon: "info",
          title: "Already Checked In",
          text: `${data.reservation?.user?.firstName || "Attendee"} is already checked in.`,
          confirmButtonColor: "var(--color-red-primary)",
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "Check-in Successful!",
          text: `Welcome, ${data.reservation?.user?.firstName || "Attendee"}!`,
          timer: 2000,
          showConfirmButton: false,
        });
        // Refresh the list to show the new status
        fetchAttendees();
      }
    } catch (err) {
      console.error("Check-in error:", err);
      Swal.fire({
        icon: "error",
        title: "Check-in Failed",
        text: err.message,
        confirmButtonColor: "var(--color-red-primary)",
      });
    }
  };

  /* ─────────────────────────────────────────────────────────────────────── */
  /*  Render                                                                  */
  /* ─────────────────────────────────────────────────────────────────────── */

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
        {/* ── Event Banner ── */}
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

        {/* ── Category Stats Cards ── */}
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
                    <th>Ticket Type</th>
                    <th>Purchase Date</th>
                    <th>Status</th>
                    <th>Check-in Time</th>
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

                      {/* Ticket / Booth pill */}
                      {/* Ticket Type & Item */}
                      <td className="type-cell" data-label="Ticket Type">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className={`type-pill pill-bg-${row.typeColor}`}>
                            {row.typePill} | {row.item}
                          </span>
                          {/* <span className="small-body-text item-col">
                            | {row.item}
                          </span> */}
                        </div>
                      </td>

                      {/* Purchase Date */}
                      <td
                        data-label="Purchase Date"
                        className="small-body-text date-col"
                      >
                        {row.purchaseDate}
                      </td>

                      {/* Status */}
                      <td className="status-cell" data-label="Status">
                        <span
                          className={`status-pill status-${row.statusType}`}
                        >
                          {row.status}
                        </span>
                      </td>

                      {/* Check-in Time */}
                      <td
                        data-label="Check-in Time"
                        className="small-body-text"
                      >
                        <div className="att-time-col-wrapper">
                          {row.checkedIn && (
                            <Icon
                              icon="mdi:clock-outline"
                              className="time-icon text-green"
                            />
                          )}
                          <span
                            className={row.checkedIn ? "text-green" : ""}
                          >
                            {" "}
                            {row.checkedInAt}
                          </span>
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
