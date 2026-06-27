'use strict'

const mongoose = require('mongoose')

const connectDB = async () => {
  try {

    // CURRENT: Replica Set (active)
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to MongoDB (Replica Set)')

    /*
    // STEP 21 — SHARDED CLUSTER (uncomment after Atlas upgrade)
    // 1. Atlas cluster converted to Sharded Cluster topology
    // 2. MONGO_URI updated in .env to the mongos router URI
    // 3. enableSharding.js has been run successfully
    // 4. Comment out the Replica Set block above before enabling this

    const connectionOptions = {
      autoIndex: process.env.NODE_ENV !== 'production',
    }
    await mongoose.connect(process.env.MONGO_URI, connectionOptions)
    console.log('Connected to MongoDB (Sharded Cluster — mongos router)')

    // PREVIOUS (original):
    // await mongoose.connect(process.env.MONGO_URI)
    // console.log('Connected to MongoDB')
    */

  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

module.exports = connectDB