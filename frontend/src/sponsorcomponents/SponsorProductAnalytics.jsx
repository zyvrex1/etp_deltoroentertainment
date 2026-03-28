import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import jsPDF from "jspdf";
import { loadLogo, addReportHeader, addReportFooter, showExportToast, removeExportToast, drawTable, finalizeReport } from "../admincomponents/utils/pdfExport";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import "./SponsorProductAnalytics.css";

const revenueData = [
  { day: 'Day 1', total: 400 },
  { day: 'Day 2', total: 600 },
  { day: 'Day 3', total: 750 },
  { day: 'Day 4', total: 500 },
  { day: 'Day 5', total: 900 },
  { day: 'Day 6', total: 1100 },
  { day: 'Day 7', total: 850 },
];

const pieData = [
  { name: 'Drinks', value: 84 },
  { name: 'Food', value: 145 },
  { name: 'Merch', value: 62 },
];
const PIE_COLORS = ['#c62828', '#ffdd66', '#0059ff'];

const initialInventoryData = [
  { id: 1, name: "Gourmet Burger", category: "Food", sales: 84, stock: 40, revenue: "$1091.16", status: "Active" },
  { id: 2, name: "Event T-Shirt", category: "Merch", sales: 62, stock: 150, revenue: "$1549.38", status: "Active" },
  { id: 3, name: "Craft Lemonade", category: "Drinks", sales: 145, stock: 100, revenue: "$868.55", status: "Active" },
  { id: 4, name: "Loaded Nachos", category: "Food", sales: 56, stock: 25, revenue: "$559.44", status: "Active" },
  { id: 5, name: "Ceramic Mug", category: "Merch", sales: 14, stock: 0, revenue: "$209.86", status: "Inactive" },
  { id: 6, name: "Cold Brew Coffee", category: "Drinks", sales: 30, stock: 15, revenue: "$179.70", status: "Active" },
  { id: 7, name: "Bottled Water", category: "Drinks", sales: 120, stock: 125, revenue: "$358.80", status: "Active" },
];

const SponsorProductAnalytics = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All Categories");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const dropdownRef = useRef(null);

  const [expandedRow, setExpandedRow] = useState(null);
  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const itemsPerPage = 5;

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

  const filteredInventory = initialInventoryData.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterCategory === "All Categories" || item.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredInventory.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const stats = [
    { label: "Total Revenue", value: "$4,250.00", icon: "mdi:currency-usd", color: "green", delta: "+12.5%", isUp: true },
    { label: "Total Orders", value: "156", icon: "mdi:shopping-outline", color: "blue", delta: "+8.2%", isUp: true },
    { label: "Average Order Value", value: "$27.24", icon: "mdi:chart-bar", color: "purple", delta: "-2.4%", isUp: false },
    { label: "Orders Today", value: "24", icon: "mdi:calendar-today", color: "orange", extra: "Today" }
  ];

  const exportToPDF = async () => {
    const loadingToast = showExportToast();
    const REPORT_TITLE = "Product Analytics Report";
    try {
      const logoData = await loadLogo();
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      addReportHeader(pdf, REPORT_TITLE, logoData);

      const headers = ["Product", "Category", "Stock", "Sales", "Revenue", "Status"];
      const pdfData = filteredInventory.map((item) => [
        item.name,
        item.category,
        item.stock.toString(),
        item.sales.toString(),
        item.revenue,
        item.status,
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

      <div className="spa-charts-grid">
        <div className="spa-chart-card">
          <h4 className="left-aligned">Sales Overview</h4>
          <div className="spa-chart-placeholder">
            <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={isMobile ? 50 : 70}
                  outerRadius={isMobile ? 70 : 100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
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

        {/* Removed small inventory tracking table layout here. Expanded at bottom */}
      </div>

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
                  setCurrentPage(1);
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
                        setCurrentPage(1);
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
                <th className="smaller-body-text">STOCK</th>
                <th className="smaller-body-text">SALES</th>
                <th className="smaller-body-text">REVENUE</th>
                <th className="smaller-body-text">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className={expandedRow === item.id ? "expanded" : ""}>
                    <td className="id-td" data-label="PRODUCT">
                      <div className="mobile-expand-icon" onClick={() => toggleRow(item.id)}>
                        <Icon icon={expandedRow === item.id ? "mdi:chevron-up" : "mdi:chevron-down"} />
                      </div>
                      <div className="spa-product-details-col regular-body-text">
                      {item.name}
                      </div>
                    </td>
                    <td data-label="CATEGORY">
                      <span className={`spa-cat-badge button-label ${item.category.toLowerCase()}`}>{item.category}</span>
                    </td>
                    <td className="small-body-text"data-label="STOCK">{item.stock}</td>
                    <td className="small-body-text" data-label="SALES">{item.sales}</td>
                    <td className="revenue-td large-body-text" data-label="REVENUE">{item.revenue}</td>
                    <td data-label="STATUS">
                      <span className={`spa-status-badge button-label ${item.status === 'Active' ? 'active' : 'inactive'}`}>
                        {item.status}
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

        {totalPages > 1 && (
          <div className="spa-pagination">
            <button
              className="spa-pagination-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="spa-pagination-info small-body-text">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="spa-pagination-btn"
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

export default SponsorProductAnalytics;
