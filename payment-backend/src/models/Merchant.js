import mongoose from "mongoose";

const merchantSchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    // email: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    currency: { type: String, default: "ETB" },
    webhookUrl: { type: String, default: "" },
    webhookSecretHash: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "active", "blocked"],
      default: "active",
    },
    settings: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.Merchant ||
  mongoose.model("Merchant", merchantSchema);
