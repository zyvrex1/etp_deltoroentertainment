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

    // Guest: only what the landing page card actually renders
   return {
  _id:       e._id,
  title:     e.title,
  category:  e.category,
  image:     e.image || null,
  status:    e.status,
  startDate: e.startDate,
  venue: e.venue ? { city: e.venue.city, state: e.venue.state } : null,

  // Only completed/featured events show these on cards — don't ship them for upcoming events
  ...(isCompleted && {
    totalSold: (e.priceLevels || []).reduce((sum, p) => sum + (p.quantitySold || 0), 0),
    creatorName: getCreatorLabel(e.createdBy),
  }),
};
};

module.exports = { serializeEvent };