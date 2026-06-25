const mongoose = require('mongoose')

const Schema = mongoose.Schema

const promoterSchema = new Schema({
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
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  industry: {
    type: String,
    required: true,
    trim: true
  },
  numberOfEvents: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true
  // shardKey: { userId: 1 }
});

module.exports = mongoose.model('Promoter', promoterSchema)