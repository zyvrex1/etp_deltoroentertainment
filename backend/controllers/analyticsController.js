const Event = require("../models/eventModel");
const Reservation = require("../models/reservationModel");

const getTopPerformingEvents = async (req, res) => {
  try {
    // Fetch all approved and completed events to calculate performance
    const events = await Event.find({ status: { $in: ["approved", "completed"] } });

    // Calculate metrics for each event
    const eventStats = events.map(event => {
      // Use virtuals and helper calculations
      const ticketsSold = event.ticketsSold || 0;
      const totalTickets = event.totalTickets || 0;
      
      // Calculate reserved tickets manually since virtual might not include them
      let ticketsReserved = 0;
      if (event.layoutData && Array.isArray(event.layoutData.items)) {
        ticketsReserved = event.layoutData.items.filter(
          (item) => (item.type || "").toLowerCase() === "seat" && item.status === "reserved"
        ).length;
      } else if (event.seatMap && Array.isArray(event.seatMap.sections)) {
        event.seatMap.sections.forEach((s) => {
          (s.seats || []).forEach((seat) => {
            if (seat.status === "reserved") {
              ticketsReserved += seat.seatCount || 1;
            }
          });
        });
      }

      const totalSeatsTaken = ticketsSold + ticketsReserved;
      
      const boothsSold = event.boothsSold || 0; // Already includes reserved in virtual
      const totalBooths = event.totalBooths || 0;

      const seatRevenue = event.seatRevenue || 0;
      const boothRevenue = event.boothRevenue || 0;
      const totalRevenue = seatRevenue + boothRevenue;

      // Calculate capacity percentage
      const totalCapacity = totalTickets + totalBooths;
      const totalOccupied = totalSeatsTaken + boothsSold;
      const capPercent = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

      return {
        id: event._id,
        name: event.title,
        ticketsSold,
        ticketsReserved,
        totalSeatsTaken,
        totalTickets,
        boothsSold,
        totalBooths,
        seatRevenue,
        boothRevenue,
        totalRevenue,
        cap: `${capPercent}% cap`,
        // Formatted strings for frontend compatibility if needed
        ticketsText: `${totalSeatsTaken} seats, ${boothsSold} booths`,
        revenueText: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      };
    });

    // Sort by total revenue descending
    eventStats.sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Return top 10
    res.status(200).json(eventStats.slice(0, 10));
  } catch (error) {
    console.error("Error fetching top performing events:", error);
    res.status(500).json({ error: "Failed to fetch analytics data" });
  }
};

const getOverviewStats = async (req, res) => {
    try {
        const events = await Event.find({ status: { $in: ["approved", "completed"] } });
        
        let totalGrossRevenue = 0;
        let totalTicketsSold = 0;
        let totalBoothsSold = 0;
        
        events.forEach(event => {
            totalGrossRevenue += (event.seatRevenue || 0) + (event.boothRevenue || 0);
            totalTicketsSold += event.ticketsSold || 0;
            totalBoothsSold += event.boothsSold || 0;
        });

        // For trend data, we might need more complex logic, 
        // but for now let's return the totals
        res.status(200).json({
            grossRevenue: totalGrossRevenue,
            netRevenue: totalGrossRevenue * 0.05, // Example: 5% platform fee
            ticketsSold: totalTicketsSold,
            boothsSold: totalBoothsSold,
            refundRate: 0.8, // Static for now
        });
    } catch (error) {
        console.error("Error fetching overview stats:", error);
        res.status(500).json({ error: "Failed to fetch overview stats" });
    }
}

module.exports = {
  getTopPerformingEvents,
  getOverviewStats
};
