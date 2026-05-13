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
    seatIds: [{
        type: String
    }],
    seatLabels: [{
        type: String
    }],
    type: {
        type: String,
        enum: ['booth', 'seat'],
        default: 'booth'
    },
    amount: {
        total: Number,
        subtotal: Number,
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
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'confirmed' // Defaulting to confirmed for the sample payment flow
    },
    paymentMethod: {
        type: String,
        enum: ['invoice', 'card'],
        default: 'invoice'
    },
    poNumber: {
        type: String
    },
    qrData: {
        type: String // We will store the reservation ID here
    },
    storeSettings: {
        companyName: String,
        industry: String,
        description: String,
        logo: String
    },

    // Check-in tracking (set when QR code is scanned)
    checkedIn: {
        type: Boolean,
        default: false
    },
    checkedInAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Auto-generate qrData before saving
reservationSchema.pre('save', function (next) {
    if (!this.qrData) {
        this.qrData = this._id.toString();
    }
    next();
});

module.exports = mongoose.model('Reservation', reservationSchema);
