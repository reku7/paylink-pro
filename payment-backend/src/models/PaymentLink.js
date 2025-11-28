// import mongoose from "mongoose";
// import Merchant from "./Merchant";

// const paymentLinkSchema = mongoose.Schema(
//   {
//     MerchantId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Merchant",
//       required: true,
//     },
//     title: String,
//     description: String,
//     amount: Number,
//     isActive: { type: Boolean, default: true },
//     linkId: { type: String, unique: true },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("paymentLink", paymentLinkSchema);

// src/models/PaymentLink.js

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

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "ETB",
    },

    description: {
      type: String,
      default: "",
    },

    customerName: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "paid", "expired"],
      default: "pending",
    },

    redirectUrl: {
      type: String,
      default: "",
    },

    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.models.PaymentLink ||
  mongoose.model("PaymentLink", PaymentLinkSchema);
