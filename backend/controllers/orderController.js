const Order = require("../models/orderModel");
const Merchandise = require("../models/merchandiseModel");
const Sponsor = require("../models/sponsorModel");
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
        
        const isInvoice = paymentMethod && paymentMethod.toLowerCase().includes('invoice');
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
            paymentStatus: isInvoice ? 'Pending' : 'Paid',
            appliedGift: req.body.appliedGift || null,
            giftCode: req.body.giftCode || ""
        });

        // Update stock for each product
        for (const item of items) {
            await Merchandise.findByIdAndUpdate(item.productId, {
                $inc: { stock: -item.quantity }
            });
        }

        // Notify the customer and sponsor
        try {
            const notificationController = require("./notificationController");
            const socket = require("../socket");
            
            const notification = await notificationController.createNotification({
                title: `Order Placed Successfully`,
                content: `Your order ${orderId} has been placed.`,
                type: 'payment',
                path: '/customer/my-orders',
                unread: true,
                userId: customerId,
                createdBy: customerId
            });
            socket.emitUpdate('newNotification', notification);

            const sponsorInfo = await Sponsor.findById(sponsorId);
            if (sponsorInfo && sponsorInfo.userId) {
                const productsList = items.map(item => `${item.quantity}x ${item.name || 'Product'}`).join(', ');
                const sponsorNotification = await notificationController.createNotification({
                    title: `New Order Received`,
                    content: `A new order ${orderId} has been placed at ${storeName} for: ${productsList}.`,
                    type: 'payment',
                    path: '/sponsor/orders',
                    unread: true,
                    userId: sponsorInfo.userId,
                    createdBy: customerId
                });
                socket.emitUpdate('newNotification', sponsorNotification);
            }
        } catch (notifErr) {
            console.error("Order notification error:", notifErr);
        }

        res.status(201).json(order);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get Orders (for Sponsor or Admin)
const getOrders = async (req, res) => {
    const { sponsorId, eventId, boothCode, status } = req.query;
    const { page, limit, skip } = req.pagination || { page: 1, limit: 10000, skip: 0 };
    const filter = {};

    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';

    if (sponsorId) filter.sponsorId = sponsorId;
    if (eventId) filter.eventId = eventId;
    if (boothCode) filter.boothCode = boothCode;
    if (status) filter.status = status;

    const queryCustomerId = req.query.customerId;

    if (!isAdmin) {
        if (queryCustomerId && queryCustomerId === req.user._id.toString()) {
            filter.customerId = queryCustomerId;
        } else if (req.user.role === 'sponsor' || req.user.role === 'promoter') {
            const sponsor = await Sponsor.findOne({ userId: req.user._id });
            if (sponsor) {
                filter.sponsorId = sponsor._id;
            } else {
                filter.customerId = req.user._id;
            }
        } else {
            filter.customerId = req.user._id;
        }
    } else if (queryCustomerId) {
        filter.customerId = queryCustomerId;
    }

    try {
        const [orders, total] = await Promise.all([
            Order.find(filter)
                .populate('customerId', 'firstName lastName email')
                .populate('sponsorId', 'companyName')
                .populate('eventId', 'title')
                .populate('items.productId')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Order.countDocuments(filter)
        ]);
        res.status(200).json({
            data: orders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
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
        // Use pre-fetched doc from verifyOrderOwner middleware if available
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
