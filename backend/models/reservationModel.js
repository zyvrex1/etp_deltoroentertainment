const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    exhibitors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    boothId: {
        type: String, // The _id of the booth within the event's booths array
        required: false
    },
    boothCode: {
        type: String, // e.g., "B01"
        required: false
    },
    priceLevelId: {
        type: mongoose.Schema.Types.Mixed, // The price level category for this reservation
        required: false,
        default: null
    },
    seatIds: [{
        type: String
    }],
    seatLabels: [{
        type: String
    }],
    type: {
        type: String,
        enum: ['booth', 'seat', 'general-fee', 'mixed-ticket', 'sponsorship'],
        default: 'booth'
    },
    amount: {
        total: Number,
        subtotal: Number,
        discount: { type: Number, default: 0 },
        discountLabel: { type: String, default: null },
        fee: Number,
        tax: Number
    },
    billingAddress: {
        companyName: String,
        address: String,
        city: String,
        zipCode: String,
        email: String
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'rejected', 'refunded', 'expired'],
        default: 'confirmed' // Defaulting to confirmed for the sample payment flow
    },
    paymentMethod: {
        type: String,
        default: 'invoice'
    },
    poNumber: {
        type: String
    },
    batchId: {
        type: String,
        required: false,
        index: true
    },
    appliedGift: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DigitalGift',
        required: false
    },
    giftCode: {
        type: String,
        required: false
    },
    qrData: {
        type: String // We will store the reservation ID here
    },
    storeSettings: {
        companyName: String,
        industry: String,
        description: String,
        logo: String,
        paymentMethods: [{
            provider: String,
            accountName: String,
            accountNumber: String,
            qrCodeUrl: String
        }]
    },

    // Check-in tracking (set when QR code is scanned)
    checkedIn: {
        type: Boolean,
        default: false
    },
    checkedInAt: {
        type: Date,
        default: null
    },
    // Multi-scan tracking: up to 3 events (check-in → exit → check-in 2)
    checkIns: [
        {
            time: { type: Date },
            type: { type: String, enum: ['checkin', 'exit'] }
        }
    ]
}, { 
    timestamps: true,
    shardKey: { event: 1, _id: 1 } // Uncomment when upgrading to M10+ dedicated cluster
});

// Auto-generate qrData before saving
reservationSchema.pre('save', function (next) {
    if (!this.qrData) {
        this.qrData = this._id.toString();
    }
    next();
});

reservationSchema.index({ user: 1, event: 1 });
reservationSchema.index({ event: 1, status: 1 });
reservationSchema.index({ event: 1, type: 1, status: 1 });
reservationSchema.index(
  { checkedIn: 1, event: 1 },
  { partialFilterExpression: { checkedIn: true } }
);

module.exports = mongoose.model('Reservation', reservationSchema);
