const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Event = require('./models/eventModel');

async function checkLayouts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const events = await Event.find({});
    console.log(`Found ${events.length} events`);

    events.forEach(event => {
      console.log(`\nEvent: ${event.title} (${event._id})`);
      if (event.ticketLayouts && event.ticketLayouts.length > 0) {
        console.log(`  Found ${event.ticketLayouts.length} layouts:`);
        event.ticketLayouts.forEach(layout => {
          console.log(`    - Category ID: ${layout.priceLevelId}`);
          console.log(`    - Item count: ${layout.layout ? layout.layout.length : 0}`);
        });
      } else {
        console.log('  No layouts found.');
      }
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkLayouts();
