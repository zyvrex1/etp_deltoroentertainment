import React, { useMemo } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { useCustomerCart } from '../context/CustomerCartContext';
import './CustomerPaySuccess.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const CustomerPaySuccess = () => {
    const navigate = useNavigate();
    const { purchaseHistory } = useCustomerCart();

    // Get the most recent purchase(s) - group items within a 10-second window
    const latestPurchases = useMemo(() => {
        if (purchaseHistory.length === 0) return [];
        
        const sortedHistory = [...purchaseHistory].sort((a, b) => 
            new Date(b.purchaseDate) - new Date(a.purchaseDate)
        );
        
        const latestTime = new Date(sortedHistory[0].purchaseDate).getTime();
        
        // Group items within 10 seconds of the most recent item
        return sortedHistory.filter(item => {
            const itemTime = new Date(item.purchaseDate).getTime();
            return Math.abs(latestTime - itemTime) < 10000; // 10 second window
        });
    }, [purchaseHistory]);


    if (latestPurchases.length === 0) {
        return (
            <div className="cps-page-wrapper">
                <div className="cps-main-container">
                    <div className="cps-success-header">
                        <Icon icon="mdi:alert-circle-outline" width="60" color="var(--color-red-primary)" />
                        <h2 className="cps-title">No recent orders found</h2>
                        <button className="primary-button mt-l" onClick={() => navigate('/customer/browse-events')}>
                            Browse Events
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const firstItem = latestPurchases[0];
    const event = firstItem.event;
    const totalAmount = latestPurchases.reduce((sum, item) => sum + item.facePrice + item.serviceFee, 0);

    return (
        <div className="cps-page-wrapper">
            <div className="cps-main-container">
                <div className="cps-success-header">
                    <div className="cps-check-circle">
                        <Icon icon="mdi:check" className="cps-check-icon" />
                    </div>
                    <h2 className="cps-title">Order Confirmed!</h2>
                    <p className="regular-body-text cps-subtitle">Thank you for your purchase. Your tickets are now available.</p>
                    <p className="small-body-text cps-order-id">
                        Transaction ID: <span className="cps-order-number">{firstItem.cartId.toUpperCase()}</span>
                    </p>
                </div>

                <div className="cps-card-container">
                    <div className="cps-card">
                        <div className="cps-event-header">
                            <img
                                src={event.image ? `${BACKEND_URL}/uploads/${event.image}` : "/assets/eventbg.jpg"}
                                alt={event.title}
                                className="cps-event-img"
                                                    onError={(e) => { e.target.src = "/assets/eventbg.jpg" }}

                            />
                            <div className="cps-event-info">
                                <h4 className="cps-event-title">{event.title}</h4>
                                <div className="cps-event-detail">
                                    <Icon icon="mdi:calendar-blank" className="cps-detail-icon" />
                                    <span className="smaller-body-text">{new Date(event.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                                <div className="cps-event-detail">
                                    <Icon icon="mdi:map-marker" className="cps-detail-icon" />
                                    <span className="smaller-body-text">{event.venue?.name}</span>
                                </div>
                            </div>
                        </div>

                        <hr className="cps-divider" />

                        <div className="cps-tickets-section">
                            <h5 className="cps-section-title">Your Tickets</h5>

                            {latestPurchases.map((item, index) => (
                                <div className="cps-ticket-item" key={index}>
                                    <div className="cps-ticket-left">
                                        <p className="small-body-text cps-ticket-type">{item.categoryName}</p>
                                        <p className="smaller-body-text cps-ticket-seat mb-1">Seat {item.seat.label}</p>
                                        <p className="small-body-text cps-ticket-price">${(item.facePrice + item.serviceFee).toFixed(2)}</p>
                                    </div>
                                    <div className="cps-ticket-right cps-qr-container">
                                        <div className="cps-qr-wrapper" style={{ background: '#fff', padding: '5px', borderRadius: '4px' }}>
                                            <QRCodeCanvas
                                                value={item.qrData || item.cartId}
                                                size={60}
                                                bgColor={"#ffffff"}
                                                fgColor={"#000000"}
                                                level={"M"}
                                            />
                                        </div>
                                        <p className="smaller-body-text mt-1 text-secondary">Seat - {item.cartId.toUpperCase().slice(0, 8)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <hr className="cps-divider-thick" />

                        <div className="cps-total-section">
                            <h4 className="cps-total-label">Total Paid</h4>
                            <h4 className="cps-total-amount">${totalAmount.toFixed(2)}</h4>
                        </div>
                    </div>

                    <div className="cps-card">
                        <h4 className="cps-section-title">What happens next?</h4>

                        <div className="cps-step-item">
                            <div className="cps-step-icon-wrapper light-red-bg">
                                <Icon icon="mdi:ticket-confirmation-outline" className="cps-step-icon" />
                            </div>
                            <div className="cps-step-text">
                                <h6 className="cps-step-title">Tickets are ready</h6>
                                <p className="smaller-body-text text-secondary m-0">Your digital tickets are available in your account instantly.</p>
                            </div>
                        </div>

                        <div className="cps-step-item">
                            <div className="cps-step-icon-wrapper light-red-bg">
                                <Icon icon="mdi:email-outline" className="cps-step-icon" />
                            </div>
                            <div className="cps-step-text">
                                <h6 className="cps-step-title">Confirmation email sent</h6>
                                <p className="smaller-body-text text-secondary m-0">Check your inbox for order details and calendar invite.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="cps-action-buttons">
                    <button className="primary-button cps-btn-primary" onClick={() => navigate('/customer/my-ticketsorder')}>
                        <Icon icon="mdi:ticket-confirmation-outline" width="18" className="mr-2" />
                        View My Tickets
                    </button>
                    <button className="outlined-button cps-btn-outline" onClick={() => navigate('/customer/browse-events')}>
                        Browse More Events
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerPaySuccess;
