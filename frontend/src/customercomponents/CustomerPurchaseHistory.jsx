import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { io } from 'socket.io-client';
import { useCustomerCart } from '../context/CustomerCartContext';
import { useAuthContext } from '../hooks/useAuthContext';
import DateRangePicker from '../utils/DateRangePicker';
import jsPDF from 'jspdf';
import { loadLogo, addReportHeader, addReportFooter, showExportToast, removeExportToast, drawTable, finalizeReport } from '../utils/pdfExport';
import usePagination from '../hooks/usePagination';
import PaginationBar from '../components/PaginationBar';
import './CustomerPurchaseHistory.css';
import CustomerHistoryViewReceipt from './Modal/CustomerHistoryViewReceipt';
import GiftRestoredNotice from '../components/GiftRestoredNotice';
import { shouldShowGiftRestoredNotice } from '../utils/giftNoticeUtils';
import orderService from '../services/orderService';

const isGiftRestoredPayment = (paymentStatus) => {
    const p = paymentStatus?.toLowerCase();
    return p === 'rejected' || p === 'refunded';
};

const getReservationGroupKey = (item) => {
    const seatMatch = item.cartId?.match(/^db-(.+)-\d+$/);
    if (seatMatch) return `res-${seatMatch[1]}`;
    const boothMatch = item.cartId?.match(/^db-(.+)$/);
    if (boothMatch) return `res-${boothMatch[1]}`;
    return item.cartId || item.purchaseDate;
};

