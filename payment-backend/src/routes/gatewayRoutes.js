import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  connectChapaGateway,
  disconnectChapa,
} from "../controllers/chapaGateway.controller.js";
import Merchant from "../models/Merchant.js";
import { checkMerchantActive } from "../middleware/checkMerchantActive.js";

const router = express.Router();

// Connect Chapa

router.post(
  "/chapa/connect",
  authMiddleware,
  checkMerchantActive,
  connectChapaGateway,
);

router.post(
  "/chapa/disconnect",
  authMiddleware,
  checkMerchantActive,
  disconnectChapa,
);

router.get("/", authMiddleware, checkMerchantActive, async (req, res) => {
  const merchant = await Merchant.findById(req.user.merchantId);
  if (!merchant) return res.status(404).json({ error: "Merchant not found" });

  res.json({
    success: true,
    data: {
      santimpay: true,
      chapa: merchant.chapa?.connected === true,
    },
  });
});

export default router;
