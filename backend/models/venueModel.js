const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const venueSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    zipCode: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Venue", venueSchema);