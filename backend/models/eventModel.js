const mongoose = require('mongoose')
const Schema = mongoose.Schema

const eventSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        required: true
    },

    category: {
        type: String,
        enum: ['concert', 'comedy', 'festival', 'conference', 'sports', 'other'],
        default: 'other'
    },

    venue: {
        name: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        zipCode: { type: String, required: true}
    },

    startDate: {
        type: Date,
        required: true
    },

    endDate: {
        type: Date,
        required: true
    },

    startTime: {
        type: String,
        required: true
    },

    endTime: {
        type: String,
        required: true
    },
    
    ticketPrice: {
        type: Number,
        required: true,
        min: 0
    },

    totalTickets: {
        type: Number,
        required: true
    },

    ticketsSold: {
        type: Number,
        default: 0
    },

    image: {
        type: String
    },

    isFeatured: {
        type: Boolean,
        default: false
    }

}, { timestamps: true })


module.exports = mongoose.model('Event', eventSchema)

// Event.find()

// Promoter
// Status
// Revenue
