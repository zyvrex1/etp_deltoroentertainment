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
import "./promotersponsors.css";

const PromoterSponsors = () => {
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState("techstart");
  const [activeFilter, setActiveFilter] = useState("All");
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

  const sponsorStats = [
    {
      type: "Total",
      count: "5",
      checkins: "1 checked in",
      colorClass: "text-blue",
      bgClass: "bg-blue-light",
    },
    {
      type: "VIP",
      count: "5",
      checkins: "1 checked in",
      colorClass: "text-purple",
      bgClass: "bg-purple-light",
    },
    {
      type: "Corner Location",
      count: "1",
      checkins: "1 checked in",
      colorClass: "text-yellow",
      bgClass: "bg-yellow-light",
    },
    {
      type: "Inline Location",
      count: "1",
      checkins: "1 checked in",
      colorClass: "text-green",
      bgClass: "bg-green-light",
    },
  ];

  const sponsorsData = [
    {
      initials: "SJ",
      name: "Sarah Jenkins",
      email: "Tech Corp",
      boothPill: "VIP",
      date: "2026-04-19",
      status: "Checked In",
      statusType: "checked",
      time: "2026-06-16 08:45",
    },
    {
      initials: "MC",
      name: "Michael Chen",
      email: "Tech Corp",
      boothPill: "Inline Location",
      date: "2026-01-12",
      status: "Checked In",
      statusType: "checked",
      time: "2026-06-16 08:50",
    },
    {
      initials: "MC",
      name: "Michael Chen",
      email: "Innovate Labs",
      boothPill: "Corner Locationt",
      date: "2026-01-15",
      status: "Checked In",
      statusType: "checked",
      time: "2026-06-16 09:05",
    },
    {
      initials: "MC",
      name: "Michael Chen",
      email: "Innovate Labs",
      boothPill: "VIP",
      date: "2026-02-14",
      status: "Registered",
      statusType: "pending",
      time: "---",
    },
    {
      initials: "MC",
      name: "Michael Chen",
      email: "Cloud Systems",
      boothPill: "Corner Locationt",
      date: "2026-01-12",
      status: "Checked In",
      statusType: "checked",
      time: "2026-06-16 09:25",
    },
    {
      initials: "MC",
      name: "Michael Chen",
      email: "Cloud Systems",
      boothPill: "Corner Locationt",
      date: "2026-01-12",
      status: "Checked In",
      statusType: "checked",
      time: "2026-06-16 09:25",
    },
  ];

  const filteredData = sponsorsData.filter((row) => {
    const q = searchQuery.toLowerCase();
    const matchesFilter = (() => {
      if (activeFilter === "All") return true;
      if (activeFilter === "Checked In") return row.statusType === "checked";
      if (activeFilter === "Pending") return row.statusType === "pending";
      return true;
    })();
    if (!matchesFilter) return false;
    if (!q) return true;
    return (
      row.name.toLowerCase().includes(q) ||
      row.email.toLowerCase().includes(q) ||
      row.boothPill.toLowerCase().includes(q)
    );
  });

  const counts = {
    all: sponsorsData.length,
    checked: sponsorsData.filter((row) => row.statusType === "checked").length,
    pending: sponsorsData.filter((row) => row.statusType === "pending").length,
  };

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
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

  const getBoothClass = (booth) => {
    const value = booth.toLowerCase();

    if (value.includes("vip")) return "type-vip";
    if (value.includes("inline")) return "type-inline";
    if (value.includes("corner")) return "type-corner";

    return "";
  };

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
      pdf.text(`Event: ${currentEventLabel}`, margin + 2, y);
      y += lineHeight;
      pdf.text(`Total Sponsors: ${filteredData.length}`, margin + 2, y);
      y += lineHeight;
      pdf.text(`Checked In: ${counts.checked}`, margin + 2, y);
      y += lineHeight;
      pdf.text(`Pending: ${counts.pending}`, margin + 2, y);
      y += lineHeight + 4;

      pdf.setFontSize(12);
      pdf.setTextColor(30, 60, 114);
      pdf.setFont("helvetica", "bold");
      pdf.text("Sponsors", margin, y);
      y += 8;

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
        row.email,
        row.boothPill,
        row.date,
        row.status,
        row.time,
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
        "Sponsors & exhibitors list export. Use the dashboard for real-time updates.",
        margin,
        y,
        { maxWidth: pdfWidth - 2 * margin },
      );

      finalizeReport(pdf);
      pdf.save(`Sponsors_List_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      removeExportToast(loadingToast);
    }
  };

  return (
    <div className="spon-container">
      <div className="spon-header">
        <div className="spon-header-left">
          <h1 className="spon-title">Sponsors & Exhibitors</h1>
          <p className="small-body-text spon-header-subtitle">
            Manage event sponsors and their booths
          </p>
        </div>
        <div className="spon-header-controls">
          <button
            className="outlined-button spon-export-btn"
            onClick={exportList}
          >
            <Icon icon="mdi:tray-arrow-down" className="export-icon" />
            Export List
          </button>
        </div>
      </div>

      <div className="spon-main-content">
        <div className="spon-event-banner">
          <div className="spon-banner-left">
            <h3>TechStart Summit 2026</h3>
            <p className="small-body-text">June 16, 2026 &bull; Moscone</p>
          </div>
          <div className="spon-banner-stats">
            <div className="spon-stat-item">
              <h4 className="text-green-stat">$30,500</h4>
              <span className="spon-stat-label smaller-body-text">
                Sponsorship Revenue
              </span>
            </div>
            <div className="spon-stat-item">
              <h4>7</h4>
              <span className="spon-stat-label smaller-body-text">
                Total Sponsors
              </span>
            </div>
          </div>
        </div>

        <div className="spon-cards-container">
          {sponsorStats.map((stat, idx) => (
            <div className="spon-card" key={idx}>
              <div
                className={`button-label ${stat.bgClass} ${stat.colorClass}`}
              >
                {stat.type}
              </div>
              <h2>{stat.count}</h2>
              <p className="smaller-body-text spon-card-sub">{stat.checkins}</p>
            </div>
          ))}
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
                  onChange={(e) => setSearchQuery(e.target.value)}
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
            {paginatedData.length === 0 ? (
              // Empty state outside table for mobile-friendly display
              <div className="empty-state">
                <Icon icon="mdi:magnify-close" width="48" />
                <h4>No Sponsor(s) found</h4>
                <p className="small-body-text">
                  No Sponsor(s) match "<strong>{searchQuery}</strong>".
                </p>
              </div>
            ) : (
              <table className="spon-table">
                <thead>
                  <tr>
                    <th>Attendee</th>
                    <th>Booth Type</th>
                    <th>Purchase Date</th>
                    <th>Status</th>
                    <th>Check-in Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, index) => (
                    <tr
                      key={index}
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
                              {row.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="type-cell" data-label="Booth Type">
                        <span
                          className={`button-label type-pill ${getBoothClass(row.boothPill)}`}
                        >
                          {row.boothPill}
                        </span>{" "}
                      </td>
                      <td
                        className="small-body-text date-col"
                        data-label="Purchase Date"
                      >
                        {row.date}
                      </td>
                      <td className="status-cell" data-label="Status">
                        <span
                          className={`button-label status-${row.statusType}`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td
                        className="small-body-text spon-time-col"
                        data-label="Check-in Time"
                      >
                        {row.statusType === "checked" && (
                          <Icon
                            icon="mdi:clock-outline"
                            className="time-icon text-green"
                          />
                        )}
                        <span
                          className={
                            row.statusType === "checked" ? "text-green" : ""
                          }
                        >
                          {" "}
                          {row.time}
                        </span>
                      </td>
                      <td data-label="Actions">
                        <button className="action-btn">
                          <Icon icon="mdi:email-outline" />
                        </button>
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

export default PromoterSponsors;
