import mongoose from "mongoose";
import { ROLES } from "../constants/roles.js";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      // index: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    roles: { type: [String], default: [ROLES.MERCHANT_OWNER] },
    avatar: {
      type: String,
      default: null,
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
