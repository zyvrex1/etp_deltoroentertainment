import React, { useState, useRef, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import "./promoterpayouts.css";
import { useNavigate, Link } from "react-router-dom";
import {
  showSuccessAlert,
} from "../utils/sweetAlert";
import DateRangePicker from "../utils/DateRangePicker/DateRangePicker.jsx";
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
import PromoterViewPayout from "./PromoterModal/PromoterViewPayout.jsx";

import { useAuthContext } from "../hooks/useAuthContext";
import eventsService from "../services/eventsService";
import payoutService from "../services/payoutService";

const PromoterPayouts = () => {

  const { user } = useAuthContext();
  const navigate = useNavigate();

  // New filter states
  const [dateRange, setDateRange] = useState({ preset: "last28" });
  const [sortFilter, setSortFilter] = useState("Recently Added");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [processFilter, setProcessFilter] = useState("All Events");

  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isProcessDropdownOpen, setIsProcessDropdownOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  const [events, setEvents] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const toggleRow = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  const sortDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);
  const processDropdownRef = useRef(null);

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
      if (
        processDropdownRef.current &&
        !processDropdownRef.current.contains(event.target)
      ) {
        setIsProcessDropdownOpen(false);
      }
    };

    if (isSortDropdownOpen || isStatusDropdownOpen || isProcessDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSortDropdownOpen, isStatusDropdownOpen, isProcessDropdownOpen]);


  const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  // Fetch Events and Sales (Logic from Revenue Reports)
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.token) return;
      setLoading(true);
      setError(null);
      try {
        const fetchedEvents = await eventsService.getEvents(user.token);
        const userId = user._id || user.id;
        const validEvents = (fetchedEvents || []).filter(e => {
          const isOwner = e.createdBy && (e.createdBy._id === userId || e.createdBy === userId);
          const isAssigned = e.assignedPromoters && e.assignedPromoters.some(p => p._id === userId || p === userId);
          return isOwner || isAssigned;
        });

        setEvents(validEvents);

        const salesPromises = validEvents.map(async (event) => {
          const res = await fetch(`${BASE_URL}/api/reservations/event/${event._id}/sales`, {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          if (!res.ok) return [];
          const { reservations } = await res.json();
          return (reservations || []).map(r => ({
            ...r,
            eventId: event._id,
            eventTitle: event.title,
            date: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
            amountStr: `$${(r.amount?.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            method: r.paymentMethod === 'card' ? 'Credit Card' : 'Invoice/Bank Transfer',
            reference: r._id.toString().toUpperCase().slice(-10)
          }));
        });

        const allSalesArrays = await Promise.all(salesPromises);
        setSalesData(allSalesArrays.flat());

        // Fetch Payouts
        const fetchedPayouts = await payoutService.getPayouts(user.token);
        setPayouts((fetchedPayouts || []).map(p => ({
          ...p,
          date: new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          amountStr: `$${(p.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          reference: p.reference || p._id.toString().toUpperCase().slice(-10)
        })));

      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load payout data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Process filtering logic
  const filteredByProcess = useMemo(() => {
    if (processFilter === "All Events") return salesData;
    if (processFilter === "Tickets") return salesData.filter(s => s.type !== 'booth');
    if (processFilter === "Booths") return salesData.filter(s => s.type === 'booth');
    // Check if it's an event ID
    return salesData.filter(s => s.eventId === processFilter);
  }, [salesData, processFilter]);

  const filteredPayouts = useMemo(() => {
    return payouts.filter((item) => {
      // For payouts, process filter might filter by event if we stored which events it covers
      // but usually withdrawals are global across all promoter's earnings.
      // If we implement event-specific payouts, we'd use item.eventIds
      if (processFilter !== "All Events") {
        if (processFilter === "Tickets" || processFilter === "Booths") return true; // keep all for now
        if (item.eventIds && !item.eventIds.includes(processFilter)) return false;
      }

      if (statusFilter === "All Status") return true;
      const itemStatus = item.status === 'paid' ? 'Paid' : item.status === 'pending' ? 'Pending' : 'Reject';
      return itemStatus === statusFilter;
    });
  }, [payouts, statusFilter, processFilter]);

  const sortedAndFilteredPayouts = useMemo(() => {
    return [...filteredPayouts].sort((a, b) => {
      if (sortFilter === "Ascending") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortFilter === "Descending") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return new Date(b.createdAt) - new Date(a.createdAt); // Recently Added
    });
  }, [filteredPayouts, sortFilter]);

  // Calculate totals based on filtered by process
  const stats = useMemo(() => {
    const totalRev = filteredByProcess.reduce((acc, s) => acc + (s.amount?.total || 0), 0);
    const totalPaid = payouts.filter(p => p.status === 'paid').reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalPending = payouts.filter(p => p.status === 'pending').reduce((acc, p) => acc + (p.amount || 0), 0);
    
    return {
      totalRevenue: totalRev,
      currentBalance: Math.max(0, totalRev - totalPaid - totalPending),
    };
  }, [filteredByProcess, payouts]);

  const estimatedArrivalDate = useMemo(() => {
    const today = new Date();
    const arrival = new Date(today);
    let businessDaysAdded = 0;
    while (businessDaysAdded < 3) {
      arrival.setDate(arrival.getDate() + 1);
      if (arrival.getDay() !== 0 && arrival.getDay() !== 6) {
        businessDaysAdded++;
      }
    }
    return arrival.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  }, []);


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
          return total + (row.amount?.total || 0);
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
        row.amountStr,
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
      doc.text(`${payout.amountStr}`, pdfWidth - margin - 30, y);
      y += 8;

      doc.line(margin, y, pdfWidth - margin, y);
      y += 8;

      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 60, 114);
      doc.text("Total Paid", margin, y);
      doc.text(`${payout.amountStr}`, pdfWidth - margin - 30, y);
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
              <span className="pay-top-label">
                Total Revenue {processFilter !== "All Events" ? `- ${processFilter === "Tickets" ? "Tickets" : processFilter === "Booths" ? "Booths" : events.find(e => e._id === processFilter)?.title}` : ""}
              </span>
              <h2 className="pay-top-amount">${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</h2>
              <span className="pay-top-subtext pay-green-text">
                <Icon icon="mdi:trending-up" /> Live data from system
              </span>
            </div>
            <div className="pay-top-card">
              <span className="pay-top-label">
                Current Balance {processFilter !== "All Events" ? `- ${processFilter === "Tickets" ? "Tickets" : processFilter === "Booths" ? "Booths" : events.find(e => e._id === processFilter)?.title}` : ""}
              </span>
              <h2 className="pay-top-amount">${stats.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</h2>
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
                <div className="pay-custom-dropdown" ref={processDropdownRef}>
                  <button
                    className="pay-custom-dropdown-btn small-body-text"
                    onClick={() =>
                      setIsProcessDropdownOpen(!isProcessDropdownOpen)
                    }
                  >
                    <span className="truncate-text">
                      {processFilter === "All Events" ? "All Events" :
                        events.find(e => e._id === processFilter)?.title || "Select Process"}
                    </span>
                    <Icon
                      icon="mdi:chevron-down"
                      className={`dropdown-icon ${isProcessDropdownOpen ? "open" : ""}`}
                    />
                  </button>
                  {isProcessDropdownOpen && (
                    <div className="pay-custom-dropdown-menu">
                      <button
                        className={`pay-custom-dropdown-item small-body-text ${processFilter === "All Events" ? "active" : ""}`}
                        onClick={() => {
                          setProcessFilter("All Events");
                          setIsProcessDropdownOpen(false);
                        }}
                      >
                        All Events
                      </button>
                      {events.map((e) => {
                        const userId = user._id || user.id;
                        const isOwner = e.createdBy && (e.createdBy._id === userId || e.createdBy === userId);
                        return (
                          <button
                            key={e._id}
                            className={`pay-custom-dropdown-item small-body-text ${processFilter === e._id ? "active" : ""}`}
                            onClick={() => {
                              setProcessFilter(e._id);
                              setIsProcessDropdownOpen(false);
                            }}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          >
                            <span>{e.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* <DateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  buttonClassName="payout-date-picker-btn"
                /> */}
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
              {loading ? (
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
                    {[...Array(itemsPerPage)].map((_, i) => (
                      <tr key={i}>
                        <td><div className="skeleton skeleton-text" /></td>
                        <td><div className="skeleton skeleton-text short" /></td>
                        <td><div className="skeleton skeleton-text" /></td>
                        <td><div className="skeleton skeleton-badge" /></td>
                        <td><div className="skeleton skeleton-text short" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : paginatedData.length === 0 ? (
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
                          {item.amountStr}
                        </td>
                        <td className="small-body-text" data-label="Method">{item.method}</td>
                        <td data-label="Status" className="pay-status-cell">
                          <span className={`button-label pay-status-pill ${item.status === 'paid' ? 'pill-bg-green' : item.status === 'pending' ? 'pill-bg-orange' : 'pill-bg-red'}`}>
                            {item.status === 'paid' ? 'Paid' : item.status === 'pending' ? 'Pending' : 'Reject'}
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
            {!loading && totalPages > 1 && (
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
            {loading ? (
              <>
                <div className="skeleton skeleton-text short" />
                <div className="skeleton skeleton-text title" style={{ height: '32px' }} />
                <div className="skeleton skeleton-text short" style={{ margin: '12px 0' }} />
                <div className="skeleton skeleton-rect" style={{ height: '44px', marginTop: '12px' }} />
              </>
            ) : (
              <>
                <p className="small-body-text pay-next-label">Estimated Payout</p>
                <h2 className="pay-next-amount">${stats.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>

                <div className="pay-est-arrival">
                  <Icon icon="mdi:bank-transfer" />
                  <span className="small-body-text pp-date">
                    Est. arrival: {estimatedArrivalDate}
                  </span>
                </div>

                <button
                  className="primary-button pay-withdraw-btn"
                  onClick={() => navigate("/promoter/promoter-payout-billing", { state: { amount: stats.currentBalance } })}
                >
                  Withdraw Now
                </button>
              </>
            )}
          </div>

          <div className="pay-card pay-methods-box">
            <h4>Payout Methods</h4>

            {loading ? (
              [...Array(2)].map((_, i) => (
                <div key={i} className="pay-method-item" style={{ border: 'none' }}>
                  <div className="skeleton skeleton-circle" style={{ width: '40px', height: '40px', marginRight: '12px' }} />
                  <div className="pay-method-info" style={{ width: '100%' }}>
                    <div className="skeleton skeleton-text title" style={{ width: '60%' }} />
                    <div className="skeleton skeleton-text short" />
                  </div>
                </div>
              ))
            ) : (user.paymentMethods && user.paymentMethods.length > 0) ? (
              user.paymentMethods.map((method, idx) => (
                <div key={method._id || idx} className="pay-method-item">
                  <div className="pay-method-icon">
                    <Icon icon={method.icon || "mdi:credit-card"} />
                  </div>
                  <div className="pay-method-info">
                    <h5 className="pay-method-name">{method.type}</h5>
                    <span className="smaller-body-text pay-method-num">
                      •••• {method.last4}
                    </span>
                  </div>
                  {method.isDefault && <span className="button-label pay-default-pill">Default</span>}
                </div>
              ))
            ) : (
                <p className="smaller-body-text text-secondary text-center py-3">No payment methods added yet. Add one in <Link to="/promoter/settings" style={{ color: 'var(--color-blue)', textDecoration: 'underline' }}>Settings</Link>.</p>
            )}
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
