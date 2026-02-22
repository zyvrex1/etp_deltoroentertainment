const mongoose = require('mongoose')

const Schema = mongoose.Schema

const promoterSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  bankAcc: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  }
}, { timestamps: true })

module.exports = mongoose.model('Promoter', promoterSchema)