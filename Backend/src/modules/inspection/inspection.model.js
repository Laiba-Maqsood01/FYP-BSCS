import mongoose from "mongoose";

const inspectionSchema = new mongoose.Schema(
  {
    // Absent for external inspections (car not listed on GearTrade)
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "listings",
      default: null
    },

    // External inspection: snapshot of the off-platform car, entered by the
    // requester. Plain strings (not refs) — there is no listing to stay in
    // sync with, this is frozen booking data.
    externalCar: {
      year:           { type: Number, default: null },
      brand:          { type: String, default: "" },
      carModel:       { type: String, default: "" },
      bodyType:       { type: String, default: "" },
      engineType:     { type: String, default: "" },
      engineCapacity: { type: Number, default: null },
      city:           { type: String, default: "" },
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
        "SCHEDULED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED"
      ],
      default: "PENDING"
    },

    cancelReason: {
      type: String,
      default: null
    },

    refundRequired: {
      type: Boolean,
      default: false
    },

    refundStatus: {
      type: String,
      enum: [
        "NOT_REQUIRED",
        "PENDING",
        "PROCESSED"
      ],
      default: "NOT_REQUIRED"
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
      default: null,
    },

    // The scheduledDate a day-before reminder SMS was last sent for.
    // Lets the reminder cron avoid duplicate sends while still re-notifying
    // after a reschedule (new scheduledDate won't match this).
    reminderSentFor: {
      type: Date,
      default: null,
    },

    report: {
      url: { type: String, default: null },
      fileId: { type: String, default: null }
    },

    assignedInspector: {
      type: String,
      default: null
    },

    inspectorNotes: String,

    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "payments"
    }
  },
  { timestamps: true }
);

// prevent duplicate active requests (listing-linked inspections only — the
// $type guard keeps external inspections, whose listing is null, out of the
// unique constraint)
inspectionSchema.index(
  { listing: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["PENDING", "SCHEDULED", "IN_PROGRESS"] },
      listing: { $type: "objectId" }
    }
  }
);

inspectionSchema.index({ requestedBy: 1 });
inspectionSchema.index({ listing: 1 });
inspectionSchema.index({ status: 1 });

const inspectionModel = mongoose.model("inspections", inspectionSchema);
export default inspectionModel;