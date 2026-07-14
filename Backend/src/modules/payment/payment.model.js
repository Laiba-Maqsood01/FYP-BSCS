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
        "RE_INSPECTION"
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

    // because if the admin deleted listing, and the buyer requested for inspection has also deleted his account/or deleted by admin, then just for audit, for admin view that wo paid, and whome to refund should go.   
    // it will not be used in stripe refund, because stripe already has payment details. it's just for admin visibility, without it admin have to check stripe dashbord.
    payerSnapshot: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      username: { type: String },
      email: { type: String }
    },
    stripeSessionId: String,
    stripePaymentIntentId: String,

    transactionId: {
      type: String,
      unique: true
    },

    status: {
      type: String,
      // REFUNDED: money landed but the purchase could no longer be honoured
      // (e.g. commission window expired mid-checkout) and was auto-refunded.
      enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
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

const paymentModel = mongoose.model("payments", paymentSchema);
export default paymentModel;