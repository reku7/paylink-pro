import crypto from "crypto";
import bcrypt from "bcryptjs";
import axios from "axios";
import Merchant from "../models/Merchant.js";
import { encryptSecret } from "../utils/crypto.js";

// Optional: verify API key with Chapa
async function verifyChapaApiKey(apiKey) {
  try {
    const res = await axios.get("https://api.chapa.co/v1/banks", {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: 5000,
    });
    return res.status === 200;
  } catch (err) {
    console.error("Chapa API key verification failed:", err.message);
    return false;
  }
}

export async function connectChapaGateway(req, res) {
  try {
    const { apiKey } = req.body;
    if (!apiKey) return res.status(400).json({ error: "API key is required" });

    // 1️⃣ Hash the API key to enforce uniqueness
    const apiKeyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

    // 2️⃣ Check if any other merchant is already using this key
    const existing = await Merchant.findOne({
      "chapa.apiKeyHash": apiKeyHash,
      _id: { $ne: req.user.merchantId },
    });
    if (existing) {
      return res.status(409).json({
        error: "This Chapa API key is already connected to another merchant",
      });
    }

    // 3️⃣ Optional: verify API key with Chapa
    const isValid = await verifyChapaApiKey(apiKey);
    if (!isValid) {
      return res.status(400).json({ error: "Invalid Chapa API key" });
    }

    // 4️⃣ Prepare webhook info
    const webhookUrl = `${process.env.WEBHOOK_BASE_URL}/api/webhooks/chapa`;
    const hashedWebhookSecret = await bcrypt.hash(
      process.env.CHAPA_WEBHOOK_SECRET,
      10,
    );

    // 5️⃣ Save encrypted API key + hash + webhook info
    await Merchant.updateOne(
      { _id: req.user.merchantId },
      {
        $set: {
          "chapa.connected": true,
          "chapa.secretEncrypted": encryptSecret(apiKey),
          "chapa.apiKeyHash": apiKeyHash,
          webhookUrl,
          webhookSecretHash: hashedWebhookSecret,
          preferredGateway: "chapa",
          updatedAt: new Date(),
        },
      },
    );

    return res.json({ success: true, message: "Chapa connected successfully" });
  } catch (err) {
    console.error("Chapa connect error:", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function disconnectChapa(req, res) {
  try {
    if (!req.user)
      return res.status(401).json({ success: false, error: "Unauthorized" });

    const merchant = await Merchant.findById(req.user.merchantId);
    if (!merchant)
      return res
        .status(404)
        .json({ success: false, error: "Merchant not found" });

    // Remove Chapa credentials safely
    merchant.chapa.connected = false;
    merchant.chapa.secretEncrypted = { iv: null, content: null, tag: null };
    merchant.chapa.apiKeyHash = null;
    merchant.preferredGateway = "santimpay";
    await merchant.save();

    return res.json({
      success: true,
      message: "Chapa disconnected successfully",
    });
  } catch (err) {
    console.error("Disconnect Chapa failed:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
