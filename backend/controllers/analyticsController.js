const Event = require("../models/eventModel");
const Reservation = require("../models/reservationModel");

const getTopPerformingEvents = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let reservationQuery = { status: { $ne: 'cancelled' } };
    if (startDate && endDate) {
      reservationQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Fetch all approved and completed events to calculate performance
    const events = await Event.find({ status: { $in: ["approved", "completed"] } });
    
    // Fetch all relevant reservations within the date range
    const reservations = await Reservation.find({ 
      ...reservationQuery,
      event: { $in: events.map(e => e._id) }
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

    // Filter out events with no activity in this period if a date range is provided
    let filteredStats = eventStats;
    if (startDate && endDate) {
      filteredStats = eventStats.filter(e => e.totalRevenue > 0 || e.totalSeatsTaken > 0 || e.totalBoothsTaken > 0);
    }

    // Sort by total revenue descending
    filteredStats.sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Return top 10
    res.status(200).json(filteredStats.slice(0, 10));
  } catch (error) {
    console.error("Error fetching top performing events:", error);
    res.status(500).json({ error: "Failed to fetch analytics data" });
  }
};

const getOverviewStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let currentStart, currentEnd;
        if (startDate && endDate) {
            currentStart = new Date(startDate);
            currentEnd = new Date(endDate);
        } else {
            // Default to last 30 days if not provided
            currentEnd = new Date();
            currentStart = new Date();
            currentStart.setDate(currentStart.getDate() - 30);
        }

        // Calculate previous period for comparison
        const duration = currentEnd.getTime() - currentStart.getTime();
        const prevStart = new Date(currentStart.getTime() - duration);
        const prevEnd = new Date(currentStart.getTime());

        // Fetch reservations for both periods
        const reservations = await Reservation.find({ 
            status: { $ne: 'cancelled' },
            createdAt: { $gte: prevStart, $lte: currentEnd }
        });
        
        const currentReservations = reservations.filter(r => r.createdAt >= currentStart && r.createdAt <= currentEnd);
        const prevReservations = reservations.filter(r => r.createdAt >= prevStart && r.createdAt < currentStart);

        const calculateMetrics = (resList) => {
            let grossRevenue = 0;
            let ticketsSold = 0;
            let boothsSold = 0;
            let ticketsReserved = 0;
            let boothsReserved = 0;
            
            resList.forEach(reservation => {
                if (reservation.status === 'confirmed') {
                    grossRevenue += (reservation.amount?.total || 0);
                    if (reservation.type === 'seat') {
                        ticketsSold += (reservation.seatIds?.length || 0);
                    } else if (reservation.type === 'booth') {
                        boothsSold += 1;
                    }
                } else if (reservation.status === 'pending') {
                    if (reservation.type === 'seat') {
                        ticketsReserved += (reservation.seatIds?.length || 0);
                    } else if (reservation.type === 'booth') {
                        boothsReserved += 1;
                    }
                }
            });
            return { grossRevenue, ticketsSold, boothsSold, ticketsReserved, boothsReserved };
        };

        const currentMetrics = calculateMetrics(currentReservations);
        const prevMetrics = calculateMetrics(prevReservations);

        const calculateTrend = (curr, prev) => {
            if (prev === 0) return curr > 0 ? 100 : 0;
            return Math.round(((curr - prev) / prev) * 100);
        };

        const trends = {
            revenueTrend: calculateTrend(currentMetrics.grossRevenue, prevMetrics.grossRevenue),
            ticketsTrend: calculateTrend(currentMetrics.ticketsSold, prevMetrics.ticketsSold),
            boothsTrend: calculateTrend(currentMetrics.boothsSold, prevMetrics.boothsSold),
            refundTrend: 0 // Placeholder
        };

        // Calculate Revenue Trends (always for the full current year as per request)
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const currentYear = new Date().getFullYear();
        
        // Fetch all confirmed reservations for the current year specifically for the chart
        const yearStart = new Date(currentYear, 0, 1);
        const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);
        const yearReservations = await Reservation.find({
            status: 'confirmed',
            createdAt: { $gte: yearStart, $lte: yearEnd }
        });

        const revenueTrends = months.map((month, i) => {
            const monthReservations = yearReservations.filter(res => {
                const d = new Date(res.createdAt);
                return d.getMonth() === i;
            });

            const total = monthReservations.reduce((sum, res) => sum + (res.amount?.total || 0), 0);
            return { month, total };
        });

        // Calculate aggregate capacity and average occupancy per event
        const events = await Event.find({ status: { $in: ["approved", "completed"] } });
        let totalSeatCapacity = 0;
        let totalBoothCapacity = 0;
        let seatOccupancySum = 0;
        let boothOccupancySum = 0;
        let eventsWithSeats = 0;
        let eventsWithBooths = 0;

        events.forEach(event => {
            const eventTickets = event.totalTickets || 0;
            const eventBooths = event.totalBooths || 0;
            
            totalSeatCapacity += eventTickets;
            totalBoothCapacity += eventBooths;

            const eventReservations = currentReservations.filter(r => r.event.toString() === event._id.toString());
            
            let eTicketsSold = 0;
            let eBoothsSold = 0;
            let eTicketsReserved = 0;
            let eBoothsReserved = 0;

            eventReservations.forEach(r => {
                if (r.status === 'confirmed') {
                    if (r.type === 'seat') eTicketsSold += (r.seatIds?.length || 0);
                    else if (r.type === 'booth') eBoothsSold += 1;
                } else if (r.status === 'pending') {
                    if (r.type === 'seat') eTicketsReserved += (r.seatIds?.length || 0);
                    else if (r.type === 'booth') eBoothsReserved += 1;
                }
            });

            if (eventTickets > 0) {
                seatOccupancySum += ((eTicketsSold + eTicketsReserved) / eventTickets) * 100;
                eventsWithSeats++;
            }
            if (eventBooths > 0) {
                boothOccupancySum += ((eBoothsSold + eBoothsReserved) / eventBooths) * 100;
                eventsWithBooths++;
            }
        });

        const seatOccupancy = eventsWithSeats > 0 ? Math.round(seatOccupancySum / eventsWithSeats) : 0;
        const boothOccupancy = eventsWithBooths > 0 ? Math.round(boothOccupancySum / eventsWithBooths) : 0;

        res.status(200).json({
            ...currentMetrics,
            ...trends,
            netRevenue: currentMetrics.grossRevenue * 0.05,
            totalSeatCapacity,
            totalBoothCapacity,
            seatOccupancy,
            boothOccupancy,
            refundRate: 0.8, 
            revenueTrends
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
