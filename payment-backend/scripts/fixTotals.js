// payment-backend/scripts/fixTotals.js
import mongoose from "mongoose";
import Transaction from "../src/models/Transaction.js";
import PaymentLink from "../src/models/PaymentLink.js";
import dotenv from "dotenv";

dotenv.config();

async function fixTotals() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Find all links with successful transactions but totals = 0
    const links = await PaymentLink.find({
      totalCollected: 0,
      totalPayments: 0,
    });

    console.log(`Found ${links.length} links to check`);

    for (const link of links) {
      // Find all successful transactions for this link
      const successfulTxs = await Transaction.find({
        linkId: link.linkId,
        status: "success",
      });

      if (successfulTxs.length > 0) {
        // Calculate totals
        const totalCollected = successfulTxs.reduce(
          (sum, tx) => sum + tx.amount,
          0,
        );
        const totalPayments = successfulTxs.length;

        console.log(`\nFixing link ${link.linkId}:`);
        console.log(`  - Found ${totalPayments} successful transactions`);
        console.log(`  - Total collected: ${totalCollected}`);
        console.log(
          `  - Current totals: ${link.totalCollected} / ${link.totalPayments}`,
        );

        // Update the link
        link.totalCollected = totalCollected;
        link.totalPayments = totalPayments;

        if (link.type === "one_time") {
          link.isPaid = true;
          link.status = "expired";
          link.paidAt = successfulTxs[0].paidAt || successfulTxs[0].createdAt;
        }

        await link.save();
        console.log(`  ✅ Updated successfully`);

        // Mark all these transactions as processed
        for (const tx of successfulTxs) {
          if (!tx.processedInTotals) {
            tx.processedInTotals = true;
            await tx.save();
          }
        }
      }
    }

    console.log("\n✅ Fix completed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixTotals();
