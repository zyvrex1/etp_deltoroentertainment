const mongoose = require('mongoose');
const Schema = mongoose.Schema

const settingsSchema = new Schema({
  platformName: String,
  supportEmail: String,
  maintenanceMode: {
    type: String,
    enum: ['enabled', 'disabled'],
    default: 'disabled'
  },
  fees: {
    platformFee: Number,
    fixedFee: Number,
    payoutSchedule: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly']
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);