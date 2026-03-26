const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const priceLevelSchema = new Schema({
  priceName: { type: String, required: true },
  description: String,
  color: String,

  facePrice: { type: Number, min: 0, required: true },
  serviceCharge: { type: Number, default: 0 },

  minPerOrder: { type: Number, default: 1 },
  maxPerOrder: { type: Number, default: 30 },
  increment: { type: Number, default: 1 },

  quantityAvailable: { type: Number, default: 0 },

  quantitySold: {
    type: Number,
    default: 0,
    validate: {
      validator: function (value) {
        return value <= this.quantityAvailable;
      },
      message: "quantitySold cannot exceed quantityAvailable",
    },
  },

  isActive: { type: Boolean, default: true },
});

const seatSchema = new Schema({
  row: String,
  number: Number,
  label: String,

  status: {
    type: String,
    enum: ["available", "reserved", "sold", "blocked"],
    default: "available",
  },

  priceLevelId: { type: Schema.Types.ObjectId },

  x: Number,
  y: Number,
  width: { type: Number, default: 20 },
  height: { type: Number, default: 20 },
  rotation: { type: Number, default: 0 },
});

const sectionSchema = new Schema({
  name: String,
  seats: [seatSchema],
});

const seatMapSchema = new Schema({
  width: { type: Number, default: 800 },
  height: { type: Number, default: 600 },
  sections: [sectionSchema],
});

const boothSchema = new mongoose.Schema({
  code: String,
  label: String,
  type: String,
  status: {
    type: String,
    enum: ["available", "reserved", "sold", "blocked"],
    default: "available"
  },
  x: Number,
  y: Number,
  width: Number,
  height: Number,
  rotation: { type: Number, default: 0 },
  priceLevelId: { type: mongoose.Schema.Types.ObjectId, ref: "PriceLevel" },
});

const eventSchema = new Schema(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    title: { type: String, required: true, trim: true },
    eventType: {
      type: String,
      enum: ["General Admission", "Seating Arrangement"],
      required: true,
    },

    description: String,
    category: { type: String, required: true, trim: true },

    venue: {
      type: {
        _id: { type: Schema.Types.ObjectId, ref: "Venue" },
        name: String,
        address: String,
        city: String,
        zipCode: String,
      },
      required: true,
    },

    startDate: { type: Date, required: true },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value >= this.startDate;
        },
        message: "End date must be after start date",
      },
    },

    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

    image: String,

    priceLevels: { type: [priceLevelSchema], default: [] },

    seatMap: { type: seatMapSchema, default: null },

    hasBooths: { type: Boolean, default: false },

    booths: { type: [boothSchema], default: [] },

    ticketsSold: { type: Number, default: 0 },

    seatRevenue: { type: Number, default: 0 },
    boothRevenue: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled", "completed"],
      default: "pending",
    },

    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

eventSchema.pre("save", function (next) {
  const priceIds = (this.priceLevels || [])
    .map((p) => (p && p._id ? p._id.toString() : null))
    .filter(Boolean);


  if (this.eventType === "Seating Arrangement" && this.seatMap && this.seatMap.sections) {
    for (const section of this.seatMap.sections) {
      if (!section.seats) continue; // Skip if no seats array
      for (const seat of section.seats) {
        if (
          seat.priceLevelId &&
          !priceIds.includes(seat.priceLevelId.toString())
        ) {
          return next(
            new Error(`Seat ${seat.label || `${seat.row}-${seat.number}`} has invalid priceLevelId`)
          );
        }
      }
    }
  }

  if (this.eventType === "General Admission") {
    this.seatMap = null; 
  }

  if (this.hasBooths) {
    if (!this.booths || !this.booths.length) {
      return next(new Error("Booths are required when hasBooths is true"));
    }

    for (const booth of this.booths) {
      if (
        booth.priceLevelId &&
        !priceIds.includes(booth.priceLevelId.toString())
      ) {
        return next(
          new Error(`Booth ${booth.code || booth.label} has invalid priceLevelId`)
        );
      }
    }
  }

  let seatRevenue = 0;
  let boothRevenue = 0;

  const priceMap = {};
  this.priceLevels.forEach((p) => {
    if (p && p._id) {
      priceMap[p._id.toString()] = p;
    }
  });

  if (this.seatMap && this.seatMap.sections) {
    for (const section of this.seatMap.sections) {
      if (!section.seats) continue;
      for (const seat of section.seats) {
        if (seat.status === "sold" && seat.priceLevelId) {
          const p = priceMap[seat.priceLevelId.toString()];
          if (p) {
            seatRevenue += (p.facePrice || 0) + (p.serviceCharge || 0);
          }
        }
      }
    }
  }

  if (this.booths) {
    for (const booth of this.booths) {
      if (booth.status === "sold" && booth.priceLevelId) {
        const p = priceMap[booth.priceLevelId.toString()];
        if (p) {
          boothRevenue += (p.facePrice || 0) + (p.serviceCharge || 0);
        }
      }
    }
  }

  this.seatRevenue = seatRevenue;
  this.boothRevenue = boothRevenue;

  next();
});


eventSchema.virtual("totalTickets").get(function () {
  if (this.eventType === "General Admission") {
    return this.priceLevels.reduce(
      (sum, p) => sum + (p.quantityAvailable || 0),
      0
    );
  }
  return null;
});

eventSchema.virtual("totalRevenue").get(function () {
  return this.seatRevenue + this.boothRevenue;
});

/* =========================
   INDEXES
========================= */
eventSchema.index({ startDate: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ createdBy: 1 });
eventSchema.index({ "venue._id": 1 });
eventSchema.index({ category: 1 });

module.exports = mongoose.model("Event", eventSchema);