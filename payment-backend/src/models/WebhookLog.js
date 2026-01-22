import mongoose, { model } from "mongoose";

const WebhookLogSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true, index: true },
    internalRef: { type: String, index: true },

    santimTxnId: { type: String, index: true },
    chapaTxRef: { type: String, index: true }, // ✅ ADD THIS

    status: { type: String, required: true },
    payload: { type: Object, required: true },
    processed: { type: Boolean, default: false },
    error: { type: String, default: "" },
  },
  { timestamps: true }
);

// 🔐 Prevent duplicate processing
WebhookLogSchema.index(
  { provider: 1, santimTxnId: 1 },
  {
    unique: true,
    partialFilterExpression: { santimTxnId: { $exists: true } },
  }
);

WebhookLogSchema.index(
  { provider: 1, chapaTxRef: 1 },
  {
    unique: true,
    partialFilterExpression: { chapaTxRef: { $type: "string", $ne: "" } },
  }
);

export default mongoose.models.WebhookLog ||
  mongoose.model("WebhookLog", WebhookLogSchema);
