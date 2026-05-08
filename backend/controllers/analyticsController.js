const Event = require("../models/eventModel");
const Reservation = require("../models/reservationModel");

const getTopPerformingEvents = async (req, res) => {
  try {
    // Fetch all approved and completed events to calculate performance
    const events = await Event.find({ status: { $in: ["approved", "completed"] } });
    
    // Fetch all relevant reservations
    const reservations = await Reservation.find({ 
      event: { $in: events.map(e => e._id) },
      status: { $ne: 'cancelled' } 
    });

    // Calculate metrics for each event based on its reservations
    const eventStats = events.map(event => {
      const eventReservations = reservations.filter(r => r.event.toString() === event._id.toString());
      
      let ticketsSold = 0;
      let ticketsReserved = 0;
      let boothsSold = 0;
      let boothsReserved = 0;
      let totalRevenue = 0;

      eventReservations.forEach(r => {
        if (r.status === 'confirmed') {
          totalRevenue += (r.amount?.total || 0);
          if (r.type === 'seat') {
            ticketsSold += (r.seatIds?.length || 0);
          } else if (r.type === 'booth') {
            boothsSold += 1;
          }
        } else if (r.status === 'pending') {
          if (r.type === 'seat') {
            ticketsReserved += (r.seatIds?.length || 0);
          } else if (r.type === 'booth') {
            boothsReserved += 1;
          }
        }
      });

      const totalSeatsTaken = ticketsSold + ticketsReserved;
      const totalBoothsTaken = boothsSold + boothsReserved;
      
      const totalTickets = event.totalTickets || 0;
      const totalBooths = event.totalBooths || 0;

      // Calculate capacity percentage
      const totalCapacity = totalTickets + totalBooths;
      const totalOccupied = totalSeatsTaken + totalBoothsTaken;
      const capPercent = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

      return {
        id: event._id,
        name: event.title,
        ticketsSold,
        ticketsReserved,
        totalSeatsTaken,
        totalTickets,
        boothsSold,
        boothsReserved,
        totalBooths,
        totalRevenue,
        cap: `${capPercent}% cap`,
        // Formatted strings for frontend compatibility
        ticketsText: `${totalSeatsTaken} seats, ${totalBoothsTaken} booths`,
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
        // Fetch all non-cancelled reservations
        const reservations = await Reservation.find({ status: { $ne: 'cancelled' } });
        
        let totalGrossRevenue = 0;
        let totalTicketsSold = 0;
        let totalBoothsSold = 0;
        let totalTicketsReserved = 0;
        let totalBoothsReserved = 0;
        
        reservations.forEach(reservation => {
            if (reservation.status === 'confirmed') {
                totalGrossRevenue += (reservation.amount?.total || 0);
                if (reservation.type === 'seat') {
                    totalTicketsSold += (reservation.seatIds?.length || 0);
                } else if (reservation.type === 'booth') {
                    totalBoothsSold += 1;
                }
            } else if (reservation.status === 'pending') {
                if (reservation.type === 'seat') {
                    totalTicketsReserved += (reservation.seatIds?.length || 0);
                } else if (reservation.type === 'booth') {
                    totalBoothsReserved += 1;
                }
            }
        });

        res.status(200).json({
            grossRevenue: totalGrossRevenue,
            netRevenue: totalGrossRevenue * 0.05, // Example: 5% platform fee
            ticketsSold: totalTicketsSold,
            boothsSold: totalBoothsSold,
            ticketsReserved: totalTicketsReserved,
            boothsReserved: totalBoothsReserved,
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
