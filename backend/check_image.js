const mongoose = require('mongoose');
require('dotenv').config();

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const Event = require('./models/eventModel');
    const event = await Event.findOne({ image: { $ne: null } });
    if (event) {
        console.log('Event Title:', event.title);
        console.log('Image field value:', event.image);
    } else {
        console.log('No event with image found');
    }
    process.exit(0);
};
run();
