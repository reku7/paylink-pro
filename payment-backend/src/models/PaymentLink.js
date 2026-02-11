import mongoose from "mongoose";

const PaymentLinkSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchant",
      required: true,
      index: true,
    },

    linkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },

    title: { type: String, default: "" },
    description: { type: String, default: "" },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    currency: { type: String, default: "ETB" },

    type: {
      type: String,
      enum: ["one_time", "reusable"],
      default: "one_time",
      index: true,
    },

    status: {
      type: String,
      enum: ["active", "disabled", "expired"],
      default: "active",
      index: true,
    },

    isPaid: {
      type: Boolean,
      default: false,
      index: true,
    },
    paidAt: Date,

    expiresAt: Date,

    customerName: { type: String, default: "" },
    customerEmail: { type: String, default: "" },
    customerPhone: { type: String, default: "" },

    successUrl: { type: String, default: "" },
    cancelUrl: { type: String, default: "" },
    failureUrl: { type: String, default: "" },

    gateway: {
      type: String,
      required: true,
      enum: ["santimpay", "chapa"],
      index: true,
    },

    transactions: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Transaction",
        },
      ],
      default: [],
    },

    metadata: { type: Object, default: {} },
  },
  { timestamps: true },
);

// Performance index
PaymentLinkSchema.index({ merchantId: 1, type: 1, status: 1 });

export default mongoose.models.PaymentLink ||
  mongoose.model("PaymentLink", PaymentLinkSchema);
