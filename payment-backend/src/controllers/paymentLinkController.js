// controllers/paymentLinkController.js
import {
  createPaymentLink,
  listPaymentLinks,
  getPaymentLinkById,
} from "../services/link.service.js";
import Merchant from "../models/Merchant.js";

export const createLinkController = async (req, res) => {
  try {
    const merchantId = req.user.merchantId;
    const { amount, gateway } = req.body;

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    // 🔒 ENFORCE CHAPA CONNECTION
    if (gateway === "chapa") {
      const merchant = await Merchant.findById(merchantId);

      if (!merchant?.chapa?.secretEncrypted) {
        return res.status(400).json({
          error: "Chapa is not connected. Please connect Chapa first.",
        });
      }
    }

    const link = await createPaymentLink(merchantId, req.body);

    return res.status(201).json({
      success: true,
      message: "Payment link created successfully",
      data: link,
    });
  } catch (error) {
    console.error("❌ Error creating payment link:", error);
    return res.status(500).json({ error: "Failed to create payment link" });
  }
};

export const getAllLinksController = async (req, res) => {
  try {
    const merchantId = req.user.merchantId;

    const links = await listPaymentLinks(merchantId);

    return res.status(200).json({
      success: true,
      data: links,
    });
  } catch (error) {
    console.error("❌ Error listing links:", error);
    return res.status(500).json({ error: "Failed to list payment links" });
  }
};

export const getLinkDetailsController = async (req, res) => {
  try {
    const { linkId } = req.params;

    const link = await getPaymentLinkById(linkId);

    if (!link) {
      return res.status(404).json({ error: "Payment link not found" });
    }

    return res.status(200).json({
      success: true,
      data: link,
    });
  } catch (error) {
    console.error("❌ Error fetching link details:", error);
    return res.status(500).json({ error: "Failed to fetch payment link" });
  }
};
