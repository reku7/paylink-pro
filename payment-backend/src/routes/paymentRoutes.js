import express from "express";
import authMiddleware from "../middleware/auth.js";
import requireRole from "../middleware/roleMiddleware.js";
import { ROLES } from "../constants/roles.js";
import { startPaymentController } from "../controllers/paymentController.js";

const router = express.Router();

/**
 * Start payment for a payment link
 * POST /api/payments/:linkId/start
 */
router.post(
  "/:linkId/start",
  authMiddleware,
  requireRole([ROLES.MERCHANT_OWNER]),
  startPaymentController
);

export default router;
