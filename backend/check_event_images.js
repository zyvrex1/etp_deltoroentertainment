const mongoose = require('mongoose');
require('dotenv').config();

const checkImages = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Event = require('./models/eventModel');

    const events = await Event.find({}, 'title image priceLevels');
    console.log(`Found ${events.length} events:`);
    events.forEach(event => {
      console.log(`- ${event.title}: image="${event.image}"`);
      if (event.priceLevels) {
        event.priceLevels.forEach(pl => {
          if (pl.ticketDesign) {
             const imgItem = pl.ticketDesign.find(i => i.id === 'event-img');
             console.log(`  - Category: ${pl.priceName}, Design Img URL: ${imgItem ? imgItem.url : 'NONE'}`);
          }
        });
      }
    });

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

checkImages();
