// controllers/publicLink.controller.js
import PaymentLink from "../models/PaymentLink.js";

export async function getPublicPaymentLink(req, res) {
  try {
    const { linkId } = req.params;

    const link = await PaymentLink.findOne({
      linkId,
      isArchived: false,
    }).lean();

    if (!link) {
      return res.status(404).json({
        success: false,
        error: "Payment link not found",
      });
    }

    // Only check real statuses
    if (link.status !== "active") {
      return res.status(400).json({
        success: false,
        error: "Payment link not available",
      });
    }

    // Optional: expiry check (recommended)
    if (link.expiresAt && link.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        error: "Payment link expired",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        linkId: link.linkId,
        title: link.title,
        description: link.description,
        amount: link.amount,
        currency: link.currency,
      },
    });
  } catch (err) {
    console.error("Public link error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch payment link",
    });
  }
}
