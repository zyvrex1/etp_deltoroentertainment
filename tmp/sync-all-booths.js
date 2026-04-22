const mongoose = require('mongoose');
const Event = require('./backend/models/eventModel');
const Reservation = require('./backend/models/reservationModel');
require('dotenv').config({ path: './backend/.env' });

const syncAll = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const events = await Event.find({});
        console.log(`Found ${events.length} events. Starting sync...`);

        for (const event of events) {
            console.log(`Syncing event: ${event.title} (${event._id})`);

            const reservations = await Reservation.find({ event: event._id });
            const reservedBoothIds = reservations.map(r => r.boothId.toString());
            const reservedBoothCodes = reservations.map(r => r.boothCode);

            let changed = false;

            // Sync booths array
            event.booths.forEach((booth, index) => {
                const isReserved = reservedBoothIds.includes(booth._id.toString()) ||
                    reservedBoothCodes.includes(booth.code) ||
                    reservedBoothCodes.includes(booth.label);

                if (booth.status === "sold" && !isReserved) {
                    console.log(`  - Resetting booth ${booth.code || booth.label} to available (No reservation)`);
                    event.booths[index].status = "available";
                    event.booths[index].reservedBy = "";
                    changed = true;
                } else if (booth.status === "available" && isReserved) {
                    console.log(`  - Marking booth ${booth.code || booth.label} as sold (Found reservation)`);
                    event.booths[index].status = "sold";
                    changed = true;
                }
            });

            // Sync layoutData
            if (event.layoutData && event.layoutData.items) {
                event.layoutData.items.forEach((item, index) => {
                    if (item.type === 'Booth') {
                        const isReserved = reservedBoothIds.includes(item._id?.toString()) ||
                            reservedBoothIds.includes(item.id?.toString()) ||
                            reservedBoothCodes.includes(item.code) ||
                            reservedBoothCodes.includes(item.label);

                        if (item.status === 'sold' && !isReserved) {
                            event.layoutData.items[index].status = 'available';
                            event.layoutData.items[index].reservedBy = '';
                            changed = true;
                        } else if (item.status === 'available' && isReserved) {
                            event.layoutData.items[index].status = 'sold';
                            changed = true;
                        }
                    }
                });
                if (changed) event.markModified('layoutData');
            }

            // Sync price levels
            event.priceLevels.forEach((pl, index) => {
                const soldCount = event.booths.filter(b => b.priceLevelId?.toString() === pl._id.toString() && b.status === "sold").length;
                if (pl.quantitySold !== soldCount) {
                    console.log(`  - Updating quantitySold for ${pl.priceName}: ${pl.quantitySold} -> ${soldCount}`);
                    event.priceLevels[index].quantitySold = soldCount;
                    changed = true;
                }
            });

            if (changed) {
                event.markModified('booths');
                event.markModified('priceLevels');
                await event.save();
                console.log(`  [OK] Saved event ${event.title}`);
            } else {
                console.log(`  [SKIP] No changes for ${event.title}`);
            }
        }

        console.log("Sync complete!");
        process.exit(0);
    } catch (err) {
        console.error("Sync failed:", err);
        process.exit(1);
    }
};

syncAll();
