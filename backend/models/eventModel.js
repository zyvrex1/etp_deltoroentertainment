const mongoose = require("mongoose");
const Schema = mongoose.Schema;

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
      name: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      zipCode: { type: String, required: true }
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    startTime: { type: String, required: true },
    endTime: { type: String, required: true },

    image: String,

    eventType: {
      type: String,
      enum: ["General Admission", "Seating Arrangement"],
      default: "General Admission",
    },

     ticketPrice: {
      type: Number,
      default: 0,
      validate: {
        validator: function (value) {
          // Require ticketPrice only if eventType is General Admission
          if (this.eventType === "General Admission") {
            return value !== null && value !== undefined;
          }
          return true; // optional for Seating Arrangement
        },
        message:
          "ticketPrice is required for General Admission events",
      },
    },
    totalTickets: { type: Number, default: 0 },

    seatMap: {
      type: Schema.Types.Mixed,
      default: null,
    },

    seatVariations: [
      {
        seatNumber: String,
        price: Number,
        isAvailable: { type: Boolean, default: true },
      },
    ],

    ticketsSold: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },

    hasBooths: {
      type: Boolean,
      default: false,
    },

    maxBooths: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled", "completed"],
      default: "pending",
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);