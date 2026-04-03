import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/philz";

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    const email = process.env.SUPER_ADMIN_EMAIL || "admin@philzproperties.com";
    const password = process.env.SUPER_ADMIN_PASSWORD || "Admin@Philz2024!";

    // Check if super admin already exists
    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`Super admin already exists: ${email}`);
      console.log(`  Role: ${existing.role}`);
      console.log(`  Approved: ${existing.adminApproved}`);
      console.log(`  Email Verified: ${existing.emailVerified}`);

      // Ensure they have the right flags
      if (!existing.adminApproved || !existing.emailVerified) {
        existing.adminApproved = true;
        existing.emailVerified = true;
        await existing.save({ validateBeforeSave: false });
        console.log("Updated existing admin: approved + email verified");
      }

      process.exit(0);
    }

    // Create super admin
    const admin = await User.create({
      name: "Philz Admin",
      email,
      phone: "+2348000000000",
      password,
      role: "admin",
      adminApproved: true,
      emailVerified: true,
    });

    console.log("=================================");
    console.log("  Super Admin Created");
    console.log("=================================");
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${password}`);
    console.log(`  Role:     ${admin.role}`);
    console.log(`  ID:       ${admin._id}`);
    console.log("=================================");
    console.log("Save these credentials securely!");
    console.log("=================================");

    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
};

seedSuperAdmin();
