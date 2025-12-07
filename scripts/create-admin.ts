/**
 * Create Admin User Script
 * 
 * Usage:
 *   npx tsx scripts/create-admin.ts
 * 
 * Or with custom values:
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=SecurePass123 npx tsx scripts/create-admin.ts
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import "dotenv/config";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI environment variable is not set");
  process.exit(1);
}

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  status: { type: String, enum: ["active", "blocked"], default: "active" },
  emailVerified: { type: Boolean, default: false },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@ebook1eur.com";
  const password = process.env.ADMIN_PASSWORD || "Admin123!";
  const name = process.env.ADMIN_NAME || "Administrator";

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected successfully");

  // Check if admin already exists
  const existingAdmin = await User.findOne({ email });
  if (existingAdmin) {
    console.log(`Admin user already exists: ${email}`);
    if (existingAdmin.role !== "admin") {
      existingAdmin.role = "admin";
      await existingAdmin.save();
      console.log("Updated user role to admin");
    }
    await mongoose.disconnect();
    return;
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash(password, 12);
  
  const admin = await User.create({
    email,
    passwordHash: hashedPassword,
    name,
    role: "admin",
    status: "active",
    emailVerified: true,
  });

  console.log("\n✓ Admin user created successfully!");
  console.log("  Email:", email);
  console.log("  Password:", password);
  console.log("  ID:", admin._id.toString());
  console.log("\n⚠️  Please change the password after first login!");

  await mongoose.disconnect();
}

createAdmin().catch((error) => {
  console.error("Error creating admin:", error);
  process.exit(1);
});
