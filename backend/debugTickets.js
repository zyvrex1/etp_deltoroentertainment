require('dotenv').config();
const mongoose = require('mongoose');
const Reservation = require('./models/reservationModel');

async function debugTickets() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB\n');

  const reservations = await Reservation.find({ type: 'seat' }).lean();
  console.log(`Total seat-type reservations: ${reservations.length}\n`);

  reservations.forEach((res, i) => {
    const seatIds = res.seatIds || [];
    const hasGA = seatIds.some(sid => sid.startsWith('GA-'));
    console.log(`[${i + 1}] ID: ${res._id}`);
    console.log(`    seatIds: ${JSON.stringify(seatIds)}`);
    console.log(`    seatLabels: ${JSON.stringify(res.seatLabels)}`);
    console.log(`    isGA: ${hasGA}`);
    console.log(`    status: ${res.status}`);
    console.log('');
  });

  await mongoose.disconnect();
}

debugTickets().catch(console.error);
