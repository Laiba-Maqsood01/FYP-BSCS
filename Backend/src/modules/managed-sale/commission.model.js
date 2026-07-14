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

        // The buyer pays GearTrade in full; the team deducts the commission and
        // hands the seller the remaining proceeds (e.g. by cheque). So every
        // commission record is created already settled. The field exists (rather
        // than being implicit) so the admin ledger can badge it and future
        // states (e.g. REFUNDED) can be added without a migration.
        status: {
            type: String,
            enum: ["PAID"],
            default: "PAID",
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