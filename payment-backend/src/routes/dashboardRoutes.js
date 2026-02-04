// src/routes/dashboardRoutes.js
import express from "express";
import authMiddleware from "../middleware/auth.js";
import requireRole from "../middleware/roleMiddleware.js";
import { ROLES } from "../constants/roles.js";
import {
  dashboardSummary,
  revenueStats,
  merchantTransactions,
  linkPerformance,
  gatewayStatus,
} from "../controllers/dashboardController.js";
import { checkMerchantActive } from "../middleware/checkMerchantActive.js";

const router = express.Router();

// ✅ These routes should be prefixed with /dashboard
// So: GET /api/dashboard/summary

router.get(
  "/summary",
  authMiddleware,
  requireRole([ROLES.MERCHANT_OWNER]),
  checkMerchantActive,
  dashboardSummary,
);

router.get(
  "/revenue",
  authMiddleware,
  requireRole([ROLES.MERCHANT_OWNER]),
  checkMerchantActive,
  revenueStats,
);

router.get(
  "/transactions",
  authMiddleware,
  requireRole([ROLES.MERCHANT_OWNER]),
  checkMerchantActive,
  merchantTransactions,
);

router.get(
  "/links/performance",
  authMiddleware,
  requireRole([ROLES.MERCHANT_OWNER]),
  checkMerchantActive,
  linkPerformance,
);

router.get(
  "/gateway-status",
  authMiddleware,
  requireRole([ROLES.MERCHANT_OWNER]),
  checkMerchantActive,
  gatewayStatus,
);

export default router;
