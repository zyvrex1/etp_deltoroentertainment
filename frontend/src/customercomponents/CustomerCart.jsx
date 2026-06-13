import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useCustomerCart } from '../context/CustomerCartContext';
import { useAuthContext } from '../hooks/useAuthContext';
import eventsService from '../services/eventsService';
import { showDeleteConfirmAlert, showSuccessAlert, showCheckoutConfirmAlert, showErrorAlert } from '../utils/sweetAlert';
import './CustomerCart.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function CustomerCart() {
    const navigate = useNavigate();
    const { cartItems, removeFromCart, clearCart, completePurchase } = useCustomerCart();

    const { user } = useAuthContext();
    const [selectedItems, setSelectedItems] = useState([]);

    const [loading, setLoading] = useState(true);
    const [eventsData, setEventsData] = useState({});

    useEffect(() => {
        const fetchLatestEventsData = async () => {
            const uniqueEventIds = [...new Set(cartItems.map(item => item.event?._id || item.event?.id).filter(Boolean))];
            const newEventsData = { ...eventsData };
            let hasNewData = false;

            await Promise.all(uniqueEventIds.map(async (id) => {
                if (!newEventsData[id]) {
                    try {
                        const token = user ? user.token : null;
                        const fullEvent = await eventsService.getEvent(id, token);
                        if (fullEvent) {
                            newEventsData[id] = fullEvent;
                            hasNewData = true;
                        }
                    } catch (err) {
                        console.error('Error fetching event data', err);
                    }
                }
            }));

            if (hasNewData) {
                setEventsData(newEventsData);
            }
        };

        if (cartItems.length > 0) {
            fetchLatestEventsData();
        }
    }, [cartItems, user, eventsData]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 600);
        return () => clearTimeout(timer);
    }, []);

    const isCartEmpty = cartItems.length === 0;
    const countSelected = selectedItems.length;

    const subtotal = cartItems
        .filter(item => selectedItems.includes(item.cartId))
        .reduce((sum, item) => sum + (item.facePrice || 0), 0);

    const selectedCount = cartItems.filter(item => selectedItems.includes(item.cartId)).length;
    const serviceFees = subtotal > 0 ? 0.5 : 0;

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
            removeFromCart(cartId);
            setSelectedItems(prev => prev.filter(id => id !== cartId));
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
            selectedItems.forEach(id => removeFromCart(id));
            setSelectedItems([]);
            showSuccessAlert('Removed!', 'Selected tickets have been removed.');
        }
    };

    const handleCheckout = async () => {
        if (countSelected === 0) return;

        const result = await showCheckoutConfirmAlert(countSelected, total);
        if (result.isConfirmed) {
            navigate('/customer/checkout', { state: { selectedItems } });
        }
    };

    // Group items by event
    const groupedItems = cartItems.reduce((acc, item) => {
        const eventId = item.event?._id || item.event?.id;
        if (!eventId) return acc;

        const actualEvent = eventsData[eventId] || item.event;

        if (!acc[eventId]) {
            acc[eventId] = {
                event: actualEvent,
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
                        {!isCartEmpty && !loading && (
                            <p className="small-body-text text-muted m-0">{cartItems.length} tickets • {countSelected} selected for checkout</p>
                        )}
                    </div>
                </div>
                {!isCartEmpty && !loading && (
                    <button className="text-button" onClick={clearCart} style={{ color: 'var(--color-red-primary)', cursor: 'pointer', background: 'none', border: 'none' }}>
                        Clear All
                    </button>
                )}
            </div>

            {loading ? (
                <div className="cart-content-layout">
                    <div className="cart-event-card">
                        <div className="event-card-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div className="skeleton-image skeleton" style={{ width: '40px', height: '40px', borderRadius: '4px' }} />
                                <div className="skeleton-text title skeleton" style={{ width: '150px', marginBottom: 0 }} />
                            </div>
                            <div className="skeleton-badge skeleton" style={{ width: '50px' }} />
                        </div>
                        <div className="ticket-list">
                            {Array.from({ length: 2 }).map((_, idx) => (
                                <div className="ticket-item" key={idx} style={{ borderBottom: idx === 0 ? '1px solid var(--color-black-quaternary)' : 'none' }}>
                                    <div className="skeleton skeleton-circle" style={{ width: '20px', height: '20px', marginRight: '1rem' }} />
                                    <div className="ticket-main">
                                        <div className="ticket-info">
                                            <div className="skeleton-text title skeleton" style={{ width: '120px' }} />
                                            <div className="skeleton-text skeleton" style={{ width: '80px' }} />
                                        </div>
                                        <div className="ticket-price-right">
                                            <div className="skeleton-text title skeleton" style={{ width: '60px', marginBottom: 0 }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : isCartEmpty ? (
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
                            <div className="cart-event-card" key={event?._id || event?.id}>
                                <div className="event-card-header" onClick={() => navigate(`/customer/event-details/${event?._id}`)} style={{ cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <img
                                            src={event?.image ? `/uploads/${event.image}` : "/assets/eventbg.jpg"}
                                            alt={event?.title || 'Event'}
                                            style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }}
                                            onError={(e) => { e.target.src = "/assets/eventbg.jpg" }}
                                        />
                                        <h4>{event?.title || 'Unknown Event'}</h4>
                                    </div>
                                    {(() => {
                                        if (!event || !event.startDate) return <span className="live-badge">TBA</span>;

                                        const now = new Date();
                                        const startDate = new Date(event.startDate);
                                        const endDate = event.endDate ? new Date(event.endDate) : new Date(startDate);

                                        if (event.startTime) {
                                            const [hours, minutes] = event.startTime.split(':').map(Number);
                                            startDate.setHours(hours || 0, minutes || 0, 0, 0);
                                        } else {
                                            startDate.setHours(0, 0, 0, 0);
                                        }

                                        if (event.endTime) {
                                            const [hours, minutes] = event.endTime.split(':').map(Number);
                                            endDate.setHours(hours || 23, minutes || 59, 59, 999);
                                        } else {
                                            endDate.setHours(23, 59, 59, 999);
                                        }

                                        if (now > endDate) {
                                            return <span className="live-badge ended-badge" style={{ backgroundColor: '#d41d1dff', color: '#fff' }}>Ended</span>;
                                        } else if (now >= startDate && now <= endDate) {
                                            return <span className="live-badge live-badge-active" style={{ backgroundColor: '#28a745', color: '#fff' }}>Live</span>;
                                        } else {
                                            const todayMidnight = new Date();
                                            todayMidnight.setHours(0, 0, 0, 0);
                                            const startMidnight = new Date(event.startDate);
                                            startMidnight.setHours(0, 0, 0, 0);

                                            const diffTime = startMidnight - todayMidnight;
                                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                            if (diffDays === 1) {
                                                return <span className="live-badge upcoming-badge" style={{ backgroundColor: '#6c757d', color: '#fff' }}>Tomorrow</span>;
                                            } else if (diffDays === 0) {
                                                return <span className="live-badge upcoming-badge" style={{ backgroundColor: '#6c757d', color: '#fff' }}>Later Today</span>;
                                            }
                                            return <span className="live-badge upcoming-badge" style={{ backgroundColor: '#6c757d', color: '#fff' }}>In {diffDays} Days</span>;
                                        }
                                    })()}
                                </div>
                                <div className="ticket-list">
                                    {(() => {
                                        const itemsToShow = [];
                                        const physicalSeats = items.filter(item => !item.seat?.id?.startsWith("GA-"));
                                        const gaItems = items.filter(item => item.seat?.id?.startsWith("GA-"));

                                        physicalSeats.forEach(item => {
                                            const catName = item.categoryName === 'Seated Ticket' ? 'Seat Ticket' : item.categoryName;
                                            itemsToShow.push({
                                                type: 'physical',
                                                key: item.cartId,
                                                ids: [item.cartId],
                                                quantity: 1,
                                                item: item,
                                                label: `${catName || 'Ticket'} (Seat ${item.seat?.label})`,
                                                facePrice: item.facePrice,
                                                serviceFee: item.serviceFee,
                                            });
                                        });

                                        const gaGroups = {};
                                        gaItems.forEach(item => {
                                            const catKey = item.categoryId || item.categoryName;
                                            if (!gaGroups[catKey]) {
                                                gaGroups[catKey] = [];
                                            }
                                            gaGroups[catKey].push(item);
                                        });

                                        Object.entries(gaGroups).forEach(([catKey, group]) => {
                                            const first = group[0];
                                            const totalFace = group.reduce((sum, i) => sum + i.facePrice, 0);
                                            const totalFee = group.reduce((sum, i) => sum + i.serviceFee, 0);
                                            const ids = group.map(i => i.cartId);
                                            const catName = first.categoryName === 'Seated Ticket' ? 'Ticket' : first.categoryName;

                                            itemsToShow.push({
                                                type: 'ga',
                                                key: `ga-group-${catKey}`,
                                                ids: ids,
                                                quantity: group.length,
                                                item: first,
                                                label: `${catName || 'Ticket'} x ${group.length}`,
                                                facePrice: totalFace,
                                                serviceFee: totalFee,
                                            });
                                        });

                                        return itemsToShow.map(showItem => {
                                            const isChecked = showItem.ids.every(id => selectedItems.includes(id));
                                            const handleToggleGroup = () => {
                                                if (isChecked) {
                                                    setSelectedItems(prev => prev.filter(id => !showItem.ids.includes(id)));
                                                } else {
                                                    setSelectedItems(prev => {
                                                        const toAdd = showItem.ids.filter(id => !prev.includes(id));
                                                        return [...prev, ...toAdd];
                                                    });
                                                }
                                            };

                                            const handleDeleteGroup = async () => {
                                                const ticketWord = showItem.quantity > 1 ? 'tickets' : 'ticket';
                                                const result = await showDeleteConfirmAlert(
                                                    'Remove Tickets?',
                                                    `Are you sure you want to remove these ${showItem.quantity} ${ticketWord} from your cart?`
                                                );
                                                if (result.isConfirmed) {
                                                    showItem.ids.forEach(id => removeFromCart(id));
                                                    setSelectedItems(prev => prev.filter(id => !showItem.ids.includes(id)));
                                                    showSuccessAlert('Removed!', 'Selected ticket(s) have been removed.');
                                                }
                                            };

                                            return (
                                                <div className={`ticket-item ${isChecked ? 'checked' : ''}`} key={showItem.key}>
                                                    <label className="custom-checkbox">
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={handleToggleGroup}
                                                        />
                                                        <span className="checkmark"></span>
                                                    </label>
                                                    <div className="ticket-main">
                                                        <div className="ticket-info">
                                                            <div className="ticket-type-info">
                                                                <h5>{showItem.label}</h5>
                                                                <p>
                                                                    <Icon icon="mdi:map-marker-outline" width="16" /> {event?.venue ? `${event.venue.name || ''}, ${event.venue.address || ''}, ${event.venue.city || ''}, ${event.venue.zipCode || ''}`.replace(/(, )+/g, ', ').replace(/^, |, $/g, '') : 'Location Unavailable'}
                                                                </p>
                                                            </div>
                                                            <div className="ticket-meta">
                                                                <div className="ticket-meta-item">
                                                                    <Icon icon="mdi:calendar-blank-outline" width="16" />
                                                                    <span>{event?.startDate ? new Date(event.startDate).toLocaleDateString() : 'Start Date TBA'}</span>
                                                                </div>

                                                                <div className="ticket-meta-item">
                                                                    <Icon icon="mdi:clock-outline" width="16" />
                                                                    <span>{event?.startTime || 'TBA'} - {event?.endTime || 'TBA'}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="ticket-price-right">
                                                            <h5>${(showItem.facePrice + showItem.serviceFee).toLocaleString()}</h5>
                                                            <button className="del-btn" onClick={handleDeleteGroup}>
                                                                <Icon icon="mdi:trash-can-outline" width="20" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
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
                                    Delete Selected
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
