import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import "./payments.css";
import Swal from "sweetalert2";
import { showSuccessAlert, showErrorAlert, showApproveConfirmAlert, showRejectConfirmAlert } from "../utils/sweetAlert";
import PaymentRejectionModal from "./Modal/PaymentRejectionModal";
import ViewTransactionModal from "./Modal/ViewTransactionModal";
import TransactionMonitoring from "./transaction";
import axios from "axios";
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

const Payments = () => {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState("payout-requests");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setIsFilterDropdownOpen(false);
      }
    };
    if (isFilterDropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFilterDropdownOpen]);

  const getReservationData = () => {
    return reservations.map((res, index) => {
      const promoterName = res.user
        ? (res.user.companyName || `${res.user.firstName} ${res.user.lastName}`)
        : 'Unknown Promoter';

      const isBooth = !!res.boothCode;
      return {
        id: isBooth ? `Booth-${res._id.toString().slice(-6).toUpperCase()}` : `Seats-${res._id.toString().slice(-6).toUpperCase()}`,
        resId: res._id,
        promoter: promoterName,
        event: res.event?.title || 'Unknown Event',
        category: isBooth ? 'Booth' : 'Seats',
        amount: `$${res.amount?.total ? res.amount.total.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}`,
        booth: isBooth
          ? `Booth (${res.boothCode})`
          : res.seatLabels?.length > 0
            ? `Seats (${res.seatLabels.join(', ')})`
            : res.seatIds?.length > 0
              ? `Seats (${res.seatIds.length} seat${res.seatIds.length > 1 ? 's' : ''})`
              : null,
        paymentMethod: res.paymentMethod === 'invoice' ? 'Invoice' : 'Card',
        status: res.status,
        date: res.createdAt ? new Date(res.createdAt).toLocaleDateString() : 'N/A'
      };
    });
  };

  let filteredData = activeTab === "payout-requests" ? payoutRequests : getReservationData();

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredData = filteredData.filter(item =>
      (item.promoter?.toLowerCase().includes(query) || false) ||
      (item.event?.toLowerCase().includes(query) || false) ||
      (item.amount?.toLowerCase().includes(query) || false) ||
      (item.status?.toLowerCase().includes(query) || false)
    );
  }

  if (activeTab === "payout-requests" && statusFilter !== "All Status") {
    filteredData = filteredData.filter(item => item.status.toLowerCase() === statusFilter.toLowerCase());
  } else if (activeTab === "booth-reservations" && statusFilter !== "All") {
    filteredData = filteredData.filter(item => item.category === statusFilter);
  }

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const [expandedRow, setExpandedRow] = useState(null);
  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchQuery("");
    setStatusFilter(tab === "payout-requests" ? "All Status" : "All");
    setExpandedRow(null);
  };

  const getFilterOptions = () => {
    if (activeTab === "payout-requests") {
      return ["All Status", "Pending", "Processing", "Paid", "Rejected"];
    } else if (activeTab === "booth-reservations") {
      return ["All", "Booth", "Seats"];
    } else if (activeTab === "transactions") {
      return ["All", "Booth", "Seats", "Payout"];
    }
    return ["All"];
  };

  const getTransactionFilterValue = (label) => {
    const mapping = {
      "All": "all",
      "Booth": "booth",
      "Seats": "ticket",
      "Payout": "payout"
    };
    return mapping[label] || "all";
  };

  const getTransactionList = () => {
    const reservationTx = (reservations || []).map((res) => {
      const name = res.user
        ? (res.user.companyName || `${res.user.firstName} ${res.user.lastName}`)
        : 'Unknown User';

      const isBooth = !!res.boothCode;
      return {
        id: isBooth ? `Booth-${res._id.toString().slice(-6).toUpperCase()}` : `Seats-${res._id.toString().slice(-6).toUpperCase()}`,
        user: name,
        event: res.event?.title || 'Unknown Event',
        category: isBooth ? 'Booth' : 'Seats',
        amount: `$${res.amount?.total ? res.amount.total.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}`,
        status: res.status === 'confirmed' ? 'completed' : res.status,
        date: res.createdAt ? new Date(res.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
        filterType: res.boothCode ? 'booth' : 'ticket',
        rawDate: res.createdAt ? new Date(res.createdAt) : new Date(0),
        paymentMethod: res.paymentMethod === 'invoice' ? 'Invoice' : 'Card'
      };
    });

    const payoutTx = (payoutRequests || []).map((p) => ({
      id: p.reference,
      user: p.promoter,
      event: "Platform Payout",
      category: "Payout",
      amount: p.amount,
      status: p.status,
      date: p.requested,
      filterType: "payout",
      rawDate: new Date(p.requested),
      paymentMethod: p.method
    }));

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
    setSelectedTx({
      id: row.id,
      resId: row.resId,
      user: row.promoter,
      event: row.event,
      category: row.category,
      amount: row.amount,
      status: row.status === 'confirmed' ? 'completed' : row.status,
      date: row.date,
      paymentMethod: row.paymentMethod
    });
    setIsTxModalOpen(true);
  };

  const handleTxRefund = async (transactionId) => {
    const matchingRes = reservations.find(res => {
      const isBooth = !!res.boothCode;
      const formattedId = isBooth ? `Booth-${res._id.toString().slice(-6).toUpperCase()}` : `Seats-${res._id.toString().slice(-6).toUpperCase()}`;
      return formattedId === transactionId;
    });

    if (!matchingRes) return;

    try {
      await reservationService.updateReservationStatus(matchingRes._id, "refunded", user.token);
      setReservations(prev =>
        prev.map(res => res._id === matchingRes._id ? { ...res, status: 'refunded' } : res)
      );
    } catch (error) {
      console.error('Error refunding reservation:', error);
      await showErrorAlert('Error', error.response?.data?.error || 'Failed to process refund on backend.');
    }
  };

  const handleAcceptReservation = async (id, promoter, amount) => {
    const confirmResult = await showApproveConfirmAlert(promoter, amount);

    if (!confirmResult.isConfirmed) {
      return;
    }

    try {
      await reservationService.updateReservationStatus(id, "confirmed", user.token);
      setReservations(prev =>
        prev.map(res => res._id === id ? { ...res, status: "confirmed" } : res)
      );
      await showSuccessAlert('Reservation Approved', 'The reservation invoice has been approved.');
    } catch (error) {
      console.error('Error approving reservation:', error);
      await showErrorAlert('Error', error.response?.data?.error || 'Failed to approve reservation.');
    }
  };

  const handleRejectReservation = async (id, promoter, amount) => {
    const confirmResult = await showRejectConfirmAlert(promoter, amount);

    if (!confirmResult.isConfirmed) {
      return;
    }

    try {
      await reservationService.updateReservationStatus(id, "rejected", user.token);
      setReservations(prev =>
        prev.map(res => res._id === id ? { ...res, status: "rejected" } : res)
      );
      await showSuccessAlert('Reservation Rejected', 'The reservation invoice has been rejected.');
    } catch (error) {
      console.error('Error rejecting reservation:', error);
      await showErrorAlert('Error', error.response?.data?.error || 'Failed to reject reservation.');
    }
  };

  const getStatusClass = (status) => {
    if (status === "paid" || status === "confirmed") return "button-label pay-status-paid";
    if (status === "pending") return "button-label pay-status-pending";
    if (status === "processing") return "button-label pay-status-processing";
    if (status === "rejected" || status === "reject" || status === "refunded") return "button-label pay-status-rejected";
    return "button-label";
  };

  const getCategoryClass = (category) => {
    if (category === "Booth") return "button-label pay-category-booth";
    if (category === "Seats") return "button-label pay-category-seats";
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
            Payout Requests
          </button>
          <button
            className={`pay-tab ${activeTab === "booth-reservations" ? "active" : ""}`}
            onClick={() => handleTabChange("booth-reservations")}
          >
            Reservations
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
                  setCurrentPage(1);
                }}
                className="small-body-text"
              />
            </div>
          </div>

          <div className="pay-toolbar-right">
            <div className="pay-filter-dropdown" ref={filterDropdownRef}>
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
                        setCurrentPage(1);
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
            data={getTransactionList()}
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
                      : "mdi:store-off"
                  }
                  style={{ fontSize: '48px', marginBottom: '16px' }}
                />
                <h4>{searchQuery ? "No results found" : `No ${activeTab === "payout-requests" ? "payout requests" : "reservations"} yet`}</h4>
                <p className="small-body-text">
                  {searchQuery
                    ? <>No matches found for "<strong>{searchQuery}</strong>".</>
                    : `There are currently no ${activeTab === "payout-requests" ? "payout requests" : "reservations"} in this category.`
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
                        <th>Booth/Seats</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Method</th>
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
                          <td data-label="Booth" className="small-body-text">  {row.booth ? (
                            <span>{row.booth}</span>
                          ) : (
                            <span style={{ opacity: 0.4 }}>—</span>
                          )}
                          </td>
                          <td data-label="Category">
                            <span className={getCategoryClass(row.category)}>{row.category}</span>
                          </td>
                          <td data-label="Amount" className="pay-amount regular-body-text">{row.amount}</td>
                          <td data-label="Method" className="small-body-text">{row.paymentMethod}</td>
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
                              {row.paymentMethod === 'Invoice' && row.status === 'pending' && (
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
                                    onClick={() => handleAcceptReservation(row.resId, row.promoter, row.amount)}
                                  >
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
                                    onClick={() => handleRejectReservation(row.resId, row.promoter, row.amount)}
                                  >
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

        {activeTab !== "transactions" && totalPages > 1 && (
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
