const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const venueMapSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    
    // Equivalent to the old event.layoutData object properties
    items: { type: Schema.Types.Mixed, default: [] },
    canvasWidth: { type: Number, default: 1400 },
    canvasHeight: { type: Number, default: 900 },
    backgroundImage: { type: String, default: null },
    bgOpacity: { type: Number, default: 0.4 },
    bgWidth: { type: Number, default: null },
    bgHeight: { type: Number, default: null },

    // Equivalent to the old event.seatMap object
    seatMap: { type: Schema.Types.Mixed, default: null },
    
    version: { type: Number, default: 1 }
  },
  { timestamps: true }
);

venueMapSchema.index({ eventId: 1 });

module.exports = mongoose.model("VenueMap", venueMapSchema);