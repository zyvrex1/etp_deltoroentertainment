import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import "./transaction.css";

const TransactionMonitoring = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const itemsPerPage = 5;

  const filterOptions = [
    { value: "all", label: "All Transactions" },
    { value: "booth", label: "Booth filter" },
    { value: "ticket", label: "Ticket filter" },
    { value: "payout", label: "Payout filter" },
  ];

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
    };
  }, [isDropdownOpen]);

  const getFilterLabel = () => {
    const option = filterOptions.find((opt) => opt.value === activeFilter);
    return option ? option.label : "All Transactions";
  };

  const transactions = [
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
  ];

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.toLowerCase();

    return transactions.filter((tx) => {
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
  }, [transactions, searchQuery, activeFilter]);

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
    setActiveFilter(filter);
    setCurrentPage(1);
    setIsDropdownOpen(false);
  };

  const getStatusClass = (status) => {
    if (status === "completed") return "button-label tx-status-completed";
    if (status === "pending") return "button-label tx-status-pending";
    return "button-label tx-status";
  };

  const getCategoryClass = (category) => {
    if (category === "VIP" || category === "VIP Booth")
      return "button-label tx-category-vip";
    if (category === "Corner Booth")
      return "button-label tx-category-booth";
    if (category === "Standard")
      return "button-label tx-category-standard";
    return "tx-category";
  };

  return (
    <div className="transaction-page">
      <div className="transaction-header">
        <div>
          <h1>Transaction Monitoring</h1>
          <p>Real-time view of all financial activities.</p>
        </div>
        <div className="tx-header-actions">
          <button className="outlined-button export-btn">
            <Icon icon="mdi:tray-arrow-down" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="tx-content">
        <div className="tx-toolbar">
          <div className="tx-toolbar-left">
            <div className="tx-search">
              <Icon icon="mdi:magnify" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
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
                      className={`tx-filter-dropdown-item ${
                        activeFilter === option.value ? "active" : ""
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

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Event</th>
                <th>Type</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="small-body-text" data-label="ID">#{tx.id.toString().padStart(2, "0")}</td>
                  <td   className="regular-body-text"data-label="User">{tx.user}</td>
                  <td  className="small-body-text" data-label="Event">{tx.event}</td>
                  <td   className="small-body-text" data-label="Type">{tx.type}</td>
                  <td  data-label="Category">
                    <span className={getCategoryClass(tx.category)}>
                      {tx.category}
                    </span>
                  </td>
                  <td className="regular-body-text amount" data-label="Amount">{tx.amount}</td>
                  <td data-label="Status">
                    <span className={getStatusClass(tx.status)}>
                      {tx.status}
                    </span>
                  </td>
                  <td  className="small-body-text"data-label="Date">{tx.date}</td>
                  <td data-label="Actions">
                    <button className="tx-view-btn" aria-label="View details">
                      <Icon icon="mdi:eye" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    </div>
  );
};

export default TransactionMonitoring;
