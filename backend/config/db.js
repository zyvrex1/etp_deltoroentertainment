const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        /*
        // Sharding Options (Uncomment when upgrading to M10+ dedicated cluster)
        const connectionOptions = {
            autoIndex: process.env.NODE_ENV !== 'production',
        };
        await mongoose.connect(process.env.MONGO_URI, connectionOptions);
        console.log('Connected to MongoDB (Sharded Cluster Router Connection Ready)');
        */
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
