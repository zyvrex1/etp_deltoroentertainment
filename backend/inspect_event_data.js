const mongoose = require('mongoose');
require('dotenv').config();
const Event = require('./models/eventModel');
const Reservation = require('./models/reservationModel');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  // Find events
  const events = await Event.find().populate('venueMap');
  console.log("Total events:", events.length);

  for (const event of events) {
    console.log(`\nEvent: ${event.title} (${event._id}) - Status: ${event.status}`);
    
    // Check reservations
    const reservations = await Reservation.find({ event: event._id }).populate('user');
    console.log(`Reservations count: ${reservations.length}`);
    for (const res of reservations) {
      console.log(` - Res: ${res._id}, User: ${res.user?.firstName} ${res.user?.lastName}, Type: ${res.type}, Status: ${res.status}`);
      console.log(`   boothId: ${res.boothId}, boothCode: ${res.boothCode}, seatLabels: ${res.seatLabels}`);
    }

    // Check booths
    if (event.booths && event.booths.length > 0) {
      console.log("Booths in event.booths:");
      event.booths.forEach(b => {
        if (b.status === 'sold') {
          console.log(` - Booth: ${b.code || b.label} (${b._id}) - status: ${b.status}, reservedBy: "${b.reservedBy}"`);
        }
      });
    }

    // Check layoutData
    if (event.venueMap && event.venueMap.items) {
      console.log("VenueMap Items:");
      event.venueMap.items.forEach(item => {
        if (item.status === 'sold' || item.status === 'reserved') {
          console.log(` - Item: ${item.label || item.code} (${item._id || item.id}), Type: ${item.type}, Status: ${item.status}, reservedBy: "${item.reservedBy}"`);
        }
      });
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);
