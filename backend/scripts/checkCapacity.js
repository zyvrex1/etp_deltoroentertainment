const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
// Must require VenueMap BEFORE Event so the ref is registered
const VenueMap = require('../models/venueMapModel');
const Event = require('../models/eventModel');

mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI).then(async () => {
    const events = await Event.find({ status: { $in: ['approved', 'completed'] } }).populate('venueMap');
    const summary = events.map(e => ({
        title: e.title,
        eventType: e.eventType,
        totalTickets: e.totalTickets,
        totalBooths: e.totalBooths,
        hasLayoutDataOnEvent: !!(e.layoutData && e.layoutData.items),
        hasVenueMap: !!e.venueMap,
        venueMapItemCount: e.venueMap ? (e.venueMap.items || []).length : 0,
        venueMapSeatCount: e.venueMap ? (e.venueMap.items || []).filter(i => (i.type || '').toLowerCase() === 'seat').length : 0,
    }));
    console.log(JSON.stringify(summary, null, 2));
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
