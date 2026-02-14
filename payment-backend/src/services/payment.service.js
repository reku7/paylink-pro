// src/services/payment.service.js
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import Transaction from "../models/Transaction.js";
import PaymentLink from "../models/PaymentLink.js";
import { assertGatewayReady } from "./gatewayGuards.service.js";
import { buildGatewayContext } from "./gatewayContext.service.js";
import { getGateway } from "../gateways/index.js";

/* ============================================================
   UTILITIES
============================================================ */

function generateInternalRef() {
  const date = new Date().toISOString().split("T")[0].replace(/-/g, "");
  const shortId = uuidv4().replace(/-/g, "").slice(0, 12);
  return `INT-${date}-${shortId}`;
}

function ensureValidUrls({ successUrl, cancelUrl, failureUrl }) {
  for (const [key, value] of Object.entries({
    successUrl,
    cancelUrl,
    failureUrl,
  })) {
    if (!value) throw new Error(`${key} is required`);
    try {
      new URL(value);
    } catch {
      throw new Error(`${key} must be a valid URL`);
    }
  }
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

/* ============================================================
   CREATE INTERNAL TRANSACTION
============================================================ */

export async function createInternalTransaction(merchantId, linkId, opts = {}) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      amount,
      currency = "ETB",
      customerName = "",
      customerPhone = "",
      metadata = {},
      idempotencyKey = null,
    } = opts;

    const link = await PaymentLink.findOne({ linkId }).session(session);
    if (!link) throw new Error("Payment link not found");
    if (merchantId && link.merchantId.toString() !== merchantId.toString())
      throw new Error("Unauthorized payment link access");
    if (link.status !== "active") throw new Error("Payment link not available");
    if (link.expiresAt && link.expiresAt < new Date())
      throw new Error("Payment link expired");
    if (link.type === "one_time" && link.isPaid)
      throw new Error("This payment link has already been used");

    const finalAmount = amount ?? link.amount;
    if (!finalAmount || finalAmount <= 0) throw new Error("Invalid amount");

    // Idempotency protection
    if (idempotencyKey) {
      const existing = await Transaction.findOne({
        linkId,
        "metadata.idempotencyKey": idempotencyKey,
      }).session(session);
      if (existing) {
        await session.commitTransaction();
        return existing;
      }
    }

    const tx = await Transaction.create(
      [
        {
          merchantId: link.merchantId,
          linkId,
          internalRef: generateInternalRef(),
          amount: finalAmount,
          currency: link.currency || currency,
          status: "initialized",
          customerName,
          customerPhone,
          metadata: { ...metadata, idempotencyKey },
          gatewayResponse: {},
          gateway: link.gateway,
        },
      ],
      { session },
    );

    await PaymentLink.updateOne(
      { _id: link._id },
      { $push: { transactions: tx[0]._id }, $set: { updatedAt: new Date() } },
      { session },
    );

    await session.commitTransaction();
    return tx[0];
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

/* ============================================================
   TRANSACTION STATE MANAGEMENT
============================================================ */

export async function markTransactionProcessing(
  internalRef,
  { gatewayPayload = {} } = {},
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
    { new: true },
  );

  if (tx)
    await PaymentLink.updateOne(
      { linkId: tx.linkId },
      { $set: { updatedAt: new Date() } },
    );
  return tx;
}

