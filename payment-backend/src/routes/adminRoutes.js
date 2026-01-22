import express from "express";
import { ROLES } from "../constants/roles.js";
import requireRole from "../middleware/roleMiddleware.js";
import authMiddleware from "../middleware/auth.js";
import {
  getAllMerchants,
  setChapaSecret,
} from "../controllers/adminController.js";

const router = express.Router();

router.get(
  "/admin/merchants",
  authMiddleware,
  requireRole([ROLES.ADMIN]),
  getAllMerchants
);

router.post(
  "/admin/merchants/:merchantId/chapa-secret",
  authMiddleware,
  requireRole([ROLES.ADMIN]),
  setChapaSecret
);

export default router;
