const mongoose = require('mongoose');
require('dotenv').config();

const Event = require('./models/eventModel');
const Reservation = require('./models/reservationModel');

const cleanup = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        // 1. Delete all reservations
        const resResult = await Reservation.deleteMany({});
        console.log(`Deleted ${resResult.deletedCount} reservations.`);

        // 2. Reset events
        const events = await Event.find({});
        console.log(`Found ${events.length} events to check.`);

        for (const event of events) {
            let modified = false;

            // Reset layoutData items
            if (event.layoutData && Array.isArray(event.layoutData.items)) {
                event.layoutData.items.forEach(item => {
                    const hasBuyerInfo = item.reservedBy || item.reservedByEmail || item.reservedByPO;
                    if (['sold', 'reserved', 'partially-sold'].includes(item.status) || (item.status === 'available' && hasBuyerInfo)) {
                        item.status = 'available';
                        // Clear buyer info
                        item.reservedBy = "";
                        item.reservedByEmail = "";
                        item.reservedByPO = "";
                        modified = true;
                    }
                });
                event.markModified('layoutData');
            }

            // Reset booths
            if (event.booths && Array.isArray(event.booths)) {
                event.booths.forEach(booth => {
                    const hasBuyerInfo = booth.reservedBy || booth.reservedByEmail || booth.reservedByPO;
                    if (['sold', 'reserved'].includes(booth.status) || (booth.status === 'available' && hasBuyerInfo)) {
                        booth.status = 'available';
                        // Clear buyer info
                        booth.reservedBy = "";
                        booth.reservedByEmail = "";
                        booth.reservedByPO = "";
                        modified = true;
                    }
                });
            }

            // Reset legacy seatMap
            if (event.seatMap && Array.isArray(event.seatMap.sections)) {
                event.seatMap.sections.forEach(section => {
                    if (section.seats && Array.isArray(section.seats)) {
                        section.seats.forEach(seat => {
                            const hasBuyerInfo = seat.reservedBy || seat.reservedByEmail || seat.reservedByPO;
                            if (['sold', 'reserved', 'partially-sold'].includes(seat.status) || (seat.status === 'available' && hasBuyerInfo)) {
                                seat.status = 'available';
                                seat.occupiedSeats = 0;
                                // Clear buyer info
                                seat.reservedBy = "";
                                seat.reservedByEmail = "";
                                seat.reservedByPO = "";
                                modified = true;
                            }
                        });
                    }
                });
            }

            // Reset price levels quantitySold
            if (event.priceLevels && Array.isArray(event.priceLevels)) {
                event.priceLevels.forEach(pl => {
                    if (pl.quantitySold > 0) {
                        pl.quantitySold = 0;
                        modified = true;
                    }
                });
            }

            // Reset revenue fields
            if (event.seatRevenue > 0 || event.boothRevenue > 0) {
                event.seatRevenue = 0;
                event.boothRevenue = 0;
                modified = true;
            }

            if (modified) {
                await event.save();
                console.log(`Reset status for event: ${event.title}`);
            }
        }

        console.log("Cleanup complete.");
        process.exit(0);
    } catch (error) {
        console.error("Error during cleanup:", error);
        process.exit(1);
    }
};

cleanup();
