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

const router = express.Router();

// ✅ These routes should be prefixed with /dashboard
// So: GET /api/dashboard/summary
router.get(
  "/summary",
  authMiddleware,
  requireRole([ROLES.MERCHANT_OWNER]),
  dashboardSummary,
);

// GET /api/dashboard/revenue
router.get(
  "/revenue",
  authMiddleware,
  requireRole([ROLES.MERCHANT_OWNER]),
  revenueStats,
);

// GET /api/dashboard/transactions
router.get(
  "/transactions",
  authMiddleware,
  requireRole([ROLES.MERCHANT_OWNER]),
  merchantTransactions,
);

// GET /api/dashboard/links/performance
router.get(
  "/links/performance",
  authMiddleware,
  requireRole([ROLES.MERCHANT_OWNER]),
  linkPerformance,
);

// GET /api/dashboard/gateway-status
router.get(
  "/gateway-status",
  authMiddleware,
  requireRole([ROLES.MERCHANT_OWNER]),
  gatewayStatus,
);

export default router;
