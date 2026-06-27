const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['concern', 'payment', 'event', 'user', 'update', 'reservation', 'policy', 'announcement'],
        required: true
    },
    path: {
        type: String,
        required: true
    },
    unread: {
        type: Boolean,
        default: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // If null, it's for all admins/system-wide
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    targetRole: {
        type: String,
        enum: ['admin', 'promoter', 'sponsor', 'customer', 'all'],
        required: false
    }
}, { 
    timestamps: true,
    shardKey: { _id: "hashed" } // Uncomment when upgrading to M10+ dedicated cluster
});

notificationSchema.index({ userId: 1, unread: 1, createdAt: -1 });
notificationSchema.index({ targetRole: 1, unread: 1, createdAt: -1 });
notificationSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
