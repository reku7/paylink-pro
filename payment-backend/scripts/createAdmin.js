import mongoose from "mongoose";
import User from "../src/models/User.js";
import { hashPassword } from "../src/services/auth.service.js";
import { ROLES } from "../src/constants/roles.js";

async function createAdmin() {
  await mongoose.connect(process.env.MONGO_URI);

  const email = "admin@paylinkpro.com";

  const existing = await User.findOne({ email });
  if (existing) {
    console.log("✅ Admin already exists");
    process.exit(0);
  }

  if (!process.env.ADMIN_PASSWORD) {
    console.error("❌ ADMIN_PASSWORD not set in .env");
    process.exit(1);
  }

  const passwordHash = await hashPassword(process.env.ADMIN_PASSWORD);

  await User.create({
    name: "PayLinkPro Admin",
    email,
    passwordHash,
    roles: [ROLES.ADMIN],
  });

  console.log("🚀 Admin user created successfully");
  process.exit(0);
}

createAdmin();
