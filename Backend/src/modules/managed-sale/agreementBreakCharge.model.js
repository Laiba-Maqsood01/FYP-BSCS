import mongoose from "mongoose";

// Fee charged when a managed-sale owner breaks the exclusive sale agreement
// (asks to withdraw the car before it sells). The amount is derived from the
// featured-plan prices based on how long GearTrade held the car; the admin
// may override it during the office meeting before accepting.
const agreementBreakChargeSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "listings",
      required: true,
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    deletionRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ListingDeletionRequest",
      required: true,
    },

    // Days between the listing going live and the request being accepted
    // (0 when the listing never went live — minimum bracket applies)
    daysHeld: {
      type: Number,
      required: true,
    },

    // What the bracket formula produced (kept for audit)
    computedAmount: {
      type: Number,
      required: true,
    },

    // What the admin actually charged (defaults to computedAmount)
    amount: {
      type: Number,
      required: true,
    },

    // OFFLINE — paid at the office, admin marks it paid.
    // ONLINE  — a payment slot is opened; the owner pays via Stripe.
    paymentMode: {
      type: String,
      enum: ["OFFLINE", "ONLINE"],
      required: true,
    },

    status: {
      type: String,
      enum: ["AWAITING_PAYMENT", "PAID"],
      default: "AWAITING_PAYMENT",
    },

    paidAt: {
      type: Date,
      default: null,
    },

    // Stripe payment (ONLINE mode only)
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "payments",
      default: null,
    },

    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
  },
  { timestamps: true }
);

agreementBreakChargeSchema.index({ deletionRequest: 1 }, { unique: true });
agreementBreakChargeSchema.index({ seller: 1 });
agreementBreakChargeSchema.index({ status: 1 });

const agreementBreakChargeModel = mongoose.model(
  "agreement_break_charges",
  agreementBreakChargeSchema
);
export default agreementBreakChargeModel;
