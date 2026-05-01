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
            let y = 45;

            addReportHeader(pdf, REPORT_TITLE, logoData);

            pdf.setFontSize(14);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Event History', MARGIN, y);
            y += 20;

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

            y = drawTable(pdf, y, headers, rows, MARGIN, pdfWidth, pdfHeight, 15, 12, 5, logoData, REPORT_TITLE);

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

        try {
            const logoData = await loadLogo();
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
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
            pdf.text(`Payment Date: ${item.paymentDate}`, MARGIN, y);
            y += 6;
            pdf.text(`Booking Date: ${item.paymentDate}`, MARGIN, y);
            y += 6;
            
            const priceLevel = res?.event?.priceLevels?.find(pl => pl._id === res?.event?.booths?.find(b => b.code === res?.boothCode)?.priceLevelId);
            pdf.text(`Booth Type: ${priceLevel?.priceName || 'Standard'} • ${priceLevel?.boothSize || '10x10'}`, MARGIN, y);
            y += 10;

            pdf.setFontSize(14);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Payment Information', MARGIN, y);
            y += 6;
            pdf.setFontSize(10);
            pdf.setTextColor(50, 50, 50);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Payment Method: ${res?.paymentMethod === 'card' ? 'Credit Card' : 'Invoice'}`, MARGIN, y);
            y += 6;
            pdf.text(`Payment Status: ${item.paymentStatus}`, MARGIN, y);
            y += 10;

            pdf.setFontSize(12);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Exhibitors', MARGIN, y);
            y += 6;
            pdf.setFontSize(10);
            pdf.setTextColor(50, 50, 50);
            pdf.setFont('helvetica', 'normal');
            
            // Lead
            const leadName = `${res?.user?.firstName || ''} ${res?.user?.lastName || ''}`.trim() || res?.user?.email || "Lead Representative";
            pdf.text(`• ${leadName} (Lead Representative)`, MARGIN, y);
            y += 6;

            // Other exhibitors
            (res?.exhibitors || []).forEach(ex => {
                if (y > 270) { // Page break if needed
                    pdf.addPage();
                    addReportHeader(pdf, INVOICE_TITLE, logoData);
                    y = 45;
                }
                const exName = `${ex.firstName || ''} ${ex.lastName || ''}`.trim() || ex.email || "Exhibitor";
                pdf.text(`• ${exName} (Exhibitor)`, MARGIN, y);
                y += 6;
            });
            y += 4;

            y += 4;

            const headers = ['Description', 'Amount'];
            const rows = [
                ['Booth Price', `$${(res?.amount?.subtotal || 0).toLocaleString()}`],
                ['Processing Fee', `$${(res?.amount?.fee || 0).toLocaleString()}`],
                ['Tax', `$${(res?.amount?.tax || 0).toLocaleString()}`],
                ['Total Paid', item.amount]
            ];
            y = drawTable(pdf, y, headers, rows, MARGIN, pdfWidth, pdfHeight, 15, 12, 5, logoData, INVOICE_TITLE);

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

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user?.token) return;
            setIsLoading(true);
            try {
                const response = await axios.get(`${BACKEND_URL}/api/reservations/my-booths`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                
                // Map backend reservation data to the expected history format
                const mappedHistory = response.data.map(res => ({
                    id: res._id,
                    displayId: `Booth-${res._id.toString().slice(-6).toUpperCase()}`,
                    title: res.event?.title || 'Unknown Event',
                    booth: `Booth #${res.boothCode}`,
                    date: res.event?.startDate ? new Date(res.event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA',
                    eventStatus: 'Upcoming', // Default status, logic could be more complex based on date
                    invoiceRef: `${res.poNumber}`,
                    amount: `$${(res.amount?.total || 0).toLocaleString()}`,
                    paymentStatus: res.status === 'confirmed' ? 'Paid' : (res.status === 'pending' ? 'Pending' : 'Cancelled'),
                    paymentDate: res.createdAt ? new Date(res.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
                    // Full details for modal
                    fullReservation: res
                }));

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
        const matchesStatus = selectedStatus === "All Events" || item.eventStatus === selectedStatus;
        
        // Search filter
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.invoiceRef.toLowerCase().includes(searchQuery.toLowerCase());

        // Date range filtering (based on payment date/createdAt)
        const paymentDate = new Date(item.fullReservation.createdAt);
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

    if (isLoading) {
        return (
            <div className="sponsor-history-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <Icon icon="line-md:loading-twotone-loop" width="48" />
            </div>
        );
    }

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
                            {paginatedHistory.map((item) => (
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
                            ))}
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
