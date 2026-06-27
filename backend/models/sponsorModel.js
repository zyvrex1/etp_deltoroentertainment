const mongoose = require('mongoose')

const Schema = mongoose.Schema

const sponsorSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true 
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
  phone: {
    type: String,
    required: true,
    trim: true
  },
  streetAddress: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  zipCode: {
    type: String,
    trim: true
  }
}, { 
  timestamps: true,
  shardKey: { userId: 1 } // add comma in true
});

module.exports = mongoose.model('Sponsor', sponsorSchema)