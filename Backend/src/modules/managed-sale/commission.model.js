import mongoose from "mongoose";

const commissionSchema = new mongoose.Schema(
    {
        listing: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "listings",
            required: true,
        },

        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true,
        },

        // Actual sale price entered by admin
        salePrice: {
            type: Number,
            required: true,
        },

        commissionRate: {
            type: Number,
            default: 0.009, // 0.9%
        },

        // Calculated: salePrice * commissionRate
        commissionAmount: {
            type: Number,
            required: true,
        },

        // Ref to payment record
        payment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "payments",
            default: null,
        },

        status: {
            type: String,
            enum: ["PENDING", "PAID", "EXPIRED", "CANCELLED"],
            default: "PENDING",
        },

        // 30 mins from creation
        expiresAt: {
            type: Date,
            required: true,
        },

        // Admin fills when cancelling
        cancelReason: {
            type: String,
            default: null,
        },

        // Who initiated (always admin)
        initiatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

const commissionModel= mongoose.model("Commission", commissionSchema);
export default commissionModel;