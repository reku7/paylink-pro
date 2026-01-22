import Merchant from "../models/Merchant.js";
import { encryptSecret } from "../utils/crypto.js";
import bcrypt from "bcryptjs";

// Connect Chapa
export async function connectChapaGateway(req, res) {
  try {
    const { apiKey } = req.body;
    if (!apiKey) return res.status(400).json({ error: "API key is required" });

    const webhookUrl = `${process.env.WEBHOOK_BASE_URL}/api/webhooks/chapa`;
    const webhookSecret = process.env.CHAPA_WEBHOOK_SECRET;
    if (!webhookUrl || !webhookSecret)
      return res.status(500).json({ error: "Webhook not configured" });

    const hashedWebhookSecret = await bcrypt.hash(webhookSecret, 10);

    await Merchant.updateOne(
      { _id: req.user.merchantId },
      {
        $set: {
          "chapa.connected": true, // ✅ REQUIRED
          "chapa.secretEncrypted": encryptSecret(apiKey),
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

// Disconnect Chapa
export async function disconnectChapa(req, res) {
  try {
    if (!req.user)
      return res.status(401).json({ success: false, error: "Unauthorized" });

    const merchant = await Merchant.findById(req.user.merchantId);
    if (!merchant)
      return res
        .status(404)
        .json({ success: false, error: "Merchant not found" });

    // safely remove Chapa credentials
    merchant.chapa.connected = false;
    merchant.chapa.secretEncrypted = {
      iv: null,
      content: null,
      tag: null,
    };
    merchant.preferredGateway = "santimpay";
    await merchant.save();

    // reset default gateway
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
