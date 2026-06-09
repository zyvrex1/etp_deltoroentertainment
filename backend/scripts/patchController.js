const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../controllers/eventController.js');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add VenueMap import
if (!content.includes('const VenueMap = require("../models/venueMapModel")')) {
  content = content.replace(
    'const Event = require("../models/eventModel");',
    'const Event = require("../models/eventModel");\nconst VenueMap = require("../models/venueMapModel");\n\nconst mapVenueMapToEvent = (eventDoc) => {\n  if (!eventDoc) return null;\n  const eventObj = typeof eventDoc.toObject === "function" ? eventDoc.toObject() : eventDoc;\n  if (eventObj.venueMap && typeof eventObj.venueMap === "object") {\n    eventObj.layoutData = eventObj.venueMap;\n    eventObj.seatMap = eventObj.venueMap.seatMap;\n    delete eventObj.venueMap.seatMap;\n  }\n  return eventObj;\n};'
  );
}

// 2. Fix getEvent populate
if (!content.includes('path: "venueMap"')) {
  content = content.replace(
    /path: "assignedPromoters",\s*select: "firstName lastName email avatar",\s*\},/g,
    'path: "assignedPromoters",\n        select: "firstName lastName email avatar",\n      },\n      {\n        path: "venueMap",\n      },'
  );
}

// 3. Fix getEvent mapping before autoHealEvents
if (!content.includes('const mappedEvent = mapVenueMapToEvent(event)')) {
  content = content.replace(
    'const healedEvent = await autoHealEvents(event);',
    'const mappedEvent = mapVenueMapToEvent(event);\n    const healedEvent = await autoHealEvents(mappedEvent);'
  );
}

// 4. Fix getEvents populate and mapping
if (!content.includes('path: "venueMap"')) {
  content = content.replace(
    /const events = await Event\.find\(query\)\s*\.sort\(\{ createdAt: -1 \}\)\s*\.populate\(\[\s*\{\s*path: "createdBy",\s*select: "firstName lastName role email avatar",\s*\},/g,
    'const events = await Event.find(query)\n      .sort({ createdAt: -1 })\n      .populate([\n        {\n          path: "venueMap",\n        },\n        {\n          path: "createdBy",\n          select: "firstName lastName role email avatar",\n        },'
  );
}

if (!content.includes('const mappedEvents = events.map(mapVenueMapToEvent)')) {
  content = content.replace(
    'const healedEvents = await autoHealEvents(events);',
    'const mappedEvents = events.map(mapVenueMapToEvent);\n    const healedEvents = await autoHealEvents(mappedEvents);'
  );
}

// 5. Fix createEvent VenueMap creation
if (!content.includes('const newVenueMap = new VenueMap')) {
  content = content.replace(
    /const newEvent = await Event\.create\(\{\s*title,([\s\S]*?)seatMap: eventType === "General Admission" \? null : seatMap,([\s\S]*?)\}\);/g,
    `const newEventId = new mongoose.Types.ObjectId();
    const newVenueMap = new VenueMap({
      eventId: newEventId,
      items: typeof layoutData !== 'undefined' && layoutData ? layoutData.items : [],
      seatMap: eventType === "General Admission" ? null : seatMap,
      canvasWidth: typeof layoutData !== 'undefined' && layoutData ? layoutData.canvasWidth : 1400,
      canvasHeight: typeof layoutData !== 'undefined' && layoutData ? layoutData.canvasHeight : 900,
      backgroundImage: typeof layoutData !== 'undefined' && layoutData ? layoutData.backgroundImage : null,
      bgOpacity: typeof layoutData !== 'undefined' && layoutData ? layoutData.bgOpacity : 0.4,
    });
    await newVenueMap.save();

    const newEvent = await Event.create({
      _id: newEventId,
      title,$1venueMap: newVenueMap._id,$2});`
  );
}

// 6. Fix updateEvent VenueMap logic
if (!content.includes('await VenueMap.findOneAndUpdate')) {
  // Replace the layoutData saving logic in updateEvent
  content = content.replace(
    /layoutData:\s*layoutData !== undefined \? layoutData : existingEvent\.layoutData,\s*status: finalStatus,/g,
    `status: finalStatus,`
  );

  content = content.replace(
    /seatMap:\s*\(finalEventType === "Seating Arrangement" \|\| finalEventType === "Reservation"\) \? finalSeatMap : null,\s*booths: finalBooths,/g,
    `booths: finalBooths,`
  );

  content = content.replace(
    /const updatedEvent = await Event\.findByIdAndUpdate\(/g,
    `if (layoutData !== undefined || finalSeatMap !== undefined) {
      await VenueMap.findOneAndUpdate(
        { eventId: id },
        { 
          $set: { 
            ...(layoutData !== undefined && {
              items: layoutData.items || [],
              canvasWidth: layoutData.canvasWidth || 1400,
              canvasHeight: layoutData.canvasHeight || 900,
              backgroundImage: layoutData.backgroundImage || null,
              bgOpacity: layoutData.bgOpacity || 0.4,
              bgWidth: layoutData.bgWidth || null,
              bgHeight: layoutData.bgHeight || null,
            }),
            ...(finalSeatMap !== undefined && {
              seatMap: (finalEventType === "Seating Arrangement" || finalEventType === "Reservation") ? finalSeatMap : null
            })
          } 
        },
        { upsert: true }
      );
    }
    
    const updatedEvent = await Event.findByIdAndUpdate(`
  );

  // Map the output of updateEvent
  content = content.replace(
    'res.status(200).json({ event: updatedEvent });',
    'const mappedUpdatedEvent = mapVenueMapToEvent(updatedEvent);\n    res.status(200).json({ event: mappedUpdatedEvent });'
  );
  
  // Need to populate venueMap in updateEvent response
  content = content.replace(
    /\{ path: "assignedPromoters", select: "firstName lastName email avatar" \},/g,
    `{ path: "assignedPromoters", select: "firstName lastName email avatar" },\n      { path: "venueMap" },`
  );
}

fs.writeFileSync(targetFile, content);
console.log('Successfully patched eventController.js');
