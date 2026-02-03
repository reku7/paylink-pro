import Merchant from "../models/Merchant.js";
import { encryptSecret } from "../utils/crypto.js";
import User from "../models/User.js";

/**
 * POST /api/admin/merchants/:merchantId/chapa-secret
 * Admin-only: set/update a merchant's Chapa secret
 */
export async function setChapaSecret(req, res, next) {
  try {
    const { merchantId } = req.params;
    const { chapaSecret } = req.body;

    if (!chapaSecret) {
      return res.status(400).json({ error: "Chapa secret is required" });
    }

    const encrypted = encryptSecret(chapaSecret);

    const result = await Merchant.updateOne(
      { _id: merchantId },
      { $set: { "chapa.secretEncrypted": encrypted } },
    );

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ error: "Merchant not found or secret not changed" });
    }

    res.json({ success: true, message: "Chapa secret updated successfully" });
  } catch (err) {
    next(err);
  }
}

// Get single merchant by ID
export async function getSingleMerchant(req, res, next) {
  try {
    const { merchantId } = req.params;

    const merchant = await Merchant.findById(merchantId).populate(
      "ownerUserId",
      "name email roles",
    ); // include owner info

    if (!merchant) {
      return res.status(404).json({ message: "Merchant not found" });
    }

    res.json({ success: true, data: merchant });
  } catch (err) {
    next(err);
  }
}

export async function getAllMerchants(req, res, next) {
  try {
    const merchants = await Merchant.find()
      .populate("ownerUserId", "name email roles")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: merchants.length,
      data: merchants,
    });
  } catch (err) {
    next(err);
  }
}
