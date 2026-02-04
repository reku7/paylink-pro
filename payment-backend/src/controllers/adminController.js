// controllers/adminController.js
import mongoose from "mongoose";
import Merchant from "../models/Merchant.js";
import Transaction from "../models/Transaction.js";
import { encryptSecret } from "../utils/crypto.js";

/* ================= SET / UPDATE CHAPA SECRET ================= */
export async function setChapaSecret(req, res, next) {
  try {
    const { merchantId } = req.params;
    const { chapaSecret } = req.body;

    if (!chapaSecret) {
      return res
        .status(400)
        .json({ success: false, error: "Chapa secret is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(merchantId)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid merchant ID" });
    }

    const encrypted = encryptSecret(chapaSecret);

    const result = await Merchant.updateOne(
      { _id: merchantId },
      { $set: { "chapa.secretEncrypted": encrypted } },
    );

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Merchant not found" });
    }

    res.json({ success: true, message: "Chapa secret updated successfully" });
  } catch (err) {
    next(err);
  }
}

/* ================= GET SINGLE MERCHANT ================= */
export async function getSingleMerchant(req, res, next) {
  try {
    const { merchantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(merchantId)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid merchant ID" });
    }

    const merchant = await Merchant.findById(merchantId).populate(
      "ownerUserId",
      "name email roles",
    );

    if (!merchant) {
      return res
        .status(404)
        .json({ success: false, error: "Merchant not found" });
    }

    let transactions = [];
    if (req.query.includeTransactions === "true") {
      transactions = await Transaction.find({
        merchantId: new mongoose.Types.ObjectId(merchantId),
      }).sort({ createdAt: -1 });
    }

    res.json({
      success: true,
      data: {
        merchant,
        transactions,
      },
    });
  } catch (err) {
    next(err);
  }
}

/* ================= GET ALL MERCHANTS ================= */
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

/* ================= UPDATE MERCHANT STATUS ================= */
export async function updateMerchantStatus(req, res, next) {
  try {
    const { merchantId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res
        .status(400)
        .json({ success: false, error: "Status is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(merchantId)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid merchant ID" });
    }

    const merchant = await Merchant.findByIdAndUpdate(
      merchantId,
      { status },
      { new: true },
    );

    if (!merchant) {
      return res
        .status(404)
        .json({ success: false, error: "Merchant not found" });
    }

    res.json({ success: true, data: merchant });
  } catch (err) {
    next(err);
  }
}

/* ================= FORCE DISCONNECT CHAPA ================= */
export async function disconnectChapa(req, res, next) {
  try {
    const { merchantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(merchantId)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid merchant ID" });
    }

    const merchant = await Merchant.findByIdAndUpdate(
      merchantId,
      { "chapa.connected": false },
      { new: true },
    );

    if (!merchant) {
      return res
        .status(404)
        .json({ success: false, error: "Merchant not found" });
    }

    res.json({ success: true, data: merchant });
  } catch (err) {
    next(err);
  }
}

/* ================= GET MERCHANT TRANSACTIONS ================= */
export async function getMerchantTransactions(req, res, next) {
  try {
    const { merchantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(merchantId)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid merchant ID" });
    }

    const transactions = await Transaction.find({
      merchantId: new mongoose.Types.ObjectId(merchantId),
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (err) {
    next(err);
  }
}
