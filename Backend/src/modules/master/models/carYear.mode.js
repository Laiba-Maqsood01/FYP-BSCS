import mongoose from "mongoose";

const carYearSchema = new mongoose.Schema(
  {
    model: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "car_models",
      required: true
    },
    year: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

carYearSchema.index({ model: 1, year: 1 }, { unique: true });

const carYearModel = mongoose.model("car_years", carYearSchema);
export default carYearModel