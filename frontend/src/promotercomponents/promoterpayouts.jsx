import React, { useState, useRef, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import usePagination from "../hooks/usePagination";
import PaginationBar from "../components/PaginationBar";
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
  generatePayoutInvoicePDF
} from "../utils/pdfExport";
import PromoterViewPayout from "./PromoterModal/PromoterViewPayout.jsx";

import { useAuthContext } from "../hooks/useAuthContext";
import eventsService from "../services/eventsService";
import payoutService from "../services/payoutService";
import api from "../services/api";

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
  const [payoutPdfUrl, setPayoutPdfUrl] = useState(null);
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
          try {
            const res = await api.get(`/reservations/event/${event._id}/sales`, {
              headers: { Authorization: `Bearer ${user.token}` }
            });
            const { reservations } = res.data;
            return (reservations || []).map(r => ({
              ...r,
              eventId: event._id,
              eventTitle: event.title,
              date: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
              amountStr: `$${(r.amount?.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
              method: r.paymentMethod === 'card' ? 'Credit Card' : 'Invoice/Bank Transfer',
              reference: r._id.toString().toUpperCase().slice(-10)
            }));
          } catch (err) {
            console.error(`Error fetching sales for event ${event._id}:`, err);
            return [];
          }
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
        if (err.message.includes('401') || err.message.toLowerCase().includes('unauthorized')) {
          setError("Your session has expired. Please log in again.");
        } else {
          setError("Failed to load payout data.");
        }
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
      // The history table should not be affected by the event filter in the header

      if (statusFilter === "All Status") return true;
      const itemStatus = item.status === 'paid' ? 'Paid' : item.status === 'pending' ? 'Pending' : 'Reject';
      return itemStatus === statusFilter;
    });
  }, [payouts, statusFilter]);

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
    let totalRev = 0;
    let totalPaid = 0;
    let totalPending = 0;

    if (processFilter === "All Events") {
      totalRev = salesData.reduce((acc, s) => acc + (s.amount?.total || 0), 0);
      totalPaid = payouts.filter(p => p.status === 'paid').reduce((acc, p) => acc + (p.amount || 0), 0);
      totalPending = payouts.filter(p => p.status === 'pending').reduce((acc, p) => acc + (p.amount || 0), 0);
    } else if (processFilter === "Tickets" || processFilter === "Booths") {
      const filteredSales = salesData.filter(s => processFilter === "Tickets" ? s.type !== 'booth' : s.type === 'booth');
      totalRev = filteredSales.reduce((acc, s) => acc + (s.amount?.total || 0), 0);
      // For type filters, we don't have specific payouts, so we use global for now or just revenue
      // The user specifically asked for "each event", so type filters are secondary here.
      totalPaid = payouts.filter(p => p.status === 'paid').reduce((acc, p) => acc + (p.amount || 0), 0);
      totalPending = payouts.filter(p => p.status === 'pending').reduce((acc, p) => acc + (p.amount || 0), 0);
    } else {
      // Specific Event ID
      totalRev = salesData.filter(s => s.eventId === processFilter).reduce((acc, s) => acc + (s.amount?.total || 0), 0);
      const eventPayouts = payouts.filter(p => p.eventIds && p.eventIds.includes(processFilter));
      totalPaid = eventPayouts.filter(p => p.status === 'paid').reduce((acc, p) => acc + (p.amount || 0), 0);
      totalPending = eventPayouts.filter(p => p.status === 'pending').reduce((acc, p) => acc + (p.amount || 0), 0);
    }

    return {
      totalRevenue: totalRev,
      currentBalance: Math.max(0, totalRev - totalPaid - totalPending),
    };
  }, [salesData, payouts, processFilter]);

  // Pre-calculate stats for each event for the dropdown
  const allEventsStats = useMemo(() => {
    return events.reduce((acc, event) => {
      const totalRev = salesData.filter(s => s.eventId === event._id).reduce((sum, s) => sum + (s.amount?.total || 0), 0);
      const eventPayouts = payouts.filter(p => p.eventIds && p.eventIds.includes(event._id));
      const totalPaid = eventPayouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalPending = eventPayouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0);

      acc[event._id] = {
        totalRevenue: totalRev,
        currentBalance: Math.max(0, totalRev - totalPaid - totalPending)
      };
      return acc;
    }, {});
  }, [events, salesData, payouts]);

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


  const itemsPerPage = 5;
  const {
    page, totalPages, total,
    setTotal, goTo, next, prev,
    reset: resetPage,
  } = usePagination({ limit: itemsPerPage });

  useEffect(() => {
    setTotal({
      total: sortedAndFilteredPayouts.length,
      totalPages: Math.ceil(sortedAndFilteredPayouts.length / itemsPerPage) || 1,
    });
  }, [sortedAndFilteredPayouts.length, setTotal]);

  const startIndex = (page - 1) * itemsPerPage;
  const paginatedData = sortedAndFilteredPayouts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  useEffect(() => {
    resetPage();
  }, [statusFilter, sortFilter, resetPage]);

  const handleViewDetails = async (payout) => {
    setSelectedPayout(payout);
    const pdfDataUrl = await generateInvoicePDF(payout, false);
    setPayoutPdfUrl(pdfDataUrl);
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

        addReportHeader(pdf, REPORT_TITLE, logoData);

        // ── helpers ────────────────────────────────────────────────────────
        const newPageIfNeeded = (needed) => {
            if (y + needed > pdfHeight - FOOTER_HEIGHT - 5) {
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

        // ── pre-compute values ─────────────────────────────────────────────
        const totalAmount = sortedAndFilteredPayouts.reduce((s, p) => s + (p.amount || 0), 0);
        const paidPayouts = sortedAndFilteredPayouts.filter(p => p.status === "paid");
        const pendingPayouts = sortedAndFilteredPayouts.filter(p => p.status === "pending");
        const rejectedPayouts = sortedAndFilteredPayouts.filter(p => p.status === "rejected" || p.status === "reject");

        const paidAmount = paidPayouts.reduce((s, p) => s + (p.amount || 0), 0);
        const pendingAmount = pendingPayouts.reduce((s, p) => s + (p.amount || 0), 0);
        const rejectedAmount = rejectedPayouts.reduce((s, p) => s + (p.amount || 0), 0);

        const currentFilterLabel =
            processFilter === "All Events" ? "All Events" :
            processFilter === "Tickets" ? "Tickets" :
            processFilter === "Booths" ? "Booths" :
            events.find(e => e._id === processFilter)?.title || "Selected Event";

        // ══════════════════════════════════════════════════════════════════
        // BANNER
        // ══════════════════════════════════════════════════════════════════
        pdf.setFillColor(235, 240, 255);
        pdf.setDrawColor(180, 200, 245);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(margin, y, pdfWidth - margin * 2, 22, 3, 3, "FD");

        // Left — filter label
        pdf.setFontSize(11);
        pdf.setTextColor(30, 60, 114);
        pdf.setFont("helvetica", "bold");
        pdf.text(currentFilterLabel, margin + 4, y + 8);

        pdf.setFontSize(8);
        pdf.setTextColor(80, 90, 130);
        pdf.setFont("helvetica", "normal");
        pdf.text(
            `Payouts Report  •  ${sortedAndFilteredPayouts.length} transaction${sortedAndFilteredPayouts.length !== 1 ? "s" : ""}`,
            margin + 4, y + 15
        );

        // Right — total badge
        const badgeX = pdfWidth - margin - 50;
        pdf.setFillColor(30, 60, 114);
        pdf.roundedRect(badgeX, y + 4, 46, 14, 2, 2, "F");
        pdf.setFontSize(7.5);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "normal");
        pdf.text("Total Payouts", badgeX + 23, y + 10, { align: "center" });
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.text(
            `$${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            badgeX + 23, y + 16, { align: "center" }
        );

        y += 30;

        // ══════════════════════════════════════════════════════════════════
        // KEY METRICS — 3-col cards
        // ══════════════════════════════════════════════════════════════════
        sectionHeading("Key Metrics");

        const cardW = (pdfWidth - margin * 2 - 12) / 3;
        const cardH = 22;

        const metricCards = [
            {
                label: "Paid",
                value: `$${paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                sub: `${paidPayouts.length} payout${paidPayouts.length !== 1 ? "s" : ""}`,
                color: [22, 163, 74],
                bg: [235, 255, 245],
                border: [180, 235, 210],
            },
            {
                label: "Pending",
                value: `$${pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                sub: `${pendingPayouts.length} payout${pendingPayouts.length !== 1 ? "s" : ""}`,
                color: [217, 119, 6],
                bg: [255, 251, 235],
                border: [245, 220, 160],
            },
            {
                label: "Current Balance",
                value: `$${stats.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                sub: `Est. arrival: ${estimatedArrivalDate}`,
                color: [30, 60, 114],
                bg: [235, 240, 255],
                border: [180, 200, 245],
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
            pdf.setFontSize(11);
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
        // PAYOUT BREAKDOWN BARS
        // ══════════════════════════════════════════════════════════════════
        sectionHeading("Payout Breakdown");

        const breakdownItems = [
            {
                label: "Paid",
                value: paidAmount,
                count: paidPayouts.length,
                countLabel: "payouts",
                color: [22, 163, 74],
            },
            {
                label: "Pending",
                value: pendingAmount,
                count: pendingPayouts.length,
                countLabel: "payouts",
                color: [217, 119, 6],
            },
            {
                label: "Rejected / Cancelled",
                value: rejectedAmount,
                count: rejectedPayouts.length,
                countLabel: "payouts",
                color: [200, 200, 200],
            },
        ];

        const maxBreakdown = Math.max(...breakdownItems.map(b => b.value), 1);
        const barMaxW = pdfWidth - margin * 2 - 65;

        breakdownItems.forEach((item) => {
            newPageIfNeeded(14);
            const fillW = (item.value / maxBreakdown) * barMaxW;

            pdf.setFontSize(8.5);
            pdf.setTextColor(50, 50, 50);
            pdf.setFont("helvetica", "normal");
            pdf.text(item.label, margin, y + 4.5);

            // Track
            pdf.setFillColor(235, 235, 235);
            pdf.roundedRect(margin + 43, y, barMaxW, 6, 1, 1, "F");

            // Fill
            if (fillW > 0) {
                pdf.setFillColor(...item.color);
                pdf.roundedRect(margin + 43, y, fillW, 6, 1, 1, "F");
            }

            // Right label
            pdf.setFontSize(7.5);
            pdf.setTextColor(80, 80, 80);
            pdf.text(
                `$${item.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}  (${item.count} ${item.countLabel})`,
                margin + 43 + barMaxW + 2, y + 4.5
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
            `Total Payouts: $${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}   |   Balance: $${stats.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}   |   Transactions: ${sortedAndFilteredPayouts.length}`,
            pdfWidth / 2, y + 6.5, { align: "center" }
        );
        y += 16;

        // ══════════════════════════════════════════════════════════════════
        // TRANSACTIONS TABLE
        // ══════════════════════════════════════════════════════════════════
        newPageIfNeeded(20);
        sectionHeading("Transactions");

        const headers = ["Reference No.", "Date", "Amount", "Method", "Status"];
        const rows = sortedAndFilteredPayouts.map((row) => [
            row.reference,
            row.date,
            row.amountStr,
            row.method,
            row.status === "paid" ? "Paid" : row.status === "pending" ? "Pending" : "Rejected",
        ]);

        y = drawTable(
            pdf, y, headers, rows,
            margin, pdfWidth, pdfHeight, FOOTER_HEIGHT, 10, 3,
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
            `Payouts report for "${currentFilterLabel}"  •  Generated by eTicketsPro`,
            pdfWidth / 2, y + 9, { align: "center" }
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
  const generateInvoicePDF = async (payout, shouldSave = true) => {
    try {
      return await generatePayoutInvoicePDF(jsPDF, payout, events, salesData, { shouldSave });
    } catch (error) {
      console.error("Error generating invoice PDF:", error);
      if (shouldSave) alert("Failed to generate PDF. Please try again.");
    }
  };

  const handleDownloadInvoice = async (payout) => {
    await generateInvoicePDF(payout, true);
  };

  return (
    <div className="pay-container">
      <div className="pay-header">
        <div className="pay-header-left">
          <h1 className="pay-title">Payouts</h1>
        </div>

        <div className="pay-custom-dropdown header-dropdown" ref={processDropdownRef}>
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
                const eventStat = allEventsStats[e._id] || { totalRevenue: 0, currentBalance: 0 };
                return (
                  <button
                    key={e._id}
                    className={`pay-custom-dropdown-item small-body-text ${processFilter === e._id ? "active" : ""}`}
                    onClick={() => {
                      setProcessFilter(e._id);
                      setIsProcessDropdownOpen(false);
                    }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '10px 15px' }}
                  >
                    <span style={{ fontWeight: '600', marginBottom: '2px' }}>{e.title}</span>
                    <div style={{ display: 'flex', gap: '10px', opacity: '0.7', fontSize: '11px' }}>
                      <span>Rev: ${eventStat.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span>Bal: ${eventStat.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
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
                      <th>Reference No.</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                    <tbody>
                      {paginatedData.map((item, index) => (
                        <React.Fragment key={index}>
                          <tr className={expandedRow === index ? "expanded" : ""}>
                            <td className="small-body-text" data-label="Reference No.">
                              {item.reference}
                            </td>
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
                          {expandedRow === index && (
                            <tr className="expanded-row-content">
                              <td colSpan="6">
                                <div className="expanded-info-container" style={{ padding: '15px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                      <div>
                                        <h6 style={{ marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: '#1e3c72' }}>Included Events</h6>
                                        <p className="small-body-text" style={{ margin: 0, opacity: 0.8 }}>
                                          {item.eventIds && item.eventIds.length > 0 ? item.eventIds.map(e => e.title).join(', ') : 'All Events'}
                                        </p>
                                      </div>
                                      {(item.status === 'reject' || item.status === 'rejected') && (
                                        <div>
                                          <h6 style={{ marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: '#dc2626' }}>Rejection Reason</h6>
                                          <p className="small-body-text" style={{ margin: 0, opacity: 0.8 }}>{item.rejectionReason || "No reason provided."}</p>
                                        </div>
                                      )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {!loading && (
              <PaginationBar
                page={page}
                totalPages={totalPages}
                total={total}
                onPrev={prev}
                onNext={next}
                onGoTo={goTo}
              />
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
                  onClick={() => navigate("/promoter/promoter-payout-billing", {
                    state: {
                      amount: stats.currentBalance,
                      eventId: (processFilter !== "All Events" && processFilter !== "Tickets" && processFilter !== "Booths") ? processFilter : null
                    }
                  })}
                >
                  Withdraw Now
                </button>
              </>
            )}
          </div>

          {/* <div className="pay-card pay-methods-box">
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
              <p className="smaller-body-text text-secondary text-center py-3">No payout methods added yet. Add one in <Link to="/promoter/settings" style={{ color: 'var(--color-blue)', textDecoration: 'underline' }}>Settings</Link>.</p>
            )}
          </div> */}
        </div>
      </div>

      <PromoterViewPayout
        isOpen={!!selectedPayout}
        onClose={() => {
          if (payoutPdfUrl) URL.revokeObjectURL(payoutPdfUrl);
          setSelectedPayout(null);
          setPayoutPdfUrl(null);
        }}
        payout={selectedPayout}
        pdfUrl={payoutPdfUrl}
        onDownloadInvoice={handleDownloadInvoice}
      />
    </div>
  );
};

export default PromoterPayouts;
