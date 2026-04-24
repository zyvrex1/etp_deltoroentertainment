import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import jsPDF from "jspdf";
import { loadLogo, addReportHeader, addReportFooter, showExportToast, removeExportToast, drawTable, finalizeReport } from "../utils/pdfExport";
import "./SponsorManageOrder.css";
import SponsorViewOrder from "./SponsorModal/SponsorViewOrder";

const initialOrders = [
  { id: "ORD-8902", customer: "Sarah Jenkins", time: "10:45 AM", items: "3 items", itemDesc: "2x Gourmet Burger, 1x Truffle Fri...", total: "$45.95", payment: "Paid", status: "Pending" },
  { id: "ORD-8901", customer: "Michael Chen", time: "10:30 AM", items: "2 items", itemDesc: "1x Event T-Shirt, 3x Tech Sticker...", total: "$39.96", payment: "Paid", status: "Preparing" },
  { id: "ORD-8900", customer: "Emma Watson", time: "10:15 AM", items: "2 items", itemDesc: "1x Cold Brew Coffee, 1x Caesar...", total: "$14.98", payment: "Paid", status: "Ready for Pickup" },
  { id: "ORD-8899", customer: "David Rodriguez", time: "09:50 AM", items: "2 items", itemDesc: "2x Loaded Nachos, 2x Sparkling...", total: "$27.96", payment: "Paid", status: "Completed" },
  { id: "ORD-8898", customer: "Jessica Lee", time: "09:30 AM", items: "1 item", itemDesc: "1x Branded Tote Bag", total: "$14.99", payment: "Unpaid", status: "Pending" },
  { id: "ORD-8897", customer: "Chris Evans", time: "09:15 AM", items: "1 item", itemDesc: "1x Craft Lemonade", total: "$4.99", payment: "Paid", status: "Completed" },
  { id: "ORD-8896", customer: "Natalie Portman", time: "09:00 AM", items: "2 items", itemDesc: "2x Cold Brew Coffee", total: "$11.98", payment: "Paid", status: "Ready for Pickup" },
  { id: "ORD-8895", customer: "Tom Hanks", time: "08:45 AM", items: "1 item", itemDesc: "1x Ceramic Mug", total: "$14.99", payment: "Unpaid", status: "Pending" }
];

