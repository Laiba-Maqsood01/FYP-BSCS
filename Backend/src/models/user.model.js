import mongoose from "mongoose";

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
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    role: {
        type: String,
        enum: ["admin", "user"],
        default: "user"
    },
    verified: {
        type: Boolean,
        default: false
    },
    accountStatus:{
        type: String,
        enum:["PENDING", "ACTIVE", "SUSPENDED", "BLOCKED"],
        default: "PENDING"
    },
    pendingEmail:{
        type: String,
        default: null
    }
},
    {
        timestamps: true 
    }
)

const userModel = mongoose.model("users", userSchema);
export default userModel;