import connectDB from "../config/db.js";
import config from "../config/config.js";
import userModel from "../models/user.model.js";
import bcrypt from "bcryptjs";

async function seedAdmin() {
  try {
    await connectDB();
    console.log("Connected to DB");

    const existingAdmin = await userModel.findOne({ role: "admin" });

    if (existingAdmin) {
      console.log("Admin already exists:", existingAdmin.email);
      process.exit();
    }

    const hashedPassword = await bcrypt.hash(config.ADMIN_PASSWORD, 10);

    await userModel.create({
      username: "Super Admin",
      email: config.EMAIL_ADMIN,
      mobileNumber: "03001234567",
      password: hashedPassword,
      role: "admin",
      verified: true,
      accountStatus: "ACTIVE",
    });

    console.log("Admin seeded successfully");

    process.exit();
  } catch (error) {
    console.error("Admin seed failed:", error.message);
    process.exit(1);
  }
}

seedAdmin();