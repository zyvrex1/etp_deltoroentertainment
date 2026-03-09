const mongoose = require('mongoose')

const Schema = mongoose.Schema

const ticketSchema = new Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  categoryName: String,     
  seatNumber: String,      
  price: Number,
  status: {
    type: String,
    enum: ['reserved', 'purchased'],
    default: 'reserved'
  },
  quantity: {
    type: Number,
    default: 1
  }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema)