import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/User.js";
import { hashPassword } from "../src/services/auth.service.js";

dotenv.config();

async function createAdmin() {
  await mongoose.connect(process.env.MONGO_URI);

  const email = "admin@payflow.com";

  const existing = await User.findOne({ email });
  if (existing) {
    console.log("✅ Admin already exists");
    process.exit(0);
  }

  const passwordHash = await hashPassword(process.env.ADMIN_PASSWORD);

  await User.create({
    name: "PayFlow Admin",
    email,
    passwordHash,
    roles: ["ADMIN"],
  });

  console.log("🚀 Admin user created successfully");
  process.exit(0);
}

createAdmin();
