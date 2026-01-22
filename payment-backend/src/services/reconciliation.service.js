// services/reconciliation.service.js
import Transaction from "../models/Transaction.js";
import PaymentLink from "../models/PaymentLink.js";
import { getGateway } from "../gateways/index.js";
import { buildGatewayContext } from "./gatewayContext.service.js";
import {
  normalizeProviderStatus,
  markTransactionSuccess,
  markTransactionFailed,
} from "./payment.service.js";

export async function reconcileStuckTransactions() {
  console.log("🔁 Starting transaction reconciliation...");

  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Find stuck transactions
  const stuckTxs = await Transaction.find({
    status: "processing",
    updatedAt: { $lt: fifteenMinutesAgo },
    createdAt: { $gte: oneHourAgo }, // Only check recent transactions
  }).limit(100);

  console.log(`📊 Found ${stuckTxs.length} stuck transactions to reconcile`);

  const results = {
    success: 0,
    failed: 0,
    stillProcessing: 0,
    errors: 0,
  };

  for (const tx of stuckTxs) {
    try {
      console.log(`🔄 Reconciling transaction: ${tx.internalRef}`);

      // Check linked payment link status
      const link = await PaymentLink.findOne({ linkId: tx.linkId });
      if (link && link.status === "paid") {
        console.log(
          `✅ Link already paid, marking transaction as success: ${tx.internalRef}`
        );
        await markTransactionSuccess(tx.internalRef, {
          gatewayPayload: { reconciled: true },
          paidAt: new Date(),
        });
        results.success++;
        continue;
      }

      // Get gateway context
      const context = await buildGatewayContext(tx.merchantId, tx.gateway);
      const gateway = getGateway(tx.gateway, context);

      // Query gateway for current status
      const gatewayResult = await gateway.fetchTransaction(tx.internalRef);

      if (!gatewayResult || !gatewayResult.status) {
        console.warn(`⚠️ No status from gateway for: ${tx.internalRef}`);

        // If transaction is very old and no gateway response, mark as failed
        const ageInHours = (new Date() - tx.createdAt) / (1000 * 60 * 60);
        if (ageInHours > 24) {
          console.log(
            `🕐 Transaction ${tx.internalRef} is ${ageInHours.toFixed(
              1
            )} hours old, marking as failed`
          );
          await markTransactionFailed(tx.internalRef, {
            gatewayPayload: {
              reconciled: true,
              reason: "Timeout after 24 hours",
            },
            reason: "Transaction timeout",
          });
          results.failed++;
        } else {
          results.stillProcessing++;
        }
        continue;
      }

      const normalizedStatus = normalizeProviderStatus(gatewayResult.status);

      console.log(
        `📊 Gateway status for ${tx.internalRef}: ${normalizedStatus}`
      );

      // Update transaction based on gateway status
      if (normalizedStatus === "success") {
        await markTransactionSuccess(tx.internalRef, {
          gatewayPayload: gatewayResult,
          paidAt:
            gatewayResult.paidAt || gatewayResult.updated_at || new Date(),
        });
        results.success++;
        console.log(`✅ Marked as success: ${tx.internalRef}`);
      } else if (normalizedStatus === "failed") {
        await markTransactionFailed(tx.internalRef, {
          gatewayPayload: gatewayResult,
          reason: gatewayResult.reason || "Gateway reported failure",
        });
        results.failed++;
        console.log(`❌ Marked as failed: ${tx.internalRef}`);
      } else {
        // Still processing at gateway
        results.stillProcessing++;
        console.log(`🔄 Still processing: ${tx.internalRef}`);
      }
    } catch (err) {
      results.errors++;
      console.error(
        `❌ Reconciliation error for ${tx.internalRef}:`,
        err.message
      );

      // Log detailed error for debugging
      await Transaction.updateOne(
        { _id: tx._id },
        {
          $push: {
            "metadata.reconciliationErrors": {
              timestamp: new Date(),
              error: err.message,
            },
          },
        }
      );
    }
  }

  console.log("📈 Reconciliation completed:", results);
  return results;
}

// New function to manually reconcile a specific transaction
export async function manuallyReconcileTransaction(internalRef) {
  const tx = await Transaction.findOne({ internalRef });
  if (!tx) {
    throw new Error("Transaction not found");
  }

  console.log(`🛠️ Manual reconciliation for: ${internalRef}`);

  const context = await buildGatewayContext(tx.merchantId, tx.gateway);
  const gateway = getGateway(tx.gateway, context);

  try {
    const gatewayResult = await gateway.fetchTransaction(internalRef);
    console.log("Gateway result:", gatewayResult);

    return {
      transaction: tx,
      gatewayResult,
      normalizedStatus: normalizeProviderStatus(
        gatewayResult?.status || "unknown"
      ),
    };
  } catch (error) {
    console.error("Manual reconciliation failed:", error);
    throw error;
  }
}
