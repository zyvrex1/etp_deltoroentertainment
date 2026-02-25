const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const eventSchema = new Schema(
  {
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
      enum: ["concert", "comedy", "festival", "conference", "sports", "other"],
      default: "other",
    },

    venue: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      zipCode: { type: String, required: true },
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    ticketPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    totalTickets: {
      type: Number,
      required: true,
    },

    ticketsSold: {
      type: Number,
      default: 0,
    },

    revenue: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "draft",
        "pending",
        "approved",
        "rejected",
        "cancelled",
        "completed",
      ],
      default: "pending",
    },

    image: {
      type: String,
    },

    booths: {
  type: [
    {
      boothNumber: { type: String, required: true },
      size: String,
      price: { type: Number, min: 0, required: true },
      status: { type: String, enum: ["available", "reserved", "sold"], default: "available" },
      assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    },
  ],
  default: [],
},

    user_id: {
      type: String,
      required: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);


eventSchema.pre('save', function(next) {
    const ticketRevenue = (this.ticketPrice || 0) * (this.ticketsSold || 0);

    const boothRevenue = Array.isArray(this.booths)
        ? this.booths.reduce((total, booth) => {
              // Make sure booth.price exists
              return total + (booth.status === 'sold' && booth.price ? booth.price : 0);
          }, 0)
        : 0;

    this.revenue = ticketRevenue + boothRevenue;
    next();
});

module.exports = mongoose.model("Event", eventSchema);
