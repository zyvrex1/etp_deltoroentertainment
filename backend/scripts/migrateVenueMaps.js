require("dotenv").config();
const mongoose = require("mongoose");
const Event = require("../models/eventModel");
const VenueMap = require("../models/venueMapModel");

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for VenueMap migration...");

    // We must query without schema restrictions because we removed layoutData and seatMap from the schema.
    // We use lean() to get raw objects.
    const events = await Event.find({}).lean();
    console.log(`Found ${events.length} events to process.`);

    let migratedCount = 0;

    for (const event of events) {
      // If it already has a venueMap ObjectId, it might be migrated
      if (event.venueMap) {
        console.log(`Event ${event._id} already has a venueMap reference. Skipping.`);
        continue;
      }

      // Check if it has the raw data we need to migrate
      const hasLayoutData = event.layoutData != null;
      const hasSeatMap = event.seatMap != null;

      if (!hasLayoutData && !hasSeatMap) {
        console.log(`Event ${event._id} has no layoutData or seatMap. Skipping.`);
        continue;
      }

      // Create new VenueMap document
      const newVenueMap = new VenueMap({
        eventId: event._id,
        items: event.layoutData ? event.layoutData.items || [] : [],
        seatMap: event.seatMap || null,
        canvasWidth: event.layoutData ? event.layoutData.canvasWidth || 1400 : 1400,
        canvasHeight: event.layoutData ? event.layoutData.canvasHeight || 900 : 900,
        backgroundImage: event.layoutData ? event.layoutData.backgroundImage || null : null,
        bgOpacity: event.layoutData ? event.layoutData.bgOpacity || 0.4 : 0.4,
        bgWidth: event.layoutData ? event.layoutData.bgWidth || null : null,
        bgHeight: event.layoutData ? event.layoutData.bgHeight || null : null,
      });

      await newVenueMap.save();

      // Update the event with the venueMap reference and unset the old fields
      await Event.collection.updateOne(
        { _id: event._id },
        { 
          $set: { venueMap: newVenueMap._id },
          $unset: { layoutData: "", seatMap: "" }
        }
      );

      migratedCount++;
      console.log(`Migrated event ${event._id}`);
    }

    console.log(`Migration complete! Migrated ${migratedCount} events.`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
