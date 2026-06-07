import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import './SponsorInvoice.css';
import SponsorViewInvoiceReceipt from './SponsorModal/SponsorViewInvoiceReceipt';
import DateRangePicker from '../utils/DateRangePicker';
import jsPDF from 'jspdf';
import { loadLogo, addReportHeader, addReportFooter, showExportToast, removeExportToast, drawTable, finalizeReport } from '../utils/pdfExport';
import reservationService from '../services/reservationService';
import { useAuthContext } from '../hooks/useAuthContext';

export default function SponsorInvoice() {
    const { user } = useAuthContext();
    const [allInvoices, setAllInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const PAGE_TITLE = 'Invoices Report';

    const groupReservations = (reservations) => {
        const groups = [];
        reservations.forEach(res => {
            const eventId = (res.event?._id || res.event)?.toString();
            const createdTime = new Date(res.createdAt).getTime();

            const existing = groups.find(g =>
                g.eventId === eventId &&
                g.paymentMethod === res.paymentMethod &&
                Math.abs(g.createdTime - createdTime) < 10000 &&
                !g.reservations.some(r => r._id === res._id)
            );

            if (existing) {
                existing.reservations.push(res);
                existing.totalAmount += res.amount?.total || 0;
            } else {
                groups.push({
                    eventId,
                    paymentMethod: res.paymentMethod,
                    createdTime,
                    reservations: [res],
                    totalAmount: res.amount?.total || 0,
                });
            }
        });
        return groups;
    };

    useEffect(() => {
        const fetchInvoices = async () => {
            if (!user) return;
            try {
                setLoading(true);
                const reservations = await reservationService.getMyReservations(user.token);

                // Include both confirmed AND pending reservations
                const relevantReservations = reservations.filter(res => {
                    const status = res.status?.toLowerCase();
                    return status === 'confirmed' || status === 'pending';
                });

                const grouped = groupReservations(relevantReservations);

                // Inside fetchInvoices(), replace the formattedInvoices mapping:

                const formattedInvoices = grouped.map(group => {
                    const res = group.reservations[0];
                    const allRes = group.reservations;
                    const isSeat = res.type === 'seat';
                    const status = res.status?.toLowerCase();
                    const isPaid = status === 'confirmed';
                    const paymentStatus = status === 'confirmed' ? 'Paid'
                        : status === 'rejected' ? 'Rejected'
                        : status === 'refunded' ? 'Refunded'
                        : status === 'cancelled' ? 'Cancelled'
                        : 'Pending';

                    const subtotal = allRes.reduce((s, r) => s + (r.amount?.subtotal || 0), 0);
                    const isBXGY_check = res.appliedGift?.valueType === 'bxgy';
const discountAmt = isBXGY_check
    ? allRes.filter(r => (r.amount?.subtotal || 0) === 0)
            .reduce((s, r) => s + (r.amount?.discount || 0), 0)
    : allRes.reduce((s, r) => s + (r.amount?.discount || 0), 0);  // sum all for display
                    const discountLabel = res.amount?.discountLabel || res.appliedGift?.name || null;
                    const fee = allRes.reduce((s, r) => s + (r.amount?.fee || 0), 0);
                    const tax = allRes.reduce((s, r) => s + (r.amount?.tax || 0), 0);
                    const total = group.totalAmount;
                    const isBXGY = res.appliedGift?.valueType === 'bxgy';
                    const bxgyFreeAmount = isBXGY
                        ? allRes
                            .filter(r => (r.amount?.subtotal || 0) === 0)
                            .reduce((s, r) => s + (r.amount?.discount || 0), 0)
                        : 0;

                    const boothLabel = isSeat
                        ? (res.seatLabels?.length > 1
                            ? `${res.seatLabels.length} Seats (${res.seatLabels.join(', ')})`
                            : `Seat ${res.seatLabels?.[0] || res.seatIds?.[0] || 'N/A'}`)
                        : (allRes.length > 1
                            ? `${allRes.length} Booths (${allRes.map(r => `#${r.boothCode}`).join(', ')})`
                            : `Booth #${res.boothCode || 'N/A'}`);

                    let lineItems;

                    if (isBXGY && !isSeat && allRes.length > 1) {
                        lineItems = allRes.map((r) => {
                            const isFreeItem = (r.amount?.subtotal || 0) === 0;
                            const originalPrice = r.amount?.subtotal || 0;
                            return {
                                description: `Booth Registration (#${r.boothCode || ''})`,
                                qty: 1,
                                unitPrice: isFreeItem ? 'FREE' : `$${originalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                                total: isFreeItem ? '$0.00' : `$${originalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                                isFree: isFreeItem,
                            };
                        });
                    }
                    else if (isSeat) {
                        lineItems = [{
                            description: `Seat Registration (${res.seatLabels?.join(', ') || 'N/A'})`,
                            qty: res.seatIds?.length || 1,
                            unitPrice: `$${(subtotal / (res.seatIds?.length || 1)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                            total: `$${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                        }];
                    }
                    else {
                        lineItems = allRes.map(r => ({
                            description: `Booth Registration (${r.boothCode || ''})`,
                            qty: 1,
                            unitPrice: `$${((r.amount?.subtotal || 0) + (r.amount?.discount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                            total: `$${((r.amount?.subtotal || 0) + (r.amount?.discount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                        }));
                    }

                    if (discountAmt > 0 && !isBXGY) {
                        const giftType = res.appliedGift?.valueType;
                        const giftValue = res.appliedGift?.value;
                        const discountSuffix = giftType === 'percent'
                            ? `${giftValue}% off`
                            : giftType === 'fixed'
                                ? `$${giftValue?.toLocaleString()} off`
                                : discountLabel || '';
                        lineItems.push({
                            description: `Gift Card Discount${discountSuffix ? ` — ${discountSuffix}` : ''}`,
                            qty: 1,
                            unitPrice: `-$${discountAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                            total: `-$${discountAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                            isDiscount: true,
                        });
                    }

                    lineItems.push(
                        { description: 'Tax', qty: 1, unitPrice: `$${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, total: `$${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
                        { description: 'Processing Fee', qty: 1, unitPrice: `$${fee.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, total: `$${fee.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
                    );

                    const invoiceNum = res.poNumber || res._id?.toString().slice(-8).toUpperCase();
                    const issuedDateObj = new Date(res.createdAt);
                    const paidDateObj = isPaid ? issuedDateObj : null;
                    const dateOpts = { month: 'short', day: 'numeric', year: 'numeric' };

                    return {
                        id: res._id,
                        title: res.event?.title || 'Unknown Event',
                        invoiceRef: `INV-${invoiceNum}`,
                        booth: boothLabel,
                        amount: `$${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                        subtotal: `$${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                        totalDue: `$${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                        status: isPaid ? 'paid' : (status === 'rejected' || status === 'refunded' ? status : 'pending'),
                        paymentStatus,
                        issuedDate: issuedDateObj.toLocaleDateString('en-US', dateOpts),
                        paidDate: paidDateObj ? paidDateObj.toLocaleDateString('en-US', dateOpts) : null,
                        paymentMethod: res.paymentMethod === 'card' ? 'Credit Card' : 'Invoice / Bank Transfer',
                        companyName: res.billingAddress?.company || `${res.user?.firstName || ''} ${res.user?.lastName || ''}`.trim() || 'N/A',
                        companyAddress: [res.billingAddress?.address, res.billingAddress?.city, res.billingAddress?.country].filter(Boolean).join(', ') || 'N/A',
                        taxId: res.billingAddress?.taxId || 'N/A',
                        items: lineItems,
                        fullReservation: res,
                        appliedGift: res.appliedGift?.valueType ? res.appliedGift : null,
                        giftCode: res.giftCode || null,
                        discount: discountAmt,
                        discountLabel: discountLabel,
                        isBXGY: isBXGY,
                    };
                });

                setAllInvoices(formattedInvoices);
            } catch (error) {
                console.error("Error fetching invoices:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInvoices();
    }, [user]);

    const exportAllInvoicesToPDF = async () => {
        const loadingToast = showExportToast();
        try {
            const logoData = await loadLogo();
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const MARGIN = 15;
            let y = 45;

            addReportHeader(pdf, PAGE_TITLE, logoData);

            pdf.setFontSize(14);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Invoices Summary', MARGIN, y);
            y += 20;

            const headers = ['Event', 'Invoice #', 'Booth', 'Amount', 'Issued', 'Paid'];
            const rows = filteredInvoices.map(item => [
                item.title,
                item.invoiceRef,
                item.booth,
                item.amount,
                item.issuedDate,
                item.paidDate ?? 'Pending'
            ]);

            y = drawTable(pdf, y, headers, rows, MARGIN, pdfWidth, pdfHeight, 15, 12, 5, logoData, PAGE_TITLE);

            finalizeReport(pdf);
            pdf.save(`Invoices_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            removeExportToast(loadingToast);
        }
    };

    const downloadInvoicePDF = async (item) => {
        const loadingToast = showExportToast();
        const INVOICE_TITLE = 'Invoice';
        try {
            const logoData = await loadLogo();
            const pdf = new jsPDF('p', 'mm', 'a4');
            const MARGIN = 15;
            let y = 45;

            addReportHeader(pdf, INVOICE_TITLE, logoData);

            pdf.setFontSize(14);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Invoice Details', MARGIN, y);
            y += 10;

            pdf.setFontSize(10);
            pdf.setTextColor(50, 50, 50);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Event: ${item.title}`, MARGIN, y); y += 6;
            pdf.text(`Booth: ${item.booth}`, MARGIN, y); y += 6;
            pdf.text(`Invoice Ref: ${item.invoiceRef}`, MARGIN, y); y += 6;
            pdf.text(`Company: ${item.companyName}`, MARGIN, y); y += 6;

            const addressText = `Address: ${item.companyAddress}`;
            const maxWidth = pdf.internal.pageSize.getWidth() - (MARGIN * 2);
            const wrappedAddress = pdf.splitTextToSize(addressText, maxWidth);
            pdf.text(wrappedAddress, MARGIN, y);
            y += (wrappedAddress.length * 5);

            pdf.text(`Tax ID: ${item.taxId}`, MARGIN, y); y += 6;
            pdf.text(`Issued Date: ${item.issuedDate}`, MARGIN, y); y += 6;

            // Show paid date or pending
            if (item.status === 'paid') {
                pdf.text(`Paid Date: ${item.paidDate}`, MARGIN, y);
            } else {
                pdf.setTextColor(217, 119, 6); // amber
                pdf.text(`Paid Date: Not yet paid`, MARGIN, y);
                pdf.setTextColor(50, 50, 50);
            }
            y += 20;

            const headers = ['Description', 'Qty', 'Unit Price', 'Total'];
            const rows = item.items.map(i => [i.description, i.qty.toString(), i.unitPrice, i.total]);

            y = drawTable(pdf, y, headers, rows, MARGIN, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 15, 12, 5, logoData, INVOICE_TITLE);

            y += 10;
            pdf.setFontSize(12);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`Total Due: ${item.totalDue}`, MARGIN, y);
            y += 12;

            // ── Payment Status Box ──────────────────────────────────────────
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const boxWidth = pdfWidth - MARGIN * 2;
            const boxHeight = 18;

            if (item.status === 'paid') {
                // Green box
                pdf.setFillColor(240, 253, 244);
                pdf.setDrawColor(187, 247, 208);
            } else {
                // Amber box
                pdf.setFillColor(255, 251, 235);
                pdf.setDrawColor(253, 230, 138);
            }

            pdf.setLineWidth(0.4);
            pdf.roundedRect(MARGIN, y, boxWidth, boxHeight, 3, 3, 'FD');

            // Icon placeholder (circle)
            const iconX = MARGIN + 5;
            const iconCenterY = y + boxHeight / 2;
            pdf.setFillColor(item.status === 'paid' ? 22 : 217, item.status === 'paid' ? 163 : 119, item.status === 'paid' ? 74 : 6);
            pdf.circle(iconX, iconCenterY, 2.5, 'F');

            // Checkmark or clock symbol inside circle
            pdf.setFontSize(5);
            pdf.setTextColor(255, 255, 255);
            pdf.text(item.status === 'paid' ? '✓' : '!', iconX, iconCenterY + 1.5, { align: 'center' });

            // Status title
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(item.status === 'paid' ? 6 : 146, item.status === 'paid' ? 95 : 64, item.status === 'paid' ? 70 : 14);
            pdf.text(item.status === 'paid' ? 'Payment Received' : 'Payment Pending', iconX + 6, iconCenterY - 1.5);

            // Status subtitle
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(100, 100, 100);
            const subText = item.status === 'paid'
                ? `Paid on ${item.paidDate} via ${item.paymentMethod}`
                : 'This invoice has not been paid yet. Please complete your payment.';
            pdf.text(subText, iconX + 6, iconCenterY + 4);

            y += boxHeight + 12;
            // ───────────────────────────────────────────────────────────────

            pdf.setFontSize(10);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Payment Instructions:', MARGIN, y); y += 6;
            pdf.setFontSize(9);
            pdf.setTextColor(50, 50, 50);
            pdf.setFont('helvetica', 'normal');
            pdf.text('Wire Transfer: Bank of America, Account #123456789, Routing #987654321', MARGIN, y); y += 5;
            pdf.text('ACH: Use invoice number as reference', MARGIN, y); y += 5;
            pdf.text('Questions? Contact us at billing@eticketspro.com or call +1 (555) 123-4567', MARGIN, y);

            finalizeReport(pdf);
            pdf.save(`Invoice_${item.invoiceRef}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            removeExportToast(loadingToast);
        }
    };
    const handleViewInvoice = (invoice) => {
        // Map list item structure to match what the modal expects
        const mappedInvoice = {
            ...invoice,
            issueDate: invoice.issuedDate,
            dueDate: invoice.issuedDate,
        };
        setSelectedInvoice(mappedInvoice);
        setIsInvoiceModalOpen(true);
    };

    const closeInvoiceModal = () => {
        setIsInvoiceModalOpen(false);
        setSelectedInvoice(null);
    };

    // Pagination Logic
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [dateRange, setDateRange] = useState(() => ({
        preset: 'all',
        presetLabel: 'All time',
        start: new Date(2000, 0, 1),
        end: new Date(2100, 11, 31),
    }));

    const handleDateRangeChange = (newRange) => {
        setDateRange(newRange);
        setCurrentPage(1);
    };
    const filteredInvoices = allInvoices.filter(item => {
        if (!item?.title || !item?.invoiceRef) return false;
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.invoiceRef.toLowerCase().includes(searchQuery.toLowerCase());
        const dateToCheck = item.paidDate ? new Date(item.paidDate) : new Date(item.issuedDate);
        const matchesDate = dateToCheck >= dateRange.start && dateToCheck <= dateRange.end;
        return matchesSearch && matchesDate;
    });

    const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="sponsor-invoice-wrapper">
            <div className="sponsor-invoice-header">
                <h2>Invoices & Receipts</h2>
                <p className="regular-body-text text-secondary">View and download your sponsorship invoices and payment receipts.</p>
            </div>

            <div className="si-controls">
                <div className="si-search">
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
                <div className="si-filters">
                    <button className="outlined-button si-filter-btn" onClick={exportAllInvoicesToPDF}>
                        <Icon icon="mdi:tray-arrow-up" className="export-icon" />
                        Export Invoices
                    </button>
                    <DateRangePicker
                        value={dateRange}
                        onChange={handleDateRangeChange}
                        buttonClassName="outlined-button si-filter-btn"
                        placeholder="Date Range"
                    />
                </div>
            </div>

            <div className="si-list">
                {loading ? (
                    [...Array(5)].map((_, i) => (
                        <div className="si-card" key={i}>
                            <div className="si-card-left">
                                <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '8px' }}></div>
                                <div className="si-card-info">
                                    <div className="skeleton skeleton-text title" style={{ width: '200px' }}></div>
                                    <div className="skeleton skeleton-text" style={{ width: '150px' }}></div>
                                    <div className="skeleton skeleton-text" style={{ width: '180px' }}></div>
                                </div>
                            </div>
                            <div className="si-card-right">
                                <div className="si-amount-sec">
                                    <div className="skeleton skeleton-text" style={{ width: '40px' }}></div>
                                    <div className="skeleton skeleton-text title" style={{ width: '80px' }}></div>
                                </div>
                                <div className="skeleton skeleton-button" style={{ width: '80px' }}></div>
                            </div>
                        </div>
                    ))
                ) : paginatedInvoices.length > 0 ? (
                    paginatedInvoices.map((item) => (
                        <div className="si-card" key={item.id}>
                            <div className="si-card-left">
                                <div className={`si-card-icon ${item.status === 'pending' ? 'pending' : ''}`}>
                                    <Icon
                                        icon={item.status === 'pending' ? 'mdi:file-clock-outline' : 'mdi:file-document'}
                                        width="24"
                                        color="var(--color-white-primary)"
                                    />
                                </div>
                                <div className="si-card-info">
                                    <div className="si-title-row">
                                        <h5 className="si-title">{item.title}</h5>
                                    </div>
                                    <div className="si-meta small-body-text text-secondary">
                                        Invoice {item.invoiceRef} • {item.booth}
                                    </div>
                                    <div className="si-dates small-body-text text-secondary">
                                        <span className="si-date-item">
                                            <Icon icon="mdi:calendar-blank" /> Issued: {item.issuedDate}
                                        </span>
                                        {item.status === 'paid' ? (
                                            <span className="si-date-item text-green">
                                                <Icon icon="mdi:check-circle-outline" /> Paid: {item.paidDate}
                                            </span>
                                        ) : (
                                            <span className="si-date-item text-warning">
                                                <Icon icon="mdi:clock-outline" /> Awaiting Payment
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="si-card-right">
                                <div className="si-amount-sec">
                                    <span className="smaller-body-text text-secondary">Amount</span>
                                    <h4 className="si-amount">{item.amount}</h4>
                                </div>
                                <div className="si-actions">
                                    <button className="si-action-btn view" onClick={() => handleViewInvoice(item)}>
                                        <Icon icon="mdi:eye-outline" width="20" />
                                    </button>
                                    <button className="si-action-btn download" onClick={() => downloadInvoicePDF(item)}>
                                        <Icon icon="mdi:download-outline" width="20" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-black-secondary)' }}>
                        <Icon icon="mdi:file-document-remove-outline" width="48" />
                        <p>No invoices or receipts found.</p>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="pagination invoice-pagination">
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

            <SponsorViewInvoiceReceipt
                isOpen={isInvoiceModalOpen}
                onClose={closeInvoiceModal}
                invoiceItem={selectedInvoice}
                onDownload={() => downloadInvoicePDF(selectedInvoice)}
            />
        </div>
    );
}
