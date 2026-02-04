// middleware/checkMerchantActive.js
import Merchant from "../models/Merchant.js";

export async function checkMerchantActive(req, res, next) {
  const merchantId = req.user?.merchantId; // depends on your auth setup
  if (!merchantId) return res.status(403).json({ error: "No merchant linked" });

  const merchant = await Merchant.findById(merchantId);
  if (!merchant) return res.status(404).json({ error: "Merchant not found" });

  if (merchant.status !== "active") {
    return res.status(403).json({
      error: `Merchant is ${merchant.status} and cannot perform this action.`,
    });
  }

  next();
}
