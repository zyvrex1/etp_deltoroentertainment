const mongoose = require('mongoose')

const Schema = mongoose.Schema

const promoterSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
 firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  }
}, { timestamps: true })

module.exports = mongoose.model('Promoter', promoterSchema)