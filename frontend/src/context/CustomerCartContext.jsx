import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import userService from '../services/userService';
import reservationService from '../services/reservationService';
import eventsService from '../services/eventsService';
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

    const hasInitialSynced = useRef(false);
    const { dispatch } = useAuthContext();

    const saveCustomerCart = (newItems, currentUser = user) => {
        localStorage.setItem('customerCart', JSON.stringify(newItems));
        if (currentUser && currentUser.token && currentUser.role) {
            // Preserve existing non-seat items (like booths) from the user's cart in the DB
            const currentDbCart = currentUser.cart || [];
            const nonSeatItems = currentDbCart.filter(item => !item?.seat?.id && !item?.seat?._id);
            const mergedCart = [...nonSeatItems, ...newItems];

            userService.updateCart(mergedCart, currentUser.token).then(updatedCart => {
                const updatedUser = { ...currentUser, cart: updatedCart };
                dispatch({ type: 'LOGIN', payload: updatedUser });
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }).catch(error => {
                console.error("Failed to sync cart to backend:", error);
            });
        }
    };

    useEffect(() => {
        if (user && user.token && !hasInitialSynced.current) {
            let didMerge = false;
            let finalCart = [...cartItems];

            if (user.cart && user.cart.length > 0) {
                const localIds = new Set(finalCart.filter(item => item?.seat?.id).map(item => item.seat.id));
                const remoteItems = user.cart.filter(item => item?.seat?.id && !localIds.has(item.seat.id));
                if (remoteItems.length > 0) {
                    finalCart = [...finalCart, ...remoteItems];
                    didMerge = true;
                }
            }

            if (didMerge) setCartItems(finalCart);

            if (didMerge || (user.cart?.length === 0 && finalCart.length > 0)) {
                saveCustomerCart(finalCart, user);
            }

            hasInitialSynced.current = true;
        }
    }, [user]);



    /**
     * Build a discount lookup map from locally-stored purchase history.
     *
     * We key by TWO strategies so we can match both before and after fetchHistory runs:
     *   1. resId  — extracted from cartId "db-{resId}-{idx}" (post-fetchHistory items)
     *   2. purchaseDate (ISO string, truncated to the minute) — matches items written
     *      by completePurchase before they get replaced by fetchHistory items.
     *
     * This ensures discount data is never lost during the 2-second fetchHistory delay.
     */
    const buildLocalDiscountMap = (localHistory) => {
        const map = {};
        localHistory.forEach(item => {
            if (!item.appliedGift && !item.discountAmount) return;

            // Strategy 1: cartId pattern "db-{resId}-{idx}"
            const match = item.cartId?.match(/^db-(.+)-(\d+)$/);
            if (match) {
                const resId = match[1];
                if (!map[`resId:${resId}`]) {
                    map[`resId:${resId}`] = {
                        appliedGift: item.appliedGift || null,
                        discountAmount: item.discountAmount || 0,
                    };
                }
            }

            // Strategy 2: purchaseDate truncated to minute (e.g. "2024-01-15T10:30")
            if (item.purchaseDate) {
                const dateKey = `date:${item.purchaseDate.slice(0, 16)}`;
                if (!map[dateKey]) {
                    map[dateKey] = {
                        appliedGift: item.appliedGift || null,
                        discountAmount: item.discountAmount || 0,
                    };
                }
            }
        });
        return map;
    };

    const fetchHistory = useCallback(async () => {
        if (!user || !user.token) return;
        try {
            const reservations = await reservationService.getMyReservations(user.token);

            // Snapshot local discount data before overwriting
            const localHistory = JSON.parse(localStorage.getItem('customerPurchaseHistory') || '[]');
            const localDiscountMap = buildLocalDiscountMap(localHistory);

            /**
             * Resolve discount for a reservation.
             * Checks backend data first, then falls back to local map using:
             *   1. resId key
             *   2. createdAt date key (matches completePurchase items written seconds ago)
             */
            const resolveDiscount = (res) => {
                const backendDiscount = res.amount?.discount || 0;

                // Only treat a gift as redeemed when a discount was actually applied
                if (backendDiscount > 0) {
                    return {
                        resolvedGift: res.appliedGift || null,
                        resolvedDiscount: backendDiscount,
                    };
                }

                // Rejected/cancelled orders may still reference a gift on the record after restore.
                // Refunded orders keep the gift redeemed — do not show discount UI for terminal statuses.
                if (['rejected', 'refunded', 'cancelled'].includes(res.status)) {
                    return { resolvedGift: null, resolvedDiscount: 0 };
                }

                const byResId = localDiscountMap[`resId:${res._id}`];
                if (byResId?.discountAmount > 0) {
                    return { resolvedGift: byResId.appliedGift, resolvedDiscount: byResId.discountAmount };
                }

                // Match by createdAt minute — covers items just written by completePurchase
                const dateKey = `date:${res.createdAt?.slice(0, 16)}`;
                const byDate = localDiscountMap[dateKey];
                if (byDate?.discountAmount > 0) {
                    return { resolvedGift: byDate.appliedGift, resolvedDiscount: byDate.discountAmount };
                }

                return { resolvedGift: null, resolvedDiscount: 0 };
            };

            const formattedHistory = [];
            reservations.forEach(res => {
                const orderGift = res.appliedGift || null;
                const orderGiftCode = res.giftCode || res.appliedGift?.code || null;

                if (res.type === 'seat' && res.seatIds) {
                    const pricePerSeat = res.amount.subtotal / res.seatIds.length;
                    const { resolvedGift, resolvedDiscount } = resolveDiscount(res);

                    const isBXGY = resolvedGift?.valueType === 'bxgy' && res.seatIds.length > 1;

                    res.seatIds.forEach((sid, idx) => {
                        formattedHistory.push({
                            cartId: `db-${res._id}-${idx}`,
                            event: res.event,
                            categoryId: '',
                            categoryName: sid.startsWith("GA-") ? "Ticket" : "Seat Ticket",
                            seat: {
                                id: sid,
                                label: res.seatLabels[idx] || sid,
                                row: ''
                            },
                            facePrice: pricePerSeat,
                            isBXGYFree: isBXGY && idx === 0,
                            serviceFee: (res.amount.fee / res.seatIds.length) || 0,
                            purchaseDate: res.createdAt,
                            paymentMethod: res.paymentMethod === 'card' ? 'Credit Card' : 'Invoice / Bank Transfer',
                            poNumber: res.poNumber || '',
                            status: res.status,
                            qrData: res.qrData || res._id.toString(),
                            // Discount only on first item to avoid duplication in sum
                            appliedGift: idx === 0 ? resolvedGift : null,
                            giftCode: idx === 0 ? (res.giftCode || resolvedGift?.code || null) : null,
                            discountAmount: idx === 0 ? resolvedDiscount : 0,
                            orderGift: idx === 0 ? orderGift : null,
                            orderGiftCode: idx === 0 ? orderGiftCode : null,
                        });
                    });
                } else if (res.type === 'booth') {
                    const { resolvedGift, resolvedDiscount } = resolveDiscount(res);

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
                        status: res.status,
                        qrData: res.qrData || res._id.toString(),
                        appliedGift: resolvedGift,
                        giftCode: res.giftCode || resolvedGift?.code || null,
                        discountAmount: resolvedDiscount,
                        orderGift,
                        orderGiftCode,
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
        if (!user || !user.token) return;
        fetchHistory();
    }, [fetchHistory, user]);

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
                endDate: event.endDate,
                startTime: event.startTime,
                endTime: event.endTime
            },
            categoryId: seat.categoryId,
            categoryName: seat.categoryName,
            seat: {
                id: seat.id,
                label: seat.label,
                row: seat.row
            },
            facePrice: seat.price,
            serviceFee: 0
        }));

        setCartItems(prev => {
            const filteredNewItems = newItems.filter(newItem => {
                const isDuplicate = prev.some(item =>
                    item.event._id === newItem.event._id &&
                    item.seat.id === newItem.seat.id
                );
                return !isDuplicate;
            });

            if (filteredNewItems.length === 0) return prev;
            const newCart = [...prev, ...filteredNewItems];
            saveCustomerCart(newCart);
            return newCart;
        });
    };

    const removeFromCart = (cartId) => {
        setCartItems(prev => {
            const newCart = prev.filter(item => item.cartId !== cartId);
            saveCustomerCart(newCart);
            return newCart;
        });
    };

    /**
     * completePurchase
     * @param {string[]}    cartIds       - cart item IDs being purchased
     * @param {string}      paymentMethod - resolved payment method label
     * @param {string}      poNumber      - PO number (invoice only)
     * @param {number}      totalFee      - total service fee amount
     * @param {object|null} selectedGift  - the applied gift card object (or null)
     * @param {number}      discount      - calculated discount amount
     */
    const completePurchase = (cartIds, paymentMethod = 'Credit Card', poNumber = '', totalFee = 0, selectedGift = null, discount = 0) => {
        const itemsToPurchase = cartItems.filter(item => cartIds.includes(item.cartId));
        const feePerItem = itemsToPurchase.length > 0 ? (totalFee / itemsToPurchase.length) : 0;

        let bxgyFreeCartId = null;
        if (selectedGift?.valueType === 'bxgy' && itemsToPurchase.length >= 2) {
            const sorted = [...itemsToPurchase].sort((a, b) => a.facePrice - b.facePrice);
            bxgyFreeCartId = sorted[0].cartId;
        }

        const now = new Date().toISOString();

        const purchasedItems = itemsToPurchase.map((item, idx) => ({
            ...item,
            serviceFee: feePerItem,
            purchaseDate: now,
            paymentMethod,
            poNumber,
            status: 'Upcoming',
            isBXGYFree: bxgyFreeCartId === item.cartId,
            // Discount stored on first item only — summed in PaySuccess
            appliedGift: idx === 0 ? (selectedGift || null) : null,
            giftCode: idx === 0 ? (selectedGift?.code || null) : null,
            discountAmount: idx === 0 ? discount : 0,
            orderGift: idx === 0 ? (selectedGift || null) : null,
            orderGiftCode: idx === 0 ? (selectedGift?.code || null) : null,
        }));

        setPurchaseHistory(prev => [...purchasedItems, ...prev]);

        const updatedHistory = [...purchasedItems, ...JSON.parse(localStorage.getItem('customerPurchaseHistory') || '[]')];
        localStorage.setItem('customerPurchaseHistory', JSON.stringify(updatedHistory));

        setCartItems(prev => {
            const newCart = prev.filter(item => !cartIds.includes(item.cartId));
            saveCustomerCart(newCart);
            return newCart;
        });

        // fetchHistory will now find discount via the date-key fallback
        setTimeout(() => fetchHistory(), 2000);
    };

    const clearCart = () => {
        setCartItems([]);
        saveCustomerCart([]);
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