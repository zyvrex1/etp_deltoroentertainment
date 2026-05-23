const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  promoterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'reject'], // matching frontend status
    default: 'pending'
  },
  method: {
    type: String,
    required: true
  },
  methodDetails: {
    type: Object // last4, etc.
  },
  reference: {
    type: String,
    unique: true
  },
  eventIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Payout', payoutSchema);
