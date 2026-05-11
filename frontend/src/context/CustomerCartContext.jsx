import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import userService from '../services/userService';
import reservationService from '../services/reservationService';

const CustomerCartContext = createContext();

export const useCustomerCart = () => {
    const context = useContext(CustomerCartContext);
    if (!context) {
        throw new Error('useCustomerCart must be used within a CustomerCartProvider');
    }
    return context;
};

export const CustomerCartProvider = ({ children }) => {
    const { user } = useAuthContext();
    const [cartItems, setCartItems] = useState(() => {
        const savedCart = localStorage.getItem('customerCart');
        if (savedCart) {
            try {
                const items = JSON.parse(savedCart);
                return Array.isArray(items) ? items.filter(item => item?.seat?.id) : [];
            } catch (error) {
                console.error("Error parsing cart from localStorage:", error);
                return [];
            }
        }
        return [];
    });

    const [purchaseHistory, setPurchaseHistory] = useState(() => {
        const savedHistory = localStorage.getItem('customerPurchaseHistory');
        if (savedHistory) {
            try {
                const items = JSON.parse(savedHistory);
                return Array.isArray(items) ? items.filter(item => item?.purchaseDate) : [];
            } catch (error) {
                console.error("Error parsing history from localStorage:", error);
                return [];
            }
        }
        return [];
    });

    // --- Sync Cart with Backend ---
    const hasInitialSynced = useRef(false);

    useEffect(() => {
        if (user && user.token && !hasInitialSynced.current) {
            // If user just logged in, they might have cart data in their profile
            if (user.cart && user.cart.length > 0) {
                setCartItems(prev => {
                    // Merge local cart with remote cart, avoiding duplicates by seat.id
                    const localIds = new Set(prev.filter(item => item?.seat?.id).map(item => item.seat.id));
                    const remoteItems = user.cart.filter(item => item?.seat?.id && !localIds.has(item.seat.id));
                    
                    if (remoteItems.length > 0) {
                        return [...prev, ...remoteItems];
                    }
                    return prev;
                });
            }
            hasInitialSynced.current = true;
        }
    }, [user]);


    // Save cart to localStorage and Backend whenever it changes
    const { dispatch } = useAuthContext();
    
    useEffect(() => {
        localStorage.setItem('customerCart', JSON.stringify(cartItems));
        
        const syncCart = async () => {
            if (user && user.token) {
                try {
                    const updatedCart = await userService.updateCart(cartItems, user.token);
                    
                    // Update user in AuthContext and LocalStorage to keep cart synced
                    const updatedUser = { ...user, cart: updatedCart };
                    dispatch({ type: 'LOGIN', payload: updatedUser });
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                } catch (error) {
                    console.error("Failed to sync cart to backend:", error);
                }
            }
        };
        syncCart();
    }, [cartItems, user?.token, dispatch]); // Only trigger when items change or token changes


    // --- Sync Purchase History with Backend ---
    const fetchHistory = useCallback(async () => {
        if (!user || !user.token) return;
        try {
            const reservations = await reservationService.getMyReservations(user.token);
            
            // Format reservations into the format expected by the frontend
            const formattedHistory = [];
            reservations.forEach(res => {
                // If it's a seated reservation, it has seatIds and seatLabels
                if (res.type === 'seat' && res.seatIds) {
                    res.seatIds.forEach((sid, idx) => {
                        formattedHistory.push({
                            cartId: `db-${res._id}-${idx}`,
                            event: res.event,
                            categoryId: '', // We don't have cat info in reservation model yet
                            categoryName: 'Seated Ticket',
                            seat: {
                                id: sid,
                                label: res.seatLabels[idx] || sid,
                                row: ''
                            },
                            facePrice: (res.amount.subtotal / res.seatIds.length) || 0,
                            serviceFee: (res.amount.fee / res.seatIds.length) || 0,
                            purchaseDate: res.createdAt,
                            paymentMethod: res.paymentMethod === 'card' ? 'Credit Card' : 'Invoice / Bank Transfer',
                            poNumber: res.poNumber || '',
                            status: res.status === 'confirmed' ? 'Upcoming' : 'Confirmed',
                            qrData: res.qrData || res._id.toString()
                        });
                    });
                } else if (res.type === 'booth') {
                    formattedHistory.push({
                        cartId: `db-${res._id}`,
                        event: res.event,
                        categoryId: '',
                        categoryName: 'Booth',
                        seat: {
                            id: res.boothId,
                            label: res.boothCode,
                            row: ''
                        },
                        facePrice: res.amount.subtotal || 0,
                        serviceFee: res.amount.fee || 0,
                        purchaseDate: res.createdAt,
                        paymentMethod: res.paymentMethod === 'card' ? 'Credit Card' : 'Invoice / Bank Transfer',
                        poNumber: res.poNumber || '',
                        status: 'Confirmed',
                        qrData: res.qrData || res._id.toString()
                    });
                }
            });

            setPurchaseHistory(formattedHistory);
            localStorage.setItem('customerPurchaseHistory', JSON.stringify(formattedHistory));
        } catch (error) {
            console.error("Failed to fetch purchase history:", error);
        }
    }, [user]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // Save history to localStorage (redundant but kept for offline support)
    useEffect(() => {
        localStorage.setItem('customerPurchaseHistory', JSON.stringify(purchaseHistory));
    }, [purchaseHistory]);

    const addToCart = (event, seats) => {
        const newItems = seats.map(seat => ({
            cartId: Math.random().toString(36).substr(2, 9),
            event: {
                _id: event._id,
                title: event.title,
                image: event.image,
                venue: event.venue,
                startDate: event.startDate,
                startTime: event.startTime
            },
            categoryId: seat.categoryId,
            categoryName: seat.categoryName,
            seat: {
                id: seat.id,
                label: seat.label,
                row: seat.row
            },
            facePrice: seat.price,
            serviceFee: 10
        }));

        setCartItems(prev => [...prev, ...newItems]);
    };

    const removeFromCart = (cartId) => {
        setCartItems(prev => prev.filter(item => item.cartId !== cartId));
    };

    const completePurchase = (cartIds, paymentMethod = 'Credit Card', poNumber = '') => {
        const itemsToPurchase = cartItems.filter(item => cartIds.includes(item.cartId));
        const purchasedItems = itemsToPurchase.map(item => ({
            ...item,
            purchaseDate: new Date().toISOString(),
            paymentMethod,
            poNumber,
            status: 'Upcoming'
        }));

        setPurchaseHistory(prev => [...purchasedItems, ...prev]);
        setCartItems(prev => prev.filter(item => !cartIds.includes(item.cartId)));
        
        // Refetch from backend to ensure everything is synced
        setTimeout(() => fetchHistory(), 1000);
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const value = {
        cartItems,
        purchaseHistory,
        addToCart,
        removeFromCart,
        completePurchase,
        clearCart,
        totalItems: cartItems.length,
        refreshHistory: fetchHistory
    };

    return (
        <CustomerCartContext.Provider value={value}>
            {children}
        </CustomerCartContext.Provider>
    );
};
