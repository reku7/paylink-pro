//src\routes\paymentLinkRoutes.js
import express from "express";
import authMiddleware from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";
import requireRole from "../middleware/roleMiddleware.js";
import {
  createLinkController,
  getAllLinksController,
  getLinkDetailsController,
} from "../controllers/paymentLinkController.js";
import { checkMerchantActive } from "../middleware/checkMerchantActive.js";

const router = express.Router();
// routes/paymentLinkRoutes.js

router.post(
  "/",
  authMiddleware,
  requireRole([ROLES.MERCHANT_OWNER]),
  checkMerchantActive,
  createLinkController,
);

router.get(
  "/",
  authMiddleware,
  requireRole([ROLES.MERCHANT_OWNER]),
  checkMerchantActive,
  getAllLinksController,
);

router.get(
  "/:linkId",
  authMiddleware,
  requireRole([ROLES.MERCHANT_OWNER]),
  checkMerchantActive,
  getLinkDetailsController,
);

export default router;
