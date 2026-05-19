import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useSponsorCartContext } from '../context/SponsorCartContext';
import { showDeleteConfirmAlert, showSuccessAlert, showCheckoutConfirmAlert } from '../utils/sweetAlert';
import './SponsorCart.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function SponsorCart() {
    const navigate = useNavigate();
    const { cartItems, removeFromCart, removeMultipleFromCart, clearCart } = useSponsorCartContext();

    const [selectedItems, setSelectedItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    const isCartEmpty = cartItems.length === 0;
    const countSelected = selectedItems.length;

    const subtotal = cartItems
        .filter(item => selectedItems.includes(item.cartId))
        .reduce((sum, item) => sum + (item.facePrice || 0), 0);

    const processingFees = cartItems
        .filter(item => selectedItems.includes(item.cartId))
        .reduce((sum, item) => sum + (item.processingFee || 0), 0);
        
    const estimatedTax = cartItems
        .filter(item => selectedItems.includes(item.cartId))
        .reduce((sum, item) => sum + (item.estimatedTax || 0), 0);

    const total = subtotal + processingFees + estimatedTax;

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
            'Remove Booth?',
            'Are you sure you want to remove this booth from your cart?'
        );

        if (result.isConfirmed) {
            removeFromCart(cartId);
            showSuccessAlert('Removed!', 'The booth has been removed from your cart.');
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedItems.length === 0) return;
        const result = await showDeleteConfirmAlert(
            'Remove Selected Booths?',
            `Are you sure you want to remove ${selectedItems.length} selected booths?`
        );
        if (result.isConfirmed) {
            removeMultipleFromCart(selectedItems);
            setSelectedItems([]);
            showSuccessAlert('Removed!', 'Selected booths have been removed.');
        }
    };

    const handleCheckout = async () => {
        if (countSelected === 0) return;
        
        const result = await showCheckoutConfirmAlert(countSelected);
        if (result.isConfirmed) {
            const itemsToCheckout = cartItems.filter(item => selectedItems.includes(item.cartId));
            navigate('/sponsor/sponsor-venue-billing', { state: { selectedItems: itemsToCheckout } });
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
        <div className="sponsor-cart-wrapper">
            <div className="cart-header-nav">
                <span className="breadcrumb" onClick={() => navigate('/sponsor/sponsor-events')}>Browse Events</span> &gt; <span className="breadcrumb-current">Cart</span>
            </div>

            <div className="cart-title-section">
                <div className="cart-title-left">
                    <button className="action-icon-btn back-btn" onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <Icon icon="mdi:arrow-left" width="24" />
                    </button>
                    <div>
                        <h2 className="cart-page-title">Your Cart</h2>
                        {loading ? (
                            <div className="skeleton skeleton-text" style={{ width: '150px', height: '14px', marginTop: '4px', marginBottom: 0 }}></div>
                        ) : !isCartEmpty && (
                            <p className="small-body-text text-muted m-0">{cartItems.length} booths • {countSelected} selected for checkout</p>
                        )}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="cart-content-layout">
                    {[...Array(2)].map((_, groupIdx) => (
                        <div className="cart-event-card" key={groupIdx}>
                            <div className="event-card-header">
                                <div className="skeleton skeleton-text title" style={{ width: '200px', height: '20px', margin: 0 }}></div>
                                <div className="skeleton skeleton-badge" style={{ width: '60px', height: '24px', borderRadius: '20px' }}></div>
                            </div>
                            <div className="ticket-list">
                                {[...Array(groupIdx === 0 ? 2 : 1)].map((_, itemIdx) => (
                                    <div className="ticket-item" key={itemIdx}>
                                        <div className="custom-checkbox">
                                            <div className="skeleton skeleton-circle" style={{ width: '24px', height: '24px' }}></div>
                                        </div>
                                        <div className="ticket-main">
                                            <div className="skeleton skeleton-image" style={{ width: '60px', height: '60px', borderRadius: '8px' }}></div>
                                            <div className="ticket-info">
                                                <div className="ticket-type-info">
                                                    <div className="skeleton skeleton-text title" style={{ width: '60%', height: '18px', marginBottom: '8px' }}></div>
                                                    <div className="skeleton skeleton-text" style={{ width: '40%', height: '14px', margin: 0 }}></div>
                                                </div>
                                                <div className="ticket-meta">
                                                    <div className="skeleton skeleton-text" style={{ width: '100px', height: '14px', margin: 0 }}></div>
                                                    <div className="skeleton skeleton-text" style={{ width: '80px', height: '14px', margin: 0 }}></div>
                                                </div>
                                            </div>
                                            <div className="ticket-price-right">
                                                <div className="skeleton skeleton-text" style={{ width: '60px', height: '18px', margin: 0 }}></div>
                                                <div className="skeleton skeleton-circle" style={{ width: '36px', height: '36px' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : isCartEmpty ? (
                <div className="empty-cart-state">
                    <Icon icon="mdi:cart-outline" width="60" className="empty-cart-icon" />
                    <h3>Your cart is empty</h3>
                    <p className="small-body-text text-muted mt-s">Start browsing events to add sponsor booths to your cart.</p>
                    <button className="primary-button empty-browse-btn mt-l" onClick={() => navigate('/sponsor/sponsor-events')} style={{ marginTop: '1.5rem' }}>
                        Browse Events
                    </button>
                </div>
            ) : (
                <>
                    <div className="cart-tip-card">
                        <p className="small-body-text">
                            <span className="font-bold">Tip:</span> Select which booths you want to reserve by checking the boxes. You can keep exploring other events and add more booths before checking out.
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
                                                    src={(event.image || event.banner) ? `${BACKEND_URL}/uploads/${event.image || event.banner}` : "/assets/eventbg.jpg"} 
                                                    alt={event.title} 
                                                    className="ticket-image" 
                                                    onError={(e) => { e.target.src = "/assets/eventbg.jpg" }} 
                                                />
                                                <div className="ticket-info">
                                                    <div className="ticket-type-info">
                                                        <h5>{item.category?.priceName || 'Sponsorship Booth'} ({item.booth?.label || item.booth?.code})</h5>
                                                        <p>
                                                            <Icon icon="mdi:map-marker-outline" width="16" /> {event.venue ? `${event.venue.name}, ${event.venue.city}` : (event.location || 'Location Unavailable')}
                                                        </p>
                                                    </div>
                                                    <div className="ticket-meta">
                                                        <div className="ticket-meta-item">
                                                            <Icon icon="mdi:calendar-blank-outline" width="16" />
                                                            <span>{(event.startDate || event.date) ? new Date(event.startDate || event.date).toLocaleDateString() : 'Date Unavailable'}</span>
                                                        </div>
                                                        <div className="ticket-meta-item">
                                                            <Icon icon="mdi:clock-outline" width="16" />
                                                            <span>{(event.startDate || event.date) ? new Date(event.startDate || event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Time Unavailable'}</span>
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
