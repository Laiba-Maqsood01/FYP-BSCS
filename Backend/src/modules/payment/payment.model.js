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
      required: true
    },

    featuredRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "featured_listings"
    },

    amount: {
      type: Number,
      required: true
    },

    paymentMethod: {
      type: String,
      default: "SANDBOX"
    },

    transactionId: {
      type: String,
      unique: true
    },

    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING"
    }
  },
  { timestamps: true }
);

const paymentModel = mongoose.model("payments", paymentSchema);

export default paymentModel;