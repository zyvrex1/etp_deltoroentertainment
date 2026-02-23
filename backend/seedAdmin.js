require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const User = require('./models/userModel')

const createAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)

    // Check if Super Admin exists
    const superAdminExists = await User.findOne({ role: 'superadmin' })
    if (!superAdminExists) {
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash('SuperAdmin123!', salt)

      await User.create({
        firstName: 'Joey',
        lastName: 'Del Toro',
        email: 'superadmin@gmail.com',
        password: hashedPassword,
        role: 'superadmin'
      })

      console.log('Super Admin created successfully')
    } else {
      console.log('Super Admin already exists')
    }

    // Check if Admin exists
    const adminExists = await User.findOne({ role: 'admin' })
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash('Admin123!', salt)

      await User.create({
        firstName: 'Ehdsell',
        lastName: 'Apan',
        email: 'admin@gmail.com',
        password: hashedPassword,
        role: 'admin'
      })

      console.log('Admin created successfully')
    } else {
      console.log('Admin already exists')
    }

    process.exit()
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

createAdmins()