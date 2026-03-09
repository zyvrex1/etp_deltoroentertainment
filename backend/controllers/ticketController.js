const Event = require("../models/eventModel");
const Customer = require("../models/customerModel");
const { updateEventRevenue } = require("../utils/eventRevenue");

async function purchaseTickets(req, res) {
  try {
    const { customerId, eventId, quantity } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    // Increment tickets sold
    event.ticketsSold += quantity;
    await event.save();

    // Update revenue dynamically
    await updateEventRevenue(eventId);

    return res.status(200).json({ message: "Tickets purchased successfully", event });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = { purchaseTickets };