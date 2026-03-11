const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const boothSchema = new Schema(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true   // must link to an Event
    },

    boothNumber: {
      type: String,
      required: true   // unique per event floor plan
    },

    size: {
      type: String,
      default: null    // optional, e.g., "Small", "Medium", "Large"
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    sponsorId: {
      type: Schema.Types.ObjectId,
      ref: "Sponsor",
      default: null
    }

    // Removed status field, it can be added later when booking/reservation is implemented
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booth", boothSchema);