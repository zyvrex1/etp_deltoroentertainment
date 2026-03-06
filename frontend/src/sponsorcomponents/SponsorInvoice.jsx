import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import './SponsorInvoice.css';
import SponsorViewInvoiceReceipt from './SponsorModal/SponsorViewInvoiceReceipt';
import DateRangePicker from '../admincomponents/DateRangePicker';
import jsPDF from 'jspdf';
import { loadLogo, addReportHeader, addReportFooter, showExportToast, removeExportToast, drawTable } from '../admincomponents/utils/pdfExport';

export default function SponsorInvoice() {
    // Mock Data
    const allInvoices = Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        title: (i % 2 === 0) ? 'TechInnovate Summit 2026' : 'Global Healthcare Expo 2024',
        invoiceRef: (i % 2 === 0) ? 'INV-2026-001' : 'INV-2024-002',
        booth: (i % 2 === 0) ? 'Booth #102' : 'Booth #405',
        amount: (i % 2 === 0) ? '$5,575' : '$2,750',
        issuedDate: (i % 2 === 0) ? 'May 15, 2026' : 'Aug 10, 2024',
        paidDate: (i % 2 === 0) ? 'May 15, 2026' : 'Aug 10, 2024',
        // extra info for invoice modal
        companyName: 'TechCorp Inc.',
        companyAddress: '123 Tech Street\nSan Francisco, CA 94105',
        taxId: 'TAX-123456789',
        items: [
            { description: 'Premium Island Booth (20x20)', qty: 1, unitPrice: (i % 2 === 0) ? '$ 5,000' : '$ 2,175', total: (i % 2 === 0) ? '$ 5,000' : '$ 2,175' },
            { description: 'Processing Fee', qty: 1, unitPrice: '$ 150', total: '$ 150' },
            { description: 'Tax (8.5%)', qty: 1, unitPrice: '$ 425', total: '$ 425' }
        ],
        subtotal: (i % 2 === 0) ? '$5,575' : '$2,750',
        totalDue: (i % 2 === 0) ? '$5,575' : '$2,750',
        paymentMethod: 'Visa ending in 4242'
    }));

    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    const exportAllInvoicesToPDF = async () => {
        const loadingToast = showExportToast();
        try {
            const logoData = await loadLogo();
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const MARGIN = 15;
            let y = 45;

            addReportHeader(pdf, 'Invoices Report', logoData);

            pdf.setFontSize(14);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Invoices Summary', MARGIN, y);
            y += 20;

            const headers = ['Event', 'Invoice #', 'Booth', 'Amount', 'Issued', 'Paid'];
            const rows = allInvoices.map(item => [
                item.title,
                item.invoiceRef,
                item.booth,
                item.amount,
                item.issuedDate,
                item.paidDate
            ]);

            y = drawTable(pdf, y, headers, rows, MARGIN, pdfWidth, pdfHeight, 15, 12, 5);

            addReportFooter(pdf, 1, 1);
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
        try {
            const logoData = await loadLogo();
            const pdf = new jsPDF('p', 'mm', 'a4');
            const MARGIN = 15;
            let y = 45;

            addReportHeader(pdf, 'Invoice', logoData);

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

            y = drawTable(pdf, y, headers, rows, MARGIN, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 15, 12, 5);

            y += 10;
            y += 10;
            pdf.setFontSize(12);
            pdf.setTextColor(30, 60, 114);
            pdf.text(`Total Due: ${item.totalDue}`, MARGIN, y);

            y += 15;
            pdf.setFontSize(10);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont('helvetica', 'bold');
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

            addReportFooter(pdf, 1, 1);
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

    const totalPages = Math.ceil(allInvoices.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedInvoices = allInvoices.slice(startIndex, startIndex + itemsPerPage);

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
                    <input type="text" placeholder="Search by event or invoice order" className="small-body-text" />
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
                {paginatedInvoices.map((item) => (
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
                ))}
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
