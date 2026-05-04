import mongoose from "mongoose";

const inspectionSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "listings",
      required: true
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true
    },

    status: {
      type: String,
      enum: ["PENDING", "COMPLETED"],
      default: "PENDING"
    },

    reportPdf: {
      url: String,
      fileId: String
    },

    inspectionImages: [
      {
        url: String,
        fileId: String
      }
    ],

    comments: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

const inspectionModel = mongoose.model(
  "inspections",
  inspectionSchema
);

export default inspectionModel;