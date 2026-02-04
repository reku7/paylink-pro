// controllers/adminController.js
import Merchant from "../models/Merchant.js";
import Transaction from "../models/Transaction.js"; // assuming you have a Transaction model
import { encryptSecret } from "../utils/crypto.js";

/* ================= SET/UPDATE CHAPA SECRET ================= */
export async function setChapaSecret(req, res, next) {
  try {
    const { merchantId } = req.params;
    const { chapaSecret } = req.body;

    if (!chapaSecret) {
      return res
        .status(400)
        .json({ success: false, error: "Chapa secret is required" });
    }

    const encrypted = encryptSecret(chapaSecret);

    const result = await Merchant.updateOne(
      { _id: merchantId },
      { $set: { "chapa.secretEncrypted": encrypted } },
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Merchant not found or secret not changed",
      });
    }

    res.json({ success: true, message: "Chapa secret updated successfully" });
  } catch (err) {
    next(err);
  }
}

/* ================= GET SINGLE MERCHANT (OPTIONAL: INCLUDE TRANSACTIONS) ================= */
export async function getSingleMerchant(req, res, next) {
  try {
    const { merchantId } = req.params;

    const merchant = await Merchant.findById(merchantId).populate(
      "ownerUserId",
      "name email roles",
    ); // Include owner info

    if (!merchant) {
      return res
        .status(404)
        .json({ success: false, error: "Merchant not found" });
    }

    let transactions = [];
    if (req.query.includeTransactions === "true") {
      transactions = await Transaction.find({ merchantId }).sort({
        createdAt: -1,
      });
    }

    res.json({ success: true, data: { merchant, transactions } });
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
