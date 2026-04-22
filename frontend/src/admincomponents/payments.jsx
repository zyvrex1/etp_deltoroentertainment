import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import "./payments.css";
import Swal from "sweetalert2";
import { showSuccessAlert, showErrorAlert, showApproveConfirmAlert } from "./utils/sweetAlert";
import PaymentRejectionModal from "./Modal/PaymentRejectionModal";
import axios from "axios";
import { useAuthContext } from "./hooks/useAuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

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
        const response = await axios.get(`${BACKEND_URL}/api/reservations/admin`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setReservations(response.data);
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

  const [payoutRequests, setPayoutRequests] = useState([
    { id: 1, promoter: "Sarah Chen", amount: "$15,240.00", method: "Wire Transfer", status: "pending", requested: "Oct 1, 2024" },
    { id: 2, promoter: "David Kim", amount: "$45,000.00", method: "PayPal", status: "paid", requested: "Aug 1, 2024" },
    { id: 3, promoter: "Lisa Zhang", amount: "$20,000.00", method: "Wire Transfer", status: "paid", requested: "Sep 12, 2024" },
    { id: 4, promoter: "James Wilson", amount: "$5,000.00", method: "Wire Transfer", status: "pending", requested: "Oct 20, 2024" },
    { id: 5, promoter: "Sarah Chen", amount: "$10,000.00", method: "Wire Transfer", status: "processing", requested: "Oct 22, 2024" },
    { id: 6, promoter: "Maria Santos", amount: "$8,500.00", method: "PayPal", status: "paid", requested: "Sep 5, 2024" },
    { id: 7, promoter: "Maria Santos", amount: "$8,500.00", method: "PayPal", status: "paid", requested: "Sep 5, 2024" },
    { id: 8, promoter: "Maria Santos", amount: "$8,500.00", method: "PayPal", status: "paid", requested: "Sep 5, 2024" },


  ]);

  const [selectedPayout, setSelectedPayout] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  const paymentMethods = [
    { id: 1, promoter: "Alice Brown", event: "TechStart Summit 2026", amount: "$15,240.00", method: "Wire Transfer", status: "paid", date: "Oct 1, 2024" },
    { id: 2, promoter: "Bob Wilson", event: "TechStart Summit 2026", amount: "$45,000.00", method: "PayPal", status: "paid", date: "Aug 1, 2024" },
    { id: 3, promoter: "Maria Santos", event: "Creator Economy Expo", amount: "$20,000.00", method: "Wire Transfer", status: "paid", date: "Sep 12, 2024" },
    { id: 4, promoter: "James Wilson", event: "Creator Economy Expo", amount: "$5,000.00", method: "Wire Transfer", status: "paid", date: "Oct 20, 2024" },
    { id: 5, promoter: "Sarah Chen", event: "Creator Economy Expo", amount: "$10,000.00", method: "Wire Transfer", status: "paid", date: "Oct 22, 2024" },
  ];

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
        
      return {
        id: index + 1,
        resId: res._id,
        promoter: promoterName,
        event: res.event?.title || 'Unknown Event',
        amount: `$${res.amount?.total ? res.amount.total.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}`,
        method: res.paymentMethod === 'invoice' ? 'Invoice' : 'Card',
        status: res.status,
        date: res.createdAt ? new Date(res.createdAt).toLocaleDateString() : 'N/A'
      };
    });
  };

  let filteredData = activeTab === "payout-requests" ? payoutRequests : getReservationData();

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredData = filteredData.filter(item =>
      item.promoter.toLowerCase().includes(query) ||
      (item.event && item.event.toLowerCase().includes(query)) ||
      item.amount.toLowerCase().includes(query) ||
      item.status.toLowerCase().includes(query)
    );
  }

  if (activeTab === "payout-requests" && statusFilter !== "All Status") {
    filteredData = filteredData.filter(item => item.status.toLowerCase() === statusFilter.toLowerCase());
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
    setStatusFilter("All Status");
    setExpandedRow(null);
  };

  const handleApprove = async (id, promoter, amount) => {
    const confirmResult = await showApproveConfirmAlert(promoter, amount);

    if (!confirmResult.isConfirmed) {
      return;
    }

    try {
      setPayoutRequests(prev =>
        prev.map(req => req.id === id ? { ...req, status: "paid" } : req)
      );
      await showSuccessAlert('Payment Approved', 'The payment request has been approved and marked as paid.');
    } catch (error) {
      console.error('Error approving payment:', error);
      await showErrorAlert('Error', 'Failed to approve payment request.');
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
      setPayoutRequests(prev =>
        prev.map(req => req.id === selectedPayout.id ? { ...req, status: "rejected", rejectionReason } : req)
      );
      await showSuccessAlert('Payment Rejected', `Payment request for ${selectedPayout.promoter} (${selectedPayout.amount}) has been rejected. Reason: ${rejectionReason}`);
      setShowRejectionModal(false);
      setSelectedPayout(null);
    } catch (error) {
      console.error('Error rejecting payment:', error);
      await showErrorAlert('Error', 'Failed to reject payment request.');
    }
  };

  const getStatusClass = (status) => {
    if (status === "paid") return "button-label pay-status-paid";
    if (status === "pending") return "button-label pay-status-pending";
    if (status === "processing") return "button-label pay-status-processing";
    if (status === "rejected") return "button-label pay-status-rejected";
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
          <h4 className="pay-card-amount">$15,240.00</h4>
          <span className="small-body-text pay-card-meta">
            <Icon icon="mdi:file-document-outline" />
            3 requests waiting
          </span>
        </div>
        <div className="pay-card pay-card-total">
          <p className="regular-body-text pay-card-title">Total Paid (YTD)</p>
          <h4 className="pay-card-amount">${(reservations.reduce((total, res) => total + res.amount?.total, 0) || 0).toLocaleString()}</h4>
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
            Booth Reservations
          </button>
        </div>

        <div className="pay-toolbar">
          <div className="pay-toolbar-left">
            <div className="pay-search">
              <Icon icon="mdi:magnify" />
              <input
                type="text"
                placeholder={activeTab === "payout-requests" ? "Search payouts..." : "Search payments..."}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="small-body-text"
              />
            </div>
          </div>

          {activeTab === "payout-requests" && (
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
                    {["All Status", "Pending", "Processing", "Paid", "Rejected"].map((option) => (
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
          )}
        </div>

        <div className="table-wrapper">
          {isLoading ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Promoter</th>
                  {activeTab === "booth-reservations" && <th>Event</th>}
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>{activeTab === "payout-requests" ? "Requested" : "Date"}</th>
                  {activeTab === "payout-requests" && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {[...Array(itemsPerPage)].map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton skeleton-text" style={{ width: '40px' }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '120px' }} /></td>
                    {activeTab === "booth-reservations" && <td><div className="skeleton skeleton-text" style={{ width: '150px' }} /></td>}
                    <td><div className="skeleton skeleton-text" style={{ width: '80px' }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '100px' }} /></td>
                    <td><div className="skeleton skeleton-badge" style={{ width: '70px', height: '24px' }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '80px' }} /></td>
                    {activeTab === "payout-requests" && (
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <div className="skeleton skeleton-rect" style={{ width: '60px', height: '32px' }} />
                          <div className="skeleton skeleton-rect" style={{ width: '60px', height: '32px' }} />
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : error ? (
            <div className="empty-state">
              <Icon icon="mdi:alert-circle-outline" width="48" style={{ color: 'var(--accent-red)' }} />
              <h4>Error</h4>
              <p className="small-body-text">{error}</p>
            </div>
          ) : paginatedData.length === 0 ? (
            // Empty state outside table for mobile-friendly display
            <div className="empty-state">
              <Icon icon="mdi:magnify-close" width="48" />
              <h4>No payments found</h4>
              <p className="small-body-text">
                No payments match "<strong>{searchQuery}</strong>".
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
                      <th>Requested</th>
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
                          <span>#{row.id.toString().padStart(2, "0")}</span>
                        </td>
                        <td data-label="Promoter" className="regular-body-text name-td">{row.promoter}</td>
                        <td data-label="Amount" className="regular-body-text pay-amount">{row.amount}</td>
                        <td data-label="Method" className="small-body-text">{row.method}</td>
                        <td data-label="Status">
                          <span className={getStatusClass(row.status)}>{row.status}</span>
                        </td>
                        <td data-label="Requested" className="regular-body-text">{row.requested}</td>
                        <td data-label="Actions">
                          {row.status === "pending" ? (
                            <div className="pay-actions">
                              <button
                                className="button-label pay-btn-approve"
                                onClick={() => handleApprove(row.id, row.promoter, row.amount)}
                              >
                                Approve
                              </button>
                              <button
                                className="button-label pay-btn-reject"
                                onClick={() => handleRejectClick(row)}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              ) : (
                <>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Promoter</th>
                      <th>Event</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((row) => (
                      <tr key={row.id} className={expandedRow === row.id ? "expanded" : ""}>
                        <td className="small-body-text id-td" data-label="ID">
                          <div className="mobile-expand-icon" onClick={() => toggleRow(row.id)}>
                            <Icon icon={expandedRow === row.id ? "mdi:chevron-up" : "mdi:chevron-down"} />
                          </div>
                          <span>#{row.id.toString().padStart(2, "0")}</span>
                        </td>
                        <td data-label="Promoter" className="regular-body-text name-td">{row.promoter}</td>
                        <td data-label="Event" className="small-body-text">{row.event}</td>
                        <td data-label="Amount" className="pay-amount regular-body-text">{row.amount}</td>
                        <td data-label="Method" className="small-body-text">{row.method}</td>
                        <td data-label="Status">
                          <span className={getStatusClass(row.status)}>{row.status}</span>
                        </td>
                        <td data-label="Date" className="small-body-text">{row.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
            </table>
          )}
        </div>

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
    </div>
  );
};

export default Payments;
