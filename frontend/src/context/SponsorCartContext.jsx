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

            const currentDbCart = currentUser.cart || [];
            const nonBoothItems = currentDbCart.filter(item => !item?.booth?.id && !item?.booth?._id);
            const mergedCart = [...nonBoothItems, ...leanItems];

            updateCartAPI(mergedCart, currentUser.token).then(() => {
                const updatedUser = { ...currentUser, cart: mergedCart };
                try {
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                } catch (e) { }
            }).catch(err => {
                console.error("Failed to sync cart with backend", err);
            });
        }
    };

    // Load cart from user object or localStorage on mount or when user changes
    useEffect(() => {
        if (user) {
            // Check if user has cart items in their profile (from DB)
            const dbItems = (user.cart && Array.isArray(user.cart)) 
                ? user.cart.filter(item => item?.booth?.id || item?.booth?._id) 
                : [];

            // Fallback to localStorage if we need to merge guest cart
            const savedCart = localStorage.getItem(`sponsorCart_${user.email}`);
            const guestCart = localStorage.getItem('guestCart');

            let localItems = [];
            if (savedCart) {
                try { localItems = JSON.parse(savedCart).filter(item => item?.booth?.id || item?.booth?._id); } catch (e) { }
            } else if (guestCart) {
                try { localItems = JSON.parse(guestCart).filter(item => item?.booth?.id || item?.booth?._id); } catch (e) { }
            }

            // Merge DB cart and Local cart based on booth ID
            const mergedItems = [...dbItems];
            let didMerge = false;
            localItems.forEach(localItem => {
                const localId = String(localItem.booth?._id || localItem.booth?.id);
                if (!mergedItems.some(dbItem => String(dbItem.booth?._id || dbItem.booth?.id) === localId)) {
                    mergedItems.push(localItem);
                    didMerge = true;
                }
            });

            setCartItems(mergedItems);

            // Sync merged cart to DB ONLY if we added guest items that weren't in the DB
            // OR if DB is empty but we found items locally.
            if (didMerge || (dbItems.length === 0 && mergedItems.length > 0)) {
                saveCart(mergedItems, user);
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
    }, [user]); // <-- FIXED: Added the missing closure block right here!

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
            setCartItems(prev => {
                const newValue = data.cart || [];
                const prevIds = prev.map(i => String(i.booth?._id || i.booth?.id)).sort().join(',');
                const newIds = newValue.map(i => String(i.booth?._id || i.booth?.id)).sort().join(',');
                if (prevIds !== newIds || prev.length !== newValue.length) {
                    return newValue;
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