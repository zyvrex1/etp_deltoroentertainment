import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import { useAuthContext } from '../hooks/useAuthContext';
import SponsorViewFullHistory from './SponsorModal/SponsorViewFullHistory';
import DateRangePicker from '../utils/DateRangePicker';
import jsPDF from 'jspdf';
import { loadLogo, addReportHeader, addReportFooter, showExportToast, removeExportToast, drawTable, finalizeReport } from '../utils/pdfExport';
import './SponsorEventHistory.css';

export default function SponsorEventHistory() {

    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState("All Events");
    const statusDropdownRef = useRef(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

    const exportHistoryToPDF = async () => {
        const loadingToast = showExportToast();
        const REPORT_TITLE = 'Sponsorship History';

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
            const totalAmount = filteredHistory.reduce((s, item) => {
                return s + (item.fullReservation?.amount?.total || 0);
            }, 0);

            const paidItems = filteredHistory.filter(i => i.paymentStatus === 'Paid');
            const pendingItems = filteredHistory.filter(i => i.paymentStatus === 'Pending');
            const cancelledItems = filteredHistory.filter(i =>
                i.paymentStatus === 'Cancelled' || i.paymentStatus === 'Refunded'
            );

            const paidAmount = paidItems.reduce((s, i) => s + (i.fullReservation?.amount?.total || 0), 0);
            const pendingAmount = pendingItems.reduce((s, i) => s + (i.fullReservation?.amount?.total || 0), 0);
            const cancelledAmount = cancelledItems.reduce((s, i) => s + (i.fullReservation?.amount?.total || 0), 0);

            const filterLabel = selectedStatus === 'All Events' ? 'All Events' : selectedStatus;

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
                `Sponsorship History  •  ${filteredHistory.length} record${filteredHistory.length !== 1 ? 's' : ''}`,
                MARGIN + 4, y + 15
            );

            // Right — total badge
            const badgeX = pdfWidth - MARGIN - 50;
            pdf.setFillColor(30, 60, 114);
            pdf.roundedRect(badgeX, y + 4, 46, 14, 2, 2, 'F');
            pdf.setFontSize(7.5);
            pdf.setTextColor(255, 255, 255);
            pdf.setFont('helvetica', 'normal');
            pdf.text('Total Spent', badgeX + 23, y + 10, { align: 'center' });
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.text(
                `$${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
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
                    label: 'Paid',
                    value: `$${paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                    sub: `${paidItems.length} sponsorship${paidItems.length !== 1 ? 's' : ''}`,
                    color: [22, 163, 74],
                    bg: [235, 255, 245],
                    border: [180, 235, 210],
                },
                {
                    label: 'Pending',
                    value: `$${pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                    sub: `${pendingItems.length} sponsorship${pendingItems.length !== 1 ? 's' : ''}`,
                    color: [217, 119, 6],
                    bg: [255, 251, 235],
                    border: [245, 220, 160],
                },
                {
                    label: 'Cancelled / Refunded',
                    value: `$${cancelledAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                    sub: `${cancelledItems.length} record${cancelledItems.length !== 1 ? 's' : ''}`,
                    color: [180, 50, 50],
                    bg: [255, 240, 240],
                    border: [245, 190, 190],
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
            // SPENDING BREAKDOWN BARS
            // ══════════════════════════════════════════════════════════════════
            sectionHeading('Spending Breakdown');

            const breakdownItems = [
                { label: 'Paid', value: paidAmount, count: paidItems.length, countLabel: 'sponsorships', color: [22, 163, 74] },
                { label: 'Pending', value: pendingAmount, count: pendingItems.length, countLabel: 'sponsorships', color: [217, 119, 6] },
                { label: 'Cancelled / Refunded', value: cancelledAmount, count: cancelledItems.length, countLabel: 'records', color: [200, 200, 200] },
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
                `Total Spent: $${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}   |   Records: ${filteredHistory.length}   |   Filter: ${filterLabel}`,
                pdfWidth / 2, y + 6.5, { align: 'center' }
            );
            y += 16;

            // ══════════════════════════════════════════════════════════════════
            // HISTORY TABLE
            // ══════════════════════════════════════════════════════════════════
            newPageIfNeeded(20);
            sectionHeading('Event History');

            const headers = ['ID', 'Event', 'Booth', 'Date', 'Invoice', 'Amount', 'Event Status', 'Payment Status'];
            const rows = filteredHistory.map(item => [
                item.displayId,
                item.title,
                item.booth,
                item.date,
                item.invoiceRef,
                item.amount,
                item.eventStatus,
                item.paymentStatus
            ]);

            y = drawTable(pdf, y, headers, rows, MARGIN, pdfWidth, pdfHeight, FOOTER_HEIGHT, 12, 5, logoData, REPORT_TITLE);

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
                `Sponsorship history export  •  Generated by eTicketsPro`,
                pdfWidth / 2, y + 9, { align: 'center' }
            );

            finalizeReport(pdf);
            pdf.save(`Sponsorship_History_${new Date().toISOString().split('T')[0]}.pdf`);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            removeExportToast(loadingToast);
        }
    };

    const downloadHistoryItemPDF = async (item) => {
        const loadingToast = showExportToast();
        const INVOICE_TITLE = 'Invoice Receipt';
        const res = item.fullReservation;
        const isSeat = res?.type === 'seat';

        try {
            const logoData = await loadLogo();
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const MARGIN = 15;
            const FOOTER_HEIGHT = 15;
            let y = 45;

            addReportHeader(pdf, INVOICE_TITLE, logoData);

            // ── helpers ────────────────────────────────────────────────────────
            const newPageIfNeeded = (needed) => {
                if (y + needed > pdfHeight - FOOTER_HEIGHT - 5) {
                    addReportFooter(pdf);
                    pdf.addPage();
                    addReportHeader(pdf, INVOICE_TITLE, logoData);
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

            const priceLevel = res?.event?.priceLevels?.find(
                pl => pl._id === res?.event?.booths?.find(b => b.code === res?.boothCode)?.priceLevelId
            );
            const paymentStatusColor =
                item.paymentStatus === 'Paid' ? [22, 163, 74] :
                    item.paymentStatus === 'Pending' ? [217, 119, 6] :
                        [180, 50, 50];

            // ══════════════════════════════════════════════════════════════════
            // INVOICE BANNER
            // ══════════════════════════════════════════════════════════════════
            pdf.setFillColor(235, 240, 255);
            pdf.setDrawColor(180, 200, 245);
            pdf.setLineWidth(0.3);
            pdf.roundedRect(MARGIN, y, pdfWidth - MARGIN * 2, 22, 3, 3, 'FD');

            pdf.setFontSize(11);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont('helvetica', 'bold');
            const titleMaxW = pdfWidth - MARGIN * 2 - 55;
            const wrappedTitle = pdf.splitTextToSize(item.title, titleMaxW);
            pdf.text(wrappedTitle[0], MARGIN + 4, y + 8);

            pdf.setFontSize(8);
            pdf.setTextColor(80, 90, 130);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`${item.booth}  •  ${item.date}`, MARGIN + 4, y + 15);

            // Right — total badge
            const badgeX = pdfWidth - MARGIN - 50;
            pdf.setFillColor(30, 60, 114);
            pdf.roundedRect(badgeX, y + 4, 46, 14, 2, 2, 'F');
            pdf.setFontSize(7.5);
            pdf.setTextColor(255, 255, 255);
            pdf.setFont('helvetica', 'normal');
            pdf.text('Total Paid', badgeX + 23, y + 10, { align: 'center' });
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.text(item.amount, badgeX + 23, y + 16, { align: 'center' });

            y += 30;

            // ══════════════════════════════════════════════════════════════════
            // INVOICE DETAILS — 2-col info cards
            // ══════════════════════════════════════════════════════════════════
            sectionHeading('Invoice Details');

            const cardW = (pdfWidth - MARGIN * 2 - 6) / 2;
            const cardH = 30;

            const detailCards = [
                {
                    title: 'Booking Information',
                    lines: [
                        { label: 'Invoice Ref', value: item.invoiceRef },
                        { label: 'Booking Date', value: item.paymentDate },
                        { label: isSeat ? 'Ticket / Seat' : 'Booth Type', value: isSeat ? (res.seatLabels?.join(', ') || `${res.seatIds?.length || 0} Tickets`) : `${priceLevel?.priceName || 'Standard'} • ${priceLevel?.boothSize || '10x10'}` },
                    ],
                    color: [30, 60, 114],
                    bg: [235, 240, 255],
                    border: [180, 200, 245],
                },
                {
                    title: 'Payment Information',
                    lines: [
                        { label: 'Method', value: res?.paymentMethod === 'card' ? 'Credit Card' : 'Invoice / Bank Transfer' },
                        { label: 'Status', value: item.paymentStatus },
                        { label: 'Amount', value: item.amount },
                    ],
                    color: paymentStatusColor,
                    bg: item.paymentStatus === 'Paid' ? [235, 255, 245] : item.paymentStatus === 'Pending' ? [255, 251, 235] : [255, 240, 240],
                    border: item.paymentStatus === 'Paid' ? [180, 235, 210] : item.paymentStatus === 'Pending' ? [245, 220, 160] : [245, 190, 190],
                },
            ];

            detailCards.forEach((card, i) => {
                const cx = MARGIN + i * (cardW + 6);
                const cy = y;

                pdf.setFillColor(...card.bg);
                pdf.setDrawColor(...card.border);
                pdf.setLineWidth(0.3);
                pdf.roundedRect(cx, cy, cardW, cardH, 3, 3, 'FD');

                // Card title
                pdf.setFillColor(...card.color);
                pdf.circle(cx + 5, cy + 6, 2, 'F');
                pdf.setFontSize(8.5);
                pdf.setTextColor(...card.color);
                pdf.setFont('helvetica', 'bold');
                pdf.text(card.title, cx + 10, cy + 7);

                // Lines
                card.lines.forEach((line, li) => {
                    const lineY = cy + 14 + li * 6;
                    pdf.setFontSize(7.5);
                    pdf.setTextColor(100, 100, 100);
                    pdf.setFont('helvetica', 'normal');
                    pdf.text(`${line.label}:`, cx + 5, lineY);
                    pdf.setTextColor(40, 40, 40);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text(line.value, cx + cardW - 4, lineY, { align: 'right' });
                });
            });

            y += cardH + 10;

            // ══════════════════════════════════════════════════════════════════
            // EXHIBITORS
            // ══════════════════════════════════════════════════════════════════
            const exhibitors = res?.exhibitors || [];
            const leadName = `${res?.user?.firstName || ''} ${res?.user?.lastName || ''}`.trim() || res?.user?.email || 'Lead Representative';
            const allExhibitors = [
                { name: leadName, role: 'Lead Representative' },
                ...exhibitors.map(ex => ({
                    name: `${ex.firstName || ''} ${ex.lastName || ''}`.trim() || ex.email || 'Exhibitor',
                    role: 'Exhibitor'
                }))
            ];

            if (allExhibitors.length > 0) {
                sectionHeading('Exhibitors');

                allExhibitors.forEach((ex, i) => {
                    newPageIfNeeded(10);
                    const roleColor = i === 0 ? [30, 60, 114] : [100, 100, 100];

                    pdf.setFillColor(i === 0 ? 235 : 248, i === 0 ? 240 : 248, i === 0 ? 255 : 248);
                    pdf.setDrawColor(i === 0 ? 180 : 220, i === 0 ? 200 : 220, i === 0 ? 245 : 220);
                    pdf.setLineWidth(0.2);
                    pdf.roundedRect(MARGIN, y, pdfWidth - MARGIN * 2, 8, 1, 1, 'FD');

                    pdf.setFontSize(8.5);
                    pdf.setTextColor(...roleColor);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text(ex.name, MARGIN + 4, y + 5.5);

                    pdf.setFontSize(7.5);
                    pdf.setTextColor(130, 130, 130);
                    pdf.setFont('helvetica', 'normal');
                    pdf.text(ex.role, pdfWidth - MARGIN - 4, y + 5.5, { align: 'right' });

                    y += 10;
                });

                y += 4;
            }

            sectionHeading('Payment Breakdown');

            const isBXGY = res?.appliedGift?.valueType === 'bxgy';
            const allRes = item.allReservations || [res];
            const discountAmt = res?.amount?.discount || 0;
            const discountLbl = res?.amount?.discountLabel || res?.appliedGift?.name || '';
            const rawSubtotal = allRes.reduce((s, r) => s + (r.amount?.subtotal || 0), 0);
            const originalPrice = rawSubtotal + discountAmt;

            const headers = ['Description', 'Amount'];
            const tableRows = [];

            if (isBXGY && allRes.length > 1) {
                const sorted = [...allRes].sort((a, b) => (b.amount?.subtotal || 0) - (a.amount?.subtotal || 0));
                sorted.forEach(r => {
                    const isFreeItem = (r.amount?.subtotal || 0) === 0;
                    tableRows.push([
                        `Booth Registration (#${r.boothCode || 'N/A'})`,
                        isFreeItem ? 'FREE' : `$${(r.amount?.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                    ]);
                });
                tableRows.push([`Gift Card Discount — Buy 1 Get 1 Free`, `-$${discountAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}`]);
            } else if (discountAmt > 0) {
                const giftType = res?.appliedGift?.valueType;
                const giftValue = res?.appliedGift?.value;
                const discountSuffix = giftType === 'percent'
                    ? `${giftValue}% off`
                    : giftType === 'fixed'
                        ? `$${giftValue?.toLocaleString()} off`
                        : discountLbl || '';
                tableRows.push([isSeat ? 'Original Ticket Price' : 'Original Booth Price', `$${originalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`]);
                tableRows.push([`Gift Card Discount${discountSuffix ? ` — ${discountSuffix}` : ''}`, `-$${discountAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}`]);
            } else {
                tableRows.push([isSeat ? 'Ticket Price' : 'Booth Price', `$${rawSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`]);
            }

            tableRows.push(['Tax', `$${(res?.amount?.tax || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`]);
            tableRows.push(['Processing Fee', `$${(res?.amount?.fee || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`]);
            tableRows.push(['Total Paid', item.amount]);

            y = drawTable(pdf, y, headers, tableRows, MARGIN, pdfWidth, pdfHeight, FOOTER_HEIGHT, 12, 5, logoData, INVOICE_TITLE);

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
                `Invoice ${item.invoiceRef}  •  Generated by eTicketsPro`,
                pdfWidth / 2, y + 9, { align: 'center' }
            );

            finalizeReport(pdf);
            pdf.save(`Invoice_${item.invoiceRef}.pdf`);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            removeExportToast(loadingToast);
        }
    };
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
                setIsStatusDropdownOpen(false);
            }
        };

        if (isStatusDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isStatusDropdownOpen]);

    const statusOptions = [
        "All Events",
        "Upcoming",
        "Live",
        "Completed"
    ];

    const eventStatuses = ["Upcoming", "Live", "Completed"];

    const { user } = useAuthContext();
    const [allHistory, setAllHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

    // 1. Define ABOVE useEffect
    const groupReservations = (reservations) => {
        const groups = new Map();
        reservations.forEach(res => {
            const key = res.batchId || res._id?.toString();
            if (groups.has(key)) {
                const group = groups.get(key);
                group.reservations.push(res);
                group.totalAmount += res.amount?.total || 0;
            } else {
                groups.set(key, {
                    batchId: key,
                    eventId: (res.event?._id || res.event)?.toString(),
                    paymentMethod: res.paymentMethod,
                    createdTime: new Date(res.createdAt).getTime(),
                    reservations: [res],
                    totalAmount: res.amount?.total || 0,
                });
            }
        });
        return Array.from(groups.values());
    };

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user?.token) return;
            setIsLoading(true);
            try {
                const response = await axios.get(`${BACKEND_URL}/api/reservations/my-booths`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });

                const grouped = groupReservations(response.data);

                const mappedHistory = grouped.map((group, index) => {
                    const res = group.reservations[0];
                    const allRes = group.reservations;

                    const boothLabel = allRes.length > 1
                        ? `${allRes.length} Booths (${allRes.map(r => `#${r.boothCode}`).join(', ')})`
                        : `Booth #${res.boothCode || 'N/A'}`;

                    const eventStatus = (() => {
                        if (!res.event?.startDate) return 'Upcoming';
                        const now = new Date();
                        const start = new Date(res.event.startDate);
                        const end = new Date(res.event.endDate || res.event.startDate);
                        if (now < start) return 'Upcoming';
                        if (now >= start && now <= end) return 'Live';
                        return 'Completed';
                    })();

                    const paymentStatus = res.status === 'confirmed' ? 'Paid'
                        : res.status === 'refunded' ? 'Refunded'
                            : res.status === 'rejected' ? 'Rejected'
                                : res.status === 'cancelled' ? 'Cancelled'
                                    : 'Pending';

                    const dateOpts = { month: 'short', day: 'numeric', year: 'numeric' };
                    const createdAt = new Date(res.createdAt);

                    return {
                        id: group.batchId,
                        displayId: `#${String(index + 1).padStart(4, '0')}`,
                        title: res.event?.title || 'Unknown Event',
                        booth: boothLabel,
                        date: res.event?.startDate
                            ? new Date(res.event.startDate).toLocaleDateString('en-US', dateOpts)
                            : 'TBA',
                        invoiceRef: `INV-${res.poNumber || res._id?.toString().slice(-8).toUpperCase()}`,
                        amount: `$${group.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                        eventStatus,
                        paymentStatus,
                        paymentDate: createdAt.toLocaleDateString('en-US', dateOpts),
                        fullReservation: {
                            ...res,
                            amount: {
                                total: group.totalAmount,
                                subtotal: allRes.reduce((s, r) => s + (r.amount?.subtotal || 0), 0),
                               discount: (() => {
    const isBXGY = res.appliedGift?.valueType === 'bxgy';
    if (isBXGY) {
        return allRes
            .filter(r => (r.amount?.subtotal || 0) === 0)
            .reduce((s, r) => s + (r.amount?.discount || 0), 0);
    }
    return allRes.reduce((s, r) => s + (r.amount?.discount || 0), 0);  // sum all for display
})(),
                                discountLabel: res.amount?.discountLabel || res.appliedGift?.name || null,
                                fee: allRes.reduce((s, r) => s + (r.amount?.fee || 0), 0),
                                tax: allRes.reduce((s, r) => s + (r.amount?.tax || 0), 0),
                            },
                            appliedGift: res.appliedGift?.valueType ? res.appliedGift : null,
                            giftCode: res.giftCode || null,
                        },
                        allReservations: allRes,
                    };
                });

                setAllHistory(mappedHistory);
            } catch (error) {
                console.error("Fetch history error:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, [user?.token]);

    // Date Range Logic
    const [dateRange, setDateRange] = useState(() => ({
        preset: 'all',
        presetLabel: 'All time',
        start: new Date(2000, 0, 1),
        end: new Date(2100, 11, 31),
    }));

    const filteredHistory = allHistory.filter(item => {
        if (!item || !item.title) return false;
        const matchesStatus = selectedStatus === "All Events" || item.eventStatus === selectedStatus;
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.invoiceRef.toLowerCase().includes(searchQuery.toLowerCase());
        const paymentDate = item.fullReservation?.createdAt
            ? new Date(item.fullReservation.createdAt)
            : new Date(0);
        const matchesDate = paymentDate >= dateRange.start && paymentDate <= dateRange.end;
        return matchesStatus && matchesSearch && matchesDate;
    });

    // Pagination Logic
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    const handleDateRangeChange = (newRange) => {
        setDateRange(newRange);
        setCurrentPage(1);
    };

    const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedHistory = filteredHistory.slice(startIndex, startIndex + itemsPerPage);
    const totalResults = filteredHistory.length;


    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };



    return (
        <div className="sponsor-history-wrapper">
            <div className="sponsor-history-header">
                <div className="sponsor-history-title-area">
                    <h2>Sponsorship History</h2>
                    <p className="regular-body-text text-secondary">View your past sponsorships and payment records.</p>
                </div>
                <button className="outlined-button sh-dl" onClick={exportHistoryToPDF}>
                    <Icon icon="mdi:tray-arrow-up" className="export-icon" />
                    Export History
                </button>
            </div>

            <div className="sponsor-history-card">
                <div className="sponsor-history-controls">
                    <div className="sh-search">
                        <Icon icon="mdi:magnify" width="20" color="var(--color-black-secondary)" />
                        <input
                            type="text"
                            placeholder="Search by event or invoice order"
                            className="small-body-text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    <div className="sh-filters">
                        <DateRangePicker
                            value={dateRange}
                            onChange={handleDateRangeChange}
                            buttonClassName="outlined-button sh-filter-btn"
                            placeholder="Date Range"
                        />
                        <div className="sh-dropdown" ref={statusDropdownRef}>
                            <button
                                className="sh-dropdown-btn"
                                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                            >
                                <span className="truncate-text">{selectedStatus}</span>
                                <Icon
                                    icon="mdi:chevron-down"
                                    className={`dropdown-icon ${isStatusDropdownOpen ? "open" : ""}`}
                                />
                            </button>

                            {isStatusDropdownOpen && (
                                <div className="sh-dropdown-menu">
                                    {statusOptions.map((option, index) => (
                                        <button
                                            key={index}
                                            className={`sh-dropdown-item ${selectedStatus === option ? "active" : ""}`}
                                            onClick={() => {
                                                setSelectedStatus(option);
                                                setCurrentPage(1); // reset to first page
                                                setIsStatusDropdownOpen(false);
                                            }}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="sh-table-container">
                    <table className="sh-table">
                        <thead>
                            <tr>
                                <th className="small-body-text text-secondary">ID</th>
                                <th className="small-body-text text-secondary">EVENT DETAILS</th>
                                <th className="small-body-text text-secondary">INVOICE #</th>
                                <th className="small-body-text text-secondary">AMOUNT</th>
                                <th className="small-body-text text-secondary">STATUS</th>
                                <th className="small-body-text text-secondary">PAYMENT DATE</th>
                                <th className="small-body-text text-secondary">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                [...Array(6)].map((_, i) => (
                                    <tr key={i}>

                                        <td><div className="skeleton skeleton-text" style={{ width: '60px', height: '14px' }}></div></td>
                                        <td>
                                            <div className="skeleton skeleton-text" style={{ width: '150px', height: '16px', marginBottom: '8px' }}></div>
                                            <div className="skeleton skeleton-text" style={{ width: '100px', height: '12px' }}></div>
                                        </td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '80px', height: '14px' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '70px', height: '14px' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '60px', height: '24px', borderRadius: '4px' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '100px', height: '14px' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '40px', height: '24px', borderRadius: '4px' }}></div></td>
                                    </tr>
                                ))
                            ) : paginatedHistory.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                                        <div className="empty-state">
                                            <Icon icon="mdi:history" width="48" />
                                            <p>No history found matching your filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedHistory.map((item) => (
                                    <tr key={item.id}>
                                        <td className="regular-body-text text-secondary">{item.displayId}</td>
                                        <td>
                                            <div className="sh-event-details">
                                                <h6 className="sh-event-title">{item.title}</h6>
                                                <div className="sh-event-meta text-secondary small-body-text">
                                                    {item.booth} • {item.date}
                                                    <span className={`button-label ${item.eventStatus.toLowerCase()}`}>
                                                        {item.eventStatus}
                                                    </span>                                            </div>
                                            </div>
                                        </td>
                                        <td className="regular-body-text text-secondary">{item.invoiceRef}</td>
                                        <td className="regular-body-text text-secondary">{item.amount}</td>
                                        <td>
                                            <span className={`button-label ${item.paymentStatus.toLowerCase()}`}>{item.paymentStatus}</span>
                                        </td>
                                        <td className="regular-body-text text-secondary">{item.paymentDate}</td>
                                        <td>
                                            <div className="sh-actions">
                                                <button
                                                    className="sh-action-btn view-btn"
                                                    onClick={() => {
                                                        setSelectedHistoryItem(item);
                                                        setIsHistoryModalOpen(true);
                                                    }}
                                                >
                                                    View
                                                </button>
                                                <button className="sh-action-btn text-secondary" onClick={() => downloadHistoryItemPDF(item)}>
                                                    <Icon icon="mdi:download" width="20" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="sh-table-footer">
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
            <SponsorViewFullHistory
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                historyItem={selectedHistoryItem}
                onDownload={() => downloadHistoryItemPDF(selectedHistoryItem)}
            />
        </div>
    );
}
