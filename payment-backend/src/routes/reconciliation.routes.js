// routes/reconciliation.routes.js
import express from "express";
import authMiddleware from "../middleware/auth.js";
import requireRole from "../middleware/roleMiddleware.js";
import { ROLES } from "../constants/roles.js";
import {
  manualReconcile,
  forceSync,
  runReconciliationJob,
} from "../controllers/reconciliation.controller.js";
import { checkMerchantActive } from "../middleware/checkMerchantActive.js";

const router = express.Router();

router.post(
  "/reconcile/:transactionRef",
  authMiddleware,
  requireRole([ROLES.ADMIN, ROLES.MERCHANT_OWNER]),
  checkMerchantActive,
  manualReconcile,
);

router.post(
  "/sync/:transactionRef",
  authMiddleware,
  requireRole([ROLES.ADMIN, ROLES.MERCHANT_OWNER]),
  checkMerchantActive,
  forceSync,
);

// Admin-only → no merchant check needed
router.post(
  "/reconcile-all",
  authMiddleware,
  requireRole([ROLES.ADMIN]),
  runReconciliationJob,
);

export default router;
