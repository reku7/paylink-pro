import cron from "node-cron";
import { reconcileStuckTransactions } from "../services/reconciliation.service.js";

export function startReconciliationJob() {
  cron.schedule("*/5 * * * *", async () => {
    console.log("🔁 Running transaction reconciliation...");
    await reconcileStuckTransactions();
  });
}
