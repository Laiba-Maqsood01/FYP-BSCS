import mongoose from "mongoose";

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true
    },

    brand: {
      type: String,
      required: true
    },

    model: {
      type: String,
      required: true
    },

    year: {
      type: Number,
      required: true
    },

    price: {
      type: Number,
      required: true
    },

    mileage: {
      type: Number,
      required: true
    },

    fuelType: {
      type: String,
      enum: ["petrol", "diesel", "hybrid", "electric"],
      required: true
    },

    transmission: {
      type: String,
      enum: ["manual", "automatic"],
      required: true
    },

    // condition: {
    //   type: String,
    //   enum: ["new", "used"],
    //   default: "used"
    // },

    images: [
      {
        url: String,
        fileId: String
      }
    ],

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true
    },

    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "REJECTED", "SOLD", "REMOVED"],
      default: "PENDING"
    },

    saleMode: {
      type: String,
      enum: ["GENERAL", "MANAGED"],
      default: "GENERAL"
    },

    isFeatured: {
      type: Boolean,
      default: false
    },

    inspectionStatus: {
      type: String,
      enum: ["NOT_REQUESTED", "PENDING", "COMPLETED"],
      default: "NOT_REQUESTED"
    }
  },
  { timestamps: true }
);

const listingModel = mongoose.model("listings", listingSchema);
export default listingModel;