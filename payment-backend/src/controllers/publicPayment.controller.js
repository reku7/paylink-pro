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
// src/controllers/publicPayment.controller.js
export async function startPublicPaymentController(req, res) {
  try {
    const { linkId } = req.params;

    const link = await PaymentLink.findOne({ linkId });
    if (!link) return res.status(400).json({ error: "Payment link not found" });

    if (link.status !== "active") {
      if (link.expiresAt && link.expiresAt < new Date()) {
        return res.status(400).json({ error: "Payment link expired" });
      }
    }

    // ✅ Create internal transaction for public payment
    const transaction = await createInternalTransaction(
      null,
      link.linkId,
      {
        amount: link.amount,
        currency: link.currency,
      },
      true,
    ); // <-- true = public

    const successUrl = `${process.env.PUBLIC_PAYMENT_SUCCESS_URL}?linkId=${link.linkId}`;
    const cancelUrl = `${process.env.PUBLIC_PAYMENT_CANCEL_URL}?linkId=${link.linkId}`;
    const failureUrl = `${process.env.PUBLIC_PAYMENT_FAILURE_URL}?linkId=${link.linkId}`;

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
