import mongoose from "mongoose";

const provinceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    }
  },
  { timestamps: true }
);

const provinceModel = mongoose.model(
  "provinces",
  provinceSchema
);

export default provinceModel;