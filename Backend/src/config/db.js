import mongoose from "mongoose";
import config from "./config.js" 
import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"])

async function connectDB() {
    try {
        await mongoose.connect(config.MONGO_URI)
        console.log("Connected to DB")
    } catch (error) {
        console.log("Error connecting to db",error)
        process.exit(1);
    }
}

export default connectDB