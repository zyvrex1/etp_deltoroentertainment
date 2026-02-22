require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const User = require('./models/userModel')

const createAdmin = async () => {
  try {

    await mongoose.connect(process.env.MONGO_URI)

    const exists = await User.findOne({ role: 'admin' })
    if (exists) {
      console.log('Admin already exists')
      process.exit()
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash('Admin123!', salt)

    await User.create({
      email: 'admin@gmail.com',
      password: hashedPassword,
      role: 'admin'
    })

    console.log('Admin created successfully')
    process.exit()

  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

createAdmin()