const Event = require("./eventModel");
const { Booth } = require("./boothModel");

async function updateEventRevenue(eventId) {
  const event = await Event.findById(eventId);
  if (!event) throw new Error("Event not found");

  // Ticket revenue
  const ticketRevenue = (event.ticketPrice || 0) * (event.ticketsSold || 0);

  // Booth revenue from Booth collection
  const boothAgg = await Booth.aggregate([
    { $match: { eventId: event._id, status: "sold" } },
    { $group: { _id: null, total: { $sum: "$price" } } }
  ]);

  const boothRevenue = boothAgg[0]?.total || 0;

  // Update revenue in event
  event.revenue = ticketRevenue + boothRevenue;
  await event.save();
}

module.exports = { updateEventRevenue };