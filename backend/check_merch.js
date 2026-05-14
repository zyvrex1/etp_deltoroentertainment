const mongoose = require('mongoose');
const Merchandise = require('./models/merchandiseModel');
require('dotenv').config();

async function checkMerchandise() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const merchandises = await Merchandise.find({});
        console.log(`Total Merchandises: ${merchandises.length}`);
        
        merchandises.forEach(m => {
            console.log(`- Name: ${m.name}, eventId: ${m.eventId}, boothCode: ${m.boothCode}, sponsorId: ${m.sponsorId}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkMerchandise();
