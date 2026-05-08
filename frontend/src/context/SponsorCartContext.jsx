import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import { updateCart as updateCartAPI } from '../services/userService';

export const SponsorCartContext = createContext();

export const useSponsorCartContext = () => {
    return useContext(SponsorCartContext);
};

export const SponsorCartProvider = ({ children }) => {
    const { user, dispatch } = useAuthContext();
    const [cartItems, setCartItems] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load cart from user object or localStorage on mount or when user changes
    useEffect(() => {
        if (user && !isInitialized) {
            // Check if user has cart items in their profile (from DB)
            if (user.cart && Array.isArray(user.cart) && user.cart.length > 0) {
                setCartItems(user.cart);
            } else {
                // Fallback to localStorage if DB cart is empty
                const savedCart = localStorage.getItem(`sponsorCart_${user.email}`);
                if (savedCart) {
                    try {
                        const parsedCart = JSON.parse(savedCart);
                        setCartItems(parsedCart);
                        
                        // Sync localStorage cart to DB if DB was empty
                        if (parsedCart.length > 0) {
                            updateCartAPI(parsedCart, user.token).catch(err => 
                                console.error("Error syncing local cart to DB:", err)
                            );
                        }
                    } catch (e) {
                        console.error("Error parsing cart from local storage", e);
                    }
                } else {
                    setCartItems([]);
                }
            }
            setIsInitialized(true);
        } else if (!user) {
            setCartItems([]);
            setIsInitialized(false);
        }
    }, [user, isInitialized]);

    // Save cart to localStorage AND backend whenever it changes
    useEffect(() => {
        if (user && isInitialized) {
            // Create a lean version of cart items for localStorage to save space
            const leanCartItems = cartItems.map(item => ({
                ...item,
                // Only keep essential fields from potentially large objects
                event: item.event ? {
                    _id: item.event._id,
                    title: item.event.title,
                    date: item.event.date,
                    banner: item.event.banner,
                    location: item.event.location
                } : null,
                booth: item.booth ? {
                    _id: item.booth._id,
                    id: item.booth.id,
                    label: item.booth.label,
                    price: item.booth.price,
                    type: item.booth.type
                } : null
            }));

            // Save to localStorage with error handling
            try {
                localStorage.setItem(`sponsorCart_${user.email}`, JSON.stringify(leanCartItems));
            } catch (e) {
                if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                    console.error("Local storage quota exceeded! Could not save cart locally.");
                    // Optional: You could clear other non-essential localStorage items here
                } else {
                    console.error("Error saving cart to local storage:", e);
                }
            }
            
            // Sync with backend
            const syncWithBackend = async () => {
                try {
                    await updateCartAPI(cartItems, user.token);
                    
                    // Also update the user object in AuthContext so it's consistent
                    const updatedUser = { ...user, cart: cartItems };
                    try {
                        localStorage.setItem('user', JSON.stringify(updatedUser));
                    } catch (storageErr) {
                        // If user object is too big, at least the cart is synced to DB
                        console.warn("Could not save updated user to localStorage (quota exceeded)");
                    }
                } catch (error) {
                    console.error("Failed to sync cart with backend", error);
                }
            };
            
            syncWithBackend();
        }
    }, [cartItems, user, isInitialized]);

    const addToCart = (item) => {
        // item will have { event, booth, category, total, facePrice, processingFee, estimatedTax }
        // Check if booth is already in cart
        setCartItems((prevItems) => {
            const exists = prevItems.find(i => {
                const iId = String(i.booth._id || i.booth.id);
                const newItemId = String(item.booth._id || item.booth.id);
                return iId === newItemId;
            });
            if (exists) {
                return prevItems; // Don't add duplicates
            }
            // generate a unique id for the cart item
            const cartItem = {
                ...item,
                cartId: Date.now().toString() + Math.random().toString(36).substr(2, 9)
            };
            return [...prevItems, cartItem];
        });
    };

    const removeFromCart = (cartId) => {
        setCartItems((prevItems) => prevItems.filter(item => item.cartId !== cartId));
    };

    const removeMultipleFromCart = (cartIds) => {
        setCartItems((prevItems) => prevItems.filter(item => !cartIds.includes(item.cartId)));
    };

    const clearCart = () => {
        setCartItems([]);
        if (user) {
            localStorage.removeItem(`sponsorCart_${user.email}`);
            updateCartAPI([], user.token).catch(err => console.error("Error clearing DB cart:", err));
        }
    };

    return (
        <SponsorCartContext.Provider value={{ cartItems, addToCart, removeFromCart, removeMultipleFromCart, clearCart }}>
            {children}
        </SponsorCartContext.Provider>
    );
};

