import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import "./promoterpayouts.css";
import { useNavigate } from "react-router-dom";
import {
  showSuccessAlert,
} from "../admincomponents/utils/sweetAlert";
import DateRangePicker from "../admincomponents/DateRangePicker/DateRangePicker.jsx";
import jsPDF from "jspdf";
import {
  loadLogo,
  addReportHeader,
  addReportFooter,
  showExportToast,
  removeExportToast,
  drawTable,
  finalizeReport,
} from "../admincomponents/utils/pdfExport";
import PromoterViewPayout from "./PromoterModal/PromoterViewPayout.jsx";

const PromoterPayouts = () => {
  const navigate = useNavigate();

  // New filter states
  const [dateRange, setDateRange] = useState({ preset: "last28" });
  const [sortFilter, setSortFilter] = useState("Recently Added");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRow = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  const sortDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target)
      ) {
        setIsSortDropdownOpen(false);
      }
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setIsStatusDropdownOpen(false);
      }
    };

    if (isSortDropdownOpen || isStatusDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSortDropdownOpen, isStatusDropdownOpen]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleWithdraw = () => {
    navigate("/promoter/promoter-payout-billing");
  };

  const initialPayoutHistory = [
    {
      date: "Jan 01, 2026",
      amount: "$12,450.00",
      method: "Bank Transfer •••• 4242",
      status: "Paid",
      reference: "WTD-8472910"
    },
    {
      date: "Sep 15, 2025",
      amount: "$8,200.00",
      method: "Bank Transfer •••• 4242",
      status: "Paid",
      reference: "WTD-3928174"
    },
    {
      date: "Aug 30, 2025",
      amount: "$5,150.00",
      method: "Bank Transfer •••• 4242",
      status: "Paid",
      reference: "WTD-5610293"
    },
    {
      date: "Jul 12, 2025",
      amount: "$2,300.00",
      method: "Bank Transfer •••• 4242",
      status: "Pending",
      reference: "WTD-2233445"
    },
    {
      date: "Jun 05, 2025",
      amount: "$4,100.00",
      method: "Bank Transfer •••• 4242",
      status: "Reject",
      reference: "WTD-9988776"
    },
    {
      date: "May 20, 2025",
      amount: "$1,500.00",
      method: "Bank Transfer •••• 4242",
      status: "Pending",
      reference: "WTD-1122334"
    }
  ];

  const filteredPayouts = initialPayoutHistory.filter((item) => {
    if (statusFilter === "All Status") return true;
    return item.status === statusFilter;
  });

  const sortedAndFilteredPayouts = [...filteredPayouts].sort((a, b) => {
    if (sortFilter === "Ascending") {
      return new Date(a.date) - new Date(b.date);
    } else if (sortFilter === "Descending") {
      return new Date(b.date) - new Date(a.date);
    }
    return 0; // Recently Added
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(sortedAndFilteredPayouts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedAndFilteredPayouts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, sortFilter]);

  const handleViewDetails = (payout) => {
    setSelectedPayout(payout);
  };

  const exportReport = async () => {
    if (loading) return;
    const loadingToast = showExportToast();
    const REPORT_TITLE = "Payouts Report";
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
      
      const sumAmounts = (data) =>
        data.reduce((total, row) => {
          const numeric =
            parseFloat(String(row.amount).replace(/[^0-9.-]+/g, "")) || 0;
          return total + numeric;
        }, 0);

      const totalAmount = sumAmounts(sortedAndFilteredPayouts);

      pdf.text(
        `Total Amount: $${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${sortedAndFilteredPayouts.length} transactions)`,
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
        "Date",
        "Amount",
        "Method",
        "Status",
        "Reference",
      ];
      const rows = sortedAndFilteredPayouts.map((row) => [
        row.date,
        row.amount,
        row.method,
        row.status,
        row.reference,
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
        "Report generated from Payouts Overview.",
        margin,
        y,
        { maxWidth: pdfWidth - 2 * margin },
      );

      finalizeReport(pdf);
      pdf.save(`Payouts_Report_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      removeExportToast(loadingToast);
    }
  };

  const handleDownloadInvoice = async (payout) => {
    const loadingToast = showExportToast();
    const INVOICE_TITLE = "Payout Invoice Receipt";
    try {
      const logoData = await loadLogo();
      const doc = new jsPDF("p", "mm", "a4");
      const pdfWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let y = 45;

      addReportHeader(doc, INVOICE_TITLE, logoData);

      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Date: ${payout.date}`, margin, y);
      y += 8;
      doc.text(`Status: ${payout.status}`, margin, y);
      y += 8;
      doc.text(`Reference: ${payout.reference || `WTD-${Math.floor(Math.random() * 10000000)}`}`, margin, y);
      y += 15;

      doc.setFontSize(12);
      doc.setTextColor(30, 60, 114);
      doc.setFont("helvetica", "bold");
      doc.text("Description", margin, y);
      doc.text("Amount", pdfWidth - margin - 30, y);
      y += 4;
      
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pdfWidth - margin, y);
      y += 8;

      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", "normal");
      doc.text("Event Ticket Sales Payout", margin, y);
      doc.text(`${payout.amount}`, pdfWidth - margin - 30, y);
      y += 8;

      doc.line(margin, y, pdfWidth - margin, y);
      y += 8;

      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 60, 114);
      doc.text("Total Paid", margin, y);
      doc.text(`${payout.amount}`, pdfWidth - margin - 30, y);
      y += 15;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text("Thank you for using our platform.", margin, y);

      finalizeReport(doc);
      doc.save(
        `Payout_Invoice_${payout.date.replace(/, /g, "_").replace(/ /g, "_")}.pdf`,
      );
    } catch (error) {
      console.error("Error generating invoice PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      removeExportToast(loadingToast);
    }
  };

  return (
    <div className="pay-container">
      <div className="pay-header">
        <div className="pay-header-left">
          <h1 className="pay-title">Payouts</h1>
        </div>
      </div>

      <div className="pay-top-cards">
        {loading ? (
             [...Array(2)].map((_, i) => (
                <div key={i} className="pay-top-card skeleton-card">
                    <div className="skeleton skeleton-text short" />
                    <div className="skeleton skeleton-text title" style={{ height: '32px' }} />
                    <div className="skeleton skeleton-text short" style={{ width: '60%' }} />
                </div>
             ))
        ) : (
            <>
                <div className="pay-top-card">
                   <span className="pay-top-label">Total Revenue</span>
                   <h2 className="pay-top-amount">$103,550</h2>
                   <span className="pay-top-subtext pay-green-text">
                     <Icon icon="mdi:trending-up" /> +12.5% from last month
                   </span>
                 </div>
                 <div className="pay-top-card">
                   <span className="pay-top-label">Current Balance</span>
                   <h2 className="pay-top-amount">$13,550</h2>
                 </div>
            </>
        )}
      </div>

      <div className="pay-main-content">
        <div className="pay-left-col">
          <div className="pay-card pay-history-box">
            <div className="pay-card-header pay-history-header">
              <h4>Payout History</h4>
              <div className="pay-history-filters">
                <DateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  buttonClassName="payout-date-picker-btn"
                />
                <div className="pay-custom-dropdown" ref={statusDropdownRef}>
                  <button
                    className="pay-custom-dropdown-btn small-body-text"
                    onClick={() =>
                      setIsStatusDropdownOpen(!isStatusDropdownOpen)
                    }
                  >
                    <span className="truncate-text">{statusFilter}</span>
                    <Icon
                      icon="mdi:chevron-down"
                      className={`dropdown-icon ${isStatusDropdownOpen ? "open" : ""}`}
                    />
                  </button>
                  {isStatusDropdownOpen && (
                    <div className="pay-custom-dropdown-menu">
                      {["All Status", "Paid", "Pending", "Reject"].map(
                        (option) => (
                          <button
                            key={option}
                            className={`pay-custom-dropdown-item small-body-text ${statusFilter === option ? "active" : ""}`}
                            onClick={() => {
                              setStatusFilter(option);
                              setIsStatusDropdownOpen(false);
                            }}
                          >
                            {option}
                          </button>
                        ),
                      )}
                    </div>
                  )}
                </div>

                <button
                  className="pay-date-picker-btn pay-export-report-btn"
                  onClick={exportReport}
                >
                  <Icon icon="mdi:tray-arrow-down" />
                  Export Report
                </button>
              </div>
            </div>
            <div className="pay-table-wrapper">
              {paginatedData.length === 0 ? (
                <div className="empty-state">
                  <Icon icon="mdi:magnify-close" width="48" />
                  <h4>No payouts found</h4>
                  <p className="small-body-text">
                    No payouts match your criteria.
                  </p>
                </div>
              ) : (
                <table className="pay-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((item, index) => (
                      <tr 
                        key={index}
                        className={expandedRow === index ? "expanded" : ""}
                      >
                        <td className="small-body-text pay-date-td" data-label="Date">
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
                          <span className="pay-date-text">{item.date}</span>
                        </td>
                        <td className="large-body-text pay-amount-text" data-label="Amount">
                          {item.amount}
                        </td>
                        <td className="small-body-text" data-label="Method">{item.method}</td>
                        <td data-label="Status" className="pay-status-cell">
                          <span className={`button-label pay-status-pill ${item.status === 'Paid' ? 'pill-bg-green' : item.status === 'Reject' ? 'pill-bg-red' : 'pill-bg-orange'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td data-label="Actions">
                          <div className="pay-actions">
                            <button
                              className="pay-action-btn"
                              title="View Details"
                              onClick={() => handleViewDetails(item)}
                            >
                              <Icon icon="mdi:eye-outline" />
                            </button>
                            <button
                              className="pay-action-btn"
                              title="Download Invoice"
                              onClick={() => handleDownloadInvoice(item)}
                            >
                              <Icon icon="mdi:tray-arrow-down" />
                            </button>
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

        <div className="pay-right-col">
          <div className="pay-card pay-next-box">
            <p className="small-body-text pay-next-label">Next Payout</p>
            <h2 className="pay-next-amount">$15,240.00</h2>

            <div className="pay-est-arrival">
              <Icon icon="mdi:bank-transfer" />
              <span className="small-body-text pp-date">
                Est. arrival: Oct 15, 2024
              </span>
            </div>

            <button
              className="primary-button pay-withdraw-btn"
              onClick={handleWithdraw}
            >
              Withdraw Now
            </button>
          </div>

          <div className="pay-card pay-methods-box">
            <h4>Payout Methods</h4>

            <div className="pay-method-item">
              <div className="pay-method-icon">
                <Icon icon="mdi:domain" />
              </div>
              <div className="pay-method-info">
                <h5 className="pay-method-name">Chase Bank</h5>
                <span className="smaller-body-text pay-method-num">
                  •••• 4242
                </span>
              </div>
              <span className="button-label pay-default-pill">Default</span>
            </div>

            <div className="pay-method-item">
              <div className="pay-method-icon">
                <Icon icon="mdi:domain" />
              </div>
              <div className="pay-method-info">
                <h5 className="pay-method-name">Mastercard</h5>
                <span className="smaller-body-text pay-method-num">
                  •••• 8888
                </span>
              </div>
              <span className="button-label pay-set-default">Set as Default</span>
            </div>
          </div>
        </div>
      </div>

      <PromoterViewPayout 
        isOpen={!!selectedPayout}
        onClose={() => setSelectedPayout(null)}
        payout={selectedPayout}
        onDownloadInvoice={handleDownloadInvoice}
      />
    </div>
  );
};

export default PromoterPayouts;
