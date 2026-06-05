const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderItemSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Merchandise',
        required: true
    },
    name: String,
    price: Number,
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    image: String
});

const orderSchema = new Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sponsorId: {
        type: Schema.Types.ObjectId,
        ref: 'Sponsor',
        required: true
    },
    eventId: {
        type: Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    boothCode: {
        type: String,
        required: true
    },
    storeName: {
        type: String,
        required: true
    },
    items: [orderItemSchema],
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Preparing', 'Ready for Pickup', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    paymentStatus: {
        type: String,
        enum: ['Unpaid', 'Paid', 'Refunded', 'Pending'],
        default: 'Unpaid'
    },
    paymentMethod: {
        type: String,
        default: 'Credit Card'
    },
    appliedGift: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DigitalGift',
        required: false
    },
    giftCode: {
        type: String,
        required: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