export async function markTransactionSuccess(
  internalRef,
  { gatewayPayload = {}, paidAt = null } = {},
) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const tx = await Transaction.findOne({ internalRef }).session(session);
    if (!tx) throw new Error("Transaction not found");

    // If already success, return immediately
    if (tx.status === "success" && tx.processedInTotals) {
      await session.commitTransaction();
      return tx;
    }

    // Update transaction
    tx.status = "success";
    tx.paidAt = paidAt ? new Date(paidAt) : new Date();
    tx.gatewayResponse = { ...(tx.gatewayResponse || {}), ...gatewayPayload };
    await tx.save({ session });

    // Fetch the link
    const link = await PaymentLink.findOne({ linkId: tx.linkId }).session(
      session,
    );
    if (!link) throw new Error("Payment link not found");

    link.updatedAt = new Date();

    // Handle one-time link
    if (link.type === "one_time") {
      if (!link.isPaid) {
        link.status = "expired";
        link.isPaid = true;
        link.paidAt = tx.paidAt;

        // Only increment totals if not counted yet
        const updatedTx = await Transaction.findOneAndUpdate(
          {
            internalRef,
            processedInTotals: false,
          },
          {
            $set: { processedInTotals: true },
          },
          { new: true, session },
        );

        if (updatedTx) {
          await PaymentLink.updateOne(
            { linkId: tx.linkId },
            {
              $inc: {
                totalCollected: tx.amount,
                totalPayments: 1,
              },
              $set: { updatedAt: new Date() },
            },
            { session },
          );
        }
      }
    }

    // Handle reusable link
    if (link.type === "reusable") {
      // Increment totals only if not counted yet for this transaction
      const updatedTx = await Transaction.findOneAndUpdate(
        {
          internalRef,
          processedInTotals: false,
        },
        {
          $set: { processedInTotals: true },
        },
        { new: true, session },
      );

      if (updatedTx) {
        await PaymentLink.updateOne(
          { linkId: tx.linkId },
          {
            $inc: {
              totalCollected: tx.amount,
              totalPayments: 1,
            },
            $set: { updatedAt: new Date() },
          },
          { session },
        );
      }
    }

    // Save link changes
    await link.save({ session });

    await session.commitTransaction();
    return tx;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function markTransactionFailed(
  internalRef,
  { reason = "", gatewayPayload = {} } = {},
) {
  const tx = await Transaction.findOne({ internalRef });
  if (!tx) throw new Error("Transaction not found");

  tx.status = "failed";
  tx.gatewayResponse = gatewayPayload;
  if (reason) tx.metadata.failReason = reason;
  tx.updatedAt = new Date();
  await tx.save();

  await PaymentLink.updateOne(
    { linkId: tx.linkId },
    { $set: { updatedAt: new Date() } },
  );
  return tx;
}

/* ============================================================
   PAYMENT INITIALIZATION
============================================================ */

export async function startPayment({ transaction, returnUrls }) {
  if (!process.env.WEBHOOK_BASE_URL) {
    throw new Error("WEBHOOK_BASE_URL not configured");
  }

  const defaultNotifyUrl = `${process.env.WEBHOOK_BASE_URL}/api/webhooks/${transaction.gateway}`;

  const urls = {
    successUrl:
      returnUrls?.successUrl ||
      process.env.DEFAULT_SUCCESS_URL ||
      "http://localhost:5173/success",

    cancelUrl:
      returnUrls?.cancelUrl ||
      process.env.DEFAULT_CANCEL_URL ||
      "http://localhost:5173/cancel",

    failureUrl:
      returnUrls?.failureUrl ||
      process.env.DEFAULT_FAILURE_URL ||
      "http://localhost:5173/failed",

    notifyUrl:
      returnUrls?.notifyUrl ||
      process.env.DEFAULT_NOTIFY_URL ||
      defaultNotifyUrl,
  };

  ensureValidUrls(urls);

  let primaryGatewayName = transaction.gateway;
  let response;

  /* ============================================================
     STEP 1 — Ensure Primary Gateway Is Ready
  ============================================================ */

  try {
    await assertGatewayReady(transaction.merchantId, primaryGatewayName);
  } catch (guardError) {
    console.log(`Primary gateway (${primaryGatewayName}) not ready:`);

    // Try fallback only if primary is SantimPay
    if (primaryGatewayName === "santimpay") {
      try {
        await assertGatewayReady(transaction.merchantId, "chapa");

        console.log("🔁 Switching to Chapa (guard-level failover)");

        await Transaction.updateOne(
          { internalRef: transaction.internalRef },
          { $set: { gateway: "chapa" } },
        );

        transaction.gateway = "chapa";
        primaryGatewayName = "chapa";
      } catch {
        // No fallback available
        throw guardError;
      }
    } else {
      throw guardError;
    }
  }

  /* ============================================================
     STEP 2 — Initialize Primary Gateway
  ============================================================ */

  try {
    const context = await buildGatewayContext(
      transaction.merchantId,
      primaryGatewayName,
    );

    const gateway = getGateway(primaryGatewayName, context);

    response = await gateway.initializePayment({ transaction, urls });
  } catch (primaryError) {
    console.log("Primary gateway runtime failure:", primaryError.message);

    // Runtime fallback only if primary was SantimPay
    if (primaryGatewayName === "santimpay") {
      try {
        // Check if Chapa is configured before switching
        await assertGatewayReady(transaction.merchantId, "chapa");

        console.log("🔁 Runtime failover → Chapa");

        await Transaction.updateOne(
          { internalRef: transaction.internalRef },
          { $set: { gateway: "chapa" } },
        );

        transaction.gateway = "chapa";

        const fallbackContext = await buildGatewayContext(
          transaction.merchantId,
          "chapa",
        );

        const fallbackGateway = getGateway("chapa", fallbackContext);

        response = await fallbackGateway.initializePayment({
          transaction,
          urls,
        });
      } catch (fallbackError) {
        console.error("Fallback gateway also failed:", fallbackError.message);
        throw primaryError; // preserve original failure
      }
    } else {
      throw primaryError;
    }
  }

  /* ============================================================
     STEP 3 — Mark Processing
  ============================================================ */

  await markTransactionProcessing(transaction.internalRef, {
    gatewayPayload: response,
  });

  return response;
}

