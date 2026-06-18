import React, { createContext, useContext, useState, useEffect } from 'react';

const CustomerStoreCartContext = createContext();

export const useCustomerStoreCart = () => {
    const context = useContext(CustomerStoreCartContext);
    if (!context) {
        throw new Error('useCustomerStoreCart must be used within a CustomerStoreCartProvider');
    }
    return context;
};

export const CustomerStoreCartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        const savedCart = localStorage.getItem('customerStoreCart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    useEffect(() => {
        localStorage.setItem('customerStoreCart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product, boothInfo) => {
        setCartItems(prev => {
            const existingItem = prev.find(item => item.id === product._id || item.id === product.id);
            if (existingItem) {
                return prev.map(item => 
                    (item.id === product._id || item.id === product.id)
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { 
                id: product._id || product.id, 
                name: product.name, 
                price: product.price, 
                image: product.image,
                category: product.category,
                boothName: boothInfo.boothName,
                sponsorName: boothInfo.sponsorName,
                sponsorId: product.sponsorId?._id || product.sponsorId,
                eventId: boothInfo.eventId || product.eventId?._id || product.eventId,
                quantity: 1 
            }];
        });
    };

    const removeFromCart = (productId) => {
        setCartItems(prev => prev.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId, delta) => {
        setCartItems(prev => prev.map(item => {
            if (item.id === productId) {
                const newQuantity = Math.max(0, item.quantity + delta);
                return { ...item, quantity: newQuantity };
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const getItemQuantity = (productId) => {
        const item = cartItems.find(item => item.id === productId);
        return item ? item.quantity : 0;
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const getTotalAmount = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getTotalItems = () => {
        return cartItems.reduce((total, item) => total + item.quantity, 0);
    };

    const value = {
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        getItemQuantity,
        clearCart,
        getTotalAmount,
        getTotalItems
    };

    return (
        <CustomerStoreCartContext.Provider value={value}>
            {children}
        </CustomerStoreCartContext.Provider>
    );
};
