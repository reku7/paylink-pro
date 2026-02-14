// payment-backend/scripts/fixTotalsWithEnv.js
import "../loadEnv.js"; // This will load environment variables first
import mongoose from "mongoose";
import Transaction from "../src/models/Transaction.js";
import PaymentLink from "../src/models/PaymentLink.js";

async function fixTotals() {
  try {
    // Check if MONGO_URI is loaded
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    console.log("🔌 Connecting to MongoDB...");
    console.log(
      "MONGO_URI:",
      process.env.MONGO_URI.replace(/:[^:@]*@/, ":****@"),
    ); // Hide password in logs

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Find all links that might need fixing
    const links = await PaymentLink.find({
      $or: [
        // Links with successful transactions but totals = 0
        { totalCollected: 0, totalPayments: 0 },
        // One-time links that are still active but have successful transactions
        {
          type: "one_time",
          isPaid: false,
          status: "active",
        },
      ],
    });

    console.log(`📊 Found ${links.length} links to check`);

    let fixedCount = 0;

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

        console.log(`\n🔄 Fixing link ${link.linkId}:`);
        console.log(`  - Title: ${link.title || "Untitled"}`);
        console.log(`  - Type: ${link.type}`);
        console.log(`  - Found ${totalPayments} successful transactions`);
        console.log(`  - Total collected: ${totalCollected} ETB`);
        console.log(
          `  - Current totals: ${link.totalCollected} / ${link.totalPayments}`,
        );
        console.log(
          `  - Current status: ${link.status}, isPaid: ${link.isPaid}`,
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
        console.log(`  - New status: ${link.status}, isPaid: ${link.isPaid}`);
        console.log(
          `  - New totals: ${link.totalCollected} / ${link.totalPayments}`,
        );

        // Mark all these transactions as processed
        for (const tx of successfulTxs) {
          if (!tx.processedInTotals) {
            tx.processedInTotals = true;
            await tx.save();
            console.log(
              `  - Marked transaction ${tx.internalRef} as processed`,
            );
          }
        }

        fixedCount++;
      }
    }

    console.log(`\n✅ Fix completed: ${fixedCount} links updated`);

    // Check specifically for the sock link
    const sockLink = await PaymentLink.findOne({ linkId: "pay_450ab97024" });
    if (sockLink) {
      console.log(`\n📊 Sock link status:`);
      console.log(`  - Status: ${sockLink.status}`);
      console.log(`  - isPaid: ${sockLink.isPaid}`);
      console.log(`  - totalCollected: ${sockLink.totalCollected}`);
      console.log(`  - totalPayments: ${sockLink.totalPayments}`);
      console.log(`  - paidAt: ${sockLink.paidAt}`);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixTotals();
