// import mongoose from "mongoose";

// const paymentSchema = new mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "users",
//       required: true
//     },

//     listing: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "listings",
//       required: true
//     },

//     featuredRequest: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "featured_listings"
//     },

//     amount: {
//       type: Number,
//       required: true
//     },

//     paymentMethod: {
//       type: String,
//       default: "SANDBOX"
//     },

//     transactionId: {
//       type: String,
//       unique: true
//     },

//     status: {
//       type: String,
//       enum: ["PENDING", "SUCCESS", "FAILED"],
//       default: "PENDING"
//     }
//   },
//   { timestamps: true }
// );

// const paymentModel = mongoose.model("payments", paymentSchema);

// export default paymentModel;

import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true
    },

    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "listings",
      default: null
    },

    // WHAT is being paid for
    purpose: {
      type: String,
      enum: [
        "FEATURED",
        "INSPECTION",
        "RE_INSPECTION",
        "COMMISSION"
      ],
      required: true
    },

    // optional link to related entity
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
      // can point to:
      // featured_listings OR inspections OR null (commission)
    },

    amount: {
      type: Number,
      required: true
    },

    currency: {
      type: String,
      default: "PKR"
    },

    paymentMethod: {
      type: String,
      enum: ["STRIPE", "CASH", "SANDBOX"],
      default: "SANDBOX"
    },

    stripeSessionId: String,
    stripePaymentIntentId: String,

    transactionId: {
      type: String,
      unique: true
    },

    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING"
    },

    metadata: {
      type: Object,
      default: {}
    }
  },
  { timestamps: true }
);
// for performance, scalability, production readiness, they are like search shortcuts
paymentSchema.index({ user: 1 });
paymentSchema.index({ listing: 1 });
paymentSchema.index({ purpose: 1 });
paymentSchema.index({ referenceId: 1 });
// paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ status: 1 });

// paymentSchema.index({ transactionId: 1 }, { unique: true });

const paymentModel= mongoose.model("payments", paymentSchema);
export default paymentModel;