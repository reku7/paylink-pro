import PaymentLink from "../models/PaymentLink.js";

export async function getPublicPaymentLink(req, res) {
  try {
    const { linkId } = req.params;

    // Fetch the link first
    const link = await PaymentLink.findOne({
      linkId,
      isArchived: false,
    }).populate("transactions");

    if (!link) {
      return res.status(404).json({
        success: false,
        error: "Payment link not found",
      });
    }

    if (link.status !== "active") {
      return res.status(400).json({
        success: false,
        error: "Payment link not available",
      });
    }

    // Optional: expiry check
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
        type: link.type,
        gateway: link.gateway,
        customerName: link.customerName,
        customerEmail: link.customerEmail,
        customerPhone: link.customerPhone,
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
