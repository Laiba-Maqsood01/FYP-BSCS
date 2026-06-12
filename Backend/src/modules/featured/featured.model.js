// import mongoose from "mongoose";

// const featuredSchema = new mongoose.Schema(
//   {
//     listing: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "listings",
//       required: true
//     },

//     seller: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "users",
//       required: true
//     },

//     plan: {
//       type: String,
//       enum: ["BASIC", "PREMIUM", "TOP"],
//       required: true
//     },

//     amount: {
//       type: Number,
//       required: true
//     },

//     status: {
//       type: String,
//       enum: ["PENDING", "ACTIVE", "EXPIRED", "REJECTED"],
//       default: "PENDING"
//     },

//     startDate: Date,

//     endDate: Date
//   },
//   { timestamps: true }
// );

// const featuredModel =
//   mongoose.model(
//     "featured_listings",
//     featuredSchema
//   );

// export default featuredModel;

import mongoose from "mongoose";

const featuredSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "listings",
      required: true
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true
    },

    plan: {
      type: String,
      enum: ["BASIC", "PREMIUM", "TOP"],
      required: true
    },

    amount: {
      type: Number,
      required: true
    },

    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "EXPIRED", "REJECTED", "REMOVED"],
      default: "PENDING"
    },

    durationDays: {
      type: Number,
      default: 7
    },

    startDate: Date,

    endDate: Date,

    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "payments"
    }
  },
  { timestamps: true }
);

featuredSchema.index({ listing: 1, status: 1 });

const featuredModel =  mongoose.model(
  "featured_listings",
  featuredSchema
);

export default featuredModel;