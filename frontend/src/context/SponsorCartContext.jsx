import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';

export const SponsorCartContext = createContext();

export const useSponsorCartContext = () => {
    return useContext(SponsorCartContext);
};

export const SponsorCartProvider = ({ children }) => {
    const { user } = useAuthContext();
    const [cartItems, setCartItems] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load cart from localStorage on mount or when user changes
    useEffect(() => {
        if (user && !isInitialized) {
            const savedCart = localStorage.getItem(`sponsorCart_${user.email}`);
            if (savedCart) {
                try {
                    setCartItems(JSON.parse(savedCart));
                } catch (e) {
                    console.error("Error parsing cart from local storage", e);
                }
            } else {
                setCartItems([]);
            }
            setIsInitialized(true);
        } else if (!user) {
            setCartItems([]);
            setIsInitialized(false);
        }
    }, [user, isInitialized]);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (user && isInitialized) {
            localStorage.setItem(`sponsorCart_${user.email}`, JSON.stringify(cartItems));
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

    const clearCart = () => {
        setCartItems([]);
        if (user) {
            localStorage.removeItem(`sponsorCart_${user.email}`);
        }
    };

    return (
        <SponsorCartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart }}>
            {children}
        </SponsorCartContext.Provider>
    );
};
