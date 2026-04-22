const mongoose = require('mongoose');
const Event = require('./models/eventModel');
const Reservation = require('./models/reservationModel');
require('dotenv').config();

const syncAll = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error("MONGO_URI is not defined in .env");
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const events = await Event.find({ _id: "69c2b27ee4db9705c1c584af" });
        console.log(`Found ${events.length} target events. Starting sync...`);

        for (const event of events) {
            console.log(`Syncing event: ${event.title} (${event._id})`);

            const reservations = await Reservation.find({ event: event._id });
            const reservedBoothIds = reservations.map(r => r.boothId.toString());
            const reservedBoothCodes = reservations.map(r => r.boothCode);

            let changed = false;

            // Sync booths array
            if (event.booths && event.booths.length > 0) {
                event.booths.forEach((booth, index) => {
                    const idStr = (booth._id || "").toString();
                    const isReserved = reservedBoothIds.includes(idStr) ||
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
            }

            // Sync layoutData items independently
            if (event.layoutData && event.layoutData.items) {
                console.log(`  - Checking ${event.layoutData.items.length} layout items...`);
                event.layoutData.items.forEach((item, index) => {
                    const type = (item.type || "").toLowerCase();
                    if (type === 'booth' || type === 'seat') {
                        const idStr = (item._id || item.id || "").toString();
                        const isReserved = reservedBoothIds.includes(idStr) ||
                            reservedBoothCodes.includes(item.code) ||
                            reservedBoothCodes.includes(item.label);

                        console.log(`    * Item ${item.label}: type=${type}, status=${item.status}, isReserved=${isReserved}`);

                        if (item.status === 'sold' && !isReserved) {
                            console.log(`      - [RESET] Resetting layout item ${item.label} (${item.id}) to available`);
                            event.layoutData.items[index].status = 'available';
                            event.layoutData.items[index].reservedBy = '';
                            changed = true;
                        } else if ((item.status === 'available' || !item.status) && isReserved) {
                            console.log(`      - [MARK] Marking layout item ${item.label} as sold`);
                            event.layoutData.items[index].status = 'sold';
                            changed = true;
                        }
                    }
                });
                if (changed) event.markModified('layoutData');
            }

            // Sync price levels
            if (event.priceLevels && event.priceLevels.length > 0) {
                event.priceLevels.forEach((pl, index) => {
                    const soldCount = event.booths.filter(b => b.priceLevelId?.toString() === pl._id.toString() && b.status === "sold").length;
                    if (pl.quantitySold !== soldCount) {
                        console.log(`  - Updating quantitySold for ${pl.priceName}: ${pl.quantitySold} -> ${soldCount}`);
                        event.priceLevels[index].quantitySold = soldCount;
                        changed = true;
                    }
                });
            }

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
