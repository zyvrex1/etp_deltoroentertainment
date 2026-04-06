const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const merchandiseSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String,
    enum: ['Merch', 'Food', 'Drinks'],
    required: true,
  },
  stock: {
    type: Number,
    default: 0,
    min: 0,
  },
  image: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['Available', 'Out of Stock', 'Hidden'],
    default: 'Available',
  },
  eventId: {
    type: String,
    required: true,
  },
  sponsorId: {
    type: Schema.Types.ObjectId,
    ref: 'Sponsor',
    required: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Merchandise', merchandiseSchema);
