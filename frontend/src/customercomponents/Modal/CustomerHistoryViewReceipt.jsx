import React from 'react';
import { Icon } from '@iconify/react';
import jsPDF from 'jspdf';
import { loadLogo, addReportHeader, addReportFooter, showExportToast, removeExportToast, drawTable, finalizeReport } from '../../utils/pdfExport';
import './CustomerHistoryViewReceipt.css';

const CustomerHistoryViewReceipt = ({ show, onClose, receiptData }) => {
    if (!show) return null;

    const getStatusTextClass = (status) => {
        const s = status?.toLowerCase();
        if (s === 'pending') return 'chvr-text-yellow';
        if (s === 'preparing') return 'chvr-text-blue';
        if (s === 'ready' || s === 'ready for pickup') return 'chvr-text-blue';
        if (s === 'completed' || s === 'confirmed') return 'chvr-text-green';
        return 'chvr-text-green';
    };

    const getPaymentStatusTextClass = (paymentStatus) => {
        const p = paymentStatus?.toLowerCase();
        if (p === 'paid' || p === 'confirmed') return 'chvr-text-green';
        if (p === 'unpaid' || p === 'pending') return 'chvr-text-yellow';
        if (p === 'refunded' || p === 'rejected') return 'chvr-text-red';
        return 'chvr-text-yellow';
    };

    const data = receiptData || {
        orderNum: 'Seat - 12345',
        date: '5/1/2026 10:30:00 PM',
        billedTo: { name: 'Guest', email: 'guest@example.com' },
        paymentMethod: 'Credit Card',
        status: 'Paid',
        paymentStatus: 'Paid',
        items: [],
        subtotal: '$0.00',
        discountAmount: 0,
        discountLabel: '',
        serviceFee: '$0.00',
        tax: '$0.00',
        totalPaid: '$0.00'
    };

    // Discount values — receiptData passes these in from handleViewReceipt
    const discountAmount = data.discountAmount || 0;
    const discountLabel = data.discountLabel || '';

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        const loadingToast = showExportToast();
        const INVOICE_TITLE = 'Transaction Receipt';

        try {
            const logoData = await loadLogo();
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth  = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const MARGIN        = 15;
            const FOOTER_HEIGHT = 15;
            let y = 45;

            addReportHeader(pdf, INVOICE_TITLE, logoData);

            const newPageIfNeeded = (needed) => {
                if (y + needed > pdfHeight - FOOTER_HEIGHT - 5) {
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

            const statusColor =
                data.status === 'Paid'    ? [22, 163, 74]  :
                data.status === 'Pending' ? [217, 119, 6]  :
                                            [180, 50, 50];

            // ── BANNER ────────────────────────────────────────────────────────
            pdf.setFillColor(235, 240, 255);
            pdf.setDrawColor(180, 200, 245);
            pdf.setLineWidth(0.3);
            pdf.roundedRect(MARGIN, y, pdfWidth - MARGIN * 2, 22, 3, 3, 'FD');

            pdf.setFontSize(11);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont('helvetica', 'bold');
            pdf.text(data.orderNum, MARGIN + 4, y + 8);

            pdf.setFontSize(8);
            pdf.setTextColor(80, 90, 130);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Transaction Receipt  •  ${data.date}`, MARGIN + 4, y + 15);

            const badgeX = pdfWidth - MARGIN - 50;
            pdf.setFillColor(30, 60, 114);
            pdf.roundedRect(badgeX, y + 4, 46, 14, 2, 2, 'F');
            pdf.setFontSize(7.5);
            pdf.setTextColor(255, 255, 255);
            pdf.setFont('helvetica', 'normal');
            pdf.text('Total Paid', badgeX + 23, y + 10, { align: 'center' });
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.text(data.totalPaid, badgeX + 23, y + 16, { align: 'center' });

            y += 30;

            // ── INVOICE DETAILS ───────────────────────────────────────────────
            sectionHeading('Invoice Details');

            const cardW = (pdfWidth - MARGIN * 2 - 6) / 2;
            const cardH = 40;

            const detailCards = [
                {
                    title: 'Billed To',
                    lines: [
                        { label: 'Name',  value: data.billedTo.name  },
                        { label: 'Email', value: data.billedTo.email },
                        { label: 'Date',  value: data.date           },
                    ],
                    color:  [30, 60, 114],
                    bg:     [235, 240, 255],
                    border: [180, 200, 245],
                },
                {
                    title: 'Payment Information',
                    lines: [
                        { label: 'Method', value: data.paymentMethod },
                        ...(data.poNumber ? [{ label: 'PO Number', value: data.poNumber }] : []),
                        { label: 'Status',         value: data.status        },
                        { label: 'Payment Status', value: data.paymentStatus },
                        { label: 'Total',          value: data.totalPaid     },
                    ],
                    color:  statusColor,
                    bg:     data.status === 'Paid'    ? [235, 255, 245] :
                            data.status === 'Pending' ? [255, 251, 235] : [255, 240, 240],
                    border: data.status === 'Paid'    ? [180, 235, 210] :
                            data.status === 'Pending' ? [245, 220, 160] : [245, 190, 190],
                },
            ];

            detailCards.forEach((card, i) => {
                const cx = MARGIN + i * (cardW + 6);
                const cy = y;

                pdf.setFillColor(...card.bg);
                pdf.setDrawColor(...card.border);
                pdf.setLineWidth(0.3);
                pdf.roundedRect(cx, cy, cardW, cardH, 3, 3, 'FD');

                pdf.setFillColor(...card.color);
                pdf.circle(cx + 5, cy + 6, 2, 'F');
                pdf.setFontSize(8.5);
                pdf.setTextColor(...card.color);
                pdf.setFont('helvetica', 'bold');
                pdf.text(card.title, cx + 10, cy + 7);

                card.lines.forEach((line, li) => {
                    const lineY = cy + 14 + li * 5.5;
                    pdf.setFontSize(7.5);
                    pdf.setTextColor(100, 100, 100);
                    pdf.setFont('helvetica', 'normal');
                    pdf.text(`${line.label}:`, cx + 5, lineY);
                    pdf.setTextColor(40, 40, 40);
                    pdf.setFont('helvetica', 'bold');
                    const val = pdf.splitTextToSize(line.value || '', cardW - 30);
                    pdf.text(val[0], cx + cardW - 4, lineY, { align: 'right' });
                });
            });

            y += cardH + 10;

            // ── ITEMS TABLE ───────────────────────────────────────────────────
            // Items are always at original face price; BXGY free seat shown as Free
            newPageIfNeeded(20);
            sectionHeading('Items');

            const headers = ['Item', 'Type', 'Qty', 'Unit Price', 'Total'];
            const rows = data.items.map(item => [
                item.item,
                item.type,
                item.qty.toString(),
                item.isFree ? 'Free' : item.price,
                item.isFree ? 'Free' : item.total,
            ]);

            y = drawTable(pdf, y, headers, rows, MARGIN, pdfWidth, pdfHeight, FOOTER_HEIGHT, 12, 5, logoData, INVOICE_TITLE);

            // ── PAYMENT SUMMARY ───────────────────────────────────────────────
            // Subtotal = original prices, then discount shown as its own line
            y += 8;
            newPageIfNeeded(60);
            sectionHeading('Payment Summary');

            const summaryRows = [
                { label: 'Subtotal (before discount)', value: data.subtotal,   bold: false, color: null },
                // Discount line — only shown when a gift card / promo was applied
                ...(discountAmount > 0 && discountLabel
                    ? [{ label: discountLabel, value: `-$${discountAmount.toFixed(2)}`, bold: false, color: [22, 163, 74] }]
                    : []),
                { label: 'Service Fee',               value: data.serviceFee, bold: false, color: null },
                { label: 'Tax',                        value: data.tax,        bold: false, color: null },
                { label: 'Total Paid',                 value: data.totalPaid,  bold: true,  color: null, highlight: true },
            ];

            const summaryW = 90;
            const summaryX = pdfWidth - MARGIN - summaryW;

            summaryRows.forEach((row, i) => {
                if (row.highlight) {
                    pdf.setFillColor(30, 60, 114);
                    pdf.roundedRect(summaryX, y - 3, summaryW, 10, 2, 2, 'F');
                    pdf.setFontSize(9);
                    pdf.setTextColor(255, 255, 255);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text(row.label, summaryX + 5, y + 4);
                    pdf.text(row.value, summaryX + summaryW - 4, y + 4, { align: 'right' });
                    y += 13;
                } else {
                    pdf.setFontSize(8.5);
                    if (row.color) {
                        pdf.setTextColor(...row.color);
                    } else {
                        pdf.setTextColor(80, 80, 80);
                    }
                    pdf.setFont('helvetica', row.bold ? 'bold' : 'normal');
                    pdf.text(row.label, summaryX + 5, y + 4);
                    if (row.color) {
                        pdf.setTextColor(...row.color);
                    } else {
                        pdf.setTextColor(40, 40, 40);
                    }
                    pdf.text(row.value, summaryX + summaryW - 4, y + 4, { align: 'right' });

                    pdf.setDrawColor(220, 220, 230);
                    pdf.setLineWidth(0.2);
                    pdf.line(summaryX, y + 7, summaryX + summaryW, y + 7);
                    y += 10;
                }
            });

            // ── FOOTER STRIP ──────────────────────────────────────────────────
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
                `Receipt ${data.orderNum}  •  Generated by eTicketsPro`,
                pdfWidth / 2, y + 9, { align: 'center' }
            );

            finalizeReport(pdf);
            pdf.save(`Receipt_${data.orderNum.replace(/\s+/g, '_')}.pdf`);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            removeExportToast(loadingToast);
        }
    };

    return (
        <div className="chvr-modal-overlay">
            <div className="chvr-modal-container">
                <button className="chvr-close-btn" onClick={onClose}>
                    <Icon icon="mdi:close" width="24" />
                </button>

                <div className="chvr-receipt-header">
                    <div className="chvr-header-left text-left">
                        <div className="chvr-logo-container">
                            <img src="/logo/Logo1.png" alt="eTicketsPro" className="chvr-logo-image" />
                        </div>
                        <p className="small-body-text text-secondary mt-1 m-0">Transaction Receipt</p>
                    </div>
                    <div className="chvr-header-right text-right" style={{ paddingRight: '0' }}>
                        <h4 className="text-black m-0 mb-1">{data.orderNum}</h4>
                        <p className="small-body-text text-secondary m-0">{data.date}</p>
                    </div>
                </div>

                <hr className="chvr-divider" />

                <div className="chvr-billing-info">
                    <div className="chvr-info-block text-left">
                        <span className="smaller-body-text chvr-info-label">BILLED TO</span>
                        <h6 className="text-black m-0 mb-1">{data.billedTo.name}</h6>
                        <span className="small-body-text text-secondary">{data.billedTo.email}</span>
                    </div>
                    <div className="chvr-info-block text-right">
                        <span className="smaller-body-text chvr-info-label">PAYMENT METHOD</span>
                        <h6 className="text-black m-0 mb-1">
                            {data.paymentMethod}
                            {data.poNumber && <span className="text-secondary ml-1" style={{ fontWeight: 'normal' }}> {data.poNumber}</span>}
                        </h6>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', marginTop: '8px' }}>
                            <span className="small-body-text text-secondary" style={{ fontSize: '13px' }}>
                                Status: <span className={getStatusTextClass(data.status)}>{data.status}</span>
                            </span>
                            <span className="small-body-text text-secondary" style={{ fontSize: '13px' }}>
                                Payment: <span className={getPaymentStatusTextClass(data.paymentStatus)}>{data.paymentStatus || 'Paid'}</span>
                            </span>
                        </div>
                    </div>
                </div>

                <hr className="chvr-divider" />

                {/* Items table — original face prices; BXGY free seat shown as Free */}
                <div className="chvr-table-container">
                    <table className="chvr-table">
                        <thead>
                            <tr>
                                <th className="text-left">Item</th>
                                <th className="text-left">Type</th>
                                <th className="text-center">Qty</th>
                                <th className="text-right">Unit Price</th>
                                <th className="text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.items.map((row, index) => (
                                <tr key={index}>
                                    <td className="text-left text-black">{row.item}</td>
                                    <td className="text-left text-secondary">{row.type}</td>
                                    <td className="text-center text-black">{row.qty}</td>
                                    <td className="text-right" style={row.isFree ? { color: 'var(--color-green-primary)', fontWeight: 600 } : {}}>
                                        {row.isFree ? 'Free' : row.price}
                                    </td>
                                    <td className="text-right" style={row.isFree ? { color: 'var(--color-green-primary)', fontWeight: 600 } : { color: 'var(--color-black-primary)' }}>
                                        {row.isFree ? 'Free' : row.total}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <hr className="chvr-divider" />

                <div className="chvr-summary-container">
                    <div className="chvr-summary-content">
                        {/* Subtotal — always the sum of original face prices, never adjusted */}
                        <div className="chvr-summary-row mb-2">
                            <span className="small-body-text text-black">Subtotal (before discount)</span>
                            <span className="small-body-text text-black">{data.subtotal}</span>
                        </div>

                        {/* Discount line — only shown when a gift card / promo was applied */}
                        {discountAmount > 0 && discountLabel && (
                            <div className="chvr-summary-row mb-2">
                                <span className="small-body-text" style={{ color: 'var(--color-green-primary)' }}>{discountLabel}</span>
                                <span className="small-body-text" style={{ color: 'var(--color-green-primary)' }}>-${discountAmount.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="chvr-summary-row mb-2">
                            <span className="small-body-text text-black">Service Fee</span>
                            <span className="small-body-text text-black">{data.serviceFee}</span>
                        </div>
                        <div className="chvr-summary-row mb-3">
                            <span className="small-body-text text-black">Tax</span>
                            <span className="small-body-text text-black">{data.tax}</span>
                        </div>

                        <hr className="chvr-divider mb-3 mt-3" />

                        <div className="chvr-summary-row">
                            <h4 className="text-black m-0">Total Paid</h4>
                            <h4 className="text-red m-0">{data.totalPaid}</h4>
                        </div>
                    </div>
                </div>

                <hr className="chvr-divider" />

                <div className="chvr-footer-content">
                    <h4 className="text-black mb-2 m-0 mt-2">Thank you for your purchase!</h4>
                    <p className="small-body-text text-secondary mb-1 mt-2">Please present your QR ticket at the event entrance.</p>
                    <p className="small-body-text text-secondary mb-3 mt-0">For food and merch orders, present your pickup ticket at the vendor booth.</p>
                    <p className="smaller-body-text text-secondary m-0">Support Contact: support@eticketspro.com</p>

                    <button className="primary-button chvr-print-btn mt-2" onClick={handleDownloadPDF} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon icon="mdi:download" width="18" className="mr-2" />
                        Download PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerHistoryViewReceipt;