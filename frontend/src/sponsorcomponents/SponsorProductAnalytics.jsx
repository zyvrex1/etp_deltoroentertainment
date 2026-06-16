import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import jsPDF from "jspdf";
import { loadLogo, addReportHeader, addReportFooter, showExportToast, removeExportToast, drawTable, finalizeReport } from "../utils/pdfExport";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import merchandiseService from "../services/merchandiseService";
import orderService from "../services/orderService";
import { useAuthContext } from "../hooks/useAuthContext";
import usePagination from "../hooks/usePagination";
import PaginationBar from "../components/PaginationBar";
import "./SponsorProductAnalytics.css";

const PIE_COLORS = ['#c62828', '#ffdd66', '#0059ff'];

// Helper to format currency
const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(val);
};

const SponsorProductAnalytics = ({ eventId, boothCode }) => {
  const { user } = useAuthContext();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [analyticsStats, setAnalyticsStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    ordersToday: 0,
    revenueDelta: 0,
    ordersDelta: 0,
    avgValueDelta: 0,
    todayOrdersDelta: 0
  });
  const [chartData, setChartData] = useState([{ day: 'No Data', total: 0 }]);
  const [pieChartData, setPieChartData] = useState([]);
  const [productSales, setProductSales] = useState({});

  const formatDelta = (value) => {
    if (value === 0) return "0.0%";
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const stats = [
    { label: "Total Revenue", value: formatCurrency(analyticsStats.totalRevenue), icon: "mdi:currency-usd", color: "green", delta: formatDelta(analyticsStats.revenueDelta), isUp: analyticsStats.revenueDelta >= 0 },
    { label: "Total Orders", value: analyticsStats.totalOrders.toString(), icon: "mdi:shopping-outline", color: "blue", delta: formatDelta(analyticsStats.ordersDelta), isUp: analyticsStats.ordersDelta >= 0 },
    { label: "Average Order Value", value: formatCurrency(analyticsStats.avgOrderValue), icon: "mdi:chart-bar", color: "purple", delta: formatDelta(analyticsStats.avgValueDelta), isUp: analyticsStats.avgValueDelta >= 0 },
    { label: "Orders Today", value: analyticsStats.ordersToday.toString(), icon: "mdi:calendar-today", color: "orange", delta: formatDelta(analyticsStats.todayOrdersDelta), isUp: analyticsStats.todayOrdersDelta >= 0 }
  ];

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All Categories");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [expandedRow, setExpandedRow] = useState(null);
  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const itemsPerPage = 5;
  const {
    page, totalPages, total,
    setTotal, goTo, next, prev,
    reset: resetPage,
  } = usePagination({ limit: itemsPerPage });

  const fetchAnalyticsData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const filters = {};
      if (eventId) filters.eventId = eventId;
      if (boothCode) filters.boothCode = boothCode;
      
      const [merchData, ordersData] = await Promise.all([
        merchandiseService.getMerchandises(user.token, filters),
        orderService.getOrders(user.token, filters)
      ]);
      
      setProducts(merchData);
      setOrders(ordersData);
      processAnalytics(merchData, ordersData);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const processAnalytics = (merch, ordersData) => {
    let currentTotalRevenue = 0;
    let pastTotalRevenue = 0;
    let currentTotalOrders = ordersData.length;
    let pastTotalOrders = 0;
    
    let todayOrdersCount = 0;
    let yesterdayOrdersCount = 0;
    
    const todayStr = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    const salesMap = {};
    const categoryMap = { Drinks: 0, Food: 0, Merch: 0 };
    const dailyRevMap = {};

    ordersData.forEach(order => {
      const orderTotal = order.totalAmount || 0;
      currentTotalRevenue += orderTotal;
      
      const orderDate = new Date(order.createdAt || new Date());
      const orderDateStr = orderDate.toDateString();
      
      if (orderDateStr === todayStr) {
        todayOrdersCount++;
      } else {
        pastTotalRevenue += orderTotal;
        pastTotalOrders++;
        
        if (orderDateStr === yesterdayStr) {
          yesterdayOrdersCount++;
        }
      }
      
      const dayKey = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyRevMap[dayKey] = (dailyRevMap[dayKey] || 0) + orderTotal;

      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const qty = item.quantity || 1;
          const productId = item.productId || item.product;
          
          salesMap[productId] = (salesMap[productId] || 0) + qty;
          
          const matchedProduct = merch.find(m => m._id === productId || m.id === productId);
          if (matchedProduct) {
            const cat = matchedProduct.category;
            if (categoryMap[cat] !== undefined) {
               categoryMap[cat] += qty;
            } else {
               categoryMap[cat] = qty;
            }
          }
        });
      }
    });

    const currentAvgValue = currentTotalOrders > 0 ? currentTotalRevenue / currentTotalOrders : 0;
    const pastAvgValue = pastTotalOrders > 0 ? pastTotalRevenue / pastTotalOrders : 0;

    const calculateDelta = (current, past) => {
      if (past === 0) return current > 0 ? 100 : 0;
      return ((current - past) / past) * 100;
    };

    setAnalyticsStats({
      totalRevenue: currentTotalRevenue,
      totalOrders: currentTotalOrders,
      avgOrderValue: currentAvgValue,
      ordersToday: todayOrdersCount,
      revenueDelta: calculateDelta(currentTotalRevenue, pastTotalRevenue),
      ordersDelta: calculateDelta(currentTotalOrders, pastTotalOrders),
      avgValueDelta: calculateDelta(currentAvgValue, pastAvgValue),
      todayOrdersDelta: calculateDelta(todayOrdersCount, yesterdayOrdersCount)
    });

    setProductSales(salesMap);

    const sortedDays = Object.keys(dailyRevMap).sort((a,b) => new Date(a) - new Date(b));
    const newChartData = sortedDays.map(day => ({
       day,
       total: dailyRevMap[day]
    }));
    if (newChartData.length > 0) setChartData(newChartData);

    const newPieData = Object.entries(categoryMap)
      .filter(([_, val]) => val > 0)
      .map(([name, value]) => ({ name, value }));
    if (newPieData.length > 0) {
        setPieChartData(newPieData);
    } else {
        setPieChartData([{ name: 'No Data', value: 1 }]);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [user, eventId, boothCode]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredInventory = products.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterCategory === "All Categories" || item.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  useEffect(() => {
    setTotal({
      total: filteredInventory.length,
      totalPages: Math.ceil(filteredInventory.length / itemsPerPage) || 1,
    });
  }, [filteredInventory.length, setTotal]);

  const startIndex = (page - 1) * itemsPerPage;
  const paginatedData = filteredInventory.slice(startIndex, startIndex + itemsPerPage);

  // Replaced dynamic stats array with the user provided static stats array in the component body

// ─────────────────────────────────────────────────────────────────────────────
// DROP-IN REPLACEMENT for the exportToPDF function in SponsorProductAnalytics
// Matches the visual style used in SponsorEventHistory (Code 1)
// ─────────────────────────────────────────────────────────────────────────────

const exportToPDF = async () => {
  const loadingToast = showExportToast();
  const REPORT_TITLE = "Product Analytics Report";

  try {
    const logoData = await loadLogo();
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth  = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const MARGIN        = 15;
    const FOOTER_HEIGHT = 15;
    let y = 45;

    addReportHeader(pdf, REPORT_TITLE, logoData);

    // ── helpers ──────────────────────────────────────────────────────────────
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

    // ── pre-compute values ───────────────────────────────────────────────────
    const activeProducts    = filteredInventory.filter(i => i.stock > 0);
    const outOfStockProducts = filteredInventory.filter(i => i.stock === 0);

    const totalProductRevenue = filteredInventory.reduce((sum, item) => {
      return sum + (item.price * (productSales[item._id] || 0));
    }, 0);

    const activeRevenue    = activeProducts.reduce((s, i) => s + (i.price * (productSales[i._id] || 0)), 0);
    const outOfStockRevenue = outOfStockProducts.reduce((s, i) => s + (i.price * (productSales[i._id] || 0)), 0);
    const totalSalesUnits   = filteredInventory.reduce((s, i) => s + (productSales[i._id] || 0), 0);

    const filterLabel = filterCategory === 'All Categories' ? 'All Categories' : filterCategory;

    // ══════════════════════════════════════════════════════════════════════════
    // BANNER
    // ══════════════════════════════════════════════════════════════════════════
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
      `Product Analytics Report  •  ${filteredInventory.length} product${filteredInventory.length !== 1 ? 's' : ''}`,
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
      `$${totalProductRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      badgeX + 23, y + 16, { align: 'center' }
    );

    y += 30;

    // ══════════════════════════════════════════════════════════════════════════
    // KEY METRICS — 3-col cards
    // ══════════════════════════════════════════════════════════════════════════
    sectionHeading('Key Metrics');

    const cardW = (pdfWidth - MARGIN * 2 - 12) / 3;
    const cardH = 22;

    const metricCards = [
      {
        label: 'Total Orders',
        value: analyticsStats.totalOrders.toString(),
        sub: `$${totalProductRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} revenue`,
        color: [22, 163, 74],
        bg: [235, 255, 245],
        border: [180, 235, 210],
      },
      {
        label: 'Average Order Value',
        value: `$${analyticsStats.avgOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        sub: `across ${analyticsStats.totalOrders} order${analyticsStats.totalOrders !== 1 ? 's' : ''}`,
        color: [217, 119, 6],
        bg: [255, 251, 235],
        border: [245, 220, 160],
      },
      {
        label: 'Orders Today',
        value: analyticsStats.ordersToday.toString(),
        sub: `${analyticsStats.ordersToday !== 1 ? 'orders' : 'order'} placed today`,
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

    // ══════════════════════════════════════════════════════════════════════════
    // SALES BREAKDOWN BARS (by category)
    // ══════════════════════════════════════════════════════════════════════════
    sectionHeading('Sales Breakdown by Category');

    // Build category-level revenue from filteredInventory + productSales
    const categoryRevMap = {};
    filteredInventory.forEach(item => {
      const rev = item.price * (productSales[item._id] || 0);
      categoryRevMap[item.category] = (categoryRevMap[item.category] || 0) + rev;
    });

    const breakdownItems = Object.entries(categoryRevMap).map(([cat, rev]) => {
      const colorMap = {
        Drinks: [22, 163, 74],
        Food:   [217, 119, 6],
        Merch:  [30, 100, 200],
      };
      return {
        label: cat,
        value: rev,
        count: filteredInventory.filter(i => i.category === cat).length,
        countLabel: 'products',
        color: colorMap[cat] || [100, 100, 180],
      };
    });

    // Fallback if no category data
    if (breakdownItems.length === 0) {
      breakdownItems.push({
        label: 'No Data',
        value: 0,
        count: 0,
        countLabel: 'products',
        color: [200, 200, 200],
      });
    }

    const maxBreakdown = Math.max(...breakdownItems.map(b => b.value), 1);
    const barMaxW      = pdfWidth - MARGIN * 2 - 65;

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
        `$${item.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}  (${item.count} ${item.countLabel})`,
        MARGIN + 43 + barMaxW + 2, y + 4.5
      );

      y += 11;
    });

    // Summary strip
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
      `Total Revenue: $${totalProductRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}   |   Products: ${filteredInventory.length}   |   Filter: ${filterLabel}`,
      pdfWidth / 2, y + 6.5, { align: 'center' }
    );
    y += 16;

    // ══════════════════════════════════════════════════════════════════════════
    // PRODUCT INVENTORY TABLE
    // ══════════════════════════════════════════════════════════════════════════
    newPageIfNeeded(20);
    sectionHeading('Product Inventory');

    const headers = ['Product', 'Category', 'Stock', 'Price', 'Sales', 'Revenue', 'Status'];
    const rows = filteredInventory.map((item) => [
      item.name,
      item.category,
      item.stock.toString(),
      formatCurrency(item.price),
      (productSales[item._id] || 0).toString(),
      formatCurrency(item.price * (productSales[item._id] || 0)),
      item.stock > 0 ? 'Active' : 'Out of Stock',
    ]);

    y = drawTable(
      pdf, y, headers, rows,
      MARGIN, pdfWidth, pdfHeight, FOOTER_HEIGHT,
      12, 5, logoData, REPORT_TITLE
    );

    // ══════════════════════════════════════════════════════════════════════════
    // FOOTER STRIP
    // ══════════════════════════════════════════════════════════════════════════
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
      `Product analytics export  •  Generated by eTicketsPro`,
      pdfWidth / 2, y + 9, { align: 'center' }
    );

    finalizeReport(pdf);

    const fileName = `product_analytics_report_${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  } finally {
    removeExportToast(loadingToast);
  }
};
  return (
    <div className="spa-container">
      <div className="spa-header-section">
        <div className="spa-header-left">
          <h1>Analytics & Reports</h1>
          <p className="regular-body-text">Track your store's performance, sales, and customer engagement.</p>
        </div>
        
      </div>

      {loading ? (
        <div className="spa-stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="spa-stat-card skeleton" style={{ minHeight: '130px' }}></div>
          ))}
        </div>
      ) : (
        <div className="spa-stats-grid">
          {stats.map((stat, idx) => (
            <div key={idx} className="spa-stat-card">
              <div className="spa-stat-top">
                <span className={`spa-stat-icon ${stat.color}`}>
                  <Icon icon={stat.icon} />
                </span>
                {stat.delta && (
                  <span className={`spa-stat-delta ${stat.isUp ? 'up' : 'down'}`}>
                    <Icon icon={stat.isUp ? "mdi:trending-up" : "mdi:trending-down"} /> {stat.delta}
                  </span>
                )}
                {stat.extra && (
                  <span className="spa-stat-extra">{stat.extra}</span>
                )}
              </div>
              <div className="spa-stat-bottom">
                <p className="smaller-body-text spa-stat-label">{stat.label}</p>
                <h3>{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="spa-charts-grid">
          <div className="spa-chart-card skeleton" style={{ minHeight: '350px' }}></div>
          <div className="spa-chart-card skeleton" style={{ minHeight: '350px' }}></div>
        </div>
      ) : (
        <div className="spa-charts-grid">
          <div className="spa-chart-card">
            <h4 className="left-aligned">Sales Overview</h4>
            <div className="spa-chart-placeholder">
              <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  {!isMobile && (
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                  )}
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: isMobile ? 10 : 12, fill: 'var(--color-black-tertiary)' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: isMobile ? 10 : 12, fill: 'var(--color-black-tertiary)' }}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <RechartsTooltip formatter={(value) => `$${value}`} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="var(--color-red-primary)"
                    strokeWidth={3}
                    fillOpacity={0.1}
                    fill="var(--color-red-primary)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="spa-chart-card">
            <h4 className="left-aligned">Top Selling Products</h4>
            <div className="spa-chart-placeholder">
              <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={isMobile ? 50 : 70}
                    outerRadius={isMobile ? 70 : 100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="spa-chart-legend multi">
                <span className="spa-legend-item"><span className="dot red"></span>Drinks</span>
                <span className="spa-legend-item"><span className="dot blue"></span>Merch</span>
                <span className="spa-legend-item"><span className="dot yellow"></span>Food</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="spa-inventory-section">
        <h3 className="left-aligned spa-section-title">Products Inventory Tracking</h3>

        <div className="spa-toolbar">
          <div className="spa-toolbar-left">
            <div className="spa-search">
              <Icon icon="mdi:magnify" />
              <input
                type="text"
                placeholder="Search inventory..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  resetPage();
                }}
                className="small-body-text"
              />
            </div>
          </div>

          <div className="spa-toolbar-right">
            <div className="spa-filter-dropdown" ref={dropdownRef}>
              <button
                className="spa-filter-dropdown-btn small-body-text"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon icon="mdi:filter-variant" />
                  <span className="truncate-text">{filterCategory}</span>
                </div>
                <Icon icon="mdi:chevron-down" className={`dropdown-icon ${isDropdownOpen ? "open" : ""}`} />
              </button>
              {isDropdownOpen && (
                <div className="spa-filter-dropdown-menu">
                  {["All Categories", "Food", "Drinks", "Merch"].map((option) => (
                    <button
                      key={option}
                      className={`spa-filter-dropdown-item small-body-text ${filterCategory === option ? "active" : ""}`}
                      onClick={() => {
                        setFilterCategory(option);
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
          </div>

          <button className="primary-button spa-export-btn" onClick={exportToPDF}>
          <Icon icon="mdi:download" /> Export to PDF
        </button>
        </div>

        <div className="spa-table-wrapper-full">
          <table className="spa-full-table">
            <thead>
              <tr>
                <th className="smaller-body-text">PRODUCT</th>
                <th className="smaller-body-text">CATEGORY</th>
                <th className="smaller-body-text">AVAILABLESTOCK</th>
                <th className="smaller-body-text">PRICE</th>
                <th className="smaller-body-text">SALES</th>
                <th className="smaller-body-text">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton skeleton-text title" style={{ margin: 0, width: '80%' }}></div></td>
                    <td><div className="skeleton skeleton-text" style={{ margin: 0 }}></div></td>
                    <td><div className="skeleton skeleton-text" style={{ margin: 0, width: '40%' }}></div></td>
                    <td><div className="skeleton skeleton-text" style={{ margin: 0, width: '50%' }}></div></td>
                    <td><div className="skeleton skeleton-text" style={{ margin: 0, width: '40%' }}></div></td>
                    <td><div className="skeleton skeleton-text" style={{ margin: 0, width: '60%' }}></div></td>
                  </tr>
                ))
              ) : paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item._id} className={expandedRow === item._id ? "expanded" : ""}>
                    <td className="id-td" data-label="PRODUCT">
                      <div className="mobile-expand-icon" onClick={() => toggleRow(item._id)}>
                        <Icon icon={expandedRow === item._id ? "mdi:chevron-up" : "mdi:chevron-down"} />
                      </div>
                      <div className="spa-product-details-col regular-body-text">
                        {item.name}
                      </div>
                    </td>
                    <td data-label="CATEGORY">
                      <span className={`spa-cat-badge button-label ${item.category.toLowerCase()}`}>{item.category}</span>
                    </td>
                    <td className="small-body-text"data-label="AVAILABLESTOCK">{item.stock}</td>
                    <td className="small-body-text" data-label="PRICE">{formatCurrency(item.price)}</td>
                    <td className="small-body-text" data-label="SALES">{productSales[item._id] || 0}</td>
                    <td data-label="STATUS">
                      <span className={`spa-status-badge button-label ${item.stock > 0 ? 'active' : 'inactive'}`}>
                        {item.stock > 0 ? 'Active' : 'Out of Stock'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--color-black-tertiary)' }}>
                      <Icon icon="mdi:magnify-close" width="48" style={{ marginBottom: '16px' }} />
                      <p className="regular-body-text" style={{ marginTop: '0' }}>No products found matching your search.</p>
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
    </div>
  );
};

export default SponsorProductAnalytics;
