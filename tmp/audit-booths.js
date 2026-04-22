const mongoose = require('mongoose');
require('dotenv').config();

const audit = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const Event = mongoose.model('Event', new mongoose.Schema({
            title: String,
            booths: Array,
            layoutData: Object
        }));

        const events = await Event.find({});
        console.log(`Auditing ${events.length} events...`);

        for (const event of events) {
            let hasGhost = false;

            // Check layout items
            if (event.layoutData && event.layoutData.items) {
                const soldItems = event.layoutData.items.filter(i => i.status === 'sold' || i.reservedBy);
                if (soldItems.length > 0) {
                    console.log(`Event: ${event.title} (${event._id}) has ${soldItems.length} items marked as sold/reserved.`);
                    soldItems.forEach(i => console.log(`  - Item: ${i.label} | Status: ${i.status} | Buyer: ${i.reservedBy}`));
                }
            }

            // Check booths array
            if (event.booths && event.booths.length > 0) {
                const soldBooths = event.booths.filter(b => b.status === 'sold' || b.reservedBy);
                if (soldBooths.length > 0) {
                    console.log(`Event: ${event.title} (${event._id}) has ${soldBooths.length} booths marked as sold in booths array.`);
                }
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

audit();
