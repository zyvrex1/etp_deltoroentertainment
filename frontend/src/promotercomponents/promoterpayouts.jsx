import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import './promoterpayouts.css';
import { showConfirmAlert, showSuccessAlert } from "../admincomponents/utils/sweetAlert";const PromoterPayouts = () => {
   
   
    const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState("techstart");
    const eventDropdownRef = useRef(null);

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

    const eventOptions = [
        { value: "techstart", label: "TechStart Summit 2026" },
        { value: "creator", label: "Creator Economy Expo" },
    ];

    const getSelectedEventLabel = () => {
        const option = eventOptions.find(opt => opt.value === selectedEvent);
        return option ? option.label : "Select Event";
    };

    const handleEventChange = (val) => {
        setSelectedEvent(val);
        setIsEventDropdownOpen(false);
    };

const handleWithdraw = async () => {
    const result = await showConfirmAlert(
        "Withdraw Funds?",
        "Are you sure you want to withdraw your available balance?",
        "Yes, Withdraw",
        "Cancel"
    );

    if (result.isConfirmed) {
        await showSuccessAlert(
            "Withdrawal Initiated",
            "Your funds are being transferred to your bank account."
        );
    }
};


    const payoutHistory = [
        { date: "Jan 01, 2026", amount: "$12,450.00", method: "Bank Transfer •••• 4242", status: "Paid" },
        { date: "Sep 15, 2025", amount: "$8,200.00", method: "Bank Transfer •••• 4242", status: "Paid" },
        { date: "Aug 30, 2025", amount: "$5,150.00", method: "Bank Transfer •••• 4242", status: "Paid" },
    ];

    return (
        <div className="pay-container">
            <div className="pay-header">
                <div className="pay-header-left">
                    <h1 className="pay-title">Payouts</h1>
                </div>
                <div className="pay-header-controls">
                    <div className="pay-filter-dropdown" ref={eventDropdownRef}>
                        <button
                            className="pay-filter-dropdown-btn"
                            onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
                        >
                            <span className="truncate-text">{getSelectedEventLabel()}</span>
                            <Icon
                                icon="mdi:chevron-down"
                                className={`dropdown-icon ${isEventDropdownOpen ? "open" : ""}`}
                            />
                        </button>
                        {isEventDropdownOpen && (
                            <div className="pay-filter-dropdown-menu">
                                {eventOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        className={`pay-filter-dropdown-item ${selectedEvent === option.value ? "active" : ""}`}
                                        onClick={() => handleEventChange(option.value)}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button className="outlined-button pay-export-btn">
                        <Icon icon="mdi:tray-arrow-down" />
                        Export Report
                    </button>
                </div>
            </div>

            <div className="pay-main-content">
                <div className="pay-left-col">
                    <div className="pay-card pay-history-box">
                        <div className="pay-card-header">
                            <h4>Payout History</h4>
                        </div>
                        <div className="pay-table-wrapper">
                            <table className="pay-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Amount</th>
                                        <th>Method</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payoutHistory.map((item, index) => (
                                        <tr key={index}>
                                            <td className="small-body-text">{item.date}</td>
                                            <td className="large-body-text pay-amount-text">{item.amount}</td>
                                            <td className="small-body-text">{item.method}</td>
                                            <td>
                                                <span className="button-label pay-status-pill">
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="pay-right-col">
                    <div className="pay-card pay-next-box">
                        <p className="small-body-text pay-next-label">Next Payout</p>
                        <h2 className="pay-next-amount">$15,240.00</h2>

                        <div className="pay-est-arrival">
                            <Icon icon="mdi:bank-transfer" />
                            <span className="small-body-text pp-date">Est. arrival: Oct 15, 2024</span>
                        </div>

<button
    className="primary-button pay-withdraw-btn"
    onClick={handleWithdraw}
>
    Withdraw Now
</button>
                    </div>

                    <div className="pay-card pay-methods-box">
                        <h4>Payout Methods</h4>

                        <div className="pay-method-item">
                            <div className="pay-method-icon">
                                <Icon icon="mdi:bank-outline" />
                            </div>
                            <div className="pay-method-info">
                                <h5 className="pay-method-name">Chase Bank</h5>
                                <span className="smaller-body-text pay-method-num">•••• 4242</span>
                            </div>
                            <span className="button-label pay-default-pill">Default</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromoterPayouts;
