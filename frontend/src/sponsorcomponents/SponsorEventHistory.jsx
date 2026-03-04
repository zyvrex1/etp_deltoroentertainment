import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { NavLink } from 'react-router-dom';
import SponsorViewFullHistory from './SponsorModal/SponsorViewFullHistory';
import './SponsorEventHistory.css';

export default function SponsorEventHistory() {

    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState("All Events");
    const statusDropdownRef = useRef(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

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

    // Mock Data
    const allHistory = Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        title: `TechInnovate Summit ${2024 + (i % 2)}`,
        booth: `Booth #10${i}`,
        date: 'Oct 15, 2024',
        eventStatus: eventStatuses[i % 3], // rotates statuses
        invoiceRef: `INV-2024-00${i + 1}`,
        amount: '$5,575.00',
        paymentStatus: 'Paid',
        paymentDate: 'Aug 10, 2024'
    }));

    const filteredHistory =
        selectedStatus === "All Events"
            ? allHistory
            : allHistory.filter(item => item.eventStatus === selectedStatus);

    // Pagination Logic
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
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
                <button className="outlined-button sh-dl">
                    <Icon icon="mdi:tray-arrow-up" className="export-icon" />
                    Export History
                </button>
            </div>

            <div className="sponsor-history-card">
                <div className="sponsor-history-controls">
                    <div className="sh-search">
                        <Icon icon="mdi:magnify" width="20" color="var(--color-black-secondary)" />
                        <input type="text" placeholder="Search by event or invoice order" className="small-body-text" />
                    </div>
                    <div className="sh-filters">
                        <button className="outlined-button sh-filter-btn">
                            <Icon icon="mdi:filter-variant" width="18" /> Date Range
                        </button>
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
                                        <span className="button-label paid">{item.paymentStatus}</span>
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
                                            <button className="sh-action-btn text-secondary">
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
            />
        </div>
    );
}
