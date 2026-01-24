import {
  handleSantimWebhook as handleSantimService,
  handleChapaWebhook as handleChapaService,
} from "../services/payment.service.js";
import WebhookLog from "../models/WebhookLog.js";
import Transaction from "../models/Transaction.js";

// ========== UTILITY FUNCTIONS ==========s
function extractSantimPayData(payload) {
  return {
    refId: payload.thirdPartyId || payload.id || payload.clientReference,
    txnId: payload.txnId || payload.refId || payload.id,
    status: payload.Status || payload.status,
    amount: payload.amount,
    currency: payload.currency,
    timestamp: payload.timestamp || new Date(),
  };
}

function extractChapaData(payload) {
  return {
    refId: payload.tx_ref,
    status: payload.status,
    amount: payload.amount,
    currency: payload.currency || "ETB",
    timestamp: payload.created_at || new Date(),
  };
}

async function logWebhook(provider, data, payload) {
  const logData = {
    provider,
    internalRef: data.refId,
    payload,
    status: data.status,
    processed: false,
    receivedAt: new Date(),
  };

  // Only add IDs if they exist to avoid duplicate key errors
  if (provider === "santimpay" && data.txnId) logData.santimTxnId = data.txnId;
  if (provider === "chapa" && data.refId) logData.chapaTxRef = data.refId;

  return await WebhookLog.create(logData);
}

async function updateWebhookLog(logId, updates) {
  return await WebhookLog.findByIdAndUpdate(
    logId,
    { ...updates, updatedAt: new Date() },
    { new: true },
  );
}

async function checkDuplicateWebhook(provider, identifier) {
  if (!identifier) return false; // No ID → cannot be duplicate

  const query = { provider };
  if (provider === "santimpay") query.santimTxnId = identifier;
  if (provider === "chapa") query.chapaTxRef = identifier;

  const existing = await WebhookLog.findOne(query);
  return existing?.processed || false;
}

async function processWebhookWithRetry(serviceFn, payload, maxRetries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await serviceFn(payload);
    } catch (error) {
      lastError = error;
      console.log(`🔄 Webhook processing retry ${attempt}/${maxRetries}`);
      if (attempt === maxRetries) break;
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw lastError;
}

// ========== WEBHOOK CONTROLLERS ==========
export async function handleSantimPayWebhook(req, res) {
  let log;
  try {
    const refId =
      req.body.externalId ||
      req.body.thirdPartyId ||
      req.body.clientReference ||
      req.body.id;
    const txnId = req.body.txnId || req.body.refId || req.body.id;
    let status = req.body.Status || req.body.status;
    if (!refId || !status) return res.sendStatus(200);

    status = status.toLowerCase(); // normalize

    // Duplicate check
    const duplicate = await checkDuplicateWebhook("santimpay", txnId);
    if (duplicate) return res.status(200).send("Duplicate webhook ignored");

    // Log the webhook
    log = await logWebhook("santimpay", { refId, txnId, status }, req.body);

    const tx = await Transaction.findOne({ internalRef: refId });
    if (!tx) {
      await updateWebhookLog(log._id, {
        processed: true,
        error: "Transaction not found",
        processedAt: new Date(),
      });
      return res.sendStatus(200);
    }

    // Process transaction
    await processWebhookWithRetry(handleSantimService, req.body);

    // Mark webhook log as processed
    await updateWebhookLog(log._id, {
      processed: true,
      processedAt: new Date(),
    });

    return res.status(200).send("OK");
  } catch (err) {
    console.error("Santim webhook error:", err.message);
    if (log)
      await updateWebhookLog(log._id, {
        processed: false,
        error: err.message,
        processedAt: new Date(),
      });
    return res.sendStatus(200);
  }
}

export async function handleChapaWebhook(req, res) {
  let webhookLog;

  try {
    // Support both GET (redirect) and POST (webhook)
    const webhookData = extractChapaData(
      req.method === "POST" ? req.body : req.query,
    );

    // Validate required fields
    if (!webhookData.refId || !webhookData.status) {
      return res.status(200).send("Accepted - Invalid payload");
    }

    // Duplicate check BEFORE logging
    const isDuplicate = await checkDuplicateWebhook("chapa", webhookData.refId);
    if (isDuplicate) return res.status(200).send("OK - Duplicate ignored");

    // Log the webhook
    webhookLog = await logWebhook("chapa", webhookData, req.body);

    // Find transaction by internal reference
    const transaction = await Transaction.findOne({
      internalRef: webhookData.refId, // Make sure this matches your DB
    });

    if (!transaction) {
      await updateWebhookLog(webhookLog._id, {
        processed: true,
        error: "Transaction not found",
      });
      return res.status(200).send("Accepted - Transaction not found");
    }

    // Update transaction status immediately
    transaction.status =
      webhookData.status === "success"
        ? "success"
        : webhookData.status === "failed"
          ? "failed"
          : "processing";
    transaction.updatedAt = new Date();
    await transaction.save();

    // Process additional business logic with retry if needed
    await processWebhookWithRetry(handleChapaService, req.body);

    // Mark webhook as processed
    await updateWebhookLog(webhookLog._id, {
      processed: true,
      processedAt: new Date(),
    });

    return res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Chapa webhook error:", error);
    if (webhookLog) {
      await updateWebhookLog(webhookLog._id, {
        processed: false,
        error: error.message,
        processedAt: new Date(),
      });
    }
    return res.status(200).send("Accepted");
  }
}
