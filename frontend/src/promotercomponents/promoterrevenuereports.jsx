import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Icon } from '@iconify/react';
import jsPDF from 'jspdf';
import { loadLogo, addReportHeader, addReportFooter, showExportToast, removeExportToast, drawTable, finalizeReport } from '../utils/pdfExport';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useAuthContext } from '../hooks/useAuthContext';
import eventsService from '../services/eventsService';
import './promoterrevenuereports.css';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const PromoterRevenueReports = () => {
    const { user } = useAuthContext();
    const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState("all");
    const [events, setEvents] = useState([]);
    const [salesData, setSalesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const eventDropdownRef = useRef(null);

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (eventDropdownRef.current && !eventDropdownRef.current.contains(event.target)) {
                setIsEventDropdownOpen(false);
            }
        };

        if (isEventDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isEventDropdownOpen]);

    // Fetch Events and Sales
    useEffect(() => {
        const fetchData = async () => {
            if (!user?.token) return;
            setLoading(true);
            setError(null);
            try {
                // 1. Fetch events
                const fetchedEvents = await eventsService.getEvents(user.token);
                
                // Filter events based on assigned and owned by the promoter
                const userId = user._id || user.id;
                const validEvents = (fetchedEvents || []).filter(e => {
                    const isOwner = e.createdBy && (e.createdBy._id === userId || e.createdBy === userId);
                    const isAssigned = e.assignedPromoters && e.assignedPromoters.some(p => p._id === userId || p === userId);
                    return isOwner || isAssigned;
                });

                setEvents(validEvents);

                // 2. Fetch sales for all events concurrently
                const salesPromises = validEvents.map(async (event) => {
                    const res = await fetch(`${BASE_URL}/api/reservations/event/${event._id}/sales`, {
                        headers: { Authorization: `Bearer ${user.token}` }
                    });
                    if (!res.ok) return []; // skip if access denied
                    const { reservations } = await res.json();
                    return (reservations || []).map(r => ({ ...r, eventId: event._id, eventTitle: event.title }));
                });

                const allSalesArrays = await Promise.all(salesPromises);
                const allSales = allSalesArrays.flat();
                setSalesData(allSales);

            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load revenue data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const eventOptions = [
        { value: "all", label: "All Events" },
        ...events.map(e => ({ value: e._id, label: e.title }))
    ];

    const getSelectedEventLabel = () => {
        const option = eventOptions.find(opt => opt.value === selectedEvent);
        return option ? option.label : "Select Event";
    };

    const handleEventChange = (val) => {
        setSelectedEvent(val);
        setIsEventDropdownOpen(false);
    };

    // Filter sales by selected event
    const filteredSales = useMemo(() => {
        if (selectedEvent === "all") return salesData;
        return salesData.filter(s => s.eventId === selectedEvent);
    }, [salesData, selectedEvent]);

    const {
        totalRevenue,
        totalFees,
        ticketRevenue,
        boothRevenue,
        sponsorRevenue,
        revenueByEvent,
        revenueTrendData,
        revenueSourcesData,
        monthlyRevenueData,
        totalTicketsSold,
        totalBoothsSold,
        trendGrowth
    } = useMemo(() => {
        let totalRev = 0;
        let ticketRev = 0;
        let boothRev = 0;
        let sponsorRev = 0;
        let ticketsSold = 0;
        let boothsSold = 0;

        const eventRevenueMap = {};
        const dailyRevenueMap = {};
        const monthlyRevenueMap = {};

        filteredSales.forEach(r => {
            // Count valid revenue (exclude refunded if preferred, but usually we count completed/confirmed and pending)
            if (r.status === 'refunded' || r.status === 'cancelled') return;
            const amount = r.amount?.total || 0;
            totalRev += amount;

            const isBooth = r.type === 'booth';

            if (isBooth) {
                boothRev += amount;
                boothsSold++;
            } else {
                ticketRev += amount;
                ticketsSold += (r.seatIds?.length || 1);
            }

            // Event mapping
            if (!eventRevenueMap[r.eventId]) {
                eventRevenueMap[r.eventId] = { name: r.eventTitle, revenue: 0 };
            }
            eventRevenueMap[r.eventId].revenue += amount;

            // Trend Mapping (Last 14 days)
            const dateStr = new Date(r.createdAt).toISOString().split('T')[0];
            if (!dailyRevenueMap[dateStr]) dailyRevenueMap[dateStr] = 0;
            dailyRevenueMap[dateStr] += amount;

            // Monthly Mapping (Last 6 months)
            const d = new Date(r.createdAt);
            const monthStr = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
            if (!monthlyRevenueMap[monthStr]) monthlyRevenueMap[monthStr] = { gross: 0, dateObj: new Date(d.getFullYear(), d.getMonth(), 1) };
            monthlyRevenueMap[monthStr].gross += amount;
        });

        // Calculate Revenue by Event
        const revByEventArray = Object.values(eventRevenueMap)
            .sort((a, b) => b.revenue - a.revenue)
            .map(item => ({
                name: item.name,
                revenue: `$${item.revenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
                percentage: totalRev > 0 ? `${Math.round((item.revenue / totalRev) * 100)}%` : "0%",
                width: totalRev > 0 ? `${Math.round((item.revenue / totalRev) * 100)}%` : "0%",
                color: "var(--color-red-primary)"
            }));

        if (selectedEvent === "all") {
            events.forEach(e => {
                if (!eventRevenueMap[e._id]) {
                    revByEventArray.push({
                        name: e.title,
                        revenue: "$0",
                        percentage: "0%",
                        width: "0%",
                        color: "transparent"
                    });
                }
            });
        }

        // Fill past 14 days for trend
        const trendData = [];
        const today = new Date();
        let recent7DaysRev = 0;
        let prev7DaysRev = 0;

        for (let i = 13; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const rev = dailyRevenueMap[dateStr] || 0;
            trendData.push({
                date: d.toLocaleString('en-US', { month: 'short', day: '2-digit' }),
                revenue: rev
            });
            if (i < 7) recent7DaysRev += rev;
            else prev7DaysRev += rev;
        }

        let growth = 0;
        if (prev7DaysRev > 0) {
            growth = ((recent7DaysRev - prev7DaysRev) / prev7DaysRev) * 100;
        } else if (recent7DaysRev > 0) {
            growth = 100;
        }

        // Fill past 6 months for monthly
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthStr = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
            const shortMonth = d.toLocaleString('en-US', { month: 'short' });
            const gross = monthlyRevenueMap[monthStr]?.gross || 0;
            const fees = gross * 0.15; // 15% fee assumption
            monthlyData.push({
                month: shortMonth,
                gross: gross,
                fees: fees
            });
        }

        const sourcesData = [
            { name: 'Tickets', value: ticketRev, color: '#0059ff', percentage: totalRev > 0 ? `${Math.round((ticketRev / totalRev) * 100)}%` : '0%' },
            { name: 'Booths', value: boothRev, color: '#e62e2d', percentage: totalRev > 0 ? `${Math.round((boothRev / totalRev) * 100)}%` : '0%' }
        ];

        return {
            totalRevenue: totalRev,
            totalFees: totalRev * 0.15,
            ticketRevenue: ticketRev,
            boothRevenue: boothRev,
            sponsorRevenue: sponsorRev,
            revenueByEvent: revByEventArray,
            revenueTrendData: trendData,
            revenueSourcesData: sourcesData.filter(s => s.value > 0 || sourcesData.length <= 2),
            monthlyRevenueData: monthlyData,
            totalTicketsSold: ticketsSold,
            totalBoothsSold: boothsSold,
            trendGrowth: growth
        };
    }, [filteredSales, events, selectedEvent]);


const exportReport = async () => {
    if (loading) return;
    const loadingToast = showExportToast();
    const REPORT_TITLE = 'Revenue Reports';

    try {
        const logoData = await loadLogo();
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
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
            pdf.text(title, margin, y);
            pdf.setDrawColor(30, 60, 114);
            pdf.setLineWidth(0.4);
            pdf.line(margin, y + 2, pdfWidth - margin, y + 2);
            y += 10;
        };

        // ══════════════════════════════════════════════════════════════════
        // EVENT / FILTER BANNER
        // ══════════════════════════════════════════════════════════════════
        const currentEventLabel = getSelectedEventLabel();

        pdf.setFillColor(235, 240, 255);
        pdf.setDrawColor(180, 200, 245);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(margin, y, pdfWidth - margin * 2, 22, 3, 3, 'FD');

        // Left — filter label
        pdf.setFontSize(11);
        pdf.setTextColor(30, 60, 114);
        pdf.setFont('helvetica', 'bold');
        pdf.text(currentEventLabel, margin + 4, y + 8);

        pdf.setFontSize(8);
        pdf.setTextColor(80, 90, 130);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Revenue Report  •  Financial Breakdown & Earnings', margin + 4, y + 15);

        // Right — gross revenue badge
        const badgeX = pdfWidth - margin - 50;
        pdf.setFillColor(30, 60, 114);
        pdf.roundedRect(badgeX, y + 4, 46, 14, 2, 2, 'F');
        pdf.setFontSize(7.5);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Gross Revenue', badgeX + 23, y + 10, { align: 'center' });
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

        const cardW = (pdfWidth - margin * 2 - 12) / 3;
        const cardH = 22;

        const metricCards = [
            {
                label: 'Ticket Sales',
                value: `$${ticketRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                sub: `${totalTicketsSold} ticket${totalTicketsSold !== 1 ? 's' : ''} sold`,
                color: [22, 163, 74],
                bg: [235, 255, 245],
                border: [180, 235, 210],
            },
            {
                label: 'Booth Sales',
                value: `$${boothRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                sub: `${totalBoothsSold} booth${totalBoothsSold !== 1 ? 's' : ''} sold`,
                color: [120, 60, 200],
                bg: [245, 235, 255],
                border: [210, 190, 245],
            },
            {
                label: 'Net Earnings',
                value: `$${(totalRevenue - totalFees).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                sub: `After ~15% platform fees`,
                color: [30, 60, 114],
                bg: [235, 240, 255],
                border: [180, 200, 245],
            },
        ];

        metricCards.forEach((m, i) => {
            const cx = margin + i * (cardW + 6);
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
        // REVENUE BREAKDOWN BARS
        // ══════════════════════════════════════════════════════════════════
        sectionHeading('Revenue Breakdown');

        const breakdownItems = [
            {
                label: 'Ticket Sales',
                value: ticketRevenue,
                count: totalTicketsSold,
                countLabel: 'tickets',
                color: [22, 163, 74],
            },
            {
                label: 'Booth Sales',
                value: boothRevenue,
                count: totalBoothsSold,
                countLabel: 'booths',
                color: [120, 60, 200],
            },
            {
                label: 'Platform Fees (Est.)',
                value: totalFees,
                count: null,
                countLabel: '~15%',
                color: [200, 200, 200],
            },
        ];

        const maxBreakdown = Math.max(...breakdownItems.map(b => b.value), 1);
        const barMaxW = pdfWidth - margin * 2 - 65;

        breakdownItems.forEach((item) => {
            newPageIfNeeded(14);
            const fillW = (item.value / maxBreakdown) * barMaxW;

            pdf.setFontSize(8.5);
            pdf.setTextColor(50, 50, 50);
            pdf.setFont('helvetica', 'normal');
            pdf.text(item.label, margin, y + 4.5);

            // Track
            pdf.setFillColor(235, 235, 235);
            pdf.roundedRect(margin + 43, y, barMaxW, 6, 1, 1, 'F');

            // Fill
            if (fillW > 0) {
                pdf.setFillColor(...item.color);
                pdf.roundedRect(margin + 43, y, fillW, 6, 1, 1, 'F');
            }

            // Right label
            const countStr = item.count !== null
                ? `$${item.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}  (${item.count} ${item.countLabel})`
                : `$${item.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}  (${item.countLabel})`;
            pdf.setFontSize(7.5);
            pdf.setTextColor(80, 80, 80);
            pdf.text(countStr, margin + 43 + barMaxW + 2, y + 4.5);

            y += 11;
        });

        // Summary strip
        y += 2;
        newPageIfNeeded(12);
        pdf.setFillColor(248, 248, 255);
        pdf.setDrawColor(210, 210, 240);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(margin, y, pdfWidth - margin * 2, 10, 2, 2, 'FD');
        pdf.setFontSize(8);
        pdf.setTextColor(60, 60, 120);
        pdf.setFont('helvetica', 'bold');
        pdf.text(
            `Gross Revenue: $${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}   |   Net Earnings: $${(totalRevenue - totalFees).toLocaleString(undefined, { minimumFractionDigits: 2 })}   |   Fees: $${totalFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            pdfWidth / 2, y + 6.5, { align: 'center' }
        );
        y += 16;

        // ══════════════════════════════════════════════════════════════════
        // REVENUE BY SOURCE TABLE
        // ══════════════════════════════════════════════════════════════════
        newPageIfNeeded(20);
        sectionHeading('Revenue by Source');

        const sourceHeaders = ['Source', 'Share of Total', 'Amount'];
        const sourceRows = revenueSourcesData.map(s => [
            s.name,
            s.percentage,
            `$${s.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        ]);
        y = drawTable(pdf, y, sourceHeaders, sourceRows, margin, pdfWidth, pdfHeight, FOOTER_HEIGHT, 10, 3, logoData, REPORT_TITLE);

        // ══════════════════════════════════════════════════════════════════
        // REVENUE BY EVENT TABLE
        // ══════════════════════════════════════════════════════════════════
        y += 10;
        newPageIfNeeded(20);
        sectionHeading('Revenue by Event');

        const eventHeaders = ['Event', 'Revenue', 'Share of Total'];
        const eventRows = revenueByEvent.map(item => [
            item.name,
            item.revenue,
            item.percentage
        ]);
        y = drawTable(pdf, y, eventHeaders, eventRows, margin, pdfWidth, pdfHeight, FOOTER_HEIGHT, 10, 3, logoData, REPORT_TITLE);

        // ══════════════════════════════════════════════════════════════════
        // FOOTER STRIP
        // ══════════════════════════════════════════════════════════════════
        y += 8;
        newPageIfNeeded(16);
        pdf.setFillColor(245, 247, 255);
        pdf.setDrawColor(210, 218, 245);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(margin, y, pdfWidth - margin * 2, 14, 2, 2, 'FD');
        pdf.setFontSize(8);
        pdf.setTextColor(80, 90, 130);
        pdf.setFont('helvetica', 'italic');
        pdf.text(
            `Revenue report for "${currentEventLabel}"  •  Generated by eTicketsPro`,
            pdfWidth / 2, y + 9, { align: 'center' }
        );

        finalizeReport(pdf);
        pdf.save(`Revenue_Report_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Failed to generate PDF. Please try again.');
    } finally {
        removeExportToast(loadingToast);
    }
};
    return (
        <div className="rep-container">
            <div className="rep-header">
                <div className="rep-header-left">
                    <h1 className="rep-title">Revenue Reports</h1>
                    <p className="small-body-text rep-header-subtitle">Financial breakdown and earnings</p>
                </div>
                <div className="rep-header-controls">
                    <div className="rep-filter-dropdown" ref={eventDropdownRef}>
                        <button
                            className="rep-filter-dropdown-btn"
                            onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
                            disabled={loading}
                        >
                            <span className="truncate-text">{loading ? "Loading..." : getSelectedEventLabel()}</span>
                            <Icon
                                icon="mdi:chevron-down"
                                className={`dropdown-icon ${isEventDropdownOpen ? "open" : ""}`}
                            />
                        </button>
                        {isEventDropdownOpen && !loading && (
                            <div className="rep-filter-dropdown-menu">
                                {eventOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        className={`rep-filter-dropdown-item ${selectedEvent === option.value ? "active" : ""}`}
                                        onClick={() => handleEventChange(option.value)}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button className="outlined-button rep-export-btn" onClick={exportReport} disabled={loading}>
                        <Icon icon="mdi:tray-arrow-down" />
                        Export Report
                    </button>
                </div>
            </div>

            <div className="rep-main-content">
                {loading ? (
                    <>
                        <div className="rep-analytics-overview bottom-stats-row">
                            {[...Array(2)].map((_, i) => (
                                <div key={i} className="rep-analytics-card skeleton-card">
                                    <div className="skeleton-circle skeleton-shimmer" style={{ width: '48px', height: '48px', minWidth: '48px' }} />
                                    <div className="rep-analytics-info" style={{ width: '100%' }}>
                                        <div className="skeleton-text title skeleton-shimmer" style={{ width: '100px' }} />
                                        <div className="skeleton-text short skeleton-shimmer" style={{ width: '60px' }} />
                                    </div>
                                    <div className="skeleton-text title skeleton-shimmer" style={{ width: '80px', margin: 0 }} />
                                </div>
                            ))}
                        </div>

                        <div className="rep-content-columns">
                            <div className="rep-left-col">
                                {[...Array(2)].map((_, i) => (
                                    <div key={i} className="rep-card skeleton-card">
                                        <div className="rep-card-header">
                                            <div className="header-text" style={{ width: '60%' }}>
                                                <div className="skeleton-text title skeleton-shimmer" />
                                                <div className="skeleton-text short skeleton-shimmer" />
                                            </div>
                                            <div className="header-value" style={{ width: '30%' }}>
                                                <div className="skeleton-text title skeleton-shimmer" />
                                                <div className="skeleton-text short skeleton-shimmer" />
                                            </div>
                                        </div>
                                        <div className="skeleton-rect skeleton-shimmer" style={{ height: '220px' }} />
                                    </div>
                                ))}
                            </div>
                            <div className="rep-right-col">
                                <div className="rep-card skeleton-card">
                                    <div className="rep-card-header">
                                        <div className="header-text" style={{ width: '100%' }}>
                                            <div className="skeleton-text title skeleton-shimmer" />
                                            <div className="skeleton-text short skeleton-shimmer" />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0', position: 'relative' }}>
                                        <div className="skeleton-circle skeleton-shimmer" style={{ width: '180px', height: '180px' }} />
                                        <div className="donut-center-text">
                                            <div className="skeleton-text short skeleton-shimmer" style={{ width: '40px', margin: '0 auto 4px' }} />
                                            <div className="skeleton-text title skeleton-shimmer" style={{ width: '60px', margin: '0 auto' }} />
                                        </div>
                                    </div>
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="legend-row" style={{ marginBottom: '12px', width: '100%' }}>
                                            <div className="skeleton-text skeleton-shimmer" style={{ width: '100%' }} />
                                        </div>
                                    ))}
                                </div>
                                <div className="rep-card skeleton-card">
                                    <div className="skeleton-text title skeleton-shimmer" style={{ marginBottom: '24px' }} />
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} style={{ marginBottom: '20px' }}>
                                            <div className="rep-event-header" style={{ marginBottom: '8px' }}>
                                                <div className="skeleton-text skeleton-shimmer" style={{ width: '120px', margin: 0 }} />
                                                <div className="skeleton-text skeleton-shimmer" style={{ width: '60px', margin: 0 }} />
                                            </div>
                                            <div className="skeleton-rect skeleton-shimmer" style={{ height: '8px' }} />
                                            <div className="skeleton-text short skeleton-shimmer" style={{ width: '100px', marginTop: '8px', marginBottom: 0 }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="rep-analytics-overview bottom-stats-row">
                            <div className="rep-analytics-card ticket-card">
                                <div className="rep-analytics-icon-box blue">
                                    <Icon icon="mdi:ticket-confirmation-outline" />
                                </div>
                                <div className="rep-analytics-info">
                                    <h6 className="rep-card-label">Ticket Sales</h6>
                                    <p className="smaller-body-text">{totalRevenue > 0 ? Math.round((ticketRevenue / totalRevenue) * 100) : 0}% of total</p>
                                </div>
                                <h4 className="rep-card-value">${ticketRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</h4>
                            </div>
                            <div className="rep-analytics-card booth-card">
                                <div className="rep-analytics-icon-box red">
                                    <Icon icon="mdi:storefront-outline" />
                                </div>
                                <div className="rep-analytics-info">
                                    <h6 className="rep-card-label">Booth Sales</h6>
                                    <p className="smaller-body-text">{totalRevenue > 0 ? Math.round((boothRevenue / totalRevenue) * 100) : 0}% of total</p>
                                </div>
                                <h4 className="rep-card-value">${boothRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</h4>
                            </div>
                            {/* <div className="rep-analytics-card sponsor-card">
                                <div className="rep-analytics-icon-box green">
                                    <Icon icon="mdi:briefcase-outline" />
                                </div>
                                <div className="rep-analytics-info">
                                    <h6 className="rep-card-label">Sponsorships</h6>
                                    <p className="smaller-body-text">{totalRevenue > 0 ? Math.round((sponsorRevenue / totalRevenue) * 100) : 0}% of total</p>
                                </div>
                                <h4 className="rep-card-value">${sponsorRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</h4>
                            </div> */}
                        </div>

                        <div className="rep-content-columns">
                            <div className="rep-left-col">
                                <div className="rep-card">
                                    <div className="rep-card-header">
                                        <div className="header-text">
                                            <h4 className="left-aligned">Revenue Trend</h4>
                                            <p className="small-body-text left-aligned">Last 14 days</p>
                                        </div>
                                        <div className="header-value">
                                            <h3 className="left-aligned">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</h3>
                                            <span className={trendGrowth >= 0 ? "green-text left-aligned" : "red-text left-aligned"}>
                                                {trendGrowth >= 0 ? '+' : ''}{trendGrowth.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="chart-placeholder area-placeholder">
                                        <ResponsiveContainer width="100%" height={isMobile ? 180 : 250}>
                                            <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                {!isMobile && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />}
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: isMobile ? 10 : 12 }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: isMobile ? 10 : 12 }} tickFormatter={(val) => `$${val >= 1000 ? val / 1000 + 'k' : val}`} />
                                                <RechartsTooltip formatter={(value) => `$${value}`} />
                                                <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} fillOpacity={0.1} fill="#16a34a" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="rep-card">
                                    <div className="rep-card-header">
                                        <div className="header-text">
                                            <h4 className="left-aligned">Monthly Revenue</h4>
                                            <p className="small-body-text left-aligned">Gross revenue vs fees (last 6 months)</p>
                                        </div>
                                    </div>
                                    <div className="chart-placeholder bar-placeholder">
                                        <ResponsiveContainer width="100%" height={isMobile ? 180 : 250}>
                                            <BarChart data={monthlyRevenueData} maxBarSize={30} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                {!isMobile && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />}
                                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: isMobile ? 10 : 12 }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: isMobile ? 10 : 12 }} tickFormatter={(val) => `$${val >= 1000 ? val / 1000 + 'k' : val}`} />
                                                <RechartsTooltip formatter={(value) => `$${value}`} />
                                                <Bar dataKey="gross" fill="#0059ff" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="fees" fill="#e6e6e6" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            <div className="rep-right-col">
                                <div className="rep-card rep-donut-card">
                                    <div className="rep-card-header">
                                        <div className="header-text">
                                            <h4 className="left-aligned">Revenue Sources</h4>
                                            <p className="small-body-text left-aligned">By transaction type</p>
                                        </div>
                                    </div>
                                    <div className="chart-placeholder donut-placeholder">
                                        <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
                                            <PieChart>
                                                <Pie data={revenueSourcesData} innerRadius={isMobile ? 60 : 70} outerRadius={isMobile ? 80 : 90} paddingAngle={2} dataKey="value" stroke="none">
                                                    {revenueSourcesData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip formatter={(value) => `$${value}`} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="donut-center-text">
                                            <p className="smaller-body-text">TOTAL</p>
                                            <h3>${totalRevenue >= 1000 ? (totalRevenue / 1000).toFixed(1) + 'k' : totalRevenue}</h3>
                                        </div>
                                    </div>
                                    <div className="rep-donut-legend">
                                        {revenueSourcesData.map((s, i) => (
                                            <div className="legend-row" key={i}>
                                                <div className="legend-label">
                                                    <span className="dot" style={{ backgroundColor: s.color }}></span>
                                                    <span>{s.name}</span>
                                                </div>
                                                <div className="legend-values">
                                                    <span className="bold-val">${s.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                                    <span className="small-pct">{s.percentage}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="rep-card rep-event-box">
                                    <h4 className="left-aligned">Revenue by Event</h4>
                                    <div className="rep-event-list">
                                        {revenueByEvent.length > 0 ? revenueByEvent.map((item, index) => (
                                            <div className="rep-event-item" key={index}>
                                                <div className="rep-event-header">
                                                    <h6 className="rep-event-name left-aligned">{item.name}</h6>
                                                    <h6 className="rep-event-val left-aligned">{item.revenue}</h6>
                                                </div>
                                                <div className="rep-event-progress-bar">
                                                    <div className="rep-event-fill" style={{ width: item.width, backgroundColor: item.color }}></div>
                                                </div>
                                                <span className="smaller-body-text rep-event-pct">{item.percentage} of total revenue</span>
                                            </div>
                                        )) : (
                                            <p className="small-body-text" style={{ textAlign: "center", marginTop: "20px" }}>No events found.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PromoterRevenueReports;
