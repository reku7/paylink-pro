// src/services/payment.service.js
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import Transaction from "../models/Transaction.js";
import PaymentLink from "../models/PaymentLink.js";
import { assertGatewayReady } from "./gatewayGuards.service.js";
import { buildGatewayContext } from "./gatewayContext.service.js";
import { getGateway } from "../gateways/index.js";

// Generate internal transaction reference
function generateInternalRef() {
  const date = new Date().toISOString().split("T")[0].replace(/-/g, "");
  const shortId = uuidv4().replace(/-/g, "").slice(0, 12);
  return `INT-${date}-${shortId}`;
}

// Validate URLs
function ensureValidUrls({ successUrl, cancelUrl, failureUrl }) {
  for (const [key, url] of Object.entries({
    successUrl,
    cancelUrl,
    failureUrl,
  })) {
    if (!url) throw new Error(`${key} is required`);
    try {
      new URL(url);
    } catch {
      throw new Error(`${key} must be a valid URL`);
    }
  }
}

// ==============================
// CREATE INTERNAL TRANSACTION
// ==============================
export async function createInternalTransaction(merchantId, linkId, opts = {}) {
  const {
    amount,
    currency = "ETB",
    customerName = "",
    customerPhone = "",
    metadata = {},
    idempotencyKey = null,
  } = opts;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const link = await PaymentLink.findOne({ linkId }).session(session);
    if (!link) throw new Error("Payment link not found");

    if (merchantId && link.merchantId.toString() !== merchantId.toString()) {
      throw new Error("Unauthorized payment link access");
    }

    if (link.expiresAt && link.expiresAt < new Date()) {
      await link.save({ session });
      throw new Error("Payment link expired");
    }

    if (link.status !== "active") throw new Error("Payment link not available");

    const finalAmount = amount ?? link.amount;
    if (!finalAmount || finalAmount <= 0) throw new Error("Invalid amount");

    // Idempotency check
    if (idempotencyKey) {
      const existing = await Transaction.findOne({
        linkId,
        "metadata.idempotencyKey": idempotencyKey,
      }).session(session);
      if (existing) {
        await session.commitTransaction();
        session.endSession();
        return existing;
      }
    }

    const internalRef = generateInternalRef();
    const txDoc = {
      merchantId: link.merchantId,
      linkId,
      internalRef,
      amount: finalAmount,
      currency: link.currency || currency,
      status: "initialized",
      customerName,
      customerPhone,
      metadata: { ...(metadata || {}), idempotencyKey },
      gatewayResponse: {},
      gateway: link.gateway,
    };

    const [tx] = await Transaction.create([txDoc], { session });

    await PaymentLink.updateOne(
      { _id: link._id },
      { $set: { updatedAt: new Date() }, $push: { transactions: tx._id } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    return tx;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}

// ==============================
// TRANSACTION STATE UPDATES
// ==============================
export async function markTransactionProcessing(
  internalRef,
  { gatewayPayload = {} } = {}
) {
  const tx = await Transaction.findOneAndUpdate(
    { internalRef, status: "initialized" },
    {
      $set: {
        status: "processing",
        updatedAt: new Date(),
        ...(Object.keys(gatewayPayload).length && {
          gatewayResponse: gatewayPayload,
        }),
      },
    },
    { new: true }
  );

  if (tx) {
    await PaymentLink.updateOne(
      { linkId: tx.linkId },
      { $set: { updatedAt: new Date() } }
    );
  }
  return tx;
}

export async function markTransactionSuccess(
  internalRef,
  { gatewayPayload = {}, paidAt = null } = {}
) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tx = await Transaction.findOne({ internalRef }).session(session);
    if (!tx) throw new Error("Transaction not found");

    if (tx.status === "success") {
      await session.commitTransaction();
      session.endSession();
      return tx;
    }

    tx.status = "success";
    tx.paidAt = paidAt ? new Date(paidAt) : new Date();
    tx.gatewayResponse = {
      ...(tx.gatewayResponse || {}),
      ...(gatewayPayload || {}),
    };

    await tx.save({ session });

    // Only update updatedAt, do NOT set status on PaymentLink to "paid"
    await PaymentLink.updateOne(
      { linkId: tx.linkId },
      { $set: { updatedAt: new Date() } }
    ).session(session);

    await session.commitTransaction();
    session.endSession();
    return tx;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}

export async function markTransactionFailed(
  internalRef,
  { reason = "", gatewayPayload = {} } = {}
) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tx = await Transaction.findOne({ internalRef }).session(session);
    if (!tx) throw new Error("Transaction not found");

    tx.status = "failed";
    tx.gatewayResponse = gatewayPayload || {};
    if (reason) tx.metadata.failReason = reason;
    tx.updatedAt = new Date();

    await tx.save({ session });
    await PaymentLink.updateOne(
      { linkId: tx.linkId },
      { $set: { updatedAt: new Date() } }
    ).session(session);

    await session.commitTransaction();
    session.endSession();
    return tx;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}

