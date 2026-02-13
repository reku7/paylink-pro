// src/controllers/publicPayment.controller.js
import PaymentLink from "../models/PaymentLink.js";
import {
  createInternalTransaction,
  startPayment,
} from "../services/payment.service.js";

/**
 * Start a public payment (customer, no auth)
 * POST /api/payments/public/start/:linkId
 */
// controllers/publicPayment.controller.js
export async function startPublicPaymentController(req, res) {
  try {
    const { linkId } = req.params;

    // 1️⃣ Load the payment link
    // 1️⃣ Load the payment link
    const link = await PaymentLink.findOne({ linkId });
    if (!link) return res.status(400).json({ error: "Payment link not found" });

    // ✅ Allow retries if link is active
    if (link.status !== "active") {
      // Only block if truly expired
      if (link.expiresAt && link.expiresAt < new Date()) {
        return res.status(400).json({ error: "Payment link expired" });
      }
      // Otherwise, allow retry without changing status
    }

    // 4️⃣ Create new internal transaction
    const transaction = await createInternalTransaction(
      link.merchantId,
      link.linkId,
      { amount: link.amount, currency: link.currency },
    );

    // 5️⃣ Build public URLs with linkId (retry works now)
    const successUrl = `${process.env.DEFAULT_SUCCESS_URL}?linkId=${link.linkId}`;
    const cancelUrl = `${process.env.DEFAULT_CANCEL_URL}?linkId=${link.linkId}`;
    const failureUrl = `${process.env.DEFAULT_FAILURE_URL}?linkId=${link.linkId}`;

    // 6️⃣ Start payment via gateway
    const gatewayResponse = await startPayment({
      transaction,
      returnUrls: { successUrl, cancelUrl, failureUrl },
    });

    return res.json({
      checkoutUrl:
        gatewayResponse.checkoutUrl ||
        gatewayResponse.data?.checkoutUrl ||
        gatewayResponse.url,
      gateway: transaction.gateway,
    });
  } catch (err) {
    console.error("❌ startPublicPaymentController error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Failed to start public payment" });
  }
}
