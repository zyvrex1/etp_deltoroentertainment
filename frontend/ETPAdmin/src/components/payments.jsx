import { useState } from "react";
import { Icon } from "@iconify/react";
import "./payments.css";

const Payments = () => {
  const [activeTab, setActiveTab] = useState("payout-requests");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const payoutRequests = [
    { id: 1, promoter: "Sarah Chen", amount: "$15,240.00", method: "Wire Transfer", status: "pending", requested: "Oct 1, 2024" },
    { id: 2, promoter: "David Kim", amount: "$45,000.00", method: "PayPal", status: "paid", requested: "Aug 1, 2024" },
    { id: 3, promoter: "Lisa Zhang", amount: "$20,000.00", method: "Wire Transfer", status: "paid", requested: "Sep 12, 2024" },
    { id: 4, promoter: "James Wilson", amount: "$5,000.00", method: "Wire Transfer", status: "pending", requested: "Oct 20, 2024" },
    { id: 5, promoter: "Sarah Chen", amount: "$10,000.00", method: "Wire Transfer", status: "processing", requested: "Oct 22, 2024" },
    { id: 6, promoter: "Maria Santos", amount: "$8,500.00", method: "PayPal", status: "paid", requested: "Sep 5, 2024" },
  ];

  const paymentMethods = [
    { id: 1, promoter: "Alice Brown", event: "TechStart Summit 2026", amount: "$15,240.00", method: "Wire Transfer", status: "paid", date: "Oct 1, 2024" },
    { id: 2, promoter: "Bob Wilson", event: "TechStart Summit 2026", amount: "$45,000.00", method: "PayPal", status: "paid", date: "Aug 1, 2024" },
    { id: 3, promoter: "Maria Santos", event: "Creator Economy Expo", amount: "$20,000.00", method: "Wire Transfer", status: "paid", date: "Sep 12, 2024" },
    { id: 4, promoter: "James Wilson", event: "Creator Economy Expo", amount: "$5,000.00", method: "Wire Transfer", status: "paid", date: "Oct 20, 2024" },
    { id: 5, promoter: "Sarah Chen", event: "Creator Economy Expo", amount: "$10,000.00", method: "Wire Transfer", status: "paid", date: "Oct 22, 2024" },
  ];

  const tableData = activeTab === "payout-requests" ? payoutRequests : paymentMethods;
  const totalPages = Math.ceil(tableData.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = tableData.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const getStatusClass = (status) => {
    if (status === "paid") return "button-label pay-status-paid";
    if (status === "pending") return "button-label pay-status-pending";
    if (status === "processing") return "button-label pay-status-processing";
    return "button-label";
  };

  return (
    <div className="payments-page">
      <div className="payments-header">
        <div>
          <h1>Payments & Payouts</h1>
          <p>Manage promoter payouts and platform payment settings.</p>
        </div>
      </div>

      <div className="payments-cards">
        <div className="pay-card pay-card-pending">
          <p className="regular-body-text pay-card-title">Pending Payouts</p>
          <h3 className="pay-card-amount">$15,240.00</h3>
          <span className="small-body-text pay-card-meta">
            <Icon icon="mdi:file-document-outline" />
            3 requests waiting
          </span>
        </div>
        <div className="pay-card pay-card-total">
          <p className="regular-body-text pay-card-title">Total Paid (YTD)</p>
          <h3 className="pay-card-amount">$450,000.00</h3>
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
            className={`pay-tab ${activeTab === "payment-methods" ? "active" : ""}`}
            onClick={() => handleTabChange("payment-methods")}
          >
            Payment Methods
          </button>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            {activeTab === "payout-requests" ? (
              <>
                <thead>
                  <tr>
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
                    <tr key={row.id}>
                      <td data-label="Promoter" className="regular-body-text">{row.promoter}</td>
                      <td data-label="Amount" className="regular-body-text pay-amount">{row.amount}</td>
                      <td data-label="Method" className="small-body-text">{row.method}</td>
                      <td data-label="Status">
                        <span className={getStatusClass(row.status)}>{row.status}</span>
                      </td>
                      <td data-label="Requested" className="regular-body-text">{row.requested}</td>
                      <td data-label="Actions">
                        {row.status === "pending" ? (
                          <div className="pay-actions">
                            <button className="button-label pay-btn-approve">Approve</button>
                            <button className="button-label pay-btn-reject">Reject</button>
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
                    <tr key={row.id}>
                      <td data-label="Promoter">{row.promoter}</td>
                      <td data-label="Event">{row.event}</td>
                      <td data-label="Amount" className="pay-amount">{row.amount}</td>
                      <td data-label="Method">{row.method}</td>
                      <td data-label="Status">
                        <span className={getStatusClass(row.status)}>{row.status}</span>
                      </td>
                      <td data-label="Date">{row.date}</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
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

export default Payments;