export default function CustomerPurchaseHistory() {
    const { purchaseHistory, refreshHistory } = useCustomerCart();
    const { user } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('all');
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState(() => ({
        preset: 'all',
        presetLabel: 'All time',
        start: new Date(2000, 0, 1),
        end: new Date(2100, 11, 31),
    }));
    const itemsPerPage = 5;
    const {
        page, totalPages, total,
        setTotal, goTo, next, prev,
        reset: resetPage,
    } = usePagination({ limit: itemsPerPage });

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            try {
                if (user?.token) {
                    const data = await orderService.getOrders(user.token, { customerId: user._id });
                    if (isMounted) setOrders(data);
                }
            } catch (error) {
                console.error("Error fetching orders in purchase history:", error);
            } finally {
                setTimeout(() => {
                    if (isMounted) setLoading(false);
                }, 800);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, [user]);

    useEffect(() => {
        if (!user?.token) return;

        const socket = io(import.meta.env.VITE_BACKEND_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
        });

        socket.on('newNotification', (notification) => {
            const title = (notification?.title || '').toLowerCase();
            if (
                title.includes('gift restored') ||
                title.includes('payment rejected') ||
                title.includes('reservation rejected')
            ) {
                refreshHistory?.();
            }
        });

        return () => socket.disconnect();
    }, [user?.token, refreshHistory]);

    const tabs = [
        { id: 'all', label: 'All Purchases' },
        { id: 'ticket', label: 'Tickets' },
        { id: 'product', label: 'Products' },
        { id: 'refunds', label: 'Refunds' }
    ];

    const purchases = useMemo(() => {
        const groups = {};

        const getFulfillmentStatusClass = (status) => {
            const s = status?.toLowerCase();
            if (s === 'pending') return 'status-pending';
            if (s === 'preparing') return 'status-preparing';
            if (s === 'ready' || s === 'ready for pickup') return 'status-pickup';
            if (s === 'completed' || s === 'confirmed') return 'status-confirmed';
            return 'status-confirmed';
        };

        const getPaymentStatusClass = (paymentStatus) => {
            const p = paymentStatus?.toLowerCase();
            if (p === 'paid' || p === 'confirmed') return 'status-confirmed';
            if (p === 'unpaid' || p === 'pending') return 'status-pending';
            if (p === 'refunded' || p === 'rejected') return 'status-refunded';
            return 'status-pending';
        };

        // 1. Process seated tickets & booths — group by reservation, not purchase date
        purchaseHistory.forEach(item => {
            const groupKey = getReservationGroupKey(item);
            const date = item.purchaseDate;
            const eventTitle = item.event?.title || "Unknown Event";
            if (!groups[groupKey]) {
                const payStatus = (() => {
                    const rawStatus = item.status?.toLowerCase();
                    if (rawStatus === 'confirmed') return 'Paid';
                    if (rawStatus === 'rejected') return 'Rejected';
                    if (rawStatus === 'refunded') return 'Refunded';
                    if (rawStatus === 'pending') return 'Pending';
                    if (item.paymentMethod && item.paymentMethod.toLowerCase() === 'invoice') return 'Pending';
                    return 'Paid';
                })();

                groups[groupKey] = {
                    id: groupKey,
                    type: item.type || 'ticket',
                    title: eventTitle,
                    status: 'Completed',
                    statusClass: 'status-confirmed',
                    paymentStatus: payStatus,
                    paymentStatusClass: getPaymentStatusClass(payStatus),
                    orderNum: `Seat - ${(item.cartId || '').toUpperCase().slice(0, 8)}`,
                    date: date ? new Date(date).toLocaleDateString() : 'N/A',
                    totalAmount: 0,
                    paymentMethod: item.paymentMethod || 'Credit Card',
                    poNumber: item.poNumber || '',
                    items: [],
                    purchasedAt: date,
                    // Discount info — collected from the first item that has it
                    appliedGift: item.appliedGift || null,
                    giftCode: item.giftCode || item.appliedGift?.code || null,
                    discountAmount: item.discountAmount || 0,
                    orderGift: item.orderGift || item.appliedGift || null,
                    orderGiftCode: item.orderGiftCode || item.giftCode || item.appliedGift?.code || null,
                };
            } else {
                // Accumulate discount from whichever item carries it
                if (!groups[groupKey].appliedGift && item.appliedGift) {
                    groups[groupKey].appliedGift = item.appliedGift;
                }
                if (!groups[groupKey].giftCode && (item.giftCode || item.appliedGift?.code)) {
                    groups[groupKey].giftCode = item.giftCode || item.appliedGift?.code;
                }
                if (!groups[groupKey].orderGift && (item.orderGift || item.appliedGift)) {
                    groups[groupKey].orderGift = item.orderGift || item.appliedGift;
                }
                if (!groups[groupKey].orderGiftCode && (item.orderGiftCode || item.giftCode || item.appliedGift?.code)) {
                    groups[groupKey].orderGiftCode = item.orderGiftCode || item.giftCode || item.appliedGift?.code;
                }
                if (item.discountAmount) {
                    groups[groupKey].discountAmount = (groups[groupKey].discountAmount || 0) + item.discountAmount;
                }
            }

            // Always push original facePrice — never adjusted
            groups[groupKey].items.push({
                name: `1x ${item.categoryName || 'Ticket'} - Seat ${item.seat?.label || 'N/A'}`,
                price: `$${(item.facePrice || 0).toFixed(2)}`,
                originalPrice: item.facePrice || 0,
                isFree: item.isBXGYFree === true,
                serviceFee: item.serviceFee || 0,
            });
            groups[groupKey].totalAmount += (item.facePrice || 0);
        });

        // 2. Process store product orders
        orders.forEach(order => {
            const date = order.createdAt;
            const title = order.storeName || order.sponsorId?.companyName || "Store";
            let orderType = 'product';

            const orderItemsMapped = order.items.map(item => {
                const itemCategory = item.productId?.category || 'Product';
                return {
                    name: `${item.quantity}x ${item.name} (${itemCategory})`,
                    price: `$${(item.price * item.quantity).toFixed(2)}`,
                    originalPrice: item.price * item.quantity,
                    productCategory: itemCategory,
                    singlePrice: item.price,
                    quantity: item.quantity
                };
            });

            const fillStatus = order.status || 'Pending';
            const payStatus = (order.paymentStatus || '').toLowerCase() === 'paid' ? 'Paid' : 'Unpaid';

            groups[order._id] = {
                id: order._id,
                type: orderType,
                title: title,
                status: fillStatus,
                statusClass: getFulfillmentStatusClass(fillStatus),
                paymentStatus: payStatus,
                paymentStatusClass: getPaymentStatusClass(payStatus),
                orderNum: order.orderId || `ORD-${order._id.toUpperCase().slice(0, 8)}`,
                date: date ? new Date(date).toLocaleDateString() : 'N/A',
                totalAmount: order.totalAmount,
                paymentMethod: order.paymentMethod || 'Credit Card',
                poNumber: order.poNumber || '',
                items: orderItemsMapped,
                purchasedAt: date,
                appliedGift: null,
                discountAmount: 0,
            };
        });

        return Object.values(groups).map(g => {
            // Subtotal = sum of all original face prices (never discount-adjusted)
            const subtotalAmount = g.items.reduce((s, i) => s + (i.originalPrice || 0), 0);
            const serviceFeeTotal = g.items.reduce((s, i) => s + (i.serviceFee || 0), 0);
            const discountAmt = g.discountAmount || 0;
            const giftWasRedeemed = discountAmt > 0;

            // Total = subtotal - discount + service fee (floored at 0)
            const finalTotal = g.type === 'product'
                ? g.totalAmount
                : Math.max(0, subtotalAmount - discountAmt + serviceFeeTotal);

            return {
                ...g,
                appliedGift: giftWasRedeemed ? g.appliedGift : null,
                giftCode: giftWasRedeemed ? g.giftCode : null,
                orderGift: g.orderGift || null,
                orderGiftCode: g.orderGiftCode || null,
                subtotalAmount,
                serviceFeeTotal,
                total: `$${finalTotal.toFixed(2)}`,
                totalAmount: finalTotal,
                giftRestored: shouldShowGiftRestoredNotice(g.paymentStatus, g.orderGift, g.orderGiftCode),
            };
        }).sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt));
    }, [purchaseHistory, orders]);

    const filteredPurchases = purchases.filter(p => {
        const matchesTab = activeTab === 'all'
            || (activeTab === 'refunds' && isGiftRestoredPayment(p.paymentStatus))
            || p.type === activeTab;
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.orderNum.toLowerCase().includes(searchQuery.toLowerCase());
        const purchaseDate = new Date(p.date);
        const matchesDate = purchaseDate >= dateRange.start && purchaseDate <= dateRange.end;
        return matchesTab && matchesSearch && matchesDate;
    });

    const handleDateRangeChange = (newRange) => {
        setDateRange(newRange);
        resetPage();
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        resetPage();
    };

    useEffect(() => {
        setTotal({
            total: filteredPurchases.length,
            totalPages: Math.ceil(filteredPurchases.length / itemsPerPage) || 1,
        });
    }, [filteredPurchases.length, setTotal]);

    const startIndex = (page - 1) * itemsPerPage;
    const paginatedPurchases = filteredPurchases.slice(startIndex, startIndex + itemsPerPage);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        resetPage();
    };

    const getIconForType = (type, items = []) => {
        if (type === 'ticket') return 'mdi:ticket-confirmation-outline';
        if (type === 'product') {
            const hasFood = items.some(item =>
                item.productCategory === 'Food' ||
                item.productCategory === 'Drinks' ||
                item.name.toLowerCase().includes('food') ||
                item.name.toLowerCase().includes('drink')
            );
            return hasFood ? 'mdi:food-outline' : 'mdi:shopping-outline';
        }
        return 'mdi:receipt-text-outline';
    };

    const getIconColorForType = (type, items = []) => {
        if (type === 'ticket') return 'var(--color-red-primary)';
        if (type === 'product') {
            const hasFood = items.some(item =>
                item.productCategory === 'Food' ||
                item.productCategory === 'Drinks' ||
                item.name.toLowerCase().includes('food') ||
                item.name.toLowerCase().includes('drink')
            );
            return hasFood ? 'var(--color-yellow-primary)' : 'var(--color-blue-primary)';
        }
        return 'var(--color-black-secondary)';
    };

    /**
     * Build discount label from the appliedGift stored on the purchase group
     */
    const buildDiscountLabel = (appliedGift) => {
        if (!appliedGift) return '';
        if (appliedGift.valueType === 'fixed') return `Gift Card Discount — $${appliedGift.value.toFixed(2)} off`;
        if (appliedGift.valueType === 'percent') return `Gift Card Discount — ${appliedGift.value}% off`;
        if (appliedGift.valueType === 'bxgy') return `Gift Card Discount — Buy 1 Get 1`;
        return `Discount (${appliedGift.code})`;
    };

    const handleViewReceipt = (purchase) => {
        const subtotalAmount = purchase.subtotalAmount || purchase.totalAmount;
        const discountAmount = purchase.discountAmount || 0;
        const giftWasRedeemed = discountAmount > 0;
        const serviceFeeTotal = purchase.serviceFeeTotal || 0;
        const discountLabel = giftWasRedeemed ? buildDiscountLabel(purchase.appliedGift) : '';

        // Tax is currently $0 — update here if tax logic is added
        const taxAmount = 0;
        const totalPaid = Math.max(0, subtotalAmount - discountAmount + serviceFeeTotal + taxAmount);

        const receiptData = {
            orderNum: purchase.orderNum.replace('#', ''),
            date: purchase.date,
            billedTo: {
                name: user ? `${user.firstName} ${user.lastName}` : 'Guest Customer',
                email: user ? user.email : ''
            },
            paymentMethod: purchase.paymentMethod,
            poNumber: purchase.poNumber,
            status: purchase.status,
            paymentStatus: purchase.paymentStatus,
            appliedGift: giftWasRedeemed ? (purchase.appliedGift || null) : null,
            giftCode: giftWasRedeemed ? (purchase.giftCode || purchase.appliedGift?.code || null) : null,
            orderGift: purchase.orderGift || null,
            orderGiftCode: purchase.orderGiftCode || null,
            giftRestored: purchase.giftRestored || false,

            // Items — always at original face price; BXGY free seat shown as Free
            items: purchase.items.map(item => {
                const type = item.productCategory || (purchase.type === 'ticket' ? 'Ticket' : purchase.type === 'merchandise' ? 'Merch' : 'Food/Drink');
                const qty = item.quantity || parseInt(item.name.match(/^\d+/)?.[0] || 1, 10);
                const unitPrice = item.singlePrice
                    ? `$${item.singlePrice.toFixed(2)}`
                    : item.isFree ? 'Free' : item.price;
                const lineTotal = item.isFree ? 'Free' : item.price;

                return {
                    item: item.name.replace(/^\d+x\s*/, '').replace(/\s*\([^)]*\)\s*$/, ''),
                    type,
                    qty,
                    price: unitPrice,
                    total: lineTotal,
                    isFree: item.isFree || false,
                };
            }),

            // Summary breakdown — discount shown as its own line, NOT baked into item prices
            subtotal: `$${subtotalAmount.toFixed(2)}`,
            discountAmount,
            discountLabel,
            serviceFee: `$${serviceFeeTotal.toFixed(2)}`,
            tax: `$${taxAmount.toFixed(2)}`,
            totalPaid: `$${totalPaid.toFixed(2)}`,
        };

        setSelectedReceipt(receiptData);
        setIsReceiptModalOpen(true);
    };

    const exportHistoryToPDF = async () => {
        const loadingToast = showExportToast();
        const REPORT_TITLE = 'Purchase History';

        try {
            const logoData = await loadLogo();
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth  = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const MARGIN        = 15;
            const FOOTER_HEIGHT = 15;
            let y = 45;

            addReportHeader(pdf, REPORT_TITLE, logoData);

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

            const totalAmount = filteredPurchases.reduce((s, p) => s + p.totalAmount, 0);

            const ticketItems  = filteredPurchases.filter(p => p.type === 'ticket');
            const productItems = filteredPurchases.filter(p => p.type === 'product');
            const refundItems  = filteredPurchases.filter(p => isGiftRestoredPayment(p.paymentStatus));

            const ticketAmount  = ticketItems.reduce((s, p)  => s + p.totalAmount, 0);
            const productAmount = productItems.reduce((s, p) => s + p.totalAmount, 0);
            const refundAmount  = refundItems.reduce((s, p)  => s + p.totalAmount, 0);

            const tabLabels = { all: 'All Purchases', ticket: 'Tickets', product: 'Products', refunds: 'Refunds' };
            const filterLabel = tabLabels[activeTab] || 'All Purchases';

            // BANNER
            pdf.setFillColor(235, 240, 255);
            pdf.setDrawColor(180, 200, 245);
            pdf.setLineWidth(0.3);
            pdf.roundedRect(MARGIN, y, pdfWidth - MARGIN * 2, 22, 3, 3, 'FD');

            pdf.setFontSize(11);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont('helvetica', 'bold');
            pdf.text(filterLabel, MARGIN + 4, y + 8);

            pdf.setFontSize(8);
            pdf.setTextColor(80, 90, 130);
            pdf.setFont('helvetica', 'normal');
            pdf.text(
                `Purchase History  •  ${filteredPurchases.length} record${filteredPurchases.length !== 1 ? 's' : ''}`,
                MARGIN + 4, y + 15
            );

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

            // KEY METRICS
            sectionHeading('Key Metrics');

            const cardW = (pdfWidth - MARGIN * 2 - 12) / 3;
            const cardH = 22;

            const metricCards = [
                { label: 'Tickets', value: `$${ticketAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, sub: `${ticketItems.length} purchase${ticketItems.length !== 1 ? 's' : ''}`, color: [30, 60, 200], bg: [235, 240, 255], border: [180, 200, 245] },
                { label: 'Products', value: `$${productAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, sub: `${productItems.length} order${productItems.length !== 1 ? 's' : ''}`, color: [217, 119, 6], bg: [255, 251, 235], border: [245, 220, 160] },
                { label: 'Refunds / Rejected', value: `$${refundAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, sub: `${refundItems.length} record${refundItems.length !== 1 ? 's' : ''}`, color: [180, 50, 50], bg: [255, 240, 240], border: [245, 190, 190] },
            ];

            metricCards.forEach((m, i) => {
                const cx = MARGIN + i * (cardW + 6);
                const cy = y;
                pdf.setFillColor(...m.bg);
                pdf.setDrawColor(...m.border);
                pdf.setLineWidth(0.3);
                pdf.roundedRect(cx, cy, cardW, cardH, 3, 3, 'FD');
                pdf.setFillColor(...m.color);
                pdf.circle(cx + 5, cy + 6, 2, 'F');
                pdf.setFontSize(8);
                pdf.setTextColor(100, 100, 100);
                pdf.setFont('helvetica', 'normal');
                pdf.text(m.label, cx + 10, cy + 7);
                pdf.setFontSize(11);
                pdf.setTextColor(...m.color);
                pdf.setFont('helvetica', 'bold');
                pdf.text(m.value, cx + 5, cy + 16);
                pdf.setFontSize(7);
                pdf.setTextColor(130, 130, 130);
                pdf.setFont('helvetica', 'normal');
                pdf.text(m.sub, cx + cardW - 4, cy + 16, { align: 'right' });
            });

            y += cardH + 10;

            // SPENDING BREAKDOWN
            sectionHeading('Spending Breakdown');

            const breakdownItems = [
                { label: 'Tickets',            value: ticketAmount,  count: ticketItems.length,  countLabel: 'purchases', color: [30, 60, 200]   },
                { label: 'Products',           value: productAmount, count: productItems.length, countLabel: 'orders',    color: [217, 119, 6]   },
                { label: 'Refunds / Rejected', value: refundAmount,  count: refundItems.length,  countLabel: 'records',   color: [200, 200, 200] },
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
                pdf.setFillColor(235, 235, 235);
                pdf.roundedRect(MARGIN + 43, y, barMaxW, 6, 1, 1, 'F');
                if (fillW > 0) {
                    pdf.setFillColor(...item.color);
                    pdf.roundedRect(MARGIN + 43, y, fillW, 6, 1, 1, 'F');
                }
                pdf.setFontSize(7.5);
                pdf.setTextColor(80, 80, 80);
                pdf.text(
                    `$${item.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}  (${item.count} ${item.countLabel})`,
                    MARGIN + 43 + barMaxW + 2, y + 4.5
                );
                y += 11;
            });

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
                `Total Spent: $${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}   |   Records: ${filteredPurchases.length}   |   Filter: ${filterLabel}`,
                pdfWidth / 2, y + 6.5, { align: 'center' }
            );
            y += 16;

            // PURCHASE HISTORY TABLE
            newPageIfNeeded(20);
            sectionHeading('Purchase History');

            const headers = ['Order', 'Title', 'Date', 'Type', 'Payment Method', 'Total', 'Status', 'Payment Status'];
            const rows = filteredPurchases.map(item => [
                item.orderNum,
                item.title,
                item.date,
                item.type.charAt(0).toUpperCase() + item.type.slice(1),
                item.paymentMethod,
                item.total,
                item.status,
                item.paymentStatus.charAt(0).toUpperCase() + item.paymentStatus.slice(1),
            ]);

            y = drawTable(pdf, y, headers, rows, MARGIN, pdfWidth, pdfHeight, FOOTER_HEIGHT, 12, 5, logoData, REPORT_TITLE);

            // FOOTER STRIP
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
                `Purchase history export  •  Generated by eTicketsPro`,
                pdfWidth / 2, y + 9, { align: 'center' }
            );

            finalizeReport(pdf);
            pdf.save(`Purchase_History_${new Date().toISOString().split('T')[0]}.pdf`);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            removeExportToast(loadingToast);
        }
    };

    return (
        <div className="customer-history-container">
            <div className="history-header">
                <h2 className="history-page-title" style={{ marginBottom: 0 }}>Purchase History</h2>
                <button className="outlined-button" onClick={exportHistoryToPDF} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon icon="mdi:tray-arrow-up" width="20" />
                    Export History
                </button>
            </div>

            <div className="cph-controls">
                <div className="cph-search">
                    <Icon icon="mdi:magnify" width="20" className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search purchases or Order ID"
                        className="small-body-text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                </div>
                <div className="cph-filters">
                    <DateRangePicker
                        value={dateRange}
                        onChange={handleDateRangeChange}
                        buttonClassName="cph-date-picker-btn small-body-text"
                        placeholder="Date Range"
                    />
                </div>
            </div>

            <div className="history-tabs-container">
                <ul className="history-tab-list">
                    {tabs.map(tab => (
                        <li key={tab.id}>
                            <button
                                className={`history-tab-btn regular-body-text ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => handleTabChange(tab.id)}
                            >
                                {tab.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="history-list-container">
                {loading ? (
                    <>
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="history-card skeleton">
                                <div className="history-card-header flex-between">
                                    <div className="history-info-left">
                                        <div className="skeleton-box history-skeleton-icon" />
                                        <div className="history-details" style={{ width: '220px' }}>
                                            <div className="history-title-row">
                                                <div className="skeleton-box history-skeleton-title" />
                                                <div className="skeleton-box history-skeleton-badge" />
                                            </div>
                                            <div className="skeleton-box history-skeleton-subtitle" />
                                        </div>
                                    </div>
                                    <div className="history-info-right text-right" style={{ width: '120px' }}>
                                        <div className="skeleton-box history-skeleton-price" />
                                        <div className="skeleton-box history-skeleton-payment" />
                                    </div>
                                </div>
                                <hr className="history-divider" />
                                <div className="history-items-list">
                                    <div className="history-sub-item flex-between">
                                        <div className="skeleton-box history-skeleton-subitem-title" />
                                        <div className="skeleton-box history-skeleton-subitem-price" />
                                    </div>
                                </div>
                                <hr className="history-divider" />
                                <div className="history-actions flex-end">
                                    <div className="skeleton-box history-skeleton-btn" />
                                </div>
                            </div>
                        ))}
                    </>
                ) : paginatedPurchases.length > 0 ? (
                    <>
                        {paginatedPurchases.map((purchase) => (
                            <div key={purchase.id} className="history-card">
                                <div className="history-card-header flex-between">
                                    <div className="history-info-left">
                                        <div className="history-icon-box">
                                            <Icon icon={getIconForType(purchase.type, purchase.items)} width="24" color={getIconColorForType(purchase.type, purchase.items)} />
                                        </div>
                                        <div className="history-details">
                                            <div className="history-title-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                <h4 className="history-item-title">{purchase.title}</h4>
                                                <span className={`button-label ${purchase.statusClass}`}>{purchase.status}</span>
                                                <span className={`button-label ${purchase.paymentStatusClass}`}>{purchase.paymentStatus}</span>
                                            </div>
                                            <p className="small-body-text text-muted mt-1">
                                                Order {purchase.orderNum} • {purchase.date}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="history-info-right text-right">
                                        <h4 className="history-total">{purchase.total}</h4>
                                        <p className="small-body-text text-muted mt-1">
                                            {purchase.paymentMethod} {purchase.poNumber && ` ${purchase.poNumber}`}
                                        </p>
                                    </div>
                                </div>

                                <hr className="history-divider" />

                                <div className="history-items-list">
                                    {/* Each seat at its original face price — BXGY free seat shown as Free */}
                                    {purchase.items.map((item, idx) => (
                                        <div key={idx} className="history-sub-item flex-between">
                                            <span className="regular-body-text text-muted">{item.name}</span>
                                            <span className="regular-body-text" style={item.isFree ? { color: 'var(--color-green-primary)', fontWeight: 600 } : {}}>
                                                {item.isFree ? 'Free' : item.price}
                                            </span>
                                        </div>
                                    ))}

                                    {/* Discount line — shown separately, never baked into item prices */}
                                    {purchase.discountAmount > 0 && purchase.appliedGift && (
                                        <div className="history-sub-item flex-between" style={{ color: 'var(--color-green-primary)' }}>
                                            <span className="regular-body-text" style={{ color: 'var(--color-green-primary)' }}>
                                                {buildDiscountLabel(purchase.appliedGift)}
                                            </span>
                                            <span className="regular-body-text" style={{ color: 'var(--color-green-primary)' }}>
                                                -${purchase.discountAmount.toFixed(2)}
                                            </span>
                                        </div>
                                    )}

                                    {purchase.giftRestored && (
                                        <GiftRestoredNotice
                                            paymentStatus={purchase.paymentStatus}
                                            appliedGift={purchase.orderGift}
                                            giftCode={purchase.orderGiftCode}
                                            compact
                                        />
                                    )}
                                </div>

                                <hr className="history-divider" />

                                <div className="history-actions flex-end">
                                    <button className="outlined-button" onClick={() => handleViewReceipt(purchase)}>
                                        View Receipt
                                    </button>
                                </div>
                            </div>
                        ))}

                        <PaginationBar
                            page={page}
                            totalPages={totalPages}
                            total={total}
                            onPrev={prev}
                            onNext={next}
                            onGoTo={goTo}
                        />
                    </>
                ) : (
                    <div className="no-history-state">
                        <Icon icon="mdi:history" width="48" color="var(--color-black-tertiary)" />
                        <h4 className="mt-l">No purchases found</h4>
                        <p className="regular-body-text text-muted mt-s">You haven't made any purchases in this category yet.</p>
                    </div>
                )}
            </div>

            <CustomerHistoryViewReceipt
                show={isReceiptModalOpen}
                onClose={() => setIsReceiptModalOpen(false)}
                receiptData={selectedReceipt}
            />
        </div>
    );
}