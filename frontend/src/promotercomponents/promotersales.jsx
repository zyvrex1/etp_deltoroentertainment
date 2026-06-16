import React, { useState, useRef, useEffect } from "react";
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
import usePagination from "../hooks/usePagination";
import PaginationBar from "../components/PaginationBar";
import "./promotersales.css";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const PromoterSales = ({ selectedEvent }) => {
  const { user } = useAuthContext();

  const [activeFilter, setActiveFilter] = useState("All Sales");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const itemsPerPage = 5;
  const {
    page, totalPages, total,
    setTotal, goTo, next, prev,
    reset: resetPage,
  } = usePagination({ limit: itemsPerPage });
  const filterDropdownRef = useRef(null);

  const toggleRow = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  // ─── Fetch real data when event changes ──────────────────────────────────
  useEffect(() => {
    if (!selectedEvent?._id || !user?.token) return;

    const fetchSales = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${BASE_URL}/api/reservations/event/${selectedEvent._id}/sales`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );

        if (!res.ok) {
          if (res.status === 403) {
            setError("You are not assigned to this event.");
          } else {
            const body = await res.json().catch(() => ({}));
            setError(body.error || "Failed to load sales data.");
          }
          setSalesData([]);
          return;
        }

        const { reservations } = await res.json();

        // Map reservations → table rows
        const rows = (reservations || []).map((r) => {
          const isBooth = r.type === "booth";
          const customerName = r.user?.companyName
            ? r.user.companyName
            : `${r.user?.firstName || ""} ${r.user?.lastName || ""}`.trim();
          const initials = customerName
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          const itemLabel = isBooth
            ? r.boothCode || r.boothId || "Booth"
            : r.seatLabels?.length
              ? r.seatLabels.join(", ")
              : `${r.seatIds?.length || 1} seat(s)`;

          let typePill = "Ticket";
          let typeColor = "green";

          if (r.type === 'booth') {
            typePill = "Booth";
            typeColor = "purple";
          } else if (r.type === 'mixed-ticket') {
            typePill = "Mixed Tickets";
            typeColor = "blue";
          } else if (r.type === 'general-fee') {
            typePill = "General Fee";
            typeColor = "orange";
          } else if (r.type === 'seat') {
            // For explicitly seat-type records, but could be legacy records.
            // Check seatIds just in case it's an old record that has GA- seats but is still type 'seat'.
            const hasGA = r.seatIds?.some(id => id && id.startsWith("GA-"));
            const hasPhysical = r.seatIds?.some(id => id && !id.startsWith("GA-"));
            if (hasGA && hasPhysical) {
              typePill = "Mixed Tickets";
              typeColor = "blue";
            } else if (hasGA) {
              typePill = "General Fee";
              typeColor = "orange";
            } else {
              typePill = "Seat";
              typeColor = "green";
            }
          } else if (r.type === 'sponsorship') {
            typePill = "Sponsorship";
            typeColor = "teal";
          }

          return {
            id: r._id?.toString().slice(-6).toUpperCase(),
            initials,
            name: customerName,
            email: r.user?.email || "",
            typePill,
            typeColor,
            item: itemLabel,
            amount: `$${(r.amount?.total || 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
            amountRaw: r.amount?.total || 0,
            date: new Date(r.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
            status: r.status,
            statusColor:
              r.status === "confirmed"
                ? "green"
                : r.status === "pending"
                  ? "yellow"
                  : "red",
          };
        });

        setSalesData(rows);
      } catch (err) {
        console.error("PromoterSales fetch error:", err);
        setError("Could not load sales data.");
        setSalesData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [selectedEvent?._id, user?.token]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(e.target)
      ) {
        setIsFilterDropdownOpen(false);
      }
    };
    if (isFilterDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFilterDropdownOpen]);

  // ─── Ticket category type flags ────────────────────────────────────────────
  const priceLevels = selectedEvent?.priceLevels || [];
  const hasAnyCategories = priceLevels.length > 0;
  const hasGeneralFee = priceLevels.some(
    (pl) => (pl.type || "").toLowerCase().includes("general fee")
  );
  const hasSeat = priceLevels.some(
    (pl) => (pl.type || "").toLowerCase().includes("seat")
  );
  const hasBooth = priceLevels.some(
    (pl) => (pl.type || "").toLowerCase().includes("booth")
  );
  // Show ticket/seat card when the event has General Fee OR Seat categories
  const showTicketCard = hasGeneralFee || hasSeat;
  // Label: "Seat Sales" only when there are Seat types but no General Fee types
  const ticketCardTitle = hasSeat && !hasGeneralFee ? "Seat Sales" : "Ticket Sales";

  // ─── Computed values ───────────────────────────────────────────────────────
  const gaRows = salesData.filter((r) => r.typePill === "General Fee" && !['rejected', 'refunded', 'cancelled'].includes(r.status));
  const seatRows = salesData.filter((r) => (r.typePill === "Seat" || r.typePill === "Ticket") && !['rejected', 'refunded', 'cancelled'].includes(r.status));
  const mixedRows = salesData.filter((r) => r.typePill === "Mixed Tickets" && !['rejected', 'refunded', 'cancelled'].includes(r.status));
  const boothRows = salesData.filter((r) => r.typePill === "Booth" && !['rejected', 'refunded', 'cancelled'].includes(r.status));

  const gaRevenue = gaRows.reduce((s, r) => s + r.amountRaw, 0);
  const seatRevenue = seatRows.reduce((s, r) => s + r.amountRaw, 0);
  const mixedRevenue = mixedRows.reduce((s, r) => s + r.amountRaw, 0);
  const boothRevenue = boothRows.reduce((s, r) => s + r.amountRaw, 0);
  const totalRevenue = gaRevenue + seatRevenue + mixedRevenue + boothRevenue;

  const salesStats = [
    ...(hasGeneralFee || gaRows.length > 0 ? [{
      title: "Ticket Sales",
      amount: `$${gaRevenue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      sub: `${gaRows.length} Transaction${gaRows.length !== 1 ? "s" : ""}`,
      icon: "mdi:ticket-confirmation-outline",
      colorClass: "text-green",
      bgClass: "bg-green-light",
    }] : []),
    ...(hasSeat || seatRows.length > 0 ? [{
      title: "Seat Sales",
      amount: `$${seatRevenue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      sub: `${seatRows.length} Transaction${seatRows.length !== 1 ? "s" : ""}`,
      icon: "mdi:ticket-confirmation-outline",
      colorClass: "text-green",
      bgClass: "bg-green-light",
    }] : []),
    ...(mixedRows.length > 0 ? [{
      title: "Mixed Ticket Sales",
      amount: `$${mixedRevenue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      sub: `${mixedRows.length} Transaction${mixedRows.length !== 1 ? "s" : ""}`,
      icon: "mdi:ticket-confirmation-outline",
      colorClass: "text-green",
      bgClass: "bg-green-light",
    }] : []),
    ...(hasBooth ? [{
      title: "Booth Sales",
      amount: `$${boothRevenue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      sub: `${boothRows.length} Transaction${boothRows.length !== 1 ? "s" : ""}`,
      icon: "mdi:map-outline",
      colorClass: "text-purple",
      bgClass: "bg-purple-light",
    }] : []),
  ];

  const filteredSalesData = salesData.filter((row) => {
    const q = searchQuery.toLowerCase();
    const matchesFilter = (() => {
      if (activeFilter === "All Sales") return true;
      if (activeFilter === "Tickets") return row.typePill !== "Booth";
      if (activeFilter === "Booths") return row.typePill === "Booth";
      return true;
    })();
    if (!matchesFilter) return false;
    if (!q) return true;
    return (
      row.name.toLowerCase().includes(q) ||
      row.item.toLowerCase().includes(q) ||
      row.id.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    setTotal({
      total: filteredSalesData.length,
      totalPages: Math.ceil(filteredSalesData.length / itemsPerPage) || 1,
    });
  }, [filteredSalesData.length, setTotal]);

  const startIndex = (page - 1) * itemsPerPage;
  const paginatedData = filteredSalesData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    resetPage();
  };

  // ─── Event banner helpers ─────────────────────────────────────────────────
  const eventTitle = selectedEvent?.title || "—";
  const eventDate = selectedEvent?.startDate
    ? new Date(selectedEvent.startDate).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    : "—";
  const eventVenue = selectedEvent?.venue?.name || "—";
  const eventAddress = selectedEvent?.venue?.address || "—";
  const eventCity = selectedEvent?.venue?.city || "—";
  const eventZipCode = selectedEvent?.venue?.zipCode || "—";

  // ─── PDF Export ───────────────────────────────────────────────────────────
  const exportReport = async () => {
    const loadingToast = showExportToast();
    const REPORT_TITLE = "Sales Overview";

    try {
      const logoData = await loadLogo();
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let y = 45;

      addReportHeader(pdf, REPORT_TITLE, logoData);

      // ── helpers ────────────────────────────────────────────────────────
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
      pdf.setFillColor(235, 240, 255);
      pdf.setDrawColor(180, 200, 245);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(margin, y, pdfWidth - margin * 2, 22, 3, 3, "FD");

      // Left — event info
      pdf.setFontSize(11);
      pdf.setTextColor(30, 60, 114);
      pdf.setFont("helvetica", "bold");
      const titleMaxW = pdfWidth - margin * 2 - 55;
      const wrappedTitle = pdf.splitTextToSize(eventTitle, titleMaxW);
      pdf.text(wrappedTitle[0], margin + 4, y + 8); // first line only to stay in box

      pdf.setFontSize(8);
      pdf.setTextColor(80, 90, 130);
      pdf.setFont("helvetica", "normal");
      pdf.text(`${eventDate}  •  ${eventVenue}`, margin + 4, y + 15);

      // Right — total revenue badge
      const badgeX = pdfWidth - margin - 50;
      pdf.setFillColor(30, 60, 114);
      pdf.roundedRect(badgeX, y + 4, 46, 14, 2, 2, "F");
      pdf.setFontSize(7.5);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "normal");
      pdf.text("Total Revenue", badgeX + 23, y + 10, { align: "center" });
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text(
        `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        badgeX + 23, y + 16, { align: "center" }
      );

      y += 30;

      // ══════════════════════════════════════════════════════════════════
      // KEY METRICS — 2-col cards
      // ══════════════════════════════════════════════════════════════════
      sectionHeading("Key Metrics");

      const cardW = (pdfWidth - margin * 2 - 6) / 2;
      const cardH = 22;

      const metricCards = [];
      if (hasGeneralFee || gaRows.length > 0) {
        metricCards.push({
          label: "General Fee Sales",
          value: `$${gaRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          sub: `${gaRows.length} transaction${gaRows.length !== 1 ? "s" : ""}`,
          color: [22, 163, 74],
          bg: [235, 255, 245],
          border: [180, 235, 210],
        });
      }
      if (hasSeat || seatRows.length > 0) {
        metricCards.push({
          label: "Seat Sales",
          value: `$${seatRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          sub: `${seatRows.length} transaction${seatRows.length !== 1 ? "s" : ""}`,
          color: [22, 163, 74],
          bg: [235, 255, 245],
          border: [180, 235, 210],
        });
      }
      if (mixedRows.length > 0) {
        metricCards.push({
          label: "Mixed Ticket Sales",
          value: `$${mixedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          sub: `${mixedRows.length} transaction${mixedRows.length !== 1 ? "s" : ""}`,
          color: [22, 163, 74],
          bg: [235, 255, 245],
          border: [180, 235, 210],
        });
      }
      if (hasBooth || boothRows.length > 0) {
        metricCards.push({
          label: "Booth Sales",
          value: `$${boothRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          sub: `${boothRows.length} transaction${boothRows.length !== 1 ? "s" : ""}`,
          color: [120, 60, 200],
          bg: [245, 235, 255],
          border: [210, 190, 245],
        });
      }

      metricCards.forEach((m, i) => {
        const cx = margin + (i % 2) * (cardW + 6);
        const cy = y + Math.floor(i / 2) * (cardH + 6);

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

      y += Math.ceil(metricCards.length / 2) * (cardH + 6) + 4;

      // ══════════════════════════════════════════════════════════════════
      // SALES BREAKDOWN BARS
      // ══════════════════════════════════════════════════════════════════
      sectionHeading("Sales Breakdown");

      // compute refunded amount
      const refundedRows = salesData.filter(r =>
        ["rejected", "refunded", "cancelled"].includes(r.status)
      );
      const refundedRevenue = refundedRows.reduce((s, r) => s + r.amountRaw, 0);
      const refundedCount = refundedRows.length;

      const breakdownItems = [];
      if (hasGeneralFee || gaRows.length > 0) {
        breakdownItems.push({
          label: "General Fee Sales",
          value: gaRevenue,
          count: gaRows.length,
          color: [22, 163, 74],
        });
      }
      if (hasSeat || seatRows.length > 0) {
        breakdownItems.push({
          label: "Seat Sales",
          value: seatRevenue,
          count: seatRows.length,
          color: [22, 163, 74],
        });
      }
      if (mixedRows.length > 0) {
        breakdownItems.push({
          label: "Mixed Ticket Sales",
          value: mixedRevenue,
          count: mixedRows.length,
          color: [22, 163, 74],
        });
      }
      if (hasBooth || boothRows.length > 0) {
        breakdownItems.push({
          label: "Booth Sales",
          value: boothRevenue,
          count: boothRows.length,
          color: [120, 60, 200],
        });
      }

      breakdownItems.push({
        label: "Refunded / Cancelled",
        value: refundedRevenue,
        count: refundedCount,
        color: [200, 200, 200],
      });

      const maxBreakdown = Math.max(...breakdownItems.map(b => b.value), 1);
      const barMaxW = pdfWidth - margin * 2 - 60;

      breakdownItems.forEach((item) => {
        newPageIfNeeded(14);
        const fillW = (item.value / maxBreakdown) * barMaxW;

        pdf.setFontSize(8.5);
        pdf.setTextColor(50, 50, 50);
        pdf.setFont("helvetica", "normal");
        pdf.text(item.label, margin, y + 4.5);

        // Track
        pdf.setFillColor(235, 235, 235);
        pdf.roundedRect(margin + 38, y, barMaxW, 6, 1, 1, "F");

        // Fill
        if (fillW > 0) {
          pdf.setFillColor(...item.color);
          pdf.roundedRect(margin + 38, y, fillW, 6, 1, 1, "F");
        }

        // Label right
        pdf.setFontSize(7.5);
        pdf.setTextColor(80, 80, 80);
        pdf.text(
          `$${item.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}  (${item.count})`,
          margin + 38 + barMaxW + 2, y + 4.5
        );

        y += 11;
      });

      // Summary strip
      y += 2;
      newPageIfNeeded(12);
      pdf.setFillColor(248, 248, 255);
      pdf.setDrawColor(210, 210, 240);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(margin, y, pdfWidth - margin * 2, 10, 2, 2, "FD");
      pdf.setFontSize(8);
      pdf.setTextColor(60, 60, 120);
      pdf.setFont("helvetica", "bold");
      pdf.text(
        `Total Revenue: $${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}   |   Total Transactions: ${filteredSalesData.length}`,
        pdfWidth / 2, y + 6.5, { align: "center" }
      );
      y += 16;

      // ══════════════════════════════════════════════════════════════════
      // TRANSACTIONS TABLE
      // ══════════════════════════════════════════════════════════════════
      newPageIfNeeded(20);
      sectionHeading("Transactions");

      const headers = ["Order ID", "Customer", "Type", "Item", "Amount", "Date", "Status"];
      const rows = filteredSalesData.map((row) => [
        row.id,
        row.name,
        row.typePill,
        row.item,
        row.amount,
        row.date,
        row.status,
      ]);

      y = drawTable(
        pdf, y, headers, rows,
        margin, pdfWidth, pdfHeight, 15, 10, 3,
        logoData, REPORT_TITLE
      );

      // ══════════════════════════════════════════════════════════════════
      // FOOTER STRIP
      // ══════════════════════════════════════════════════════════════════
      y += 8;
      newPageIfNeeded(16);
      pdf.setFillColor(245, 247, 255);
      pdf.setDrawColor(210, 218, 245);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(margin, y, pdfWidth - margin * 2, 14, 2, 2, "FD");
      pdf.setFontSize(8);
      pdf.setTextColor(80, 90, 130);
      pdf.setFont("helvetica", "italic");
      pdf.text(
        `${filteredSalesData.length} transaction(s) for "${eventTitle}"  •  Generated by eTicketsPro`,
        pdfWidth / 2, y + 9, { align: "center" }
      );

      finalizeReport(pdf);
      pdf.save(`Sales_Report_${new Date().toISOString().split("T")[0]}.pdf`);

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      removeExportToast(loadingToast);
    }
  };
  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="sales-container">
      <div className="sales-header">
        <div className="sales-header-left">
          <h1 className="sales-title">Sales Overview</h1>
          <p className="small-body-text sales-header-subtitle">
            Track all transactions and revenue
          </p>
        </div>
        <div className="sales-header-controls">
          <button
            className="outlined-button sales-export-btn"
            onClick={exportReport}
            disabled={loading || salesData.length === 0}
          >
            <Icon icon="mdi:tray-arrow-up" className="export-icon" />
            Export Report
          </button>
        </div>
      </div>

      <div className="sales-main-content">
        {/* Event Banner */}
        <div className="sales-event-banner">
          <div className="sales-banner-left">
            <h3>{eventTitle}</h3>
            <p className="small-body-text">
              {eventDate} &bull; {eventVenue} &bull; {eventCity}, &bull; {eventZipCode}
            </p>
          </div>
          <div className="sales-banner-stats">
            <div className="sales-stat-item">
              <h3 className="text-green-stat">
                ${totalRevenue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h3>
              <span className="sales-stat-label smaller-body-text">
                Total Revenue
              </span>
            </div>
          </div>
        </div>

        {/* Stat Cards — only shown when ticket categories exist */}
        {hasAnyCategories && salesStats.length > 0 && (
          <div className="sales-cards-container">
            {salesStats.map((stat, idx) => (
              <div className="sales-card" key={idx}>
                <div className="sales-card-left">
                  <p
                    className={`smaller-body-text sales-card-title ${stat.colorClass}`}
                  >
                    {stat.title}
                  </p>
                  <h3 className={stat.colorClass}>{stat.amount}</h3>
                  <p className={`smaller-body-text ${stat.colorClass}`}>
                    {stat.sub}
                  </p>
                </div>
                <div className={`sales-card-icon ${stat.bgClass}`}>
                  <Icon icon={stat.icon} className={stat.colorClass} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="sales-table-container">
          <div className="sales-toolbar">
            <div className="sales-toolbar-left">
              <div className="sales-search">
                <Icon icon="mdi:magnify" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="small-body-text"
                />
              </div>
            </div>

            <div className="sales-toolbar-right">
              <div className="sales-filter-dropdown" ref={filterDropdownRef}>
                <button
                  className="sales-filter-dropdown-btn"
                  onClick={() =>
                    setIsFilterDropdownOpen(!isFilterDropdownOpen)
                  }
                >
                  <span className="truncate-text">{activeFilter}</span>
                  <Icon
                    icon="mdi:chevron-down"
                    className={`dropdown-icon ${isFilterDropdownOpen ? "open" : ""
                      }`}
                  />
                </button>

                {isFilterDropdownOpen && (
                  <div className="sales-filter-dropdown-menu">
                    {["All Sales", "Tickets", "Booths"].map((option) => (
                      <button
                        key={option}
                        className={`sales-filter-dropdown-item small-body-text ${activeFilter === option ? "active" : ""
                          }`}
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

          <div className="sales-table-wrapper">
            {loading ? (
              <div className="empty-state">
                <Icon icon="mdi:loading" width="40" className="spin-icon" />
                <p className="small-body-text">Loading sales data…</p>
              </div>
            ) : error ? (
              <div className="empty-state">
                <Icon icon="mdi:alert-circle-outline" width="48" />
                <h4>Access Denied</h4>
                <p className="small-body-text">{error}</p>
              </div>
            ) : paginatedData.length === 0 ? (
              <div className="empty-state">
                <Icon icon="mdi:receipt-text-outline" width="48" />
                <h4>No transactions found</h4>
                <p className="small-body-text">
                  {searchQuery
                    ? `No transactions match "${searchQuery}".`
                    : "No sales have been recorded for this event yet."}
                </p>
              </div>
            ) : (
              <table className="sales-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Participant</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, index) => (
                    <tr
                      key={index}
                      className={expandedRow === index ? "expanded" : ""}
                    >
                      <td
                        className="small-body-text date-col id-td"
                        data-label="Order ID"
                      >
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
                        <span>{row.id}</span>
                      </td>
                      <td className="name-td" data-label="Customer">
                        <div className="user-info">
                          <div className="user-avatar">{row.initials}</div>
                          <div>
                            <h6 className="user-name">{row.name}</h6>
                            <p className="smaller-body-text user-email">
                              {row.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td data-label="Type">
                        <span
                          className={`button-label pill-bg-${row.typeColor}`}
                        >
                          {row.typePill} |  {row.item}
                        </span>
                      </td>
                      {/* <td
                        className="small-body-text item-col"
                        data-label="Item"
                      >
                        {row.item}
                      </td> */}
                      <td
                        className="ps-green-amount large-body-text"
                        data-label="Amount"
                      >
                        <strong>{row.amount}</strong>
                      </td>
                      <td
                        className="small-body-text date-col"
                        data-label="Date"
                      >
                        {row.date}
                      </td>
                      <td className="status-cell" data-label="Status">
                        <span
                          className={`button-label pill-bg-${row.statusColor}`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
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
    </div>
  );
};

export default PromoterSales;
