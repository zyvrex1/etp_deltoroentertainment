import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import "./transaction.css";
import ViewTransactionModal from "./Modal/ViewTransactionModal";
import jsPDF from "jspdf";
import { loadLogo, addReportHeader, addReportFooter, showExportToast, removeExportToast, drawTable, finalizeReport } from '../utils/pdfExport';

const TransactionMonitoring = ({ isTab = false, externalSearchQuery = "", externalFilter = "all", data = null }) => {
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [internalFilter, setInternalFilter] = useState("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const itemsPerPage = 7;

  const filterOptions = [
    { value: "all", label: "All Transactions" },
    { value: "booth", label: "Booth filter" },
    { value: "ticket", label: "Ticket filter" },
    { value: "payout", label: "Payout filter" },
  ];

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDropdownOpen]);

  const getFilterLabel = () => {
    const currentFilter = isTab ? externalFilter : internalFilter;
    const option = filterOptions.find((opt) => opt.value === currentFilter);
    return option ? option.label : "All Transactions";
  };

  const [transactions, setTransactions] = useState([
    {
      id: 1,
      user: "Emily Blunt",
      event: "TechStart Summit 2026",
      type: "Ticket Purchase",
      category: "VIP",
      amount: "$299.00",
      status: "completed",
      date: "Sep 15, 2025",
      filterType: "ticket",
    },
    {
      id: 2,
      user: "Mike Ross",
      event: "TechStart Summit 2026",
      type: "Booth Rental",
      category: "VIP Booth",
      amount: "$5,000.00",
      status: "completed",
      date: "Sep 10, 2025",
      filterType: "booth",
    },
    {
      id: 3,
      user: "Sarah Chen",
      event: "TechStart Summit 2026",
      type: "Payout",
      category: "-",
      amount: "$15,240.00",
      status: "pending",
      date: "Oct 1, 2025",
      filterType: "payout",
    },
    {
      id: 4,
      user: "James Wilson",
      event: "TechStart Summit 2026",
      type: "Booth Rental",
      category: "Corner Booth",
      amount: "$3,000.00",
      status: "completed",
      date: "Sep 16, 2025",
      filterType: "booth",
    },
    {
      id: 5,
      user: "Sophia Garcia",
      event: "AI Innovation Conference",
      type: "Ticket Purchase",
      category: "Standard",
      amount: "$150.00",
      status: "completed",
      date: "Oct 1, 2024",
      filterType: "ticket",
    },
    {
      id: 6,
      user: "Liam Anderson",
      event: "Summer Music Festival",
      type: "Ticket Purchase",
      category: "Standard",
      amount: "$120.00",
      status: "completed",
      date: "Jul 5, 2025",
      filterType: "ticket",
    },


  ]);

  const displayTransactions = data || transactions;

  const [expandedRow, setExpandedRow] = useState(null);
  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleRefund = (transactionId) => {
    setTransactions((prevTransactions) =>
      prevTransactions.map((tx) =>
        tx.id === transactionId ? { ...tx, status: "refunded" } : tx
      )
    );
  };

  const filteredTransactions = useMemo(() => {
    const activeSearchQuery = isTab ? externalSearchQuery : internalSearchQuery;
    const activeFilter = isTab ? externalFilter : internalFilter;
    const q = activeSearchQuery.toLowerCase();

    return displayTransactions.filter((tx) => {
      const matchesFilter =
        activeFilter === "all" ? true : tx.filterType === activeFilter;

      if (!matchesFilter) return false;

      if (!q) return true;

      return (
        tx.user.toLowerCase().includes(q) ||
        tx.event.toLowerCase().includes(q) ||
        tx.type.toLowerCase().includes(q)
      );
    });
  }, [transactions, internalSearchQuery, internalFilter, isTab, externalSearchQuery, externalFilter]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleFilterChange = (filter) => {
    setInternalFilter(filter);
    setCurrentPage(1);
    setIsDropdownOpen(false);
  };

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
            tx.user,
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
    if (status === "completed") return "button-label tx-status-completed";
    if (status === "pending") return "button-label tx-status-pending";
    if (status === "refunded") return "button-label tx-status-refunded";
    return "button-label tx-status";
  };

  const getCategoryClass = (category) => {
    if (category === "Booth") return "button-label tx-category-booth";
    if (category === "Seats") return "button-label tx-category-seats";
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
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            <div className="tx-toolbar-right">
              <div className="tx-filter-dropdown" ref={dropdownRef}>
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
          {isLoading ? (
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
                {[...Array(itemsPerPage)].map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton skeleton-text" style={{ width: '40px' }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '100px' }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '150px' }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '80px' }} /></td>
                    <td><div className="skeleton skeleton-badge" style={{ width: '70px', height: '24px' }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '70px' }} /></td>
                    <td><div className="skeleton skeleton-badge" style={{ width: '80px', height: '24px' }} /></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '80px' }} /></td>
                    <td><div className="skeleton skeleton-circle" style={{ width: '32px', height: '32px' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : paginatedTransactions.length === 0 ? (
            <div className="empty-state">
              <Icon icon="mdi:magnify-close" width="48" />
              <h4>No transactions found</h4>
              <p className="small-body-text">
                No transactions match "<strong>{isTab ? externalSearchQuery : internalSearchQuery}</strong>".
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
                      {tx.user}
                    </td>
                    <td className="small-body-text" data-label="Event">
                      {tx.event}
                    </td>
                    <td data-label="Category">
                      <span className={getCategoryClass(tx.category)}>
                        {tx.category}
                      </span>
                    </td>
                    <td className="regular-body-text amount" data-label="Amount">
                      {tx.amount}
                    </td>
                    <td data-label="Status">
                      <span className={getStatusClass(tx.status)}>
                        {tx.status}
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
