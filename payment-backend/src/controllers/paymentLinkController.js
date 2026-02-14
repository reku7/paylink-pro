// controllers/paymentLinkController.js
import {
  createPaymentLink,
  listPaymentLinks,
  getPaymentLinkById,
  listArchivedPaymentLinks,
  getArchivedPaymentLinkById,
} from "../services/link.service.js";
import Merchant from "../models/Merchant.js";
import PaymentLink from "../models/PaymentLink.js";

/** ============================
 * CREATE PAYMENT LINK
 * ============================ */
export const createLinkController = async (req, res) => {
  try {
    const merchantId = req.user.merchantId;
    const { amount, gateway } = req.body;

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    // 🔒 Enforce Chapa connection if requested
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

/** ============================
 * LIST ACTIVE PAYMENT LINKS
 * ============================ */
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

/** ============================
 * GET LINK DETAILS
 * ============================ */
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

/** ============================
 * ARCHIVE PAYMENT LINK
 * ============================ */
// controllers/paymentLinkController.js

export const archivePaymentLinkController = async (req, res) => {
  try {
    const { linkId } = req.params;
    const merchantId = req.user.merchantId;

    // Support either public linkId or MongoDB _id
    const link = await PaymentLink.findOne({
      merchantId,
      isArchived: false, // only active links
      $or: [{ linkId }, { _id: linkId }],
    });

    if (!link) {
      return res.status(404).json({
        error: "Payment link not found or already archived",
      });
    }

    // Prevent archiving a paid one-time link
    if (link.type === "one_time" && link.isPaid) {
      return res.status(400).json({
        error: "Paid one-time links cannot be archived",
      });
    }

    link.isArchived = true;
    link.archivedAt = new Date();
    link.archivedBy = req.user._id;
    link.status = "disabled"; // prevent further payments
    await link.save();

    return res.json({
      success: true,
      message: "Payment link archived successfully",
      data: link,
    });
  } catch (err) {
    console.error("Archive link error:", err);
    return res.status(500).json({ error: "Failed to archive payment link" });
  }
};

/** ============================
 * UNARCHIVE PAYMENT LINK
 * ============================ */
export const unarchivePaymentLinkController = async (req, res) => {
  try {
    const { linkId } = req.params;
    const merchantId = req.user.merchantId;

    // Find archived link by linkId or _id
    const link = await PaymentLink.findOne({
      merchantId,
      isArchived: true,
      $or: [{ linkId }, { _id: linkId }],
    });

    if (!link) {
      return res.status(404).json({
        error: "Archived payment link not found",
      });
    }

    // Only reusable links can be unarchived
    if (link.type === "one_time" && link.isPaid) {
      return res.status(400).json({
        error: "Paid one-time links cannot be unarchived",
      });
    }

    link.isArchived = false;
    link.archivedAt = null;
    link.archivedBy = null;
    link.status = "active"; // re-enable payments
    await link.save();

    return res.json({
      success: true,
      message: "Payment link unarchived successfully",
      data: link,
    });
  } catch (err) {
    console.error("Unarchive link error:", err);
    return res.status(500).json({ error: "Failed to unarchive payment link" });
  }
};

/** ============================
 * LIST ARCHIVED LINKS
 * ============================ */
export const getArchivedLinksController = async (req, res) => {
  try {
    const merchantId = req.user.merchantId;

    const links = await listArchivedPaymentLinks(merchantId);

    return res.status(200).json({
      success: true,
      data: links,
    });
  } catch (err) {
    console.error("Error fetching archived links:", err);
    return res
      .status(500)
      .json({ error: "Failed to fetch archived payment links" });
  }
};
