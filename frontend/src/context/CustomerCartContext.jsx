import React, { createContext, useContext, useState, useEffect } from 'react';

const CustomerCartContext = createContext();

export const useCustomerCart = () => {
    const context = useContext(CustomerCartContext);
    if (!context) {
        throw new Error('useCustomerCart must be used within a CustomerCartProvider');
    }
    return context;
};

export const CustomerCartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        const savedCart = localStorage.getItem('customerCart');
        if (savedCart) {
            try {
                return JSON.parse(savedCart);
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
                return JSON.parse(savedHistory);
            } catch (error) {
                console.error("Error parsing history from localStorage:", error);
                return [];
            }
        }
        return [];
    });

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('customerCart', JSON.stringify(cartItems));
    }, [cartItems]);

    // Save history to localStorage
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
            poNumber, // Store PO Number
            status: 'Upcoming' // Default status for new purchases
        }));

        setPurchaseHistory(prev => [...purchasedItems, ...prev]);
        setCartItems(prev => prev.filter(item => !cartIds.includes(item.cartId)));
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
        totalItems: cartItems.length
    };

    return (
        <CustomerCartContext.Provider value={value}>
            {children}
        </CustomerCartContext.Provider>
    );
};
