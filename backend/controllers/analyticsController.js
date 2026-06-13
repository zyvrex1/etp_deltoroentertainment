const Event = require("../models/eventModel");
const Reservation = require("../models/reservationModel");
const User = require("../models/userModel");
const Concern = require("../models/concernModel");
const VenueMap = require("../models/venueMapModel");

const getTopPerformingEvents = async (req, res) => {
    try {
        const { startDate, endDate, eventId } = req.query;

        let reservationQuery = { status: { $ne: 'cancelled' } };
        if (eventId && eventId !== 'all') {
            reservationQuery.event = eventId;
        }
        if (startDate && endDate) {
            reservationQuery.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
            if (new Date(startDate).getFullYear() === 2000) {
                delete reservationQuery.createdAt;
            }
        }

        // Fetch all approved and completed events to calculate performance
        let eventQuery = { status: { $in: ["approved", "completed"] } };
        if (eventId && eventId !== 'all') {
            eventQuery._id = eventId;
        }
        const events = await Event.find(eventQuery);

        // Fetch all relevant reservations within the date range
        if (!reservationQuery.event) {
            reservationQuery.event = { $in: events.map(e => e._id) };
        }
        const reservations = await Reservation.find(reservationQuery);

        // Calculate metrics for each event based on its reservations
        const eventStats = events.map(event => {
            const eventReservations = reservations.filter(r => r.event.toString() === event._id.toString());

            let ticketsSold = 0;
            let boothsSold = 0;
            let totalRevenue = 0;

            eventReservations.forEach(r => {
                if (r.status === 'confirmed') {
                    totalRevenue += (r.amount?.total || 0);
                    if (r.type === 'seat') {
                        ticketsSold += (r.seatIds?.length || 0);
                    } else if (r.type === 'booth') {
                        boothsSold += 1;
                    }
                }
            });

            const totalSeatsTaken = ticketsSold;
            const totalBoothsTaken = boothsSold;

            const totalTickets = event.totalTickets || 0;
            const totalBooths = event.totalBooths || 0;

            // Calculate capacity percentage
            const totalCapacity = totalTickets + totalBooths;
            const totalOccupied = totalSeatsTaken + totalBoothsTaken;
            const capPercent = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

            return {
                id: event._id,
                name: event.title,
                eventType: event.eventType,
                ticketsSold,
                totalSeatsTaken,
                totalTickets,
                boothsSold,
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
        const { startDate, endDate, eventId } = req.query;

        let currentStart, currentEnd;
        if (startDate && endDate) {
            currentStart = new Date(startDate);
            currentEnd = new Date(endDate);
            if (currentStart.getFullYear() === 2000) {
                const firstRes = await Reservation.findOne({ createdAt: { $exists: true, $ne: null } }).sort({ createdAt: 1 });
                if (firstRes && firstRes.createdAt) {
                    currentStart = new Date(firstRes.createdAt);
                    currentEnd = new Date();
                    currentEnd.setHours(23, 59, 59, 999);
                } else {
                    currentStart = new Date();
                    currentStart.setFullYear(currentStart.getFullYear() - 5);
                    currentEnd = new Date();
                    currentEnd.setHours(23, 59, 59, 999);
                }
            }
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

        // When filtering by a specific event, don't restrict by date — show lifetime metrics for that event
        const resQuery = eventId && eventId !== 'all'
            ? {
                status: { $ne: 'cancelled' },
                event: eventId
            }
            : {
                status: { $ne: 'cancelled' },
                createdAt: { $gte: prevStart, $lte: currentEnd }
            };

        console.log('[Analytics] resQuery:', JSON.stringify(resQuery));
        const reservations = await Reservation.find(resQuery);
        console.log('[Analytics] reservations found:', reservations.length);

        const currentReservations = eventId && eventId !== 'all'
            ? reservations
            : reservations.filter(r => r.createdAt >= currentStart && r.createdAt <= currentEnd);
        const prevReservations = eventId && eventId !== 'all'
            ? []
            : reservations.filter(r => r.createdAt >= prevStart && r.createdAt < currentStart);

        const calculateMetrics = (resList) => {
            let grossRevenue = 0;
            let ticketsSold = 0;
            let boothsSold = 0;

            resList.forEach(reservation => {
                if (!reservation) return;
                const status = reservation.status;
                if (status === 'confirmed') {
                    grossRevenue += (reservation.amount?.total || 0);
                    if (reservation.type === 'seat') {
                        ticketsSold += (reservation.seatIds?.length || 0);
                    } else if (reservation.type === 'booth') {
                        boothsSold += 1;
                    }
                }
            });
            return { grossRevenue, ticketsSold, boothsSold };
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

        // Calculate Revenue Trends based on date range
        let revenueTrends = [];
        const confirmedReservations = currentReservations.filter(r => r.status === 'confirmed');

        // When filtering by a specific event, derive the trend window from actual reservation dates
        let trendStart = currentStart;
        let trendEnd = currentEnd;
        if (eventId && eventId !== 'all' && confirmedReservations.length > 0) {
            const dates = confirmedReservations.map(r => new Date(r.createdAt).getTime()).filter(Boolean);
            trendStart = new Date(Math.min(...dates));
            trendEnd = new Date(Math.max(...dates));
            trendEnd.setHours(23, 59, 59, 999);
        }

        const durationDays = Math.ceil((trendEnd.getTime() - trendStart.getTime()) / (1000 * 3600 * 24));

        if (durationDays <= 31) {
            // Daily aggregation
            const daysMap = {};
            for (let d = new Date(trendStart); d <= trendEnd; d.setDate(d.getDate() + 1)) {
                const dateString = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                daysMap[dateString] = 0;
            }
            // Also ensure trendEnd is included
            const endString = trendEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (daysMap[endString] === undefined) daysMap[endString] = 0;

            confirmedReservations.forEach(res => {
                const dateString = new Date(res.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                if (daysMap[dateString] !== undefined) {
                    daysMap[dateString] += (res.amount?.total || 0);
                }
            });
            revenueTrends = Object.keys(daysMap).map(label => ({ label, total: daysMap[label] }));
        } else {
            // Monthly aggregation
            const monthsMap = {};
            let d = new Date(trendStart);
            d.setDate(1);
            while (d <= trendEnd) {
                const monthString = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                monthsMap[monthString] = 0;
                d.setMonth(d.getMonth() + 1);
            }
            const endMonthString = trendEnd.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            if (monthsMap[endMonthString] === undefined) monthsMap[endMonthString] = 0;

            confirmedReservations.forEach(res => {
                const monthString = new Date(res.createdAt).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                if (monthsMap[monthString] !== undefined) {
                    monthsMap[monthString] += (res.amount?.total || 0);
                }
            });
            revenueTrends = Object.keys(monthsMap).map(label => ({ label, total: monthsMap[label] }));
        }

        // Calculate aggregate capacity and average occupancy per event
        // NOTE: Occupancy reflects lifetime reservations, not the selected date window,
        // because it answers "how full is this event" not "how many sold this period".
        let eventQuery = { status: { $in: ["approved", "completed"] } };
        if (eventId && eventId !== 'all') {
            eventQuery._id = eventId;
        }
        const events = await Event.find(eventQuery).populate('venueMap');

        // Fetch all confirmed reservations for these events (lifetime, not date-filtered)
        const eventIds = events.map(e => e._id);
        const allConfirmedReservations = await Reservation.find({
            event: { $in: eventIds },
            status: 'confirmed'
        }).select('event type seatIds');

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

            const eventAllConfirmed = allConfirmedReservations.filter(r => r.event.toString() === event._id.toString());

            let eTicketsSold = 0;
            let eBoothsSold = 0;

            eventAllConfirmed.forEach(r => {
                if (r.type === 'seat') eTicketsSold += (r.seatIds?.length || 0);
                else if (r.type === 'booth') eBoothsSold += 1;
            });

            if (eventTickets > 0) {
                seatOccupancySum += (eTicketsSold / eventTickets) * 100;
                eventsWithSeats++;
            }
            if (eventBooths > 0) {
                boothOccupancySum += (eBoothsSold / eventBooths) * 100;
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

const getDashboardReport = async (req, res) => {
    try {
        const eventsCount = await Event.countDocuments({ status: { $ne: 'cancelled' } });

        const reservations = await Reservation.find({ status: 'confirmed' });
        let ticketsSold = 0;
        let totalRevenue = 0;
        reservations.forEach(r => {
            totalRevenue += (r.amount?.total || 0);
            if (r.type === 'seat') {
                ticketsSold += (r.seatIds?.length || 0);
            }
        });

        const activeUsers = await User.countDocuments();

        const pendingApprovals = await Event.countDocuments({ status: 'pending' });

        const allBooths = await Reservation.find({ type: 'booth' });
        const boothsReserved = allBooths.length;

        const supportTickets = await Concern.countDocuments({ status: { $in: ['open', 'pending', 'in-progress'] } });

        const sponsors = await User.find({ role: 'sponsor' }).limit(5);
        const topSponsors = sponsors.length > 0 ? sponsors.map(s => ({
            name: s.companyName || s.firstName + ' ' + s.lastName,
            event: 'Sponsored Event',
            type: 'Platinum'
        })) : [
            { name: 'Global Tech', event: 'AI Summit 2026', type: 'Platinum' },
            { name: 'Nexus Corp', event: 'Creator Expo', type: 'Gold' },
            { name: 'Startup Hub', event: 'TechStart', type: 'Silver' },
        ];

        const promoters = await User.find({ role: 'promoter' }).limit(5);
        const topPromoters = promoters.length > 0 ? promoters.map(p => ({
            name: p.companyName || p.firstName + ' ' + p.lastName,
            email: p.email,
            badge: 'Top Rated'
        })) : [
            { name: 'TechStart Inc', email: 'contact@techstart.com', badge: 'Top Rated' },
            { name: 'MusicFest LLC', email: 'info@musicfest.com', badge: 'Top Rated' },
            { name: 'EventPro Solutions', email: 'hello@eventpro.com', badge: 'Top Rated' },
        ];

        res.status(200).json({
            reportStats: [
                { label: 'Total Events', value: eventsCount.toString(), change: '+12.5%' },
                { label: 'Tickets Sold', value: ticketsSold.toLocaleString(), change: '+8.2%' },
                { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, change: '+15.3%' },
                { label: 'Active Users', value: activeUsers.toLocaleString(), change: '+5.8%' },
            ],
            miniStats: [
                { label: 'Pending Approvals', value: pendingApprovals.toString() },
                { label: 'Booths Reserved', value: boothsReserved.toString() },
                { label: 'Pending Payouts', value: `$0` },
                { label: 'Support Tickets', value: supportTickets.toString() },
            ],
            topSponsors,
            topPromoters
        });

    } catch (error) {
        console.error("Error fetching dashboard report:", error);
        res.status(500).json({ error: "Failed to fetch dashboard report" });
    }
};

module.exports = {
    getTopPerformingEvents,
    getOverviewStats,
    getDashboardReport
};
