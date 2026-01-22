import mongoose from "mongoose";

const merchantSchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    currency: { type: String, default: "ETB" },
    webhookUrl: { type: String, default: "" },
    webhookSecretHash: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "active", "blocked"],
      default: "active",
    },
    chapa: {
      connected: {
        type: Boolean,
        default: false, // 👈 CRITICAL
      },
      secretEncrypted: {
        iv: { type: String, default: null },
        content: { type: String, default: null },
        tag: { type: String, default: null },
      },
    },

    preferredGateway: {
      type: String,
      enum: ["santimpay", "chapa"],
      default: "santimpay",
    },

    // ✅ New full merchant/business info
    business: {
      tinNumber: { type: String },
      fydaId: { type: String },
      businessName: { type: String },
      businessAddress: { type: String },
      businessPhone: { type: String },
      businessEmail: { type: String },
      businessType: { type: String },
    },

    settings: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.models.Merchant ||
  mongoose.model("Merchant", merchantSchema);
