import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { showDeleteConfirmAlert, showSuccessAlert, showCheckoutConfirmAlert } from '../utils/sweetAlert';
import './CustomerCart.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function CustomerCart() {
    const navigate = useNavigate();

    // Mock cart items for now since CustomerCartContext is not yet implemented
    const [cartItems, setCartItems] = useState([
        {
            cartId: '1',
            event: { _id: 'e1', title: 'Neon Dreams Tour', image: 'eventbg.jpg', venue: { name: 'Starlight Arena', city: 'Los Angeles' }, startDate: '2024-06-15T20:00:00Z' },
            category: { priceName: 'VIP Ticket' },
            seat: { row: 'B', label: '8' },
            facePrice: 150,
            serviceFee: 5
        },
        {
            cartId: '2',
            event: { _id: 'e1', title: 'Neon Dreams Tour', image: 'eventbg.jpg', venue: { name: 'Starlight Arena', city: 'Los Angeles' }, startDate: '2024-06-15T20:00:00Z' },
            category: { priceName: 'Standard Ticket' },
            seat: { row: 'E', label: '5' },
            facePrice: 65,
            serviceFee: 5
        },
        {
            cartId: '3',
            event: { _id: 'e2', title: 'Comedy All-Stars', image: 'eventbg.jpg', venue: { name: 'Gotham Comedy Club', city: 'New York' }, startDate: '2024-06-20T19:30:00Z' },
            category: { priceName: 'VIP Ticket' },
            seat: { row: 'A', label: '1' },
            facePrice: 150,
            serviceFee: 5
        },
        {
            cartId: '4',
            event: { _id: 'e2', title: 'Comedy All-Stars', image: 'eventbg.jpg', venue: { name: 'Gotham Comedy Club', city: 'New York' }, startDate: '2024-06-20T19:30:00Z' },
            category: { priceName: 'VIP Ticket' },
            seat: { row: 'A', label: '2' },
            facePrice: 150,
            serviceFee: 5
        }
    ]);

    const [selectedItems, setSelectedItems] = useState([]);

    // Initialize all items as selected by default when cart changes
    useEffect(() => {
        setSelectedItems(cartItems.map(item => item.cartId));
    }, [cartItems]);

    const isCartEmpty = cartItems.length === 0;
    const countSelected = selectedItems.length;

    const subtotal = cartItems
        .filter(item => selectedItems.includes(item.cartId))
        .reduce((sum, item) => sum + (item.facePrice || 0), 0);

    const serviceFees = cartItems
        .filter(item => selectedItems.includes(item.cartId))
        .reduce((sum, item) => sum + (item.serviceFee || 0), 0);

    const total = subtotal + serviceFees;

    const toggleItem = (cartId) => {
        setSelectedItems(prev => 
            prev.includes(cartId) 
                ? prev.filter(id => id !== cartId)
                : [...prev, cartId]
        );
    };

    const handleSelectAll = () => {
        if (selectedItems.length === cartItems.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(cartItems.map(item => item.cartId));
        }
    };

    const handleDeleteItem = async (cartId) => {
        const result = await showDeleteConfirmAlert(
            'Remove Ticket?',
            'Are you sure you want to remove this ticket from your cart?'
        );

        if (result.isConfirmed) {
            setCartItems(prev => prev.filter(item => item.cartId !== cartId));
            showSuccessAlert('Removed!', 'The ticket has been removed from your cart.');
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedItems.length === 0) return;
        const result = await showDeleteConfirmAlert(
            'Remove Selected Tickets?',
            `Are you sure you want to remove ${selectedItems.length} selected tickets?`
        );
        if (result.isConfirmed) {
            setCartItems(prev => prev.filter(item => !selectedItems.includes(item.cartId)));
            setSelectedItems([]);
            showSuccessAlert('Removed!', 'Selected tickets have been removed.');
        }
    };

    const handleCheckout = async () => {
        if (countSelected === 0) return;
        
        const result = await showCheckoutConfirmAlert(countSelected);
        if (result.isConfirmed) {
            navigate('/customer/checkout');
        }
    };

    // Group items by event
    const groupedItems = cartItems.reduce((acc, item) => {
        const eventId = item.event._id || item.event.id;
        if (!acc[eventId]) {
            acc[eventId] = {
                event: item.event,
                items: []
            };
        }
        acc[eventId].items.push(item);
        return acc;
    }, {});

    return (
        <div className="customer-cart-wrapper">
            <div className="cart-header-nav">
                <span className="breadcrumb" onClick={() => navigate('/customer/browse-events')}>Browse Events</span> &gt; <span className="breadcrumb-current">Cart</span>
            </div>

            <div className="cart-title-section">
                <div className="cart-title-left">
                    <button className="action-icon-btn back-btn" onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <Icon icon="mdi:arrow-left" width="24" />
                    </button>
                    <div>
                        <h2 className="cart-page-title">Your Cart</h2>
                        {!isCartEmpty && (
                            <p className="small-body-text text-muted m-0">{cartItems.length} tickets • {countSelected} selected for checkout</p>
                        )}
                    </div>
                </div>
            </div>

            {isCartEmpty ? (
                <div className="empty-cart-state">
                    <Icon icon="mdi:cart-outline" width="60" className="empty-cart-icon" />
                    <h3>Your cart is empty</h3>
                    <p className="small-body-text text-muted mt-s">Start browsing events to add tickets to your cart.</p>
                    <button className="primary-button empty-browse-btn mt-l" onClick={() => navigate('/customer/browse-events')} style={{ marginTop: '1.5rem' }}>
                        Browse Events
                    </button>
                </div>
            ) : (
                <>
                    <div className="cart-tip-card">
                        <p className="small-body-text">
                            <span className="font-bold">Tip:</span> Select which tickets you want to purchase by checking the boxes. You can keep exploring other events and add more tickets before checking out.
                        </p>
                    </div>

                    <div className="cart-content-layout">
                        {Object.values(groupedItems).map(({ event, items }) => (
                            <div className="cart-event-card" key={event._id || event.id}>
                                <div className="event-card-header">
                                    <h4>{event.title}</h4>
                                    <span className="live-badge">Live</span>
                                </div>
                                <div className="ticket-list">
                                    {items.map(item => (
                                        <div className={`ticket-item ${selectedItems.includes(item.cartId) ? 'checked' : ''}`} key={item.cartId}>
                                            <label className="custom-checkbox">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedItems.includes(item.cartId)} 
                                                    onChange={() => toggleItem(item.cartId)} 
                                                />
                                                <span className="checkmark"></span>
                                            </label>
                                            <div className="ticket-main">
                                                <img 
                                                    src={event.image ? `${BACKEND_URL}/uploads/${event.image}` : "/assets/eventbg.jpg"} 
                                                    alt={event.title} 
                                                    className="ticket-image" 
                                                    onError={(e) => { e.target.src = "https://via.placeholder.com/80" }} 
                                                />
                                                <div className="ticket-info">
                                                    <div className="ticket-type-info">
                                                        <h5>{item.category?.priceName || 'Ticket'} (Row {item.seat?.row}, Seat {item.seat?.label})</h5>
                                                        <p>
                                                            <Icon icon="mdi:map-marker-outline" width="16" /> {event.venue?.name}, {event.venue?.city}
                                                        </p>
                                                    </div>
                                                    <div className="ticket-meta">
                                                        <div className="ticket-meta-item">
                                                            <Icon icon="mdi:calendar-blank-outline" width="16" />
                                                            <span>{new Date(event.startDate).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="ticket-meta-item">
                                                            <Icon icon="mdi:clock-outline" width="16" />
                                                            <span>{new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="ticket-price-right">
                                                    <h5>${item.facePrice.toLocaleString()}</h5>
                                                    <button className="del-btn" onClick={() => handleDeleteItem(item.cartId)}>
                                                        <Icon icon="mdi:trash-can-outline" width="20" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="cart-bottom-actions">
                        <div className="bottom-left-actions">
                            <label className="custom-checkbox" style={{ marginRight: '0.5rem' }}>
                                <input 
                                    type="checkbox" 
                                    checked={selectedItems.length > 0 && selectedItems.length === cartItems.length}
                                    onChange={handleSelectAll} 
                                />
                                <span className="checkmark"></span>
                            </label>
                            <span className="select-all-label" onClick={handleSelectAll}>Select All</span>
                            
                            {selectedItems.length > 0 && (
                                <button className="del-btn ml-4" onClick={handleDeleteSelected}>
                                    Delete
                                </button>
                            )}
                        </div>
                        <div className="bottom-right-actions">
                            <span className="total-text">Total ({countSelected} item{countSelected !== 1 && 's'})</span>
                            <span className="total-amount">${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <button 
                                className={`primary-button checkout-btn ${countSelected === 0 ? 'disabled' : ''}`} 
                                onClick={handleCheckout}
                                disabled={countSelected === 0}
                            >
                                Checkout ({countSelected})
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
