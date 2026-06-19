import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import { updateCart as updateCartAPI } from '../services/userService';
import eventsService from '../services/eventsService';
import io from 'socket.io-client';

export const SponsorCartContext = createContext();

export const useSponsorCartContext = () => {
    return useContext(SponsorCartContext);
};

// Helper to strip heavy data and circular references before saving
const getLeanCartItems = (items) => items.map(item => ({
    ...item,
    event: item.event ? {
        _id: item.event._id,
        title: item.event.title,
        date: item.event.date,
        startDate: item.event.startDate,
        endDate: item.event.endDate,
        banner: item.event.banner,
        image: item.event.image,
        location: item.event.location,
        venue: item.event.venue
    } : null,
    booth: item.booth ? {
        _id: item.booth._id,
        id: item.booth.id,
        label: item.booth.label,
        price: item.booth.price,
        type: item.booth.type
    } : null
}));

export const SponsorCartProvider = ({ children }) => {
    const { user, dispatch } = useAuthContext();
    const [cartItems, setCartItems] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const hasHealedRef = useRef(false);
    const socketRef = useRef(null);
    // Track how many saves are in-flight so we can ignore our own WebSocket echoes
    const pendingSavesRef = useRef(0);

    // Explicitly save to storage and backend
    const saveCart = (newItems, currentUser = user) => {
        const leanItems = getLeanCartItems(newItems);

        // Always save to guestCart
        try {
            localStorage.setItem('guestCart', JSON.stringify(leanItems));
        } catch (e) {
            console.error("Error saving guest cart", e);
        }

        if (currentUser) {
            try {
                localStorage.setItem(`sponsorCart_${currentUser.email}`, JSON.stringify(leanItems));
            } catch (e) {
                console.error("Error saving user cart locally", e);
            }

            // IMPORTANT: Do NOT merge with currentUser.cart here — that is a stale
            // login-time snapshot and will resurrect deleted booths. We only keep
            // non-booth items (e.g. ticket cart items from other contexts) from the
            // persisted 'user' object, which is more up-to-date than auth context.
            let nonBoothItems = [];
            try {
                const persistedUser = JSON.parse(localStorage.getItem('user') || '{}');
                const persistedCart = persistedUser?.cart || [];
                nonBoothItems = persistedCart.filter(item => !item?.booth?.id && !item?.booth?._id);
            } catch (e) { }

            const mergedCart = [...nonBoothItems, ...leanItems];

            // Track in-flight saves so the WebSocket echo is ignored
            pendingSavesRef.current += 1;
            updateCartAPI(mergedCart, currentUser.token).then(() => {
                // Update the persisted user snapshot so future saves have fresh non-booth items
                try {
                    const persistedUser = JSON.parse(localStorage.getItem('user') || '{}');
                    const updatedUser = { ...persistedUser, cart: mergedCart };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                } catch (e) { }
            }).catch(err => {
                console.error("Failed to sync cart with backend", err);
            }).finally(() => {
                // Decrement after a short delay so the WS echo (which arrives
                // shortly after the API response) is still suppressed
                setTimeout(() => {
                    pendingSavesRef.current = Math.max(0, pendingSavesRef.current - 1);
                }, 1500);
            });
        }
    };

    // Load cart from user object or localStorage on mount or when user changes
    // Load cart from user object or localStorage on mount or when the logged-in user actually changes
    useEffect(() => {
        if (user) {
            const savedCartKey = `sponsorCart_${user.email}`;
            const savedCart = localStorage.getItem(savedCartKey);

            if (savedCart !== null) {
                // We've already established a local cart for this user, and every
                // add/remove/clear keeps it perfectly in sync. Trust it instead of
                // re-merging with user.cart, which can be a stale snapshot (we
                // never dispatch cart updates back into the auth context) and
                // would otherwise resurrect deleted items.
                let localItems = [];
                try {
                    localItems = JSON.parse(savedCart).filter(item => item?.booth?.id || item?.booth?._id);
                } catch (e) { }
                setCartItems(localItems);
            } else {
                // First time we've seen this user in this browser (fresh login /
                // new device) — merge their DB cart with any guest cart so nothing
                // gets lost, then persist that as the new local baseline.
                const dbItems = (user.cart && Array.isArray(user.cart))
                    ? user.cart.filter(item => item?.booth?.id || item?.booth?._id)
                    : [];

                const guestCart = localStorage.getItem('guestCart');
                let guestItems = [];
                if (guestCart) {
                    try { guestItems = JSON.parse(guestCart).filter(item => item?.booth?.id || item?.booth?._id); } catch (e) { }
                }

                const mergedItems = [...dbItems];
                let didMerge = false;
                guestItems.forEach(localItem => {
                    const localId = String(localItem.booth?._id || localItem.booth?.id);
                    if (!mergedItems.some(dbItem => String(dbItem.booth?._id || dbItem.booth?.id) === localId)) {
                        mergedItems.push(localItem);
                        didMerge = true;
                    }
                });

                setCartItems(mergedItems);

                if (didMerge) {
                    // New guest items found — persist locally AND to the backend
                    saveCart(mergedItems, user);
                } else {
                    // Nothing new to push to the backend, but still establish the
                    // local baseline so future renders trust localStorage.
                    try {
                        localStorage.setItem(savedCartKey, JSON.stringify(getLeanCartItems(mergedItems)));
                    } catch (e) { }
                }
            }
        } else {
            // User is a guest or just logged out
            const guestCart = localStorage.getItem('guestCart');
            let parsedCart = [];
            if (guestCart) {
                try {
                    parsedCart = (JSON.parse(guestCart) || []).filter(item => item?.booth?.id || item?.booth?._id);
                } catch (e) { }
            }
            setCartItems(parsedCart);
        }
        setIsInitialized(true);
    }, [user?.email]); // only re-sync when the logged-in user actually changes, not on every user object reference change

    // Listen for cross-window storage changes to sync cart in real-time (for same browser)
    useEffect(() => {
        const handleStorageChange = (e) => {
            const relevantKeys = [];

            if (user && user.email) {
                relevantKeys.push(`sponsorCart_${user.email}`);
            } else {
                relevantKeys.push('guestCart');
            }

            if (relevantKeys.includes(e.key)) {
                try {
                    const newValue = e.newValue ? JSON.parse(e.newValue) : [];
                    setCartItems(prev => {
                        const prevIds = prev.map(i => String(i.booth?._id || i.booth?.id)).sort().join(',');
                        const newIds = newValue.map(i => String(i.booth?._id || i.booth?.id)).sort().join(',');
                        if (prevIds !== newIds || prev.length !== newValue.length) {
                            return newValue;
                        }
                        return prev;
                    });
                } catch (err) {
                    console.error("Error parsing cross-window cart update", err);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [user]);

    // Listen to WebSocket for cross-device/browser sync
    useEffect(() => {
        if (!user) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            return;
        }

        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        const socket = io(import.meta.env.VITE_BACKEND_URL, {
            withCredentials: true,
            transports: ['polling', 'websocket'],  // polling first, upgrade later
            upgrade: false,                         // disables the upgrade that causes the warning
            reconnectionAttempts: 3,
        });

        socketRef.current = socket;

        socket.on('cartUpdate', (data) => {
            if (data.userId && String(data.userId) === String(user._id)) {
                // If we have an in-flight save, this WebSocket event is likely the
                // echo from our own updateCartAPI call. Ignore it to prevent
                // ghost-booth resurrection (the backend sends back the pre-removal
                // snapshot before our write lands).
                if (pendingSavesRef.current > 0) {
                    return;
                }

                setCartItems(prev => {
                    // Only apply WS update if it comes from another device/tab.
                    // Filter to booth-only items so we compare apples to apples.
                    const newBoothItems = (data.cart || []).filter(
                        i => i?.booth?.id || i?.booth?._id
                    );
                    const prevIds = prev.map(i => String(i.booth?._id || i.booth?.id)).sort().join(',');
                    const newIds = newBoothItems.map(i => String(i.booth?._id || i.booth?.id)).sort().join(',');
                    if (prevIds !== newIds || prev.length !== newBoothItems.length) {
                        return newBoothItems;
                    }
                    return prev;
                });
            }
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [user]);

    const addToCart = (item) => {
        if (!item || !item.booth) return;
        setCartItems((prevItems) => {
            const newItemId = String(item.booth._id || item.booth.id);
            const exists = prevItems.some(i => {
                const iId = String(i.booth?._id || i.booth?.id || '');
                return iId === newItemId;
            });

            if (exists) return prevItems;

            const cartItem = {
                ...item,
                cartId: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9)
            };
            const newCart = [...prevItems, cartItem];
            saveCart(newCart);
            return newCart;
        });
    };

    const addMultipleToCart = (items) => {
        if (!Array.isArray(items) || items.length === 0) return;

        setCartItems((prevItems) => {
            const newItems = items
                .filter(newItem => {
                    if (!newItem || !newItem.booth) return false;
                    const newItemId = String(newItem.booth._id || newItem.booth.id);
                    return !prevItems.some(i => String(i.booth?._id || i.booth?.id || '') === newItemId);
                })
                .map((item, idx) => ({
                    ...item,
                    cartId: (Date.now() + idx).toString() + '-' + Math.random().toString(36).substr(2, 9)
                }));

            if (newItems.length === 0) return prevItems;
            const newCart = [...prevItems, ...newItems];
            saveCart(newCart);
            return newCart;
        });
    };

    const removeFromCart = (cartId) => {
        setCartItems((prevItems) => {
            const newCart = prevItems.filter(item => item.cartId !== cartId);
            saveCart(newCart);
            return newCart;
        });
    };

    const removeMultipleFromCart = (cartIds) => {
        setCartItems((prevItems) => {
            const newCart = prevItems.filter(item => !cartIds.includes(item.cartId));
            saveCart(newCart);
            return newCart;
        });
    };

    const clearCart = () => {
        setCartItems([]);
        saveCart([]);
    };

    return (
        <SponsorCartContext.Provider value={{ cartItems, addToCart, addMultipleToCart, removeFromCart, removeMultipleFromCart, clearCart }}>
            {children}
        </SponsorCartContext.Provider>
    );
};