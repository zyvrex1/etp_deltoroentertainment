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

    useEffect(() => {
        const fetchInvoices = async () => {
            if (!user) return;
            try {
                setLoading(true);
                const reservations = await reservationService.getMyReservations(user.token);
                
                const formattedInvoices = reservations.map((res, index) => {
                    const eventTitle = res.event?.title || 'Unknown Event';
                    const invoiceRef = `INV-${new Date(res.createdAt).getFullYear()}-${res._id.slice(-5).toUpperCase()}`;
                    const createdDate = new Date(res.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    
                    const subtotal = res.amount?.subtotal || 0;
                    const fee = res.amount?.fee || 0;
                    const tax = res.amount?.tax || 0;
                    const total = res.amount?.total || 0;
                    
                    let companyAddr = '';
                    if (res.billingAddress?.address) {
                        companyAddr += res.billingAddress.address;
                    } else if (user.streetAddress) {
                        companyAddr += user.streetAddress;
                    }

                    if (res.billingAddress?.city || user.city) {
                        if (companyAddr) companyAddr += ', ';
                        companyAddr += res.billingAddress?.city || user.city;
                    }

                    if (res.billingAddress?.zipCode || user.zipCode) {
                        if (companyAddr) companyAddr += ' ';
                        companyAddr += res.billingAddress?.zipCode || user.zipCode;
                    }

                    return {
                        id: res._id,
                        title: eventTitle,
                        invoiceRef: invoiceRef,
                        booth: `Booth ${res.boothCode || 'N/A'}`,
                        amount: `$${total.toLocaleString(undefined, {minimumFractionDigits: 2})}`,
                        issuedDate: createdDate,
                        paidDate: createdDate, // Treat as paid immediately for now
                        companyName: res.billingAddress?.companyName || user.companyName || 'Your Company',
                        companyAddress: companyAddr.trim() || 'Address not provided',
                        taxId: 'N/A',
                        items: [
                            { description: `Booth Registration (${res.boothCode || ''})`, qty: 1, unitPrice: `$${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}`, total: `$${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}` },
                            { description: 'Processing Fee', qty: 1, unitPrice: `$${fee.toLocaleString(undefined, {minimumFractionDigits: 2})}`, total: `$${fee.toLocaleString(undefined, {minimumFractionDigits: 2})}` },
                            { description: 'Tax', qty: 1, unitPrice: `$${tax.toLocaleString(undefined, {minimumFractionDigits: 2})}`, total: `$${tax.toLocaleString(undefined, {minimumFractionDigits: 2})}` }
                        ],
                        subtotal: `$${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}`,
                        totalDue: `$${total.toLocaleString(undefined, {minimumFractionDigits: 2})}`,
                        paymentMethod: res.paymentMethod === 'card' ? 'Credit Card' : 'Invoice'
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
                item.paidDate
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
            pdf.text(`Event: ${item.title}`, MARGIN, y);
            y += 6;
            pdf.text(`Booth: ${item.booth}`, MARGIN, y);
            y += 6;
            pdf.text(`Invoice Ref: ${item.invoiceRef}`, MARGIN, y);
            y += 6;
            pdf.text(`Company: ${item.companyName}`, MARGIN, y);
            y += 6;
            
            // Wrap address text if it's too long
            const addressText = `Address: ${item.companyAddress}`;
            const maxWidth = pdf.internal.pageSize.getWidth() - (MARGIN * 2);
            const wrappedAddress = pdf.splitTextToSize(addressText, maxWidth);
            
            pdf.text(wrappedAddress, MARGIN, y);
            y += (wrappedAddress.length * 5); // Adjust Y based on wrapped lines count

            pdf.text(`Tax ID: ${item.taxId}`, MARGIN, y);
            y += 6;
            pdf.text(`Issued Date: ${item.issuedDate}`, MARGIN, y);
            y += 6;
            pdf.text(`Paid Date: ${item.paidDate}`, MARGIN, y);
            y += 20;

            const headers = ['Description', 'Qty', 'Unit Price', 'Total'];
            const rows = item.items.map(i => [
                i.description,
                i.qty.toString(),
                i.unitPrice,
                i.total
            ]);

            y = drawTable(pdf, y, headers, rows, MARGIN, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 15, 12, 5, logoData, INVOICE_TITLE);

            y += 20;
            pdf.setFontSize(12);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`Total Due: ${item.totalDue}`, MARGIN, y);

            y += 15;
            pdf.setFontSize(10);
            pdf.setTextColor(30, 60, 114);
            pdf.text('Payment Instructions:', MARGIN, y);
            y += 6;
            pdf.setFontSize(9);
            pdf.setTextColor(50, 50, 50);
            pdf.setFont('helvetica', 'normal');
            pdf.text('Wire Transfer: Bank of America, Account #123456789, Routing #987654321', MARGIN, y);
            y += 5;
            pdf.text('ACH: Use invoice number as reference', MARGIN, y);
            y += 5;
            pdf.text('Questions? Contact us at billing@eticketspro.com or call +1 (555) 123-4567', MARGIN, y);
            y += 10;

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
        // Search filter
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.invoiceRef.toLowerCase().includes(searchQuery.toLowerCase());

        // Date range filtering (based on original createdAt date stored in the item if possible, 
        // or re-parse issuedDate. Since issuedDate is formatted, it's better to use the raw date.
        // In this component, we mapped res.createdAt to issuedDate string.
        // Let's re-parse issuedDate for filtering or add rawDate to the object.)
        const invoiceDate = new Date(item.paidDate); // paidDate is mapped from res.createdAt
        const matchesDate = invoiceDate >= dateRange.start && invoiceDate <= dateRange.end;

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
                                <div className="skeleton" style={{width: '40px', height: '40px', borderRadius: '8px'}}></div>
                                <div className="si-card-info">
                                    <div className="skeleton skeleton-text title" style={{width: '200px'}}></div>
                                    <div className="skeleton skeleton-text" style={{width: '150px'}}></div>
                                    <div className="skeleton skeleton-text" style={{width: '180px'}}></div>
                                </div>
                            </div>
                            <div className="si-card-right">
                                <div className="si-amount-sec">
                                    <div className="skeleton skeleton-text" style={{width: '40px'}}></div>
                                    <div className="skeleton skeleton-text title" style={{width: '80px'}}></div>
                                </div>
                                <div className="skeleton skeleton-button" style={{width: '80px'}}></div>
                            </div>
                        </div>
                    ))
                ) : paginatedInvoices.length > 0 ? (
                    paginatedInvoices.map((item) => (
                        <div className="si-card" key={item.id}>
                            <div className="si-card-left">
                                <div className="si-card-icon">
                                    <Icon icon="mdi:file-document" width="24" color="var(--color-white-primary)" />
                                </div>
                                <div className="si-card-info">
                                    <h5 className="si-title">{item.title}</h5>
                                    <div className="si-meta small-body-text text-secondary">
                                        Invoice {item.invoiceRef} • {item.booth}
                                    </div>
                                    <div className="si-dates small-body-text text-secondary">
                                        <span className="si-date-item">
                                            <Icon icon="mdi:calendar-blank" /> Issued: {item.issuedDate}
                                        </span>
                                        <span className="si-date-item text-green">
                                            <Icon icon="mdi:check-circle-outline" /> Paid: {item.paidDate}
                                        </span>
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
