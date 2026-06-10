// import mongoose from "mongoose";

// const inspectionSchema = new mongoose.Schema(
//   {
//     listing: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "listings",
//       required: true
//     },

//     requestedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "users",
//       required: true
//     },

//     status: {
//       type: String,
//       enum: ["PENDING", "COMPLETED"],
//       default: "PENDING"
//     },

//     reportPdf: {
//       url: String,
//       fileId: String
//     },

//     inspectionImages: [
//       {
//         url: String,
//         fileId: String
//       }
//     ],

//     comments: {
//       type: String,
//       default: ""
//     }
//   },
//   { timestamps: true }
// );

// const inspectionModel = mongoose.model(
//   "inspections",
//   inspectionSchema
// );

// export default inspectionModel;

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

    type: {
      type: String,
      enum: ["INSPECTION", "RE_INSPECTION"],
      default: "INSPECTION"
    },

    inspectionBy: {
      type: String,
      enum: ["OWNER", "BUYER"],
      required: true
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "PENDING_COORDINATION",
        "SCHEDULED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED"
      ],
      default: "PENDING"
    },

    // seller inspection location
    inspectionAddress: {
      type: String,
      required: function () {
        return this.inspectionBy === "OWNER";
      }
    },

    scheduledDate: {
      type: Date,
      required: function () {
        return this.inspectionBy === "OWNER";
      }
    },


    timeSlot: {
      type: String,
      required: function () {
        return this.inspectionBy === "OWNER";
      }
    },

    report: {
      url: String,
      fileId: String
    },

    inspectorNotes: String,

    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "payments"
    }
  },
  { timestamps: true }
);

// prevent duplicate active requests
inspectionSchema.index(
  { listing: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["PENDING", "SCHEDULED", "IN_PROGRESS"] }
    }
  }
);

const inspectionModel = mongoose.model("inspections", inspectionSchema);
export default inspectionModel;