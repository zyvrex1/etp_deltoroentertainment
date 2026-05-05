const mongoose = require('mongoose');
require('dotenv').config();

const inspectEvent = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Event = require('./models/eventModel');

    const event = await Event.findOne({ title: "Your Health Matters Donna" });
    if (!event) {
      console.log("Event not found");
      process.exit(1);
    }

    console.log("Event Details:");
    console.log("Title:", event.title);
    console.log("Type:", event.eventType);
    console.log("totalTickets:", event.totalTickets);
    console.log("ticketsSold:", event.ticketsSold);
    console.log("Price Levels Count:", event.priceLevels.length);
    event.priceLevels.forEach((pl, i) => {
      console.log(`  PL ${i}: ${pl.priceName} (_id: ${pl._id}, quantitySold: ${pl.quantitySold}, quantityAvailable: ${pl.quantityAvailable})`);
    });

    console.log("Layout Data Items Count:", event.layoutData?.items?.length || 0);
    if (event.layoutData?.items) {
        let seats = 0;
        let booths = 0;
        event.layoutData.items.forEach(item => {
            if (item.type === 'seat' || item.isSeat || (!item.isBooth && !item.isElement && !item.isBackground && item.type !== 'booth')) seats++;
            else if (item.type === 'booth' || item.isBooth) booths++;
        });
        console.log(`  Seats: ${seats}, Booths: ${booths}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

inspectEvent();
