import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import DateRangePicker from '../admincomponents/DateRangePicker';
import jsPDF from 'jspdf';
import { loadLogo, addReportHeader, addReportFooter, showExportToast, removeExportToast, drawTable } from '../admincomponents/utils/pdfExport';
import './CustomerPurchaseHistory.css';
import CustomerHistoryViewReceipt from './Modal/CustomerHistoryViewReceipt';

export default function CustomerPurchaseHistory() {
    const [activeTab, setActiveTab] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
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

    const tabs = [
        { id: 'all', label: 'All Purchases' },
        { id: 'tickets', label: 'Tickets' },
        { id: 'merchandise', label: 'Merchandise' },
        { id: 'food', label: 'Food & Drinks' },
        { id: 'refunds', label: 'Refunds' }
    ];

    const mockData = [
        {
            id: 1,
            type: 'ticket',
            title: 'Neon Dreams Tour',
            status: 'Confirmed',
            statusClass: 'status-confirmed',
            orderNum: '#ORD-12345',
            date: '5/1/2026',
            total: '$155.00',
            paymentMethod: 'Visa ending in 4242',
            items: [
                { name: '1x Row A, Seat 12', price: '$150.00' }
            ],
            hasRefund: true
        },
        {
            id: 2,
            type: 'merchandise',
            title: 'Neon Dreams Tour',
            status: 'Ready for Pickup',
            statusClass: 'status-pickup',
            orderNum: '#MC-1042',
            date: '6/15/2026',
            total: '$45.00',
            paymentMethod: 'Apple Pay',
            items: [
                { name: '1x Event Hoodie', price: '$45.00' }
            ],
            hasRefund: false
        },
        {
            id: 3,
            type: 'food',
            title: 'Neon Dreams Tour',
            status: 'Preparing',
            statusClass: 'status-preparing',
            orderNum: '#FD-3621',
            date: '6/15/2026',
            total: '$29.00',
            paymentMethod: 'Apple Pay',
            items: [
                { name: '2x Burger Combo', price: '$24.00' }
            ],
            hasRefund: false
        }
    ];

    const purchases = Array.from({ length: 15 }, (_, i) => ({
        ...mockData[i % 3],
        id: i + 1,
        orderNum: `${mockData[i % 3].orderNum.split('-')[0]}-${1000 + i}`
    }));

    const filteredPurchases = purchases.filter(p => {
        const matchesTab = activeTab === 'all' || p.type === activeTab;
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.orderNum.toLowerCase().includes(searchQuery.toLowerCase());

        // Simple date filtering (assuming date format is M/D/YYYY)
        const purchaseDate = new Date(p.date);
        const matchesDate = purchaseDate >= dateRange.start && purchaseDate <= dateRange.end;

        return matchesTab && matchesSearch && matchesDate;
    });

    const handleDateRangeChange = (newRange) => {
        setDateRange(newRange);
        setCurrentPage(1);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    // Pagination Logic
    const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedPurchases = filteredPurchases.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setCurrentPage(1); // Reset page on tab change
    };

    const getIconForType = (type) => {
        switch (type) {
            case 'ticket': return 'mdi:ticket-confirmation-outline';
            case 'merchandise': return 'mdi:shopping-outline';
            case 'food': return 'mdi:food-outline';
            default: return 'mdi:receipt-text-outline';
        }
    };

    const getIconColorForType = (type) => {
        switch (type) {
            case 'ticket': return 'var(--color-red-primary)';
            case 'merchandise': return 'var(--color-blue-primary)';
            case 'food': return 'var(--color-yellow-primary)';
            default: return 'var(--color-black-secondary)';
        }
    };

    const handleViewReceipt = (purchase) => {
        // Map purchase data to the format expected by the receipt modal
        const receiptData = {
            orderNum: purchase.orderNum.replace('#', ''),
            date: purchase.date,
            billedTo: {
                name: 'Zyvrex Perez',
                email: 'hello@zyvrex.com'
            },
            paymentMethod: purchase.paymentMethod,
            status: 'Paid',
            items: purchase.items.map(item => ({
                item: item.name.replace(/^\d+x\s*/, ''),
                type: purchase.type === 'ticket' ? 'Ticket' : purchase.type === 'merchandise' ? 'Merch' : 'Food/Drink',
                qty: parseInt(item.name.match(/^\d+/)?.[0] || 1, 10),
                price: item.price,
                total: item.price // Simplify total calculation for mock data
            })),
            subtotal: purchase.total,
            serviceFee: '$0.00',
            tax: '$0.00',
            totalPaid: purchase.total
        };
        setSelectedReceipt(receiptData);
        setIsReceiptModalOpen(true);
    };

    const exportHistoryToPDF = async () => {
        const loadingToast = showExportToast();
        try {
            const logoData = await loadLogo();
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const MARGIN = 15;
            let y = 45;

            addReportHeader(pdf, 'Purchase History', logoData);

            pdf.setFontSize(14);
            pdf.setTextColor(30, 60, 114);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Purchase History', MARGIN, y);
            y += 20;

            const headers = ['Order', 'Title', 'Date', 'Type', 'Status', 'Total'];
            const rows = filteredPurchases.map(item => [
                item.orderNum,
                item.title,
                item.date,
                item.type.charAt(0).toUpperCase() + item.type.slice(1),
                item.status,
                item.total
            ]);

            y = drawTable(pdf, y, headers, rows, MARGIN, pdfWidth, pdfHeight, 15, 12, 5);

            addReportFooter(pdf, 1, 1);
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
                {paginatedPurchases.length > 0 ? (
                    <>
                        {paginatedPurchases.map((purchase) => (
                            <div key={purchase.id} className="history-card">
                                <div className="history-card-header flex-between">
                                    <div className="history-info-left">
                                        <div className="history-icon-box">
                                            <Icon icon={getIconForType(purchase.type)} width="24" color={getIconColorForType(purchase.type)} />
                                        </div>
                                        <div className="history-details">
                                            <div className="history-title-row">
                                                <h4 className="history-item-title">{purchase.title}</h4>
                                                <span className={`button-label ${purchase.statusClass}`}>{purchase.status}</span>
                                            </div>
                                            <p className="small-body-text text-muted mt-1">
                                                Order {purchase.orderNum} • {purchase.date}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="history-info-right text-right">
                                        <h4 className="history-total">{purchase.total}</h4>
                                        <p className="small-body-text text-muted mt-1">{purchase.paymentMethod}</p>
                                    </div>
                                </div>

                                <hr className="history-divider" />

                                <div className="history-items-list">
                                    {purchase.items.map((item, idx) => (
                                        <div key={idx} className="history-sub-item flex-between">
                                            <span className="regular-body-text text-muted">{item.name}</span>
                                            <span className="regular-body-text">{item.price}</span>
                                        </div>
                                    ))}
                                </div>

                                <hr className="history-divider" />

                                <div className="history-actions flex-end">
                                    <button className="outlined-button" onClick={() => handleViewReceipt(purchase)}>
                                        View Receipt
                                    </button>
                                </div>
                            </div>
                        ))}

                        {totalPages > 1 && (
                            <div className="history-pagination">
                                <button
                                    className="pagination-btn"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </button>

                                <span className="pagination-info regular-body-text">
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