/* ============================================================
   WEBHOOK HANDLERS
============================================================ */

export async function handleSantimWebhook(payload) {
  const refId =
    payload.thirdPartyId || payload.id || payload.externalId || payload.txnId;
  if (!refId || !payload.status) throw new Error("Invalid SantimPay payload");

  const normalized = normalizeProviderStatus(payload.status);
  const tx = await Transaction.findOne({ internalRef: refId });
  if (!tx) throw new Error("Transaction not found");
  if (tx.gateway !== "santimpay" || !canTransition(tx.status, normalized))
    return tx;

  if (normalized === "success")
    return markTransactionSuccess(refId, { gatewayPayload: payload });
  if (normalized === "failed")
    return markTransactionFailed(refId, {
      gatewayPayload: payload,
      reason: payload.message,
    });

  return tx;
}

export async function handleChapaWebhook(payload) {
  console.log("🔥🔥 CHAPA WEBHOOK RECEIVED:", payload);
  const refId = payload.tx_ref;
  if (!refId || !payload.status) throw new Error("Invalid Chapa payload");

  const normalized = normalizeProviderStatus(payload.status);
  const tx = await Transaction.findOne({ internalRef: refId });
  if (!tx) throw new Error("Transaction not found");
  if (tx.gateway !== "chapa" || !canTransition(tx.status, normalized))
    return tx;

  if (normalized === "success")
    return markTransactionSuccess(refId, {
      gatewayPayload: payload,
      paidAt: payload.created_at,
    });
  if (normalized === "failed")
    return markTransactionFailed(refId, {
      gatewayPayload: payload,
      reason: payload.message,
    });

  return tx;
}

/* ============================================================
   FORCE SYNC (NO NESTED TRANSACTIONS)
============================================================ */

export async function forceSyncTransactionStatus(internalRef) {
  const { transaction, gatewayStatus } =
    await verifyTransactionWithGateway(internalRef);
  if (!gatewayStatus?.status) throw new Error("No status from gateway");

  const normalized = normalizeProviderStatus(gatewayStatus.status);

  if (normalized === "success" && transaction.status !== "success") {
    return markTransactionSuccess(internalRef, {
      gatewayPayload: gatewayStatus,
      paidAt: gatewayStatus.paidAt || gatewayStatus.updated_at || new Date(),
    });
  }

  if (normalized === "failed" && transaction.status !== "failed") {
    return markTransactionFailed(internalRef, {
      gatewayPayload: gatewayStatus,
      reason: gatewayStatus.reason,
    });
  }

  return transaction;
}

export async function verifyTransactionWithGateway(internalRef) {
  const transaction = await Transaction.findOne({ internalRef });
  if (!transaction) throw new Error("Transaction not found");

  const context = await buildGatewayContext(
    transaction.merchantId,
    transaction.gateway,
  );
  const gateway = getGateway(transaction.gateway, context);
  const gatewayStatus = await gateway.fetchTransaction(internalRef);

  return { transaction, gatewayStatus };
}
