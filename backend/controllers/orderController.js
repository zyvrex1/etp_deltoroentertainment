const Order = require("../models/orderModel");
const Merchandise = require("../models/merchandiseModel");
const mongoose = require("mongoose");

// Create Order
const createOrder = async (req, res) => {
    const { items, sponsorId, eventId, boothCode, storeName, totalAmount, paymentMethod } = req.body;
    const customerId = req.user._id;

    if (!items || items.length === 0 || !sponsorId || !eventId) {
        return res.status(400).json({ error: "Missing required order details" });
    }

    try {
        const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
        
        const order = await Order.create({
            orderId,
            customerId,
            sponsorId,
            eventId,
            boothCode,
            storeName,
            items,
            totalAmount,
            paymentMethod,
            status: 'Pending',
            paymentStatus: 'Unpaid' // Defaulting to Unpaid for simulation
        });

        // Update stock for each product
        for (const item of items) {
            await Merchandise.findByIdAndUpdate(item.productId, {
                $inc: { stock: -item.quantity }
            });
        }

        res.status(201).json(order);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get Orders (for Sponsor or Admin)
const getOrders = async (req, res) => {
    const { sponsorId, eventId, boothCode, status, customerId } = req.query;
    const filter = {};

    if (sponsorId) filter.sponsorId = sponsorId;
    if (eventId) filter.eventId = eventId;
    if (boothCode) filter.boothCode = boothCode;
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;

    try {
        const orders = await Order.find(filter)
            .populate('customerId', 'firstName lastName email')
            .populate('sponsorId', 'companyName')
            .populate('eventId', 'title')
            .sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update Order Status
const updateOrder = async (req, res) => {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: "Invalid order ID" });
    }

    try {
        const order = await Order.findByIdAndUpdate(
            id,
            { status, paymentStatus },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        res.status(200).json(order);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    createOrder,
    getOrders,
    updateOrder
};
