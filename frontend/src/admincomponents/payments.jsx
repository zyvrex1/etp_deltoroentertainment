import React, { useState, useRef, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import "./payments.css";
import Swal from "sweetalert2";
import { showSuccessAlert, showErrorAlert, showApproveConfirmAlert, showRejectConfirmAlert } from "../utils/sweetAlert";
import PaymentRejectionModal from "./Modal/PaymentRejectionModal";
import ViewTransactionModal from "./Modal/ViewTransactionModal";
import TransactionMonitoring from "./transaction";
import axios from "axios";
import usePagination from "../hooks/usePagination";
import PaginationBar from "../components/PaginationBar";
import { useAuthContext } from "../hooks/useAuthContext";
import reservationService from "../services/reservationService";
import payoutService from "../services/payoutService";
import PromoterViewPayout from "../promotercomponents/PromoterModal/PromoterViewPayout.jsx";
import jsPDF from "jspdf";
import {
  loadLogo,
  addReportHeader,
  showExportToast,
  removeExportToast,
  finalizeReport,
  generatePayoutInvoicePDF
} from "../utils/pdfExport";
import "../promotercomponents/PromoterModal/PromoterViewPayout.css";

const formatPaymentMethod = (method) => {
  if (!method) return "Card";
  const lower = String(method).toLowerCase();
  if (lower === "invoice" || lower.includes("invoice") || lower.includes("bank transfer")) {
    return "Invoice";
  }
  return "Card";
};

const formatReservationTxId = (res) => {
  const isBooth = !!res.boothCode;
  const isGA = res.seatIds?.some((sid) => sid.startsWith("GA-"));
  const prefix = isBooth ? "Booth" : isGA ? "Ticket" : "Seats";
  return `${prefix}-${res._id.toString().slice(-6).toUpperCase()}`;
};

const Payments = () => {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState("payout-requests");
  const itemsPerPage = 7;
  const {
    page, totalPages, total,
    setTotal, goTo, next, prev,
    reset: resetPage,
  } = usePagination({ limit: itemsPerPage });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.token) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        setError(null);
        const data = await reservationService.getAdminReservations(user.token);
        setReservations(data);
      } catch (err) {
        console.error("Fetch admin reservations error:", err);
        const errorMsg = err.response?.data?.error || "Failed to load reservations. Please try again later.";
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.token]);

  const [payoutRequests, setPayoutRequests] = useState([]);
  const [payoutRequestsRaw, setPayoutRequestsRaw] = useState([]);

  useEffect(() => {
    const fetchPayouts = async () => {
      if (!user?.token) return;
      try {
        const data = await payoutService.getPayouts(user.token);
        // Map to the format expected by the component
        const formattedPayouts = data.map(p => ({
          id: p._id,
          reference: p.reference,
          promoter: p.promoterId ? `${p.promoterId.firstName} ${p.promoterId.lastName}` : 'Unknown',
          events: (p.eventIds && p.eventIds.length > 0) ? p.eventIds.map(e => e.title).join(', ') : 'All Events',
          amount: `$${(p.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          paymentMethod: p.method === 'card' ? 'Card' : (p.method === 'bank_transfer' ? 'Bank Transfer' : p.method),
          status: p.status,
          rejectionReason: p.rejectionReason,
          requested: new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          method: p.method
        }));
        setPayoutRequests(formattedPayouts);
        setPayoutRequestsRaw(data);
      } catch (err) {
        console.error("Fetch payouts error:", err);
      }
    };

    fetchPayouts();
  }, [user?.token]);

  const [selectedPayout, setSelectedPayout] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [payoutPdfUrl, setPayoutPdfUrl] = useState(null);
  const [viewingPayout, setViewingPayout] = useState(null);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);


  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef(null);

  // Event filter
  const [eventFilter, setEventFilter] = useState("All Events");
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
  const eventDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setIsFilterDropdownOpen(false);
      }
      if (eventDropdownRef.current && !eventDropdownRef.current.contains(event.target)) {
        setIsEventDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Derive unique event names for the event filter dropdown
  const eventOptions = useMemo(() => {
    const names = new Set();
    reservations.forEach(r => {
      const title = r.event?.title;
      if (title) names.add(title);
    });
    payoutRequests.forEach(p => {
      if (p.events) {
        p.events.split(',').forEach(e => {
          const t = e.trim();
          if (t && t !== 'All Events') names.add(t);
        });
      }
    });
    return ["All Events", ...Array.from(names).sort()];
  }, [reservations, payoutRequests]);

  const getReservationData = () => {
    const ONE_HOUR_MS = 60 * 60 * 1000;
    const now = Date.now();
    const pendingReservations = reservations.filter(res => {
      if (res.status !== 'pending') return false;
      const resTime = new Date(res.createdAt).getTime();
      return (now - resTime) <= ONE_HOUR_MS;
    });

    // Group by batchId first (booths booked together), then map
    const boothGroups = new Map();
    const nonBoothRows = [];

    pendingReservations.forEach(res => {
      const isBooth = !!res.boothCode;
      const isGA = res.seatIds && res.seatIds.some(sid => sid.startsWith("GA-"));

      if (isBooth && res.batchId) {
        // Group booths by batchId
        if (boothGroups.has(res.batchId)) {
          const group = boothGroups.get(res.batchId);
          group.reservations.push(res);
          group.totalAmount += res.amount?.total || 0;
        } else {
          boothGroups.set(res.batchId, {
            reservations: [res],
            totalAmount: res.amount?.total || 0,
          });
        }
      } else {
        nonBoothRows.push(res);
      }
    });

    const result = [];

    // Add grouped booth rows
    boothGroups.forEach((group) => {
      const res = group.reservations[0];
      const allRes = group.reservations;
      const promoterName = res.user
        ? (`${res.user.firstName || ''} ${res.user.lastName || ''}`.trim() || res.user.companyName || 'Unknown')
        : 'Unknown';

      const boothLabel = allRes.length > 1
        ? `${allRes.length} Booths (${allRes.map(r => `#${r.boothCode}`).join(', ')})`
        : `Booth (${res.boothCode})`;

      result.push({
        id: `Booth-${res._id.toString().slice(-6).toUpperCase()}`,
        resId: res._id,
        allResIds: allRes.map(r => r._id), // for bulk approve/reject
        promoter: promoterName,
        event: res.event?.title || 'Unknown Event',
        booth: boothLabel,
        category: 'Booth',
        amount: `$${group.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        paymentMethod: formatPaymentMethod(res.paymentMethod),
        status: res.status,
        date: res.createdAt ? new Date(res.createdAt).toLocaleDateString() : 'N/A',
        createdAtTime: res.createdAt ? new Date(res.createdAt).getTime() : 0,
        quantity: allRes.length,
        details: allRes.map(r => `#${r.boothCode}`).join(', ')
      });
    });

    // Booths without batchId
    pendingReservations.forEach(res => {
      if (!res.boothCode || res.batchId) return;
      const promoterName = res.user
        ? (`${res.user.firstName || ''} ${res.user.lastName || ''}`.trim() || res.user.companyName || 'Unknown')
        : 'Unknown';
      result.push({
        id: `Booth-${res._id.toString().slice(-6).toUpperCase()}`,
        resId: res._id,
        allResIds: [res._id],
        promoter: promoterName,
        event: res.event?.title || 'Unknown Event',
        booth: `Booth (${res.boothCode})`,
        category: 'Booth',
        amount: `$${(res.amount?.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        paymentMethod: formatPaymentMethod(res.paymentMethod),
        status: res.status,
        date: res.createdAt ? new Date(res.createdAt).toLocaleDateString() : 'N/A',
        createdAtTime: res.createdAt ? new Date(res.createdAt).getTime() : 0,
        quantity: 1,
        details: `#${res.boothCode}`
      });
    });

    // Add non-booth rows (seats, tickets) — keep existing logic
    const gaGroups = [];

    nonBoothRows.forEach(res => {
      const isBooth = !!res.boothCode;
      if (isBooth) return;
      const isGA = res.seatIds && res.seatIds.some(sid => sid.startsWith("GA-"));
      const promoterName = res.user
        ? (`${res.user.firstName || ''} ${res.user.lastName || ''}`.trim() || res.user.companyName || 'Unknown')
        : 'Unknown';

      const item = {
        resId: res._id,
        userId: res.user?._id || res.user,
        promoter: promoterName,
        event: res.event?.title || 'Unknown Event',
        eventId: res.event?._id || res.event,
        category: isGA ? 'Ticket' : 'Ticket',
        amountVal: res.amount?.total || 0,
        booth: isGA
          ? `Tickets (${res.seatIds?.length || 1})`
          : res.seatLabels?.length > 0
            ? `Seats (${res.seatLabels.join(', ')})`
            : `Seats (${res.seatIds?.length || 0})`,
        paymentMethod: formatPaymentMethod(res.paymentMethod),
        status: res.status,
        dateStr: res.createdAt ? new Date(res.createdAt).toLocaleDateString() : 'N/A',
        createdAtTime: res.createdAt ? new Date(res.createdAt).getTime() : 0,
        quantity: res.seatIds?.length || 1,
        details: res.seatLabels?.join(', ') || ''
      };

      if (item.category !== 'Ticket') {
        result.push({
          id: `Seats-${item.resId.toString().slice(-6).toUpperCase()}`,
          resId: item.resId,
          allResIds: [item.resId],
          promoter: item.promoter,
          event: item.event,
          booth: item.booth,
          category: item.category,
          amount: `$${item.amountVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          paymentMethod: item.paymentMethod,
          status: item.status,
          date: item.dateStr,
          createdAtTime: item.createdAtTime,
          quantity: item.quantity,
          details: item.details
        });
        return;
      }

      const userIdStr = item.userId?.toString() || '';
      const eventIdStr = item.eventId?.toString() || '';
      const existingGroup = gaGroups.find(g =>
        g.userId === userIdStr &&
        g.eventId === eventIdStr &&
        g.paymentMethod === item.paymentMethod &&
        g.status === item.status &&
        Math.abs(g.createdAtTime - item.createdAtTime) < 10000
      );

      if (existingGroup) {
        existingGroup.amountVal += item.amountVal;
        existingGroup.quantity += item.quantity;
        if (item.details) existingGroup.detailsList.push(...item.details.split(',').map(s => s.trim()));
      } else {
        gaGroups.push({
          userId: userIdStr, eventId: eventIdStr,
          paymentMethod: item.paymentMethod, status: item.status,
          createdAtTime: item.createdAtTime, promoter: item.promoter,
          event: item.event, category: item.category,
          amountVal: item.amountVal, quantity: item.quantity,
          dateStr: item.dateStr, resId: item.resId,
          detailsList: item.details ? item.details.split(',').map(s => s.trim()) : []
        });
      }
    });

    gaGroups.forEach(g => {
      result.push({
        id: `Ticket-${g.resId.toString().slice(-6).toUpperCase()}`,
        resId: g.resId,
        allResIds: [g.resId],
        promoter: g.promoter,
        event: g.event,
        booth: `Tickets (${g.quantity})`,
        category: g.category,
        amount: `$${g.amountVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        paymentMethod: g.paymentMethod,
        status: g.status,
        date: g.dateStr,
        createdAtTime: g.createdAtTime,
        quantity: g.quantity,
        details: [...new Set(g.detailsList)].join(', ')
      });
    });

    result.sort((a, b) => (b.createdAtTime || 0) - (a.createdAtTime || 0));
    return result;
  };

  // Payout Request tab: only show unresolved (pending/processing) — resolved go to Transactions
  const activePendingPayouts = payoutRequests.filter(
    p => p.status === 'pending' || p.status === 'processing'
  );
  let filteredData = activeTab === "payout-requests" ? activePendingPayouts : getReservationData();

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredData = filteredData.filter(item =>
      (item.promoter?.toLowerCase().includes(query) || false) ||
      (item.event?.toLowerCase().includes(query) || false) ||
      (item.amount?.toLowerCase().includes(query) || false) ||
      (item.status?.toLowerCase().includes(query) || false)
    );
  }

  if (eventFilter !== "All Events") {
    filteredData = filteredData.filter(item => {
      if (activeTab === "payout-requests") {
        return item.events?.includes(eventFilter);
      }
      return item.event === eventFilter;
    });
  }

  if (activeTab === "payout-requests" && statusFilter !== "All Status") {
    filteredData = filteredData.filter(item => item.status.toLowerCase() === statusFilter.toLowerCase());
  } else if (activeTab === "booth-reservations" && statusFilter !== "All") {
    filteredData = filteredData.filter(item => item.category === statusFilter);
  }

  useEffect(() => {
    setTotal({
      total: filteredData.length,
      totalPages: Math.ceil(filteredData.length / itemsPerPage) || 1
    });
  }, [filteredData.length, setTotal]);

  useEffect(() => {
    resetPage();
  }, [searchQuery, statusFilter, eventFilter, resetPage]);

  const startIndex = (page - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const [expandedRow, setExpandedRow] = useState(null);
  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    resetPage();
    setSearchQuery("");
    setStatusFilter(tab === "payout-requests" ? "All Status" : "All");
    setEventFilter("All Events");
    setExpandedRow(null);
  };

  const getFilterOptions = () => {
    if (activeTab === "payout-requests") {
      // Only actionable statuses remain in this tab
      return ["All Status", "Pending", "Processing"];
    } else if (activeTab === "booth-reservations") {
      return ["All", "Booth", "Ticket"];
    } else if (activeTab === "transactions") {
      return ["All", "Booth", "Ticket", "Payout"];
    }
    return ["All"];
  };

  const getTransactionFilterValue = (label) => {
    const mapping = {
      "All": "all",
      "Booth": "booth",
      "Ticket": "ticket",
      "Payout": "payout"
    };
    return mapping[label] || "all";
  };

  // ============================================================
  // FIND this function in payments.jsx:
  //   const getTransactionList = () => {
  // 
  // REPLACE the ENTIRE function body with the code below.
  // Everything from the opening { to the closing }; is replaced.
  // ============================================================

  const getTransactionList = () => {
    const ONE_HOUR_MS = 60 * 60 * 1000;
    const now = Date.now();

    // ── 1. Filter: only resolved reservations (not pending) or expired ──
    const resolvedReservations = (reservations || []).filter(res => {
      if (res.status !== 'pending') return true;
      const resTime = new Date(res.createdAt).getTime();
      if ((now - resTime) > ONE_HOUR_MS) {
        // Create a copy or mutate? Mutating the local state copy is okay here for display
        res.status = 'expired';
        return true;
      }
      return false;
    });

    // ── 2. Map raw reservations → flat objects ────────────────
    //    Added: batchId, boothCode, seatLabels  ← NEW FIELDS
    const mappedReservations = resolvedReservations.map((res) => {
      const name = res.user
        ? (`${res.user.firstName || ''} ${res.user.lastName || ''}`.trim() || res.user.companyName || 'Unknown User')
        : 'Unknown User';

      const isBooth = !!res.boothCode;
      const isGA = res.seatIds && res.seatIds.some(sid => sid.startsWith("GA-"));

      return {
        resId: res._id,
        userId: res.user?._id || res.user,
        user: name,
        event: res.event?.title || 'Unknown Event',
        eventId: res.event?._id || res.event,
        category: isBooth ? 'Booth' : 'Ticket',
        isGA: isGA,
        isSeat: !isGA && !isBooth,
        amountVal: res.amount?.total || 0,
        status: res.status === 'confirmed' ? 'confirmed'
          : res.status === 'rejected' ? 'rejected'
            : res.status === 'expired' ? 'expired'
              : res.status,
        dateStr: res.createdAt
          ? new Date(res.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'N/A',
        createdAtTime: res.createdAt ? new Date(res.createdAt).getTime() : 0,
        filterType: isBooth ? 'booth' : 'ticket',
        rawDate: res.createdAt ? new Date(res.createdAt) : new Date(0),
        paymentMethod: formatPaymentMethod(res.paymentMethod),
        quantity: res.seatIds?.length || 1,
        details: res.seatLabels?.join(", ") || "",
        giftCode: res.giftCode || null,
        appliedGift: res.appliedGift || null,

        // ── NEW FIELDS ──────────────────────────────────────────
        batchId: res.batchId || null,   // groups booths/seats booked together
        boothCode: res.boothCode || null,   // e.g. "A1"
        seatLabels: res.seatLabels || [],     // e.g. ["Row A - Seat 1", "Row A - Seat 2"]
      };
    });

    // ── 3. Containers ─────────────────────────────────────────
    const reservationTx = [];
    const boothBatchMap = new Map();   // key: batchId string
    const seatBatchMap = new Map();   // key: batchId string
    const gaGroups = [];

    // ══════════════════════════════════════════════════════════
    // PASS 1 — BOOTHS  (sponsor books multiple booths at once)
    //   Group by batchId → 1 row per batch in the table
    // ══════════════════════════════════════════════════════════
    mappedReservations.forEach(item => {
      if (item.category !== 'Booth') return;

      const key = item.batchId?.toString();

      if (key) {
        // Has a batchId → accumulate into the map
        if (boothBatchMap.has(key)) {
          const g = boothBatchMap.get(key);
          g.totalAmount += item.amountVal;
          g.allItems.push(item);
        } else {
          boothBatchMap.set(key, { firstItem: item, allItems: [item], totalAmount: item.amountVal });
        }
      } else {
        reservationTx.push({
          id: `Booth-${item.resId.toString().slice(-6).toUpperCase()}`,
          resId: item.resId,
          allResIds: [item.resId],
          promoter: item.user,
          event: item.event,
          category: 'Booth',
          amount: `$${item.amountVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          status: item.status,
          date: item.dateStr,
          filterType: 'booth',
          rawDate: item.rawDate,
          paymentMethod: item.paymentMethod,
          quantity: 1,
          booth: item.boothCode ? `Booth (#${item.boothCode})` : '',
          giftCode: item.giftCode,
          appliedGift: item.appliedGift,
        });
      }
    });

    boothBatchMap.forEach((g) => {
      const first = g.firstItem;
      const codes = g.allItems.map(i => `#${i.boothCode}`).join(', ');
      const label = g.allItems.length > 1 ? `${g.allItems.length} Booths (${codes})` : `Booth (${first.boothCode})`;
      reservationTx.push({
        id: `Booth-${first.resId.toString().slice(-6).toUpperCase()}`,
        resId: first.resId,
        allResIds: g.allItems.map((i) => i.resId),
        promoter: first.user,
        event: first.event,
        category: 'Booth',
        amount: `$${g.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        status: first.status,
        date: first.dateStr,
        filterType: 'booth',
        rawDate: first.rawDate,
        paymentMethod: first.paymentMethod,
        quantity: g.allItems.length,
        booth: label,
        giftCode: first.giftCode,
        appliedGift: first.appliedGift,
      });
    });

    mappedReservations.forEach(item => {
      if (!item.isSeat) return;
      const key = item.batchId?.toString();
      if (key) {
        if (seatBatchMap.has(key)) {
          const g = seatBatchMap.get(key);
          g.totalAmount += item.amountVal;
          g.quantity += item.quantity;
          g.allItems.push(item);
        } else {
          seatBatchMap.set(key, { firstItem: item, allItems: [item], totalAmount: item.amountVal, quantity: item.quantity });
        }
      } else {
        reservationTx.push({
          id: `Seats-${item.resId.toString().slice(-6).toUpperCase()}`,
          resId: item.resId,
          allResIds: [item.resId],
          promoter: item.user,
          event: item.event,
          category: 'Ticket',
          amount: `$${item.amountVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          status: item.status,
          date: item.dateStr,
          filterType: 'ticket',
          rawDate: item.rawDate,
          paymentMethod: item.paymentMethod,
          quantity: item.quantity,
          booth: item.seatLabels?.length > 0 ? `Seats (${item.seatLabels.join(', ')})` : `Seats (${item.quantity})`,
          giftCode: item.giftCode,
          appliedGift: item.appliedGift,
        });
      }
    });

    seatBatchMap.forEach((g) => {
      const first = g.firstItem;
      const allLabels = [...new Set(g.allItems.flatMap(i => i.seatLabels || []))];
      const label = allLabels.length > 0 ? `Seats (${allLabels.join(', ')})` : `Seats (${g.quantity})`;
      reservationTx.push({
        id: `Seats-${first.resId.toString().slice(-6).toUpperCase()}`,
        resId: first.resId,
        allResIds: g.allItems.map((i) => i.resId),
        promoter: first.user,
        event: first.event,
        category: 'Ticket',
        amount: `$${g.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        status: first.status,
        date: first.dateStr,
        filterType: 'ticket',
        rawDate: first.rawDate,
        paymentMethod: first.paymentMethod,
        quantity: g.quantity,
        booth: label,
        giftCode: first.giftCode,
        appliedGift: first.appliedGift,
      });
    });

    mappedReservations.forEach(item => {
      if (item.category === 'Booth' || item.isSeat) return;
      const userIdStr = item.userId?.toString() || '';
      const eventIdStr = item.eventId?.toString() || '';
      const existingGroup = gaGroups.find(g =>
        g.userId === userIdStr && g.eventId === eventIdStr && g.paymentMethod === item.paymentMethod && g.status === item.status && Math.abs(g.createdAtTime - item.createdAtTime) < 60000
      );
      if (existingGroup) {
        existingGroup.amountVal += item.amountVal;
        existingGroup.quantity += item.quantity;
        if (item.status === 'completed') existingGroup.status = 'completed';
        if (item.details) existingGroup.detailsList.push(...item.details.split(',').map(s => s.trim()));
      } else {
        gaGroups.push({
          userId: userIdStr, eventId: eventIdStr, paymentMethod: item.paymentMethod, status: item.status, createdAtTime: item.createdAtTime,
          user: item.user, event: item.event, category: item.category, amountVal: item.amountVal, quantity: item.quantity,
          dateStr: item.dateStr, filterType: item.filterType, rawDate: item.rawDate, resId: item.resId,
          detailsList: item.details ? [...new Set(item.details.split(',').map(s => s.trim()))] : [],
          giftCode: item.giftCode || null, appliedGift: item.appliedGift || null
        });
      }
    });

    gaGroups.forEach(g => {
      reservationTx.push({
        id: `Ticket-${g.resId.toString().slice(-6).toUpperCase()}`,
        resId: g.resId,
        allResIds: [g.resId],
        promoter: g.user,
        event: g.event,
        category: g.category,
        amount: `$${g.amountVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        status: g.status,
        date: g.dateStr,
        filterType: g.filterType,
        rawDate: g.rawDate,
        paymentMethod: g.paymentMethod,
        quantity: g.quantity,
        details: [...new Set(g.detailsList)].join(", "),
        giftCode: g.giftCode,
        appliedGift: g.appliedGift,
      });
    });

    // ── 4. Resolved payouts (paid / rejected) ─────────────────
    const resolvedPayouts = (payoutRequests || []).filter(
      p => p.status === 'paid' || p.status === 'rejected' || p.status === 'reject'
    );
    const payoutTx = resolvedPayouts.map((p) => ({
      id: p.reference,
      user: p.promoter,
      event: "Platform Payout",
      category: "Payout",
      amount: p.amount,
      status: p.status,
      date: p.requested,
      filterType: "payout",
      rawDate: new Date(p.requested),
      paymentMethod: p.method,
    }));

    // ── 5. Merge and sort newest first ────────────────────────
    return [...reservationTx, ...payoutTx].sort((a, b) => b.rawDate - a.rawDate);
  };

  const handleApprove = async (id, promoter, amount) => {
    const confirmResult = await showApproveConfirmAlert(promoter, amount);

    if (!confirmResult.isConfirmed) {
      return;
    }

    try {
      await payoutService.updatePayoutStatus(id, "paid", null, user.token);

      setPayoutRequests(prev =>
        prev.map(req => req.id === id ? { ...req, status: "paid" } : req)
      );
      await showSuccessAlert('Payment Approved', 'The payment request has been approved and marked as paid.');
    } catch (error) {
      console.error('Error approving payment:', error);
      await showErrorAlert('Error', error.message || 'Failed to approve payment request.');
    }
  };

  const handleRejectClick = (payout) => {
    setSelectedPayout(payout);
    setShowRejectionModal(true);
  };

  const handleReject = async (rejectionReason) => {
    if (!selectedPayout || !rejectionReason) {
      return;
    }

    try {
      await payoutService.updatePayoutStatus(selectedPayout.id, "reject", rejectionReason, user.token);

      setPayoutRequests(prev =>
        prev.map(req => req.id === selectedPayout.id ? { ...req, status: "reject", rejectionReason } : req)
      );
      await showSuccessAlert('Payment Rejected', `Payment request for ${selectedPayout.promoter} (${selectedPayout.amount}) has been rejected. Reason: ${rejectionReason}`);
      setShowRejectionModal(false);
      setSelectedPayout(null);
    } catch (error) {
      console.error('Error rejecting payment:', error);
      await showErrorAlert('Error', error.message || 'Failed to reject payment request.');
    }
  };

  const generateInvoicePDF = async (payout, shouldSave = true) => {
    try {
      const salesData = reservations.map(r => ({
        ...r,
        eventId: r.event?._id || r.event,
        eventTitle: r.event?.title || 'Unknown Event',
        type: r.boothCode ? 'booth' : 'ticket'
      }));

      // In payments.jsx, we have all events populated in reservations
      const events = Array.from(new Set(reservations.map(r => r.event).filter(Boolean)));

      return await generatePayoutInvoicePDF(jsPDF, payout, events, salesData, { shouldSave });
    } catch (error) {
      console.error("Error generating invoice PDF:", error);
      if (shouldSave) alert("Failed to generate PDF. Please try again.");
    }
  };

  const handleViewDetails = async (payout) => {
    // We need the raw payout data for methodDetails and eventIds
    const rawPayout = payoutRequestsRaw.find(p => p._id === payout.id);
    if (!rawPayout) return;

    const payoutForPdf = {
      ...payout,
      methodDetails: rawPayout.methodDetails,
      eventIds: rawPayout.eventIds,
      amountStr: payout.amount
    };

    setViewingPayout(payoutForPdf);
    setIsViewModalOpen(true);
    const pdfDataUrl = await generateInvoicePDF(payoutForPdf, false);
    setPayoutPdfUrl(pdfDataUrl);
  };

  const handleViewReservation = (row) => {
    // Find the raw reservation to get giftCode and appliedGift
    const rawRes = reservations.find(res => res._id === row.resId);

    setSelectedTx({
      id: row.id,
      resId: row.resId,
      allResIds: row.allResIds,
      user: row.promoter,
      event: row.event,
      category: row.category,
      amount: row.amount,
      status: row.status === 'confirmed' ? 'completed' : row.status,
      date: row.date,
      paymentMethod: row.paymentMethod,
      quantity: row.quantity || 1,
      details: row.details || "",
      giftCode: rawRes?.giftCode || null,           // ← add this
      appliedGift: rawRes?.appliedGift || null,      // ← add this
    });
    setIsTxModalOpen(true);
  };

  const handleTxRefund = async (transactionId, transaction = null) => {
    let idsToRefund = [];

    if (transaction?.allResIds?.length) {
      idsToRefund = transaction.allResIds;
    } else if (transaction?.resId) {
      idsToRefund = [transaction.resId];
    } else {
      const matchingRes = reservations.find(
        (res) => formatReservationTxId(res) === transactionId
      );
      if (!matchingRes) {
        await showErrorAlert('Error', 'Could not find the reservation for this transaction.');
        return false;
      }
      idsToRefund = [matchingRes._id];
    }

    try {
      for (const rid of idsToRefund) {
        await reservationService.updateReservationStatus(rid, "refunded", user.token);
      }
      setReservations((prev) =>
        prev.map((res) =>
          idsToRefund.map(String).includes(String(res._id))
            ? { ...res, status: 'refunded' }
            : res
        )
      );
      await showSuccessAlert(
        'Refund Processed',
        'The refund has been processed. Any applied digital gift has been returned to the customer.'
      );
      return true;
    } catch (error) {
      console.error('Error refunding reservation:', error);
      await showErrorAlert('Error', error.response?.data?.error || 'Failed to process refund on backend.');
      return false;
    }
  };

  const handleAcceptReservation = async (id, promoter, amount, allResIds) => {
    const confirmResult = await showApproveConfirmAlert(promoter, amount);
    if (!confirmResult.isConfirmed) return;

    // If allResIds passed (grouped booths), update all of them; otherwise just the one
    const idsToUpdate = (allResIds && allResIds.length > 0) ? allResIds : [id];

    try {
      await Promise.all(
        idsToUpdate.map(rid =>
          reservationService.updateReservationStatus(rid, "confirmed", user.token)
        )
      );
      setReservations(prev =>
        prev.map(res =>
          idsToUpdate.map(String).includes(String(res._id))
            ? { ...res, status: "confirmed" }
            : res
        )
      );
      await showSuccessAlert('Reservation Approved', 'The reservation invoice has been approved.');
    } catch (error) {
      console.error('Error approving reservation:', error);
      await showErrorAlert('Error', error.response?.data?.error || 'Failed to approve reservation.');
    }
  };


  const handleRejectReservation = async (id, promoter, amount, allResIds) => {
    const confirmResult = await showRejectConfirmAlert(promoter, amount);
    if (!confirmResult.isConfirmed) return;

    // If allResIds passed (grouped booths), update all of them; otherwise just the one
    const idsToUpdate = (allResIds && allResIds.length > 0) ? allResIds : [id];

    try {
      for (const rid of idsToUpdate) {
        await reservationService.updateReservationStatus(rid, "rejected", user.token);
      }
      setReservations(prev =>
        prev.map(res =>
          idsToUpdate.map(String).includes(String(res._id))
            ? { ...res, status: "rejected" }
            : res
        )
      );
      await showSuccessAlert(
        'Reservation Rejected',
        'The reservation invoice has been rejected. Any applied digital gift has been returned to the customer.'
      );
    } catch (error) {
      console.error('Error rejecting reservation:', error);
      await showErrorAlert('Error', error.response?.data?.error || 'Failed to reject reservation.');
    }
  };
  const getStatusClass = (status) => {
    if (status === "paid" || status === "confirmed") return "button-label pay-status-paid";
    if (status === "pending") return "button-label pay-status-pending";
    if (status === "processing") return "button-label pay-status-processing";
    if (status === "rejected" || status === "reject" || status === "refunded" || status === "expired") return "button-label pay-status-rejected";
    return "button-label";
  };

  const getCategoryClass = (category) => {
    if (category === "Booth") return "button-label pay-category-booth";
    if (category === "Seats" || category === "Seated Ticket" || category === "Ticket") return "button-label pay-category-seats";
    if (category === "Payout" || category === "-") return "button-label pay-category-payout";
    return "button-label";
  };

  return (
    <div className="payments-page">
      <div className="payments-header">
        <div>
          <h1>Payments & Payouts</h1>
          <p className="large-body-text">Manage promoter payouts and platform payment settings.</p>
        </div>
      </div>

      <div className="payments-cards">
        <div className="pay-card pay-card-pending">
          <p className="regular-body-text pay-card-title">Pending Payouts</p>
          <h4 className="pay-card-amount">
            ${payoutRequests
              .filter(p => p.status === "pending")
              .reduce((sum, p) => sum + parseFloat(p.amount?.toString().replace(/[$,]/g, '') || 0), 0)
              .toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h4>
          <span className="small-body-text pay-card-meta">
            <Icon icon="mdi:file-document-outline" />
            {payoutRequests.filter(p => p.status === "pending").length} requests waiting
          </span>
        </div>
        <div className="pay-card pay-card-total">
          <p className="regular-body-text pay-card-title">Total Paid (YTD)</p>
          <h4 className="pay-card-amount">
            ${payoutRequests
              .filter(p => p.status === "paid")
              .reduce((sum, p) => sum + parseFloat(p.amount?.toString().replace(/[$,]/g, '') || 0), 0)
              .toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h4>
          <span className="small-body-text pay-card-meta pay-card-meta-success">
            <Icon icon="mdi:check-circle" />
            All processed successfully
          </span>
        </div>
      </div>

      <div className="payments-content">
        <div className="pay-tabs">
          <button
            className={`pay-tab ${activeTab === "payout-requests" ? "active" : ""}`}
            onClick={() => handleTabChange("payout-requests")}
          >
            Payout Request
          </button>
          <button
            className={`pay-tab ${activeTab === "booth-reservations" ? "active" : ""}`}
            onClick={() => handleTabChange("booth-reservations")}
          >
            Reservation
          </button>
          <button
            className={`pay-tab ${activeTab === "transactions" ? "active" : ""}`}
            onClick={() => handleTabChange("transactions")}
          >
            Transactions
          </button>
        </div>

        <div className="pay-toolbar">
          <div className="pay-toolbar-left">
            <div className="pay-search">
              <Icon icon="mdi:magnify" />
              <input
                type="text"
                placeholder={
                  activeTab === "payout-requests" ? "Search payouts..." :
                    activeTab === "transactions" ? "Search transactions..." :
                      "Search payments..."
                }
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  resetPage();
                }}
                className="small-body-text"
              />
            </div>
          </div>

          {/* Event Filter */}
          <div className="pay-toolbar-right" ref={eventDropdownRef}>
            <div className="pay-filter-dropdown">
              <button
                className="pay-filter-dropdown-btn small-body-text"
                onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
              >
                <span className="truncate-text">{eventFilter}</span>
                <Icon icon="mdi:chevron-down" className={`dropdown-icon ${isEventDropdownOpen ? "open" : ""}`} />
              </button>
              {isEventDropdownOpen && (
                <div className="pay-filter-dropdown-menu">
                  {eventOptions.map((option) => (
                    <button
                      key={option}
                      className={`pay-filter-dropdown-item small-body-text ${eventFilter === option ? "active" : ""}`}
                      onClick={() => {
                        setEventFilter(option);
                        resetPage();
                        setIsEventDropdownOpen(false);
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div className="pay-toolbar-right" ref={filterDropdownRef}>
            <div className="pay-filter-dropdown">
              <button
                className="pay-filter-dropdown-btn small-body-text"
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              >
                <span className="truncate-text">{statusFilter}</span>
                <Icon icon="mdi:chevron-down" className={`dropdown-icon ${isFilterDropdownOpen ? "open" : ""}`} />
              </button>
              {isFilterDropdownOpen && (
                <div className="pay-filter-dropdown-menu">
                  {getFilterOptions().map((option) => (
                    <button
                      key={option}
                      className={`pay-filter-dropdown-item small-body-text ${statusFilter === option ? "active" : ""}`}
                      onClick={() => {
                        setStatusFilter(option);
                        resetPage();
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

        {isLoading ? (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{activeTab === "transactions" ? "Name" : (activeTab === "payout-requests" ? "Promoter" : "User")}</th>
                  {activeTab === "booth-reservations" && <th>Event</th>}
                  {(activeTab === "booth-reservations" || activeTab === "transactions") && <th>Category</th>}
                  <th>Amount</th>
                  {activeTab !== "transactions" && <th>Method</th>}
                  <th>Status</th>
                  <th>{activeTab === "payout-requests" ? "Requested" : "Date"}</th>
                  {(activeTab === "payout-requests" || activeTab === "transactions") && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {[...Array(itemsPerPage)].map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton skeleton-text" style={{ width: '60px' }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '120px' }} /></td>
                    {activeTab === "booth-reservations" && <td><div className="skeleton skeleton-text" style={{ width: '150px' }} /></td>}
                    {(activeTab === "booth-reservations" || activeTab === "transactions") && <td><div className="skeleton skeleton-badge" style={{ width: '70px' }} /></td>}
                    <td><div className="skeleton skeleton-text" style={{ width: '80px' }} /></td>
                    {activeTab !== "transactions" && <td><div className="skeleton skeleton-text" style={{ width: '100px' }} /></td>}
                    <td><div className="skeleton skeleton-badge" style={{ width: '70px' }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '80px' }} /></td>
                    {(activeTab === "payout-requests" || activeTab === "transactions") && (
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <div className="skeleton skeleton-rect" style={{ width: activeTab === "transactions" ? '32px' : '60px', height: '32px' }} />
                          {activeTab === "payout-requests" && <div className="skeleton skeleton-rect" style={{ width: '60px', height: '32px' }} />}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === "transactions" ? (
          <TransactionMonitoring
            isTab={true}
            externalSearchQuery={searchQuery}
            externalFilter={getTransactionFilterValue(statusFilter)}
            externalEventFilter={eventFilter}
            data={getTransactionList()}
            onRefund={handleTxRefund}
          />
        ) : (
          <div className="table-wrapper">
            {error ? (
              <div className="empty-state">
                <Icon icon="mdi:alert-circle-outline" width="48" style={{ color: 'var(--accent-red)' }} />
                <h4>Error</h4>
                <p className="small-body-text">{error}</p>
              </div>
            ) : paginatedData.length === 0 ? (
              // Empty state outside table for mobile-friendly display
              <div className="empty-state">
                <Icon
                  icon={
                    activeTab === "payout-requests"
                      ? "mdi:bank-off"
                      : "mdi:clock-check-outline"
                  }
                  style={{ fontSize: '48px', marginBottom: '16px' }}
                />
                <h4>
                  {searchQuery
                    ? "No results found"
                    : activeTab === "payout-requests"
                      ? "No pending payout requests"
                      : "No pending reservations"
                  }
                </h4>
                <p className="small-body-text">
                  {searchQuery
                    ? <>No matches found for "<strong>{searchQuery}</strong>".</>
                    : activeTab === "payout-requests"
                      ? "All payout requests have been resolved. Check the Transactions tab for history."
                      : "All reservations have been actioned. Check the Transactions tab for history."
                  }
                </p>
              </div>
            ) : (
              <table className="data-table">
                {activeTab === "payout-requests" ? (
                  <>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Promoter</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Status</th>
                        <th>Date Requested</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((row) => (
                        <React.Fragment key={row.id}>
                          <tr className={expandedRow === row.id ? "expanded" : ""}>
                            <td className="small-body-text id-td" data-label="ID">
                              <div className="mobile-expand-icon" onClick={() => toggleRow(row.id)}>
                                <Icon icon={expandedRow === row.id ? "mdi:chevron-up" : "mdi:chevron-down"} />
                              </div>
                              <span>{row.reference}</span>
                            </td>
                            <td data-label="Promoter" className="regular-body-text name-td">
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span>{row.promoter}</span>
                                <span className="small-body-text" style={{ opacity: 0.7, fontSize: '11px' }}>{row.events}</span>
                              </div>
                            </td>
                            <td data-label="Amount" className="regular-body-text pay-amount">{row.amount}</td>
                            <td data-label="Method" className="small-body-text">{row.paymentMethod}</td>
                            <td data-label="Status">
                              <span className={getStatusClass(row.status)}>{row.status}</span>
                            </td>
                            <td data-label="Requested" className="regular-body-text">{row.requested}</td>
                            <td data-label="Actions">
                              <div className="pay-actions">
                                <button
                                  className="pay-btn-view"
                                  title="View details"
                                  style={{
                                    backgroundColor: 'rgba(30, 60, 114, 0.1)',
                                    color: 'var(--primary-blue)',
                                    border: '1px solid rgba(30, 60, 114, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '8px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onClick={() => handleViewDetails(row)}
                                >
                                  <Icon icon="mdi:eye-outline" style={{ fontSize: '18px' }} />
                                </button>
                                {row.status === "pending" && (
                                  <>
                                    <button
                                      className="pay-btn-approve"
                                      title="Approve payout"
                                      style={{
                                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                                        color: '#28a745',
                                        border: '1px solid rgba(40, 167, 69, 0.2)',
                                        padding: '8px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                      onClick={() => handleApprove(row.id, row.promoter, row.amount)}
                                    >
                                      <Icon icon="mdi:check-bold" style={{ fontSize: '18px' }} />
                                    </button>
                                    <button
                                      className="pay-btn-reject"
                                      title="Reject payout"
                                      style={{
                                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                                        color: '#dc3545',
                                        border: '1px solid rgba(220, 53, 69, 0.2)',
                                        padding: '8px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                      onClick={() => handleRejectClick(row)}
                                    >
                                      <Icon icon="mdi:close-thick" style={{ fontSize: '18px' }} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                          {expandedRow === row.id && (
                            <tr className="expanded-row-content">
                              <td colSpan="7">
                                <div className="expanded-info-container" style={{ padding: '15px', backgroundColor: 'var(--color-bg-light)', borderBottom: '1px solid var(--color-border)' }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                      <h6 style={{ marginBottom: '8px', fontSize: '13px', fontWeight: '700' }}>Event Details</h6>
                                      <p className="small-body-text" style={{ margin: 0, opacity: 0.8 }}>{row.events}</p>
                                    </div>
                                    {(row.status === 'reject' || row.status === 'rejected') && (
                                      <div>
                                        <h6 style={{ marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: 'var(--color-red)' }}>Rejection Reason</h6>
                                        <p className="small-body-text" style={{ margin: 0, opacity: 0.8 }}>{row.rejectionReason || "No reason provided."}</p>
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
                  </>
                ) : (
                  <>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>User</th>
                        <th>Event</th>
                        {/* <th>Booth/Seats</th> */}
                        <th>Category</th>
                        <th>Amount</th>

                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((row) => (
                        <tr key={row.id} className={expandedRow === row.id ? "expanded" : ""}>
                          <td className="small-body-text id-td" data-label="ID">
                            <div className="mobile-expand-icon" onClick={() => toggleRow(row.id)}>
                              <Icon icon={expandedRow === row.id ? "mdi:chevron-up" : "mdi:chevron-down"} />
                            </div>
                            <span>{row.id}</span>
                          </td>
                          <td data-label="Promoter" className="regular-body-text name-td">{row.promoter}</td>
                          <td data-label="Event" className="small-body-text">{row.event}</td>
                          {/* <td data-label="Booth" className="small-body-text">  {row.booth ? (
                            <span>{row.booth}</span>
                          ) : (
                            <span style={{ opacity: 0.4 }}>—</span>
                          )}
                          </td> */}
                          <td data-label="Category">
                            <span className={getCategoryClass(row.category)}>
                              {row.category}
                            </span>
                          </td>
                          <td data-label="Amount" className="pay-amount regular-body-text">{row.amount}</td>
                          {/* <td data-label="Method" className="small-body-text">{row.paymentMethod}</td> */}
                          <td data-label="Status">
                            <span className={getStatusClass(row.status)}>{row.status}</span>
                          </td>
                          <td data-label="Date" className="small-body-text">{row.date}</td>
                          <td data-label="Actions">
                            <div className="pay-actions">
                              <button
                                className="pay-btn-view"
                                title="View details"
                                style={{
                                  backgroundColor: 'rgba(30, 60, 114, 0.1)',
                                  color: 'var(--primary-blue)',
                                  border: '1px solid rgba(30, 60, 114, 0.2)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: '8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onClick={() => handleViewReservation(row)}
                              >
                                <Icon icon="mdi:eye-outline" style={{ fontSize: '18px' }} />
                              </button>
                              {row.status === 'pending' && (
                                <>
                                  <button
                                    className="pay-btn-approve"
                                    title="Approve Reservation"
                                    style={{
                                      backgroundColor: 'rgba(40, 167, 69, 0.1)',
                                      color: '#28a745',
                                      border: '1px solid rgba(40, 167, 69, 0.2)',
                                      padding: '8px',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                    onClick={() => handleAcceptReservation(row.resId, row.promoter, row.amount, row.allResIds)}                                  >
                                    <Icon icon="mdi:check-bold" style={{ fontSize: '18px' }} />
                                  </button>
                                  <button
                                    className="pay-btn-reject"
                                    title="Reject Reservation"
                                    style={{
                                      backgroundColor: 'rgba(220, 53, 69, 0.1)',
                                      color: '#dc3545',
                                      border: '1px solid rgba(220, 53, 69, 0.2)',
                                      padding: '8px',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                    onClick={() => handleRejectReservation(row.resId, row.promoter, row.amount, row.allResIds)}                                  >
                                    <Icon icon="mdi:close-thick" style={{ fontSize: '18px' }} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}
              </table>
            )}
          </div>
        )}

        {activeTab !== "transactions" && (
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

      {showRejectionModal && selectedPayout && (
        <PaymentRejectionModal
          payout={selectedPayout}
          onClose={() => {
            setShowRejectionModal(false);
            setSelectedPayout(null);
          }}
          onConfirm={handleReject}
        />
      )}

      {isViewModalOpen && viewingPayout && (
        <PromoterViewPayout
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setViewingPayout(null);
            setPayoutPdfUrl(null);
          }}
          payout={viewingPayout}
          pdfUrl={payoutPdfUrl}
          onDownloadInvoice={() => generateInvoicePDF(viewingPayout, true)}
        />
      )}

      {isTxModalOpen && selectedTx && (
        <ViewTransactionModal
          isOpen={isTxModalOpen}
          onClose={() => {
            setIsTxModalOpen(false);
            setSelectedTx(null);
          }}
          transaction={selectedTx}
          onRefund={handleTxRefund}
        />
      )}
    </div>
  );
};

export default Payments;
