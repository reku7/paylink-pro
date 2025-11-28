import mongoose from "mongoose";

const invoiceSchema = mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchant",
      required: true,
    },
    invoiceRef: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: ETB },
    customerName: String,
    customerEmail: String,
    status: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "pending",
    },
    santimTransactionId: String,
  },
  { timestamps: true }
);

export default mongoose.model("Invoice", invoiceSchema);
