// src/controllers/paymentController.js
import Transaction from "../models/Transaction.js";
import {
  createInternalTransaction,
  startPayment,
} from "../services/payment.service.js";

/**
 * Start a private payment (authenticated merchant)
 * POST /api/payments/:linkId/start
 */
export async function startPaymentController(req, res) {
  try {
    const merchantId = req.user?.merchantId;
    if (!merchantId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { linkId } = req.params;
    const {
      amount,
      currency,
      customerName,
      customerPhone,
      metadata,
      idempotencyKey,
      returnUrls, // Optional, can override defaults
    } = req.body;

    // 1️⃣ Always create a new internal transaction
    const tx = await createInternalTransaction(merchantId, linkId, {
      amount,
      currency,
      customerName,
      customerPhone,
      metadata,
      idempotencyKey: idempotencyKey || undefined, // optional
    });

    // 2️⃣ Determine return URLs (fallback to .env)
    const urls = returnUrls || {
      successUrl: process.env.DEFAULT_SUCCESS_URL,
      cancelUrl: process.env.DEFAULT_CANCEL_URL,
      failureUrl: process.env.DEFAULT_FAILURE_URL,
    };

    // 3️⃣ Start payment via gateway
    let gatewayResp;
    try {
      gatewayResp = await startPayment({ transaction: tx, returnUrls: urls });
    } catch (err) {
      console.error("Payment gateway error:", err.message);
      return res.status(502).json({
        success: false,
        message: "Payment gateway error",
        details: err.message,
      });
    }

    // 4️⃣ Fetch the latest transaction
    const updatedTx = await Transaction.findById(tx._id);

    // ✅ Return checkout URL to frontend so retry works
    return res.status(200).json({
      success: true,
      transaction: updatedTx,
      gateway: gatewayResp,
    });
  } catch (err) {
    console.error("startPaymentController error:", err);
    return res.status(500).json({
      error: err.message || "Failed to start payment",
    });
  }
}
