import mongoose from "mongoose";

const citySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    province: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "provinces",
      required: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

citySchema.index({
  name: 1,
  province: 1
}, {
  unique: true
});

const cityModel = mongoose.model(
  "cities",
  citySchema
);

export default cityModel;