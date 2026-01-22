import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  connectChapaGateway,
  disconnectChapa,
} from "../controllers/chapaGateway.controller.js";
import Merchant from "../models/Merchant.js";

const router = express.Router();

// Connect Chapa
router.post("/chapa/connect", authMiddleware, connectChapaGateway);

// Disconnect Chapa
router.post("/chapa/disconnect", authMiddleware, disconnectChapa);

// Get connected gateways
router.get("/", authMiddleware, async (req, res) => {
  try {
    const merchant = await Merchant.findById(req.user.merchantId);
    if (!merchant)
      return res
        .status(404)
        .json({ success: false, error: "Merchant not found" });

    res.json({
      success: true,
      data: {
        santimpay: true,
        chapa: merchant.chapa?.connected === true,
      },
    });
  } catch (err) {
    console.error("Fetch gateways failed:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;
