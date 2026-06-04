const mongoose = require("mongoose");
require("dotenv").config();
const Event = require("./models/eventModel");

async function diagnose() {
  await mongoose.connect(process.env.MONGO_URI);
  const events = await Event.find({});
  events.forEach(e => {
    const total = (e.totalTickets || 0) + (e.totalBooths || 0);
    const sold = (e.ticketsSold || 0) + (e.boothsSold || 0);
    console.log(`Event: ${e.title}`);
    console.log(`  Type: "${e.eventType}"`);
    console.log(`  Reported: ${sold} / ${total}`);
    console.log(`  PriceLevels Sum: ${e.priceLevels.reduce((s, p) => s + (p.quantityAvailable || 0), 0)}`);
    console.log(`  LayoutItems Length: ${e.layoutData?.items?.length || 0}`);
    console.log(`  SeatMap Seats: ${e.seatMap?.sections?.[0]?.seats?.length || 0}`);
    console.log(`  Booths Length: ${e.booths?.length || 0}`);
    console.log('---');
  });
  mongoose.disconnect();
}
diagnose();
