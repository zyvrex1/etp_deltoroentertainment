const getCreatorLabel = (createdBy) => {
    if (!createdBy) return "Deltoro";
    const role = (createdBy.role || "").toLowerCase();
    if (role === "admin" || role === "superadmin") return "Deltoro";
    // Promoter (or anything else): prefer company name, fall back to their name
    return createdBy.companyName || `${createdBy.firstName || ""} ${createdBy.lastName || ""}`.trim() || "Deltoro";
};

const serializeEvent = (event, user) => {
    const e = event.toObject ? event.toObject({ virtuals: true }) : event;
    const role = (user?.role || '').toLowerCase();
    const totalSold = (e.priceLevels || []).reduce((sum, p) => sum + (p.quantitySold || 0), 0);
    const isCompleted = e.status === "completed";
    if (['admin', 'superadmin', 'promoter'].includes(role)) {
        return e;
    }

    if (!user) {
        return {
            _id: e._id,
            title: e.title,
            category: e.category,
            image: e.image || null,
            status: e.status,
            startDate: e.startDate,
            venue: e.venue ? { city: e.venue.city, state: e.venue.state } : null,

            ...(isCompleted && {
                totalSold: (e.priceLevels || []).reduce((sum, p) => sum + (p.quantitySold || 0), 0),
                creatorName: getCreatorLabel(e.createdBy),
            }),
        };
    }

    return {
        _id: e._id,
        title: e.title,
        category: e.category,
        image: e.image || null,
        status: e.status,
        startDate: e.startDate,
        endDate: e.endDate,
        startTime: e.startTime,
        endTime: e.endTime,
        eventType: e.eventType,
        venue: e.venue ? { name: e.venue.name, city: e.venue.city, state: e.venue.state, address: e.venue.address } : null,
        priceLevels: e.priceLevels,
        seatMap: e.seatMap,
        layoutData: e.layoutData,
        booths: e.booths,

        ...(isCompleted && {
            totalSold: (e.priceLevels || []).reduce((sum, p) => sum + (p.quantitySold || 0), 0),
            creatorName: getCreatorLabel(e.createdBy),
        }),
    };
};

module.exports = { serializeEvent };