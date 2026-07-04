import mongoose from "mongoose";

// Audit trail: one record each time a buyer successfully reveals a seller's
// contact number. Used for abuse detection (scraping) and future seller metrics.
const contactRevealSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "listings",
      required: true,
      index: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    viewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    ip: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const contactRevealModel = mongoose.model("contact_reveals", contactRevealSchema);
export default contactRevealModel;
