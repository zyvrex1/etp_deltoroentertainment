const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const priceLevelSchema = new Schema(
  {
    priceName: { type: String, required: true },
    description: String,
    color: String,

    facePrice: { type: Number, required: true, min: 0 },
    serviceCharge: { type: Number, default: 0 },

    isFlexible: { type: Boolean, default: false },

    saleStart: Date,
    saleEnd: {
      type: Date,
      validate: {
        validator: function (value) {
          return !this.saleStart || value >= this.saleStart;
        },
        message: "saleEnd must be after saleStart",
      },
    },

    minPerOrder: { type: Number, default: 1 },
    maxPerOrder: { type: Number, default: 30 },
    increment: { type: Number, default: 1 },

  
    quantityAvailable: { type: Number, default: 0 },
    quantitySold: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const eventSchema = new Schema(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    creatorModel: {
      type: String,
      enum: ["Promoter", "Admin", "Superadmin"],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    eventType: {
      type: String,
      enum: ["General Admission", "Seating Arrangement"],
      default: "General Admission",
    },

    description: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    venue: {
      type: {
        _id: { type: Schema.Types.ObjectId, ref: "Venue" }, // optional reference
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

    priceLevels: {
      type: [priceLevelSchema],
      default: [],
      validate: {
        validator: function (value) {
          return value.length > 0;
        },
        message: "At least one price level is required",
      },
    },

    seatMap: {
      type: Schema.Types.Mixed,
      default: null,
    },

    hasBooths: { type: Boolean, default: false },
    maxBooths: { type: Number, default: 0 },

    booths: [
      {
        id: { type: String, required: true },

        code: { type: String, default: null },
        type: { type: String, default: "standard" },

        status: {
          type: String,
          enum: ["available", "reserved", "sold"],
          default: "available",
        },

        x: Number,
        y: Number,
        width: Number,
        height: Number,

        price: { type: Number, required: true, min: 0 },
      },
    ],

    ticketsSold: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },

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
  if (this.eventType === "Seating Arrangement" && !this.seatMap) {
    return next(new Error("Seat map is required for seating arrangement events"));
  }

  if (this.hasBooths && this.booths.length === 0) {
    return next(new Error("Booths are required when hasBooths is true"));
  }

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

eventSchema.index({ startDate: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ createdBy: 1 });

module.exports = mongoose.model("Event", eventSchema);