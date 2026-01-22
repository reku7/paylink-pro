// import mongoose from "mongoose";

// const transactionSchema = mongoose.Schema(
//   {
//     invoiceId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Invoice",
//       required: true,
//     },
//     merchantId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Merchant",
//       required: true,
//     },
//     santimTransactionId: { type: String, unique: true },
//     amount: { type: Number, required: true },
//     status: { type: String },
//     rawData: Object,
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Transaction", transactionSchema);

// src/models/Transaction.js

import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchant",
      required: true,
    },

    linkId: {
      type: String,
      required: true,
    },

    internalRef: {
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

    status: {
      type: String,
      enum: ["initialized", "processing", "success", "failed"],
      default: "initialized",
    },

    customerName: {
      type: String,
      default: "",
    },

    customerPhone: {
      type: String,
      default: "",
    },

    gatewayResponse: {
      type: Object,
      default: {},
    },

    metadata: {
      type: Object,
      default: {},
    },
    paidAt: {
      type: Date,
    },
    santimTxnId: { type: String, index: true, default: null },

    gateway: {
      type: String,
      enum: ["santimpay", "chapa"],
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Transaction ||
  mongoose.model("Transaction", TransactionSchema);
