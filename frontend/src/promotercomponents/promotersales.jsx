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
import "./promotersales.css";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const PromoterSales = ({ selectedEvent }) => {
  const { user } = useAuthContext();

  const [activeFilter, setActiveFilter] = useState("All Sales");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const itemsPerPage = 5;
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

          return {
            id: r._id?.toString().slice(-6).toUpperCase(),
            initials,
            name: customerName,
            email: r.user?.email || "",
            typePill: isBooth ? "Booth" : "Ticket",
            typeColor: isBooth ? "purple" : "green",
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

  // ─── Computed values ───────────────────────────────────────────────────────
  const ticketRows = salesData.filter((r) => r.typePill === "Ticket");
  const boothRows = salesData.filter((r) => r.typePill === "Booth");

  const ticketRevenue = ticketRows.reduce((s, r) => s + r.amountRaw, 0);
  const boothRevenue = boothRows.reduce((s, r) => s + r.amountRaw, 0);
  const totalRevenue = ticketRevenue + boothRevenue;

  const salesStats = [
    {
      title: "Ticket Sales",
      amount: `$${ticketRevenue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      sub: `${ticketRows.length} Transaction${ticketRows.length !== 1 ? "s" : ""}`,
      icon: "mdi:ticket-confirmation-outline",
      colorClass: "text-green",
      bgClass: "bg-green-light",
    },
    {
      title: "Booth Sales",
      amount: `$${boothRevenue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      sub: `${boothRows.length} Transaction${boothRows.length !== 1 ? "s" : ""}`,
      icon: "mdi:map-outline",
      colorClass: "text-purple",
      bgClass: "bg-purple-light",
    },
  ];

  const filteredSalesData = salesData.filter((row) => {
    const q = searchQuery.toLowerCase();
    const matchesFilter = (() => {
      if (activeFilter === "All Sales") return true;
      if (activeFilter === "Tickets") return row.typePill === "Ticket";
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

  const totalPages = Math.ceil(filteredSalesData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredSalesData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
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
      pdf.text(
        `Ticket Sales: $${ticketRevenue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} (${ticketRows.length} transactions)`,
        margin + 2,
        y
      );
      y += lineHeight;
      pdf.text(
        `Booth Sales: $${boothRevenue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} (${boothRows.length} transactions)`,
        margin + 2,
        y
      );
      y += lineHeight;
      pdf.text(
        `Total Transactions: ${filteredSalesData.length}`,
        margin + 2,
        y
      );
      y += lineHeight + 4;

      pdf.setFontSize(12);
      pdf.setTextColor(30, 60, 114);
      pdf.setFont("helvetica", "bold");
      pdf.text("Transactions", margin, y);
      y += 8;

      const headers = [
        "Order ID",
        "Customer",
        "Type",
        "Item",
        "Amount",
        "Date",
        "Status",
      ];
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
        "Report generated from Sales Overview. Use the dashboard for real-time updates.",
        margin,
        y,
        { maxWidth: pdfWidth - 2 * margin }
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
              {eventDate} &bull; {eventVenue}
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

        {/* Stat Cards */}
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
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Ticket Type</th>
                    <th>Item</th>
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
                          {row.typePill}
                        </span>
                      </td>
                      <td
                        className="small-body-text item-col"
                        data-label="Item"
                      >
                        {row.item}
                      </td>
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
    </div>
  );
};

export default PromoterSales;