// ==============================
// PAYMENT INITIALIZATION
// ==============================
export async function startPayment({ transaction, returnUrls }) {
  if (!process.env.WEBHOOK_BASE_URL)
    throw new Error("WEBHOOK_BASE_URL is not configured");

  const notifyUrl = `${process.env.WEBHOOK_BASE_URL}/api/webhooks/${transaction.gateway}`;
  const urls = returnUrls || {
    successUrl:
      process.env.DEFAULT_SUCCESS_URL || "http://localhost:5173/success",
    cancelUrl: process.env.DEFAULT_CANCEL_URL || "http://localhost:5173/cancel",
    failureUrl:
      process.env.DEFAULT_FAILURE_URL || "http://localhost:5173/failed",
    notifyUrl,
  };

  ensureValidUrls(urls);

  await assertGatewayReady(transaction.merchantId, transaction.gateway);
  const context = await buildGatewayContext(
    transaction.merchantId,
    transaction.gateway
  );
  const gateway = getGateway(transaction.gateway, context);

  const response = await gateway.initializePayment({
    transaction,
    urls: {
      successUrl: urls.successUrl,
      cancelUrl: urls.cancelUrl,
      failureUrl: urls.failureUrl,
      notifyUrl,
    },
  });

  await markTransactionProcessing(transaction.internalRef, {
    gatewayPayload: response,
  });
  return response;
}

// ==============================
// WEBHOOK HANDLING
// ==============================
function canTransition(from, to) {
  if (from === to) return true;
  const allowed = {
    initialized: ["processing", "success", "failed"],
    processing: ["success", "failed"],
    success: ["success"],
    failed: ["failed"],
  };
  return allowed[from]?.includes(to);
}

export function normalizeProviderStatus(status) {
  const s = String(status).toLowerCase();
  if (["success", "successful", "completed", "paid", "done"].includes(s))
    return "success";
  if (["failed", "error", "cancelled", "canceled", "rejected"].includes(s))
    return "failed";
  if (["pending", "processing", "initiated"].includes(s)) return "processing";
  return "unknown";
}

export async function handleSantimWebhook(payload) {
  const refId =
    payload.thirdPartyId || payload.id || payload.externalId || payload.txnId;
  const status = payload.Status || payload.status;
  if (!refId || !status) throw new Error("Invalid SantimPay webhook payload");

  const normalizedStatus = normalizeProviderStatus(status);
  const tx = await Transaction.findOne({ internalRef: refId });
  if (!tx) throw new Error("Transaction not found");
  if (tx.gateway !== "santimpay" || !canTransition(tx.status, normalizedStatus))
    return tx;

  if (normalizedStatus === "success")
    return markTransactionSuccess(refId, { gatewayPayload: payload });
  if (normalizedStatus === "failed")
    return markTransactionFailed(refId, {
      gatewayPayload: payload,
      reason: payload.message || "Payment failed",
    });
  return tx;
}

export async function handleChapaWebhook(payload) {
  const refId = payload.tx_ref;
  const normalizedStatus = normalizeProviderStatus(payload.status);
  const tx = await Transaction.findOne({ internalRef: refId });
  if (!tx) throw new Error("Transaction not found");
  if (tx.gateway !== "chapa" || !canTransition(tx.status, normalizedStatus))
    return tx;

  if (normalizedStatus === "success")
    return markTransactionSuccess(refId, {
      gatewayPayload: payload,
      paidAt: payload.created_at || new Date(),
    });
  if (normalizedStatus === "failed")
    return markTransactionFailed(refId, {
      gatewayPayload: payload,
      reason: payload.message || "Payment failed",
    });
  return tx;
}

// ==============================
// GATEWAY VERIFICATION
// ==============================
export async function verifyTransactionWithGateway(internalRef) {
  const transaction = await Transaction.findOne({ internalRef });
  if (!transaction) throw new Error("Transaction not found");

  const context = await buildGatewayContext(
    transaction.merchantId,
    transaction.gateway
  );
  const gateway = getGateway(transaction.gateway, context);
  const gatewayStatus = await gateway.fetchTransaction(internalRef);

  return { transaction, gatewayStatus, gateway };
}

export async function forceSyncTransactionStatus(internalRef) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { transaction, gatewayStatus } = await verifyTransactionWithGateway(
      internalRef
    );
    if (!gatewayStatus?.status) throw new Error("No status from gateway");

    const normalizedStatus = normalizeProviderStatus(gatewayStatus.status);
    let updatedTransaction;

    if (normalizedStatus === "success" && transaction.status !== "success") {
      updatedTransaction = await markTransactionSuccess(internalRef, {
        gatewayPayload: gatewayStatus,
        paidAt: gatewayStatus.paidAt || gatewayStatus.updated_at || new Date(),
      });
    } else if (
      normalizedStatus === "failed" &&
      transaction.status !== "failed"
    ) {
      updatedTransaction = await markTransactionFailed(internalRef, {
        gatewayPayload: gatewayStatus,
        reason: gatewayStatus.reason || "Gateway reported failure",
      });
    }

    await session.commitTransaction();
    return updatedTransaction || transaction;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
