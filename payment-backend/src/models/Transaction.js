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

    transactionId: {
      type: String,
      unique: true,
      index: true,
    },

    internalRef: {
      type: String,
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

    santimpayResponse: {
      type: Object,
      default: {},
    },

    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.models.Transaction ||
  mongoose.model("Transaction", TransactionSchema);
