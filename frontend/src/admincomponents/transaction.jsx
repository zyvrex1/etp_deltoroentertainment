import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import "./transaction.css";
import ViewTransactionModal from "./Modal/ViewTransactionModal";
import jsPDF from "jspdf";
import { loadLogo, addReportHeader, addReportFooter, showExportToast, removeExportToast, drawTable, finalizeReport } from '../utils/pdfExport';
import usePagination from "../hooks/usePagination";
import PaginationBar from "../components/PaginationBar";

const TransactionMonitoring = ({ isTab = false, externalSearchQuery = "", externalFilter = "all", externalEventFilter = "All Events", data = null, onRefund = null }) => {
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const itemsPerPage = 7;
  const {
    page, totalPages, total,
    setTotal, goTo, next, prev,
    reset: resetPage,
  } = usePagination({ limit: itemsPerPage });
  const [internalFilter, setInternalFilter] = useState("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Event filter (standalone mode only)
  const [eventFilter, setEventFilter] = useState("All Events");
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
  const eventDropdownRef = useRef(null);

  const dropdownRef = useRef(null);

  const filterOptions = [
    { value: "all", label: "All Transactions" },
    { value: "payout", label: "Payout" },
    { value: "ticket", label: "Ticket" },
    { value: "booth", label: "Booth" },
    { value: "seated-ticket", label: "Seated Ticket" },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (eventDropdownRef.current && !eventDropdownRef.current.contains(event.target)) {
        setIsEventDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    }
  }, []);

  const getFilterLabel = () => {
    const currentFilter = isTab ? externalFilter : internalFilter;
    const option = filterOptions.find((opt) => opt.value === currentFilter);
    return option ? option.label : "All Transactions";
  };

  const [transactions, setTransactions] = useState([]);

  const displayTransactions = data || transactions;

  const [expandedRow, setExpandedRow] = useState(null);
  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleRefund = async (transactionId, transaction = null) => {
    const tx = transaction || selectedTransaction || displayTransactions.find((t) => t.id === transactionId);
    if (onRefund) {
      await onRefund(transactionId, tx);
      return;
    }
    setTransactions((prevTransactions) =>
      prevTransactions.map((item) =>
        item.id === transactionId ? { ...item, status: "refunded" } : item
      )
    );
  };

  const filteredTransactions = useMemo(() => {
    const activeSearchQuery = isTab ? externalSearchQuery : internalSearchQuery;
    const activeFilter = isTab ? externalFilter : internalFilter;
    const activeEventFilter = isTab ? externalEventFilter : eventFilter;
    const q = activeSearchQuery.toLowerCase();

    return displayTransactions.filter((tx) => {
      const matchesFilter =
        activeFilter === "all" ? true : tx.filterType === activeFilter;

      if (!matchesFilter) return false;

      // Event filter — applied in both tab and standalone modes
      if (activeEventFilter !== "All Events" && tx.event !== activeEventFilter) return false;

      if (!q) return true;

      return (
        (tx.promoter?.toLowerCase().includes(q) || false) ||
        (tx.user?.toLowerCase().includes(q) || false) ||
        (tx.event?.toLowerCase().includes(q) || false) ||
        (tx.type?.toLowerCase().includes(q) || false)
      );
    });
  }, [transactions, internalSearchQuery, internalFilter, isTab, externalSearchQuery, externalFilter, externalEventFilter, eventFilter]);

  useEffect(() => {
    setTotal({
      total: filteredTransactions.length,
      totalPages: Math.ceil(filteredTransactions.length / itemsPerPage) || 1
    });
  }, [filteredTransactions.length, setTotal]);

  useEffect(() => {
    resetPage();
  }, [internalSearchQuery, internalFilter, externalSearchQuery, externalFilter, externalEventFilter, eventFilter, resetPage]);

  const startIndex = (page - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleFilterChange = (filter) => {
    setInternalFilter(filter);
    resetPage();
    setIsDropdownOpen(false);
  };

  // Derive unique event names for the event filter dropdown
  const eventOptions = useMemo(() => {
    const names = new Set();
    displayTransactions.forEach(tx => {
      if (tx.event) names.add(tx.event);
    });
    return ["All Events", ...Array.from(names).sort()];
  }, [displayTransactions]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleExportReport = async () => {
    const loadingToast = showExportToast();
    const REPORT_TITLE = 'Transactions Report';
    try {
      const logoData = await loadLogo();
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const FOOTER_HEIGHT = 15;
      let y = 45;

      addReportHeader(pdf, REPORT_TITLE, logoData);

      pdf.setFontSize(12);
      pdf.setTextColor(30, 60, 114);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Real-time view of all financial activities.', margin, y);
      y += 8;

      const tableColumn = ["ID", "User", "Event", "Category", "Amount", "Status", "Date"];
      const tableRows = displayTransactions.map((tx) => [
        tx.id,
        tx.promoter || tx.user,
        tx.event,
        tx.category,
        tx.amount,
        tx.status,
        tx.date,
      ]);

      y = drawTable(pdf, y, tableColumn, tableRows, margin, pdfWidth, pdfHeight, FOOTER_HEIGHT, 10, 3, logoData, REPORT_TITLE);

      y += 10;
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Report generated from Transaction Monitoring. ${displayTransactions.length} entries.`, margin, y, { maxWidth: pdfWidth - 2 * margin });

      finalizeReport(pdf);
      pdf.save(`Transaction_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      removeExportToast(loadingToast);
    }
  };

  const getStatusClass = (status) => {
    if (status === "confirmed" || status === "paid") return "button-label tx-status-completed";
    if (status === "pending") return "button-label tx-status-pending";
    if (status === "refunded" || status === "rejected" || status === "reject") return "button-label tx-status-refunded";

    // Separate line for expired
    if (status === "expired") return "button-label tx-status-expired";

    return "button-label tx-status";
  };

  const getCategoryClass = (category) => {
    if (category === "Booth") return "button-label tx-category-booth";
    if (category === "Seats" || category === "Seated Ticket" || category === "Ticket") return "button-label tx-category-seats";
    if (category === "Payout" || category === "-") return "button-label tx-category-payout";
    return "button-label";
  };

  return (
    <div className={`transaction-page ${isTab ? 'is-tab' : ''}`}>
      {!isTab && (
        <div className="transaction-header">
          <div>
            <h1>Transaction Monitoring</h1>
            <p className="large-body-text">Real-time view of all financial activities.</p>
          </div>
          <div className="tx-header-actions">
            <button className="outlined-button export-btn" onClick={handleExportReport}>
              <Icon icon="mdi:tray-arrow-down" />
              Export Report
            </button>
          </div>
        </div>
      )}

      {!isTab && (
        <div className="tx-content">
          <div className="tx-toolbar">
            <div className="tx-toolbar-left">
              <div className="tx-search">
                <Icon icon="mdi:magnify" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={internalSearchQuery}
                  onChange={(e) => {
                    setInternalSearchQuery(e.target.value);
                    resetPage();
                  }}
                />
              </div>
            </div>

            {/* Event Filter */}
            <div className="tx-toolbar-right" ref={eventDropdownRef}>
              <div className="tx-filter-dropdown">
                <button
                  className="tx-filter-dropdown-btn"
                  onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
                >
                  <span className="truncate-text">{eventFilter}</span>
                  <Icon
                    icon="mdi:chevron-down"
                    className={`dropdown-icon ${isEventDropdownOpen ? "open" : ""}`}
                  />
                </button>
                {isEventDropdownOpen && (
                  <div className="tx-filter-dropdown-menu">
                    {eventOptions.map((option) => (
                      <button
                        key={option}
                        className={`tx-filter-dropdown-item ${eventFilter === option ? "active" : ""}`}
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

            {/* Type Filter */}
            <div className="tx-toolbar-right" ref={dropdownRef}>
              <div className="tx-filter-dropdown">
                <button
                  className="tx-filter-dropdown-btn"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span>{getFilterLabel()}</span>
                  <Icon
                    icon="mdi:chevron-down"
                    className={`dropdown-icon ${isDropdownOpen ? "open" : ""}`}
                  />
                </button>
                {isDropdownOpen && (
                  <div className="tx-filter-dropdown-menu">
                    {filterOptions.map((option) => (
                      <button
                        key={option.value}
                        className={`tx-filter-dropdown-item ${internalFilter === option.value ? "active" : ""
                          }`}
                        onClick={() => handleFilterChange(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="tx-content" style={isTab ? { padding: 0 } : {}}>
        <div className="table-wrapper">
          {paginatedTransactions.length === 0 ? (
            <div className="empty-state">
              <Icon
                icon={
                  (isTab ? externalFilter : internalFilter) === "booth"
                    ? "mdi:store-off"
                    : (isTab ? externalFilter : internalFilter) === "ticket"
                      ? "mdi:ticket-off"
                      : (isTab ? externalFilter : internalFilter) === "payout"
                        ? "mdi:bank-off"
                        : "mdi:cash-off"
                }
                style={{ fontSize: '48px', marginBottom: '16px' }}
              />
              <h4>{(isTab ? externalSearchQuery : internalSearchQuery) ? "No transactions found" : `No ${isTab ? externalFilter : internalFilter} transactions yet`}</h4>
              <p className="small-body-text">
                {(isTab ? externalSearchQuery : internalSearchQuery)
                  ? <>No transactions match "<strong>{isTab ? externalSearchQuery : internalSearchQuery}</strong>".</>
                  : `There are currently no transactions recorded in this category.`
                }
              </p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Event</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((tx) => (
                  <tr key={tx.id} className={expandedRow === tx.id ? "expanded" : ""}>
                    <td className="small-body-text id-td" data-label="ID">
                      <div className="mobile-expand-icon" onClick={() => toggleRow(tx.id)}>
                        <Icon icon={expandedRow === tx.id ? "mdi:chevron-up" : "mdi:chevron-down"} />
                      </div>
                      <span>{tx.id}</span>
                    </td>
                    <td className="regular-body-text name-td" data-label="User">
                      {tx.promoter || tx.user}
                    </td>
                    <td className="small-body-text" data-label="Event">
                      {tx.event}
                    </td>
                    <td data-label="Category">
                      <span className={getCategoryClass(tx.category)}>
                        {tx.category === 'Seats' ? 'Seated Ticket' : tx.category}
                      </span>
                    </td>
                    <td className="regular-body-text amount" data-label="Amount">
                      {tx.amount}
                    </td>
                    <td data-label="Status">
                      <span className={getStatusClass(tx.status)}>
                        {tx.status === 'reject' ? 'rejected' : tx.status}
                      </span>
                    </td>
                    <td className="small-body-text" data-label="Date">
                      {tx.date}
                    </td>
                    <td data-label="Actions">
                      <button
                        className="tx-view-btn"
                        aria-label="View details"
                        onClick={() => handleViewTransaction(tx)}
                      >
                        <Icon icon="mdi:eye" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <PaginationBar
          page={page}
          totalPages={totalPages}
          total={total}
          onPrev={prev}
          onNext={next}
          onGoTo={goTo}
        />
      </div>
      <ViewTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        transaction={selectedTransaction}
        onRefund={handleRefund}
      />
    </div>
  );
};

export default TransactionMonitoring;
