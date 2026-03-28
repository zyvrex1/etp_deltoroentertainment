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
} from "../admincomponents/utils/pdfExport";
import "./promotersales.css";

const PromoterSales = () => {
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState("techstart");
  const [activeFilter, setActiveFilter] = useState("All Sales");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState(null);
  const itemsPerPage = 5;
  const eventDropdownRef = useRef(null);
  const filterDropdownRef = useRef(null);

  const toggleRow = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        eventDropdownRef.current &&
        !eventDropdownRef.current.contains(event.target)
      ) {
        setIsEventDropdownOpen(false);
      }
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target)
      ) {
        setIsFilterDropdownOpen(false);
      }
    };

    if (isEventDropdownOpen || isFilterDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEventDropdownOpen, isFilterDropdownOpen]);

  const eventOptions = [
    { value: "techstart", label: "TechStart Summit 2026" },
    {
      value: "techstart_creator",
      label: "TechStart Summit 2026 Creator Economy Expo SaaS Growth Meetup",
    },
  ];

  const getSelectedEventLabel = () => {
    const option = eventOptions.find((opt) => opt.value === selectedEvent);
    return option ? option.label : "Select Event";
  };

  const salesStats = [
    {
      title: "Ticket Sales",
      amount: "$448",
      sub: "4 Transactions",
      icon: "mdi:ticket-confirmation-outline",
      colorClass: "text-green",
      bgClass: "bg-green-light",
    },
    {
      title: "Booth Sales",
      amount: "$15,000",
      sub: "1 transactions",
      icon: "mdi:map-outline",
      colorClass: "text-purple",
      bgClass: "bg-purple-light",
    },
  ];

  const salesData = [
    {
      id: "001",
      initials: "SJ",
      name: "Sarah Jenkins",
      email: "sarah@example.com",
      typePill: "ticket",
      typeColor: "green",
      item: "VIP Access Row A, Seat 12",
      amount: "$299",
      date: "2026-05-13",
      status: "completed",
      statusColor: "green",
    },
    {
      id: "002",
      initials: "TI",
      name: "TechCorp Inc.",
      email: "john@techcorp.com",
      typePill: "Booth",
      typeColor: "purple",
      item: "Booth VIP 101",
      amount: "$299",
      date: "2026-04-11",
      status: "completed",
      statusColor: "green",
    },
    {
      id: "003",
      initials: "SJ",
      name: "Sarah Jenkins",
      email: "sarah@example.com",
      typePill: "ticket",
      typeColor: "green",
      item: "VIP Access Row A, Seat 12",
      amount: "$299",
      date: "2026-05-16",
      status: "refunded",
      statusColor: "red",
    },
    {
      id: "001",
      initials: "SJ",
      name: "Sarah Jenkins",
      email: "sarah@example.com",
      typePill: "ticket",
      typeColor: "green",
      item: "General Admission Row C, Seat 12",
      amount: "$299",
      date: "2026-05-13",
      status: "completed",
      statusColor: "green",
    },
    {
      id: "001",
      initials: "SJ",
      name: "Sarah Jenkins",
      email: "sarah@example.com",
      typePill: "ticket",
      typeColor: "green",
      item: "Early Bird Row D, Seat 1",
      amount: "$299",
      date: "2026-05-13",
      status: "completed",
      statusColor: "green",
    },
    {
      id: "001",
      initials: "SJ",
      name: "Sarah Jenkins",
      email: "sarah@example.com",
      typePill: "ticket",
      typeColor: "green",
      item: "Early Bird Row D, Seat 1",
      amount: "$299",
      date: "2026-05-13",
      status: "completed",
      statusColor: "green",
    },
  ];

  const filteredSalesData = salesData.filter((row) => {
    const q = searchQuery.toLowerCase();
    const matchesFilter = (() => {
      if (activeFilter === "All Sales") return true;
      if (activeFilter === "Tickets")
        return row.typePill.toLowerCase() === "ticket";
      if (activeFilter === "Booths")
        return row.typePill.toLowerCase() === "booth";
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

  const counts = {
    all: salesData.length,
    tickets: salesData.filter((row) => row.typePill.toLowerCase() === "ticket")
      .length,
    booths: salesData.filter((row) => row.typePill.toLowerCase() === "booth")
      .length,
  };

  const totalPages = Math.ceil(filteredSalesData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredSalesData.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

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
      const currentEventLabel = getSelectedEventLabel();

      const ticketSales = filteredSalesData.filter(
        (row) => row.typePill.toLowerCase() === "ticket",
      );
      const boothSales = filteredSalesData.filter(
        (row) => row.typePill.toLowerCase() === "booth",
      );
      const sumAmounts = (data) =>
        data.reduce((total, row) => {
          const numeric =
            parseFloat(String(row.amount).replace(/[^0-9.-]+/g, "")) || 0;
          return total + numeric;
        }, 0);

      const ticketTotal = sumAmounts(ticketSales);
      const boothTotal = sumAmounts(boothSales);

      pdf.text(`Event: ${currentEventLabel}`, margin + 2, y);
      y += lineHeight;
      pdf.text(
        `Ticket Sales: $${ticketTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${ticketSales.length} transactions)`,
        margin + 2,
        y,
      );
      y += lineHeight;
      pdf.text(
        `Booth Sales: $${boothTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${boothSales.length} transactions)`,
        margin + 2,
        y,
      );
      y += lineHeight;
      pdf.text(
        `Total Transactions: ${filteredSalesData.length}`,
        margin + 2,
        y,
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
        { maxWidth: pdfWidth - 2 * margin },
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
          >
            <Icon icon="mdi:tray-arrow-up" className="export-icon" />
            Export Report
          </button>
        </div>
      </div>

      <div className="sales-main-content">
        <div className="sales-event-banner">
          <div className="sales-banner-left">
            <h3>TechStart Summit 2026</h3>
            <p className="small-body-text">June 16, 2026 &bull; Moscone</p>
          </div>
          <div className="sales-banner-stats">
            <div className="sales-stat-item">
              <h3 className="text-green-stat">$25,448</h3>
              <span className="sales-stat-label smaller-body-text">
                Total Revenue
              </span>
            </div>
          </div>
        </div>

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
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                >
                  <span className="truncate-text">{activeFilter}</span>
                  <Icon
                    icon="mdi:chevron-down"
                    className={`dropdown-icon ${isFilterDropdownOpen ? "open" : ""}`}
                  />
                </button>

                {isFilterDropdownOpen && (
                  <div className="sales-filter-dropdown-menu">
                    {["All Sales", "Tickets", "Booths"].map((option) => (
                      <button
                        key={option}
                        className={`sales-filter-dropdown-item small-body-text ${activeFilter === option ? "active" : ""}`}
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
            {paginatedData.length === 0 ? (
              // Empty state outside table for mobile-friendly display
              <div className="empty-state">
                <Icon icon="mdi:magnify-close" width="48" />
                <h4>No payments found</h4>
                <p className="small-body-text">
                  No payments match "<strong>{searchQuery}</strong>".
                </p>
              </div>
            ) : (
              <table className="sales-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Type</th>
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
