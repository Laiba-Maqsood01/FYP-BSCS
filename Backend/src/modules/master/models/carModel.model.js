import mongoose from "mongoose";

const carModelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "brands",
      required: true
    }
  },
  {
    timestamps: true
  }
);

carModelSchema.index(
  { name: 1, brand: 1 },
  { unique: true }
);

const car_Model= mongoose.model(
  "car_models",
  carModelSchema
);

export default car_Model;