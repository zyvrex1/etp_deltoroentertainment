const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const validator = require('validator')

const Schema = mongoose.Schema

const userSchema = new Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'promoter', 'sponsor', 'customer'],
    required: true
  },

  // ✅ NEW: Security
  twoFactor: {
    type: Boolean,
    default: false
  },

  // ✅ NEW: Notifications
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false }
  },

  lastLogin: {
    type: Date
  },

  avatar: {
  type: String, 
  default: '',  
}

}, { timestamps: true })

// ================= SIGNUP =================
userSchema.statics.signup = async function (
  email,
  password,
  confirmPassword,
  role,
  firstName,
  lastName
) {

  if (!email || !password || !confirmPassword || !role) {
    throw Error('All fields are required')
  }

  if (password !== confirmPassword) {
    throw Error('Passwords do not match')
  }

  if (!validator.isEmail(email)) {
    throw Error('Email is not valid')
  }

  if (!validator.isStrongPassword(password)) {
    throw Error('Password is not strong enough')
  }

  const exists = await this.findOne({ email })
  if (exists) {
    throw Error('Email already in use')
  }

  const salt = await bcrypt.genSalt(10)
  const hash = await bcrypt.hash(password, salt)

  const user = await this.create({
    email,
    password: hash,
    role,
    firstName,
    lastName
  })

  return user
}

// ================= LOGIN =================
userSchema.statics.login = async function (email, password) {
  if (!email || !password) throw Error('All fields must be filled')

  const user = await this.findOne({ email })
  if (!user) throw Error('Incorrect email')

  const match = await bcrypt.compare(password, user.password)
  if (!match) throw Error('Incorrect password')

  return user
}

module.exports = mongoose.model('User', userSchema)