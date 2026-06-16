import mongoose from "mongoose";

const listingDeletionRequestSchema = new mongoose.Schema(
    {
        listing: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "listings",
            required: true,
        },

        requestedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true,
        },

        reason: {
            type: String,
            required: true,
            minlength: 10,
        },

        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED"],
            default: "PENDING",
        },

        // Admin fills this when rejecting
        adminNote: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

// Only one active request per listing at a time
listingDeletionRequestSchema.index(
    { listing: 1 },
    {
        unique: true,
        partialFilterExpression: { status: "PENDING" },
    }
);

const listingDeletionRequestModel = mongoose.model(
    "ListingDeletionRequest",
    listingDeletionRequestSchema
);
export default listingDeletionRequestModel;