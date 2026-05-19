import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import jsPDF from "jspdf";
import { loadLogo, addReportHeader, addReportFooter, showExportToast, removeExportToast, drawTable, finalizeReport } from "../utils/pdfExport";
import "./SponsorManageOrder.css";
import SponsorViewOrder from "./SponsorModal/SponsorViewOrder";
import orderService from "../services/orderService";
import { useAuthContext } from "../hooks/useAuthContext";
import { showSuccessAlert, showErrorAlert } from "../utils/sweetAlert";

const SponsorManageOrder = ({ eventId, boothCode, isCompleted }) => {
  const { user } = useAuthContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrders(user?.token, { eventId, boothCode });
      
      // Transform backend data to match UI expectations
      const formattedOrders = data.map(order => ({
        id: order.orderId,
        _id: order._id,
        customer: `${order.customerId?.firstName} ${order.customerId?.lastName}`,
        time: new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        items: `${order.items.reduce((sum, item) => sum + item.quantity, 0)} items`,
        itemDesc: order.items.map(i => `${i.quantity}x ${i.name}`).join(", ").substring(0, 30) + "...",
        total: `$${order.totalAmount.toFixed(2)}`,
        payment: order.paymentStatus,
        status: order.status,
        fullItems: order.items // Keep full items for the modal
      }));
      
      setOrders(formattedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token && boothCode) {
      fetchOrders();
    }
  }, [user, boothCode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOrderChange = async (id, field, value) => {
    try {
      const orderToUpdate = orders.find(o => o.id === id);
      if (!orderToUpdate) return;

      const updateData = {};
      if (field === 'status') updateData.status = value;
      if (field === 'payment') updateData.paymentStatus = value;

      await orderService.updateOrder(orderToUpdate._id, updateData, user.token);
      
      setOrders(prev => prev.map(order => order.id === id ? { ...order, [field]: value } : order));
      
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder(prev => ({ ...prev, [field]: value }));
      }
      
      showSuccessAlert("Updated!", `Order ${field} has been updated.`);
    } catch (error) {
      showErrorAlert("Update Failed", error.message);
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

      let currentY = 50;

      currentY = drawTable(
        pdf,
        currentY,
        headers,
        pdfData,
        15,
        pdfWidth,
        pdfHeight,
        15,
        10,
        3,
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
              {loading ? (
                Array.from({ length: 7 }).map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton skeleton-text title" style={{ margin: 0, width: '80%' }}></div></td>
                    <td><div className="skeleton skeleton-text" style={{ margin: 0, width: '70%' }}></div></td>
                    <td><div className="skeleton skeleton-text title" style={{ margin: 0, width: '40%' }}></div></td>
                    <td><div className="skeleton skeleton-text" style={{ margin: 0, width: '60%' }}></div></td>
                    <td><div className="skeleton skeleton-text" style={{ margin: 0, width: '50%' }}></div></td>
                    <td><div className="skeleton skeleton-text" style={{ margin: 0, width: '40%' }}></div></td>
                  </tr>
                ))
              ) : paginatedData.length > 0 ? (
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
                          disabled={isCompleted}
                          className={`smo-select-payment button-label ${order.payment === 'Paid' ? 'paid-bg' : 'unpaid-bg'} ${isCompleted ? "disabled" : ""}`}
                        >
                          <option value="Paid">Paid</option>
                          <option value="Unpaid">Unpaid</option>
                        </select>
                      </div>
                    </td>
                    <td data-label="STATUS">
                      <div className="smo-select-wrapper inline-select">
                        <select
                          value={order.status}
                          onChange={(e) => handleOrderChange(order.id, 'status', e.target.value)}
                          disabled={isCompleted}
                          className={`smo-select-status button-label ${getStatusClass(order.status)} ${isCompleted ? "disabled" : ""}`}
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
                  <td colSpan="6" style={{ textAlign: 'center', padding: '60px 0' }}>
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
