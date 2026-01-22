// src/jobs/transactionCleanup.job.js
import cron from "node-cron";
import Transaction from "../models/Transaction.js";
import { reconcileStuckTransactions } from "../services/reconciliation.service.js";

export async function cleanupOldTransactions() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Find old stuck transactions
  const oldStuckTxs = await Transaction.find({
    status: "processing",
    createdAt: { $lt: sevenDaysAgo },
  });

  for (const tx of oldStuckTxs) {
    console.log(`🧹 Cleaning up old stuck transaction: ${tx.internalRef}`);

    // Mark as failed due to timeout
    await Transaction.updateOne(
      { _id: tx._id },
      {
        status: "failed",
        updatedAt: new Date(),
        "metadata.cleanupReason": "Timeout after 7 days",
        "metadata.cleanedAt": new Date(),
      }
    );
  }

  return { cleaned: oldStuckTxs.length };
}

export function startCleanupJob() {
  // Run every 6 hours
  cron.schedule("0 */6 * * *", async () => {
    console.log("🧹 Running transaction cleanup...");
    await cleanupOldTransactions();
  });
}
