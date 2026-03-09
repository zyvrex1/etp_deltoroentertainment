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
  ticketsPurchased: Number,
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema)