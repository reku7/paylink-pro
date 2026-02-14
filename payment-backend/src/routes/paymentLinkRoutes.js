// routes/paymentLinkRoutes.js
import express from "express";
import authMiddleware from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";
import requireRole from "../middleware/roleMiddleware.js";
import {
  createLinkController,
  getAllLinksController,
  getLinkDetailsController,
  archivePaymentLinkController,
  unarchivePaymentLinkController,
  getArchivedLinksController, // Add this import
} from "../controllers/paymentLinkController.js";
import { checkMerchantActive } from "../middleware/checkMerchantActive.js";

const router = express.Router();

// ========== CREATE PAYMENT LINK ==========
router.post(
  "/",
  authMiddleware,
  requireRole([ROLES.MERCHANT_OWNER]),
  checkMerchantActive,
  createLinkController,
);

// ========== GET ACTIVE LINKS ==========
router.get(
  "/",
  authMiddleware,
  requireRole([ROLES.MERCHANT_OWNER]),
  checkMerchantActive,
  getAllLinksController,
);

// ========== GET ARCHIVED LINKS ==========
router.get(
  "/archived",
  authMiddleware,
  requireRole([ROLES.MERCHANT_OWNER]),
  checkMerchantActive,
  getArchivedLinksController,
);

// ========== GET SINGLE LINK DETAILS ==========
router.get(
  "/:linkId",
  authMiddleware,
  requireRole([ROLES.MERCHANT_OWNER]),
  checkMerchantActive,
  getLinkDetailsController,
);

// ========== ARCHIVE LINK ==========
router.patch(
  "/:linkId/archive",
  authMiddleware,
  requireRole([ROLES.MERCHANT_OWNER]),
  checkMerchantActive,
  archivePaymentLinkController,
);

// ========== UNARCHIVE LINK ==========
router.patch(
  "/:linkId/unarchive",
  authMiddleware,
  requireRole([ROLES.MERCHANT_OWNER]),
  checkMerchantActive,
  unarchivePaymentLinkController,
);

export default router;
