import mongoose from "mongoose";
import { ROLES, ACCOUNT_STATUS } from "../utils/constants.js";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Username is required"],
        unique: [true, "Username must be unique"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: [true, "Email must be unique"],
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
    },
    mobileNumber: {
        type: String,
        required: [true, "Mobile number is required"],
        unique: true,
        trim: true,
        match: [
            /^03[0-9]{9}$/,
            "Invalid Pakistani mobile number"
        ]
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        select: false
    },
    role: {
        type: String,
        enum: Object.values(ROLES),
        default: ROLES.USER
    },
    verified: {
        type: Boolean,
        default: false
    },
    accountStatus: {
        type: String,
        enum: Object.values(ACCOUNT_STATUS),
        default: ACCOUNT_STATUS.PENDING
    },
    pendingEmail: {
        type: String,
        default: null
    },
    passwordResetToken: {
        type: String,
        default: null
    },
    passwordResetExpires: {
        type: Date,
        default: null
    },
    avatar: {
        type: String,
        default: null
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    },
    blockedUntil: {
        type: Date,
        default: null
    }
},
    {
        timestamps: true
    }
)

const userModel = mongoose.model("users", userSchema);
export default userModel;