const SponsorManageOrder = () => {
  const [orders, setOrders] = useState(initialOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const dropdownRef = useRef(null);

  const [expandedRow, setExpandedRow] = useState(null);
  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const itemsPerPage = 7;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOrderChange = (id, field, value) => {
    setOrders(prev => prev.map(order => order.id === id ? { ...order, [field]: value } : order));
    // Also update selected order in modal if it's currently open
    if (selectedOrder && selectedOrder.id === id) {
      setSelectedOrder(prev => ({ ...prev, [field]: value }));
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "All" || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Pending": return "status-pending";
      case "Preparing": return "status-preparing";
      case "Ready for Pickup": return "status-ready";
      case "Completed": return "status-completed";
      default: return "";
    }
  };

  const openViewModal = (order) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  const exportToPDF = async () => {
    const loadingToast = showExportToast();
    const REPORT_TITLE = "Orders Report";
    try {
      const logoData = await loadLogo();
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      addReportHeader(pdf, REPORT_TITLE, logoData);

      const headers = ["Order ID", "Customer", "Time", "Items", "Total", "Payment", "Status"];
      const pdfData = filteredOrders.map((order) => [
        order.id,
        order.customer,
        order.time,
        order.items,
        order.total,
        order.payment,
        order.status,
      ]);

      let currentY = 50; // below header

      currentY = drawTable(
        pdf,
        currentY,
        headers,
        pdfData,
        15, // margin
        pdfWidth,
        pdfHeight,
        15, // footer height
        10, // row height
        3,  // padding Y
        logoData,
        REPORT_TITLE
      );

      finalizeReport(pdf);

      const fileName = `orders_report_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      removeExportToast(loadingToast);
    }
  };

  return (
    <div className="smo-container">
      <div className="smo-header-section">
        <h1>Orders Management</h1>
        <p className="regular-body-text">Track and fulfill customer orders from your booth.</p>
      </div>

      <div className="smo-content-card">
        <div className="smo-toolbar">
          <div className="smo-toolbar-left">
            <div className="smo-search">
              <Icon icon="mdi:magnify" />
              <input
                type="text"
                placeholder="Search by Order ID or Customer..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="small-body-text"
              />
            </div>
          </div>

          <div className="smo-toolbar-right" style={{ display: 'flex', gap: '12px' }}>
            <div className="smo-filter-dropdown" ref={dropdownRef}>
              <button
                className="smo-filter-dropdown-btn small-body-text"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon icon="mdi:filter-variant" />
                  <span className="truncate-text">{filterStatus}</span>
                </div>
                <Icon icon="mdi:chevron-down" className={`dropdown-icon ${isDropdownOpen ? "open" : ""}`} />
              </button>
              {isDropdownOpen && (
                <div className="smo-filter-dropdown-menu">
                  {["All", "Pending", "Preparing", "Ready for Pickup", "Completed"].map((option) => (
                    <button
                      key={option}
                      className={`smo-filter-dropdown-item small-body-text ${filterStatus === option ? "active" : ""}`}
                      onClick={() => {
                        setFilterStatus(option);
                        setIsDropdownOpen(false);
                        setCurrentPage(1);
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              className="primary-button export-btn"
              style={{ padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', height: '100%' }}
              onClick={exportToPDF}
            >
              <Icon icon="mdi:download" /> Export Report
            </button>
          </div>
        </div>

        <div className="smo-table-wrapper">
          <table className="smo-table">
            <thead>
              <tr>
                <th className="smaller-body-text">ORDER DETAILS</th>
                <th className="smaller-body-text">ITEMS</th>
                <th className="smaller-body-text">TOTAL</th>
                <th className="smaller-body-text">PAYMENT</th>
                <th className="smaller-body-text">STATUS</th>
                <th className="smaller-body-text">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((order) => (
                  <tr key={order.id} className={expandedRow === order.id ? "expanded" : ""}>
                    <td className="small-body-text id-td" data-label="ID">
                      <div className="mobile-expand-icon" onClick={() => toggleRow(order.id)}>
                        <Icon icon={expandedRow === order.id ? "mdi:chevron-up" : "mdi:chevron-down"} />
                      </div>
                      <div className="smo-order-details-col">
                        <strong className="smo-order-id">{order.id}</strong>
                        <span className="smo-customer desktop-only">{order.customer}</span>
                        <span className="smo-time smaller-body-text desktop-only"><Icon icon="mdi:clock-outline" /> {order.time}</span>
                      </div>
                    </td>
                    <td data-label="CUSTOMER" className="regular-body-text name-td mobile-only-td">
                      {order.customer}
                    </td>
                    <td data-label="TIME" className="small-body-text mobile-only-td">
                      {order.time}
                    </td>
                    <td data-label="ITEMS" className="items-td">
                      <div className="smo-items-col">
                        <span className="smo-item-count">{order.items}</span>
                        <span className="smaller-body-text smo-item-desc">{order.itemDesc}</span>
                      </div>
                    </td>
                    <td data-label="TOTAL" className="total-td">
                      <span className="smo-total-count large-body-text">{order.total}</span>
                    </td>
                    <td data-label="PAYMENT">
                      <div className="smo-select-wrapper inline-select">
                        <select
                          value={order.payment}
                          onChange={(e) => handleOrderChange(order.id, 'payment', e.target.value)}
                          className={`smo-select-payment button-label ${order.payment === 'Paid' ? 'paid-bg' : 'unpaid-bg'}`}
                        >
                          <option value="Paid">Paid</option>
                          <option value="Unpaid">Unpaid</option>

                        </select>
                        <span class="arrow">⌄</span>
                      </div>
                    </td>
                    <td data-label="STATUS">
                      <div className="smo-select-wrapper inline-select">
                        <select
                          value={order.status}
                          onChange={(e) => handleOrderChange(order.id, 'status', e.target.value)}
                          className={`smo-select-status button-label ${getStatusClass(order.status)}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Preparing">Preparing</option>
                          <option value="Ready for Pickup">Ready for Pickup</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </td>
                    <td data-label="ACTIONS">
                      <div className="smo-actions-col">
                        <button className="smo-view-btn regular-body-text" onClick={() => openViewModal(order)}>
                          <Icon icon="mdi:eye-outline" /> View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={{ textAlign: 'center', }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--color-black-tertiary)' }}>
                      <Icon icon="mdi:shopping-search" width="48" style={{ marginBottom: '16px' }} />
                      <p className="regular-body-text" style={{ marginTop: '0' }}>No orders found matching your search.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="smo-pagination">
            <button
              className="smo-pagination-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="smo-pagination-info small-body-text">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="smo-pagination-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      <SponsorViewOrder
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        order={selectedOrder}
        onStatusChange={(id, newStatus) => handleOrderChange(id, 'status', newStatus)}
        onPaymentChange={(id, newPayment) => handleOrderChange(id, 'payment', newPayment)}
      />
    </div>
  );
};

export default SponsorManageOrder;
