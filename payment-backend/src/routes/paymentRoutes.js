//src\routes\paymentRoutes.js
import express from "express";
import authMiddleware from "../middleware/auth.js";
import requireRole from "../middleware/roleMiddleware.js";
import { ROLES } from "../constants/roles.js";
import { startPaymentController } from "../controllers/paymentController.js";
import { checkMerchantActive } from "../middleware/checkMerchantActive.js";

const router = express.Router();

router.post(
  "/:linkId/start",
  authMiddleware,
  requireRole([ROLES.MERCHANT_OWNER]),
  checkMerchantActive,
  startPaymentController,
);

export default router;
