import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import './CustomerSeats.css';

const CustomerSeats = () => {
    const navigate = useNavigate();
    const [selectedSeats, setSelectedSeats] = useState([
        { row: 'D', seat: 5, type: 'Standard', price: 70 },
        { row: 'A', seat: 12, type: 'VIP', price: 150 }
    ]);

    const handleBack = () => {
        navigate(-1);
    };

    const toggleSeat = (row, seat, type, price, status) => {
        if (status === 'occupied') return;

        const isSelected = selectedSeats.some(s => s.row === row && s.seat === seat);
        if (isSelected) {
            setSelectedSeats(selectedSeats.filter(s => !(s.row === row && s.seat === seat)));
        } else {
            if (selectedSeats.length >= 6) return;
            setSelectedSeats([...selectedSeats, { row, seat, type, price }]);
        }
    };

    const getSeatStatus = (row, col) => {
        const isSelected = selectedSeats.some(s => s.row === row && s.seat === col);
        if (isSelected) return 'selected';

        if (row === 'A' && [1, 2, 4, 6, 7, 8, 9, 10, 11].includes(col)) return 'vip';
        if (row === 'B' && [1, 3, 4, 5, 7, 8, 10, 12].includes(col)) return 'vip';
        if (row === 'A' && [3, 5].includes(col)) return 'occupied';
        if (row === 'B' && [2, 6, 9, 11].includes(col)) return 'occupied';
        if (row === 'C' && [3, 5].includes(col)) return 'occupied';
        if (row === 'D' && [2, 6, 7, 8, 9, 12].includes(col)) return 'occupied';
        if (row === 'F' && [3].includes(col)) return 'occupied';
        if (row === 'G' && [9].includes(col)) return 'occupied';
        if (row === 'H' && [4, 12].includes(col)) return 'occupied';
        if (row === 'I' && [1].includes(col)) return 'occupied';
        if (row === 'J' && [12].includes(col)) return 'occupied';

        return 'available';
    };

    const subtotal = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
    const serviceFees = selectedSeats.length > 0 ? 10 : 0;
    const total = subtotal + serviceFees;

    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const cols = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
        <div className="cs-page-wrapper">
            <div className="cs-header-card">
                <div className="cs-header-left">
                    <button className="cs-back-btn" onClick={handleBack}>
                        <Icon icon="mdi:arrow-left" width="24" />
                    </button>
                    <div>
                        <h2 className="text-black mb-1">Neon Dreams Tour</h2>
                        <span className="small-body-text text-secondary">
                            2024-06-15 • 20:00 • Starlight Arena
                        </span>
                    </div>
                </div>
                <div className="cs-header-right">
                    <span className="small-body-text text-secondary">Selected</span>
                    <h2 className="text-red m-0">{selectedSeats.length}</h2>
                </div>
            </div>

            <div className="cs-main-container">
                <div className="cs-content-left">
                    <div className="cs-seats-instructions mb-4">
                        <h4 className="mb-2 text-black">Select Your Seats</h4>
                        <p className="regular-body-text text-secondary m-0">
                            Click on available seats to select them. You can select up to 6 tickets.
                        </p>
                    </div>

                    <div className="cs-stage-container mb-4">
                        <div className="cs-stage-box">
                            <span className="cs-stage-text">STAGE</span>
                        </div>
                    </div>

                    <div className="cs-grid-container">
                        <div className="cs-seat-grid">
                            {rows.map(row => (
                                <div key={row} className="cs-seat-row">
                                    <span className="cs-row-label">{row}</span>
                                    <div className="cs-seat-cols">
                                        {cols.map(col => {
                                            const status = getSeatStatus(row, col);
                                            const type = status === 'vip' || row === 'A' || row === 'B' ? 'VIP' : 'Standard';
                                            const price = type === 'VIP' ? 150 : 70;

                                            return (
                                                <div
                                                    key={`${row}-${col}`}
                                                    className={`cs-seat cs-seat-${status}`}
                                                    onClick={() => toggleSeat(row, col, type, price, status)}
                                                >
                                                    <span className="smaller-body-text">{col}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <span className="cs-row-label">{row}</span>
                                </div>
                            ))}
                        </div>

                        <div className="cs-seat-legend">
                            <div className="cs-legend-item">
                                <span className="cs-legend-dot cs-available"></span>
                                <span className="smaller-body-text text-secondary">Available</span>
                            </div>
                            <div className="cs-legend-item">
                                <span className="cs-legend-dot cs-selected"></span>
                                <span className="smaller-body-text text-secondary">Selected</span>
                            </div>
                            <div className="cs-legend-item">
                                <span className="cs-legend-dot cs-occupied"></span>
                                <span className="smaller-body-text text-secondary">Occupied</span>
                            </div>
                            <div className="cs-legend-item">
                                <span className="cs-legend-dot cs-vip"></span>
                                <span className="smaller-body-text text-secondary">VIP</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="cs-content-right">
                    <div className="cs-order-summary-card">
                        <h4 className="mb-4 text-black">Order Summary</h4>

                        <div className="cs-selected-list mb-4">
                            {selectedSeats.length === 0 ? (
                                <p className="small-body-text text-secondary mb-3">No seats selected</p>
                            ) : (
                                selectedSeats.map((seat, index) => (
                                    <div key={index} className="cs-summary-row mb-2">
                                        <span className="small-body-text text-secondary">
                                            Row {seat.row}, Seat {seat.seat} ({seat.type})
                                        </span>
                                        <span className="small-body-text text-secondary">${seat.price.toFixed(2)}</span>
                                    </div>
                                ))
                            )}
                        </div>

                        <hr className="cs-divider mb-3" />

                        <div className="cs-summary-row mb-2">
                            <span className="small-body-text text-secondary">Subtotal</span>
                            <span className="small-body-text text-secondary">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="cs-summary-row mb-3">
                            <span className="small-body-text text-secondary">Service Fees</span>
                            <span className="small-body-text text-secondary">${serviceFees.toFixed(2)}</span>
                        </div>

                        <hr className="cs-divider mb-3" />

                        <div className="cs-summary-row mb-4">
                            <h4 className="m-0 text-black">Total</h4>
                            <h4 className="text-red m-0">${total.toFixed(2)}</h4>
                        </div>

                        <button
                            className="primary-button cs-submit-btn w-100 mb-3"
                            disabled={selectedSeats.length === 0}
                            onClick={() => navigate('/customer/cart')}
                        >
                            Add {selectedSeats.length} Tickets to Cart
                        </button>

                        <button
                            className="outlined-button cs-continue-btn w-100 mb-3"
                            onClick={() => navigate('/customer/browse-events')}
                        >
                            Continue Browsing events
                        </button>

                        <p className="smaller-body-text text-secondary text-center m-0">
                            Seats will be held for 10 minutes once added to cart
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerSeats;
