const mongoose = require('mongoose')

const Schema = mongoose.Schema

const customerSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  ticketsPurchased: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0  // Initialize as 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema)