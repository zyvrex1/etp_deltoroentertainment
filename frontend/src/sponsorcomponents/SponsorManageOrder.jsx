import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import jsPDF from "jspdf";
import { loadLogo, addReportHeader, addReportFooter, showExportToast, removeExportToast, drawTable, finalizeReport } from "../utils/pdfExport";
import usePagination from "../hooks/usePagination";
import PaginationBar from "../components/PaginationBar";
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
  const dropdownRef = useRef(null);

  const [expandedRow, setExpandedRow] = useState(null);
  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const itemsPerPage = 7;
  const {
    page, totalPages, total,
    setTotal, goTo, next, prev,
    reset: resetPage,
  } = usePagination({ limit: itemsPerPage });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrders(user?.token, { eventId, boothCode });
      console.log("Order sample:", data[0]);
      
      const formattedOrders = data.map(order => ({
        id: order.orderId,
        _id: order._id,
        customer: `${order.customerId?.firstName} ${order.customerId?.lastName}`,
        time: new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        items: `${order.items.reduce((sum, item) => sum + item.quantity, 0)} items`,
        itemDesc: order.items.map(i => `${i.quantity}x ${i.name}`).join(", ").substring(0, 30) + "...",
        total: `$${order.totalAmount.toFixed(2)}`,
        totalAmount: order.totalAmount,
        payment: order.paymentStatus === 'Pending' ? 'Unpaid' : order.paymentStatus,
        status: order.status,
        fullItems: order.items
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

  useEffect(() => {
    setTotal({
      total: filteredOrders.length,
      totalPages: Math.ceil(filteredOrders.length / itemsPerPage) || 1,
    });
  }, [filteredOrders.length, setTotal]);

  const startIndex = (page - 1) * itemsPerPage;
  const paginatedData = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

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
      const MARGIN = 15;
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
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, MARGIN, y);
        pdf.setDrawColor(30, 60, 114);
        pdf.setLineWidth(0.4);
        pdf.line(MARGIN, y + 2, pdfWidth - MARGIN, y + 2);
        y += 10;
      };

      // ── pre-compute values ─────────────────────────────────────────────
      const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      const paidOrders    = filteredOrders.filter(o => o.payment === 'Paid');
      const unpaidOrders  = filteredOrders.filter(o => o.payment === 'Unpaid');
      const pendingOrders = filteredOrders.filter(o => o.status === 'Pending');
      const completedOrders = filteredOrders.filter(o => o.status === 'Completed');
      const preparingOrders = filteredOrders.filter(o => o.status === 'Preparing');
      const readyOrders   = filteredOrders.filter(o => o.status === 'Ready for Pickup');

      const paidRevenue   = paidOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
      const unpaidRevenue = unpaidOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);

      const filterLabel = filterStatus === 'All' ? 'All Statuses' : filterStatus;

      // ══════════════════════════════════════════════════════════════════
      // BANNER
      // ══════════════════════════════════════════════════════════════════
      pdf.setFillColor(235, 240, 255);
      pdf.setDrawColor(180, 200, 245);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(MARGIN, y, pdfWidth - MARGIN * 2, 22, 3, 3, 'FD');

      // Left — filter label
      pdf.setFontSize(11);
      pdf.setTextColor(30, 60, 114);
      pdf.setFont('helvetica', 'bold');
      pdf.text(filterLabel, MARGIN + 4, y + 8);

      pdf.setFontSize(8);
      pdf.setTextColor(80, 90, 130);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        `Orders Report  •  ${filteredOrders.length} order${filteredOrders.length !== 1 ? 's' : ''}`,
        MARGIN + 4, y + 15
      );

      // Right — total revenue badge
      const badgeX = pdfWidth - MARGIN - 50;
      pdf.setFillColor(30, 60, 114);
      pdf.roundedRect(badgeX, y + 4, 46, 14, 2, 2, 'F');
      pdf.setFontSize(7.5);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Total Revenue', badgeX + 23, y + 10, { align: 'center' });
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(
        `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        badgeX + 23, y + 16, { align: 'center' }
      );

      y += 30;

      // ══════════════════════════════════════════════════════════════════
      // KEY METRICS — 3-col cards
      // ══════════════════════════════════════════════════════════════════
      sectionHeading('Key Metrics');

      const cardW = (pdfWidth - MARGIN * 2 - 12) / 3;
      const cardH = 22;

      const metricCards = [
        {
          label: 'Paid Orders',
          value: `$${paidRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          sub: `${paidOrders.length} order${paidOrders.length !== 1 ? 's' : ''}`,
          color: [22, 163, 74],
          bg: [235, 255, 245],
          border: [180, 235, 210],
        },
        {
          label: 'Unpaid Orders',
          value: `$${unpaidRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          sub: `${unpaidOrders.length} order${unpaidOrders.length !== 1 ? 's' : ''}`,
          color: [217, 119, 6],
          bg: [255, 251, 235],
          border: [245, 220, 160],
        },
        {
          label: 'Completed Orders',
          value: `${completedOrders.length}`,
          sub: `${pendingOrders.length} still pending`,
          color: [30, 60, 114],
          bg: [235, 240, 255],
          border: [180, 200, 245],
        },
      ];

      metricCards.forEach((m, i) => {
        const cx = MARGIN + i * (cardW + 6);
        const cy = y;

        pdf.setFillColor(...m.bg);
        pdf.setDrawColor(...m.border);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(cx, cy, cardW, cardH, 3, 3, 'FD');

        // Dot
        pdf.setFillColor(...m.color);
        pdf.circle(cx + 5, cy + 6, 2, 'F');

        // Label
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.setFont('helvetica', 'normal');
        pdf.text(m.label, cx + 10, cy + 7);

        // Value
        pdf.setFontSize(11);
        pdf.setTextColor(...m.color);
        pdf.setFont('helvetica', 'bold');
        pdf.text(m.value, cx + 5, cy + 16);

        // Sub
        pdf.setFontSize(7);
        pdf.setTextColor(130, 130, 130);
        pdf.setFont('helvetica', 'normal');
        pdf.text(m.sub, cx + cardW - 4, cy + 16, { align: 'right' });
      });

      y += cardH + 10;

      // ══════════════════════════════════════════════════════════════════
      // ORDER STATUS BREAKDOWN BARS
      // ══════════════════════════════════════════════════════════════════
      sectionHeading('Order Status Breakdown');

      const breakdownItems = [
        { label: 'Completed', value: completedOrders.length, color: [22, 163, 74] },
        { label: 'Ready for Pickup', value: readyOrders.length, color: [30, 60, 114] },
        { label: 'Preparing', value: preparingOrders.length, color: [217, 119, 6] },
        { label: 'Pending', value: pendingOrders.length, color: [200, 200, 200] },
      ];

      const maxBreakdown = Math.max(...breakdownItems.map(b => b.value), 1);
      const barMaxW = pdfWidth - MARGIN * 2 - 65;

      breakdownItems.forEach((item) => {
        newPageIfNeeded(14);
        const fillW = (item.value / maxBreakdown) * barMaxW;

        pdf.setFontSize(8.5);
        pdf.setTextColor(50, 50, 50);
        pdf.setFont('helvetica', 'normal');
        pdf.text(item.label, MARGIN, y + 4.5);

        // Track
        pdf.setFillColor(235, 235, 235);
        pdf.roundedRect(MARGIN + 43, y, barMaxW, 6, 1, 1, 'F');

        // Fill
        if (fillW > 0) {
          pdf.setFillColor(...item.color);
          pdf.roundedRect(MARGIN + 43, y, fillW, 6, 1, 1, 'F');
        }

        // Right label
        pdf.setFontSize(7.5);
        pdf.setTextColor(80, 80, 80);
        pdf.text(
          `${item.value} order${item.value !== 1 ? 's' : ''}`,
          MARGIN + 43 + barMaxW + 2, y + 4.5
        );

        y += 11;
      });

      // Payment summary strip
      y += 2;
      newPageIfNeeded(12);
      pdf.setFillColor(248, 248, 255);
      pdf.setDrawColor(210, 210, 240);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(MARGIN, y, pdfWidth - MARGIN * 2, 10, 2, 2, 'FD');
      pdf.setFontSize(8);
      pdf.setTextColor(60, 60, 120);
      pdf.setFont('helvetica', 'bold');
      pdf.text(
        `Total Revenue: $${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}   |   Orders: ${filteredOrders.length}   |   Filter: ${filterLabel}`,
        pdfWidth / 2, y + 6.5, { align: 'center' }
      );
      y += 16;

      // ══════════════════════════════════════════════════════════════════
      // ORDERS TABLE
      // ══════════════════════════════════════════════════════════════════
      newPageIfNeeded(20);
      sectionHeading('Order Details');

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

      y = drawTable(
        pdf,
        y,
        headers,
        pdfData,
        MARGIN,
        pdfWidth,
        pdfHeight,
        FOOTER_HEIGHT,
        12,
        5,
        logoData,
        REPORT_TITLE
      );

      // ══════════════════════════════════════════════════════════════════
      // FOOTER STRIP
      // ══════════════════════════════════════════════════════════════════
      y += 8;
      newPageIfNeeded(16);
      pdf.setFillColor(245, 247, 255);
      pdf.setDrawColor(210, 218, 245);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(MARGIN, y, pdfWidth - MARGIN * 2, 14, 2, 2, 'FD');
      pdf.setFontSize(8);
      pdf.setTextColor(80, 90, 130);
      pdf.setFont('helvetica', 'italic');
      pdf.text(
        `Orders report export  •  Generated by eTicketsPro`,
        pdfWidth / 2, y + 9, { align: 'center' }
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

  const paidOrdersList = orders.filter(o => o.payment === 'Paid');
  const unpaidOrdersList = orders.filter(o => o.payment === 'Unpaid');
  const pendingOrdersList = orders.filter(o => o.status === 'Pending');
  const completedOrdersList = orders.filter(o => o.status === 'Completed');

  const paidRevenue = paidOrdersList.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const unpaidRevenue = unpaidOrdersList.reduce((s, o) => s + (o.totalAmount || 0), 0);

  return (
    <div className="smo-container">
      <div className="smo-header-section">
        <h1>Orders Management</h1>
        <p className="regular-body-text">Track and fulfill customer orders from your booth.</p>
      </div>

      <div className="smo-content-card">
        <div className="smo-metrics-section">
          <div className="smo-metrics-grid">
            <div className="smo-metric-card metric-paid">
              <div className="smo-metric-header">
                <span className="metric-dot dot-paid"></span>
                <span className="metric-label small-body-text">Paid Orders</span>
              </div>
              <div className="smo-metric-footer">
                <span className="metric-value text-paid">${paidRevenue.toFixed(2)}</span>
                <span className="metric-sub smaller-body-text">{paidOrdersList.length} order{paidOrdersList.length !== 1 ? 's' : ''}</span>
              </div>
            </div>

            <div className="smo-metric-card metric-unpaid">
              <div className="smo-metric-header">
                <span className="metric-dot dot-unpaid"></span>
                <span className="metric-label small-body-text">Unpaid Orders</span>
              </div>
              <div className="smo-metric-footer">
                <span className="metric-value text-unpaid">${unpaidRevenue.toFixed(2)}</span>
                <span className="metric-sub smaller-body-text">{unpaidOrdersList.length} order{unpaidOrdersList.length !== 1 ? 's' : ''}</span>
              </div>
            </div>

            <div className="smo-metric-card metric-completed">
              <div className="smo-metric-header">
                <span className="metric-dot dot-completed"></span>
                <span className="metric-label small-body-text">Completed Orders</span>
              </div>
              <div className="smo-metric-footer">
                <span className="metric-value text-completed">{completedOrdersList.length}</span>
                <span className="metric-sub smaller-body-text">{pendingOrdersList.length} still pending</span>
              </div>
            </div>
          </div>
        </div>

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
                  resetPage();
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
                        resetPage();
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

        <PaginationBar
          page={page}
          totalPages={totalPages}
          total={total}
          onPrev={prev}
          onNext={next}
          onGoTo={goTo}
        />
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