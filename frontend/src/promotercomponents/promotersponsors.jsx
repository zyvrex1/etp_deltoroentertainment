import React, { useState, useRef, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import jsPDF from "jspdf";
import {
  loadLogo,
  addReportHeader,
  addReportFooter,
  showExportToast,
  removeExportToast,
  drawTable,
  finalizeReport,
} from "../utils/pdfExport";
import { useAuthContext } from "../hooks/useAuthContext";
import Swal from "sweetalert2";
import QRScannerModal from "./QRScannerModal";
import usePagination from "../hooks/usePagination";
import PaginationBar from "../components/PaginationBar";
import "./promotersponsors.css";

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
  const companyName = r.user?.companyName || "No Company";
  const itemLabel = r.boothCode || r.boothId || "Booth";
  const categoryName = r.categoryName || "Booth";

  const checkIns = Array.isArray(r.checkIns) ? r.checkIns : [];
  const scanCount = checkIns.length;
  const ACTION_LABELS = ["Check In", "Exit", "Check In 2", "Exit 2", "Check In 3", "Exit 3"];
  const nextAction = scanCount < 6 ? ACTION_LABELS[scanCount] : null;

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
    company: companyName,
    email: r.user?.email || "—",
    typePill: categoryName,
    typeColor: "purple",
    categoryName,
    item: itemLabel,
    purchaseDate: formatDate(r.createdAt),
    checkedIn: r.checkedIn || false,
    checkedInAt: r.checkedInAt ? formatDateTime(r.checkedInAt) : "—",
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

const PromoterSponsors = ({ selectedEvent }) => {
  const { user } = useAuthContext();

  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const itemsPerPage = 5;
  const {
    page, totalPages, total,
    setTotal, goTo, next, prev,
    reset: resetPage,
  } = usePagination({ limit: itemsPerPage });
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
            : body.error || "Failed to load sponsor data."
        );
        setAttendees([]);
        return;
      }

      const { reservations } = await res.json();

      const boothReservations = (reservations || []).filter((r) => r.type === "booth");
      const rows = boothReservations.map((r) => mapReservation(r));

      setAttendees(rows);
    } catch (err) {
      console.error("PromoterSponsors fetch error:", err);
      setError("Could not load sponsor data.");
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

  // Booth category stats (by typePill/categoryName)
  const boothCategoryStats = (() => {
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
      (activeFilter === "Pending" && row.scanCount === 0);
    if (!matchesFilter) return false;
    if (!q) return true;
    return (
      row.name.toLowerCase().includes(q) ||
      row.company.toLowerCase().includes(q) ||
      row.email.toLowerCase().includes(q) ||
      row.item.toLowerCase().includes(q) ||
      row.typePill.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    setTotal({
      total: filteredData.length,
      totalPages: Math.ceil(filteredData.length / itemsPerPage) || 1,
    });
  }, [filteredData.length, setTotal]);

  const startIndex = (page - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    resetPage();
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

  // ─── PDF Export (improved, matching PromoterSales style) ──────────────────
  const exportList = async () => {
    const loadingToast = showExportToast();
    const REPORT_TITLE = "Sponsors & Exhibitors";

    try {
      const logoData = await loadLogo();
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const FOOTER_HEIGHT = 15;
      let y = 45;

      addReportHeader(pdf, REPORT_TITLE, logoData);

      // ── helpers ──────────────────────────────────────────────────────────
      const newPageIfNeeded = (needed) => {
        if (y + needed > pdfHeight - 20) {
          addReportFooter(pdf);
          pdf.addPage();
          addReportHeader(pdf, REPORT_TITLE, logoData);
          y = 45;
        }
      };

      const sectionHeading = (title) => {
        newPageIfNeeded(14);
        pdf.setFontSize(11);
        pdf.setTextColor(30, 60, 114);
        pdf.setFont("helvetica", "bold");
        pdf.text(title, margin, y);
        pdf.setDrawColor(30, 60, 114);
        pdf.setLineWidth(0.4);
        pdf.line(margin, y + 2, pdfWidth - margin, y + 2);
        y += 10;
      };

      // ══════════════════════════════════════════════════════════════════
      // EVENT BANNER
      // ══════════════════════════════════════════════════════════════════
      pdf.setFillColor(245, 235, 255);
      pdf.setDrawColor(210, 180, 245);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(margin, y, pdfWidth - margin * 2, 22, 3, 3, "FD");

      // Left — event info
      pdf.setFontSize(11);
      pdf.setTextColor(80, 30, 140);
      pdf.setFont("helvetica", "bold");
      const titleMaxW = pdfWidth - margin * 2 - 55;
      const wrappedTitle = pdf.splitTextToSize(eventTitle, titleMaxW);
      pdf.text(wrappedTitle[0], margin + 4, y + 8);

      pdf.setFontSize(8);
      pdf.setTextColor(100, 70, 150);
      pdf.setFont("helvetica", "normal");
      pdf.text(`${eventDate}  •  ${eventVenue}`, margin + 4, y + 15);

      // Right — total sponsors badge
      const badgeX = pdfWidth - margin - 50;
      pdf.setFillColor(100, 40, 180);
      pdf.roundedRect(badgeX, y + 4, 46, 14, 2, 2, "F");
      pdf.setFontSize(7.5);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "normal");
      pdf.text("Total Sponsors", badgeX + 23, y + 10, { align: "center" });
      pdf.setFontSize(13);
      pdf.setFont("helvetica", "bold");
      pdf.text(`${filteredData.length}`, badgeX + 23, y + 16, { align: "center" });

      y += 30;

      // ══════════════════════════════════════════════════════════════════
      // KEY METRICS — 3-col cards
      // ══════════════════════════════════════════════════════════════════
      sectionHeading("Key Metrics");

      const cardW = (pdfWidth - margin * 2 - 12) / 3;
      const cardH = 22;

      const metricCards = [
        {
          label: "Total Sponsors",
          value: `${counts.all}`,
          sub: "registered booths",
          color: [100, 40, 180],
          bg: [245, 235, 255],
          border: [210, 180, 245],
        },
        {
          label: "Checked In",
          value: `${counts.checked}`,
          sub: `${counts.all > 0 ? Math.round((counts.checked / counts.all) * 100) : 0}% attendance rate`,
          color: [22, 163, 74],
          bg: [235, 255, 245],
          border: [180, 235, 210],
        },
        {
          label: "Pending / Not In",
          value: `${counts.pending}`,
          sub: `${counts.all > 0 ? Math.round((counts.pending / counts.all) * 100) : 0}% not yet arrived`,
          color: [185, 60, 60],
          bg: [255, 240, 240],
          border: [240, 180, 180],
        },
      ];

      metricCards.forEach((m, i) => {
        const cx = margin + i * (cardW + 6);
        const cy = y;

        pdf.setFillColor(...m.bg);
        pdf.setDrawColor(...m.border);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(cx, cy, cardW, cardH, 3, 3, "FD");

        // Dot
        pdf.setFillColor(...m.color);
        pdf.circle(cx + 5, cy + 6, 2, "F");

        // Label
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.setFont("helvetica", "normal");
        pdf.text(m.label, cx + 10, cy + 7);

        // Value
        pdf.setFontSize(13);
        pdf.setTextColor(...m.color);
        pdf.setFont("helvetica", "bold");
        pdf.text(m.value, cx + 5, cy + 16);

        // Sub
        pdf.setFontSize(7);
        pdf.setTextColor(130, 130, 130);
        pdf.setFont("helvetica", "normal");
        pdf.text(m.sub, cx + cardW - 4, cy + 16, { align: "right" });
      });

      y += cardH + 10;

      // ══════════════════════════════════════════════════════════════════
      // BOOTH CATEGORY BREAKDOWN BARS
      // ══════════════════════════════════════════════════════════════════
      if (boothCategoryStats.length > 0) {
        sectionHeading("Check-in by Booth Category");

        const maxCat = Math.max(...boothCategoryStats.map((c) => c.total), 1);
        const barMaxW = pdfWidth - margin * 2 - 60;

        boothCategoryStats.forEach((cat) => {
          newPageIfNeeded(14);
          const checkedInRate = cat.total > 0 ? cat.checked / cat.total : 0;
          const fillW = (cat.total / maxCat) * barMaxW;
          const checkedFillW = fillW * checkedInRate;

          pdf.setFontSize(8.5);
          pdf.setTextColor(50, 50, 50);
          pdf.setFont("helvetica", "normal");
          const labelText = pdf.splitTextToSize(cat.name, 35)[0];
          pdf.text(labelText, margin, y + 4.5);

          // Track (total)
          pdf.setFillColor(235, 235, 235);
          pdf.roundedRect(margin + 38, y, barMaxW, 6, 1, 1, "F");

          // Fill (checked in — purple)
          if (checkedFillW > 0) {
            pdf.setFillColor(120, 60, 200);
            pdf.roundedRect(margin + 38, y, checkedFillW, 6, 1, 1, "F");
          }

          // Label right
          pdf.setFontSize(7.5);
          pdf.setTextColor(80, 80, 80);
          pdf.text(
            `${cat.checked}/${cat.total} checked in`,
            margin + 38 + barMaxW + 2,
            y + 4.5
          );

          y += 11;
        });

        // Summary strip
        y += 2;
        newPageIfNeeded(12);
        pdf.setFillColor(250, 245, 255);
        pdf.setDrawColor(220, 200, 245);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(margin, y, pdfWidth - margin * 2, 10, 2, 2, "FD");
        pdf.setFontSize(8);
        pdf.setTextColor(80, 40, 130);
        pdf.setFont("helvetica", "bold");
        pdf.text(
          `Total Sponsors: ${counts.all}   |   Checked In: ${counts.checked}   |   Pending: ${counts.pending}`,
          pdfWidth / 2,
          y + 6.5,
          { align: "center" }
        );
        y += 16;
      }

      // ══════════════════════════════════════════════════════════════════
      // SPONSORS TABLE
      // ══════════════════════════════════════════════════════════════════
      newPageIfNeeded(20);
      sectionHeading("Sponsors & Exhibitors");

      const headers = [
        "Name",
        "Company",
        "Booth",
        "Purchase Date",
        "Status",
        "Check-in Time",
      ];
      const rows = filteredData.map((row) => [
        row.name,
        row.company,
        `${row.typePill} | ${row.item}`,
        row.purchaseDate,
        row.status,
        row.checkIn1 || "—",
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

      // ══════════════════════════════════════════════════════════════════
      // FOOTER STRIP
      // ══════════════════════════════════════════════════════════════════
      y += 8;
      newPageIfNeeded(16);
      pdf.setFillColor(250, 245, 255);
      pdf.setDrawColor(220, 200, 245);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(margin, y, pdfWidth - margin * 2, 14, 2, 2, "FD");
      pdf.setFontSize(8);
      pdf.setTextColor(100, 60, 150);
      pdf.setFont("helvetica", "italic");
      pdf.text(
        `${filteredData.length} sponsor(s) for "${eventTitle}"  •  Generated by eTicketsPro`,
        pdfWidth / 2,
        y + 9,
        { align: "center" }
      );

      finalizeReport(pdf);
      pdf.save(`Sponsors_List_${new Date().toISOString().split("T")[0]}.pdf`);
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
          text: "This booth has already completed all 3 check-in/exit events.",
          confirmButtonColor: "var(--color-red-primary)",
        });
        return;
      }

      const actionType = data.actionType;
      const scanNumber = data.scanNumber;
      const firstName = data.reservation?.user?.firstName || "Sponsor";

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
    <div className="spon-container">
      <div className="spon-header">
        <div className="spon-header-left">
          <h1 className="spon-title">Sponsors</h1>
          <p className="small-body-text spon-header-subtitle">
            Manage event sponsors and their booths
          </p>
        </div>

        <div className="spon-header-controls">
          <button
            className="outlined-button spon-export-btn"
            onClick={exportList}
            disabled={loading || attendees.length === 0}
          >
            <Icon icon="mdi:tray-arrow-down" className="export-icon" />
            Export List
          </button>
          <button
            className="primary-button spon-scan-btn"
            style={{ marginLeft: "10px" }}
            onClick={() => setIsScannerOpen(true)}
            disabled={loading}
          >
            <Icon icon="mdi:qrcode-scan" className="scan-icon" />
            Scan Ticket
          </button>
        </div>
      </div>

      <div className="spon-main-content">
        {/* ── Event Banner ── */}
        <div className="spon-event-banner">
          <div className="spon-banner-left">
            <h3>{selectedEvent?.title || "—"}</h3>
            <p className="small-body-text">
              {selectedEvent?.startDate
                ? new Date(selectedEvent.startDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
                : "—"}{" "}
              &bull; {selectedEvent?.venue?.name || "—"}
            </p>
          </div>
          <div className="spon-banner-stats">
            <div className="spon-stat-item">
              <h3>{loading ? "—" : counts.all}</h3>
              <span className="spon-stat-label smaller-body-text">
                Total Registered
              </span>
            </div>
            <div className="spon-stat-item">
              <h3 className="text-green">{loading ? "—" : counts.checked}</h3>
              <span className="spon-stat-label smaller-body-text">
                Checked In
              </span>
            </div>
            <div className="spon-stat-item">
              <h3 className="text-red">{loading ? "—" : counts.pending}</h3>
              <span className="spon-stat-label smaller-body-text">Pending</span>
            </div>
          </div>
        </div>

        <div className="spon-table-container">
          <div className="spon-toolbar">
            <div className="spon-toolbar-left">
              <div className="spon-search">
                <Icon icon="mdi:magnify" />
                <input
                  type="text"
                  placeholder="Search sponsors..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    resetPage();
                  }}
                  className="small-body-text"
                />
              </div>
            </div>

            <div className="spon-toolbar-right">
              <div className="spon-filter-dropdown" ref={filterDropdownRef}>
                <button
                  className="spon-filter-dropdown-btn"
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                >
                  <span className="truncate-text">{activeFilter}</span>
                  <Icon
                    icon="mdi:chevron-down"
                    className={`dropdown-icon ${isFilterDropdownOpen ? "open" : ""}`}
                  />
                </button>

                {isFilterDropdownOpen && (
                  <div className="spon-filter-dropdown-menu">
                    {["All", "Checked In", "Pending"].map((option) => (
                      <button
                        key={option}
                        className={`spon-filter-dropdown-item small-body-text ${activeFilter === option ? "active" : ""}`}
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

          <div className="spon-table-wrapper">
            {loading ? (
              <div className="empty-state">
                <Icon icon="mdi:loading" width="40" className="spin-icon" />
                <p className="small-body-text">Loading sponsors…</p>
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
                <h4>No Sponsor(s) found</h4>
                <p className="small-body-text">
                  {searchQuery
                    ? `No sponsors match "${searchQuery}".`
                    : "No sponsors have been registered for this event yet."}
                </p>
              </div>
            ) : (
              <table className="spon-table">
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
                            <span className="smaller-body-text user-email">
                              {row.company}
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
                        className="small-body-text date-col"
                        data-label="Purchase Date"
                      >
                        {row.purchaseDate}
                      </td>
                      <td className="status-cell" data-label="Status">
                        <span className={`status-pill status-${row.statusType}`}>
                          {row.status}
                        </span>
                      </td>
                      <td
                        className="small-body-text spon-time-col"
                        data-label="Check-in Times"
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

          <PaginationBar
            page={page}
            totalPages={totalPages}
            total={total}
            onPrev={prev}
            onNext={next}
            onGoTo={goTo}
          />
        </div>
      </div>
      <QRScannerModal
        show={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
};

export default PromoterSponsors;