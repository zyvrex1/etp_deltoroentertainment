const mongoose = require('mongoose')

const Schema = mongoose.Schema

const messageSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  isSystem: {
    type: Boolean,
    default: false
  },
  attachments: [{
    name: String,
    path: String,
    size: String
  }]
}, { timestamps: true })

const concernSchema = new Schema({
  sponsorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sponsorName: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    enum: ['sponsor', 'customer', 'promoter'],
    default: 'sponsor'
  },
  subject: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  description: {
    type: String,
    required: true
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedName: {
    type: String,
    default: 'Unassigned'
  },
  attachments: [{
    name: String,
    path: String,
    size: String
  }],
  messages: [messageSchema],
  internalNotes: [{
    adminId: { type: Schema.Types.ObjectId, ref: 'User' },
    adminName: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  unreadCountAdmin: {
    type: Number,
    default: 1 // Start with 1 for the initial message
  },
  unreadCountSponsor: {
    type: Number,
    default: 0
  }
}, { timestamps: true })

module.exports = mongoose.model('Concern', concernSchema)
