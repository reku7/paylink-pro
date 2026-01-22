import mongoose from "mongoose";

const PaymentLinkSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchant",
      required: true,
    },

    linkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    title: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "ETB",
    },

    // CUSTOMER INFORMATION

    customerName: {
      type: String,
      default: "",
    },
    customerEmail: {
      type: String,
      default: "",
    },
    customerPhone: {
      type: String,
      default: "",
    },

    // PAYMENT STATUS & EXPIRY

    status: {
      type: String,
      enum: ["active", "disabled", "expired"],
      default: "active",
    },

    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },

    // REDIRECT URLS

    successUrl: {
      type: String,
      default: "",
    },
    cancelUrl: {
      type: String,
      default: "",
    },
    failureUrl: {
      type: String,
      default: "",
    },

    // TRANSACTIONS (Relation)

    transactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaction",
      },
    ],

    // OPTIONAL PAYMENT METHOD

    gateway: {
      type: String,
      required: true,
      enum: ["santimpay", "chapa"],
    },

    // EXTRA DATA

    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.models.PaymentLink ||
  mongoose.model("PaymentLink", PaymentLinkSchema);
