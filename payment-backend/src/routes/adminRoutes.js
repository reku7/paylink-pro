import express from "express";
import { ROLES } from "../constants/roles.js";
import requireRole from "../middleware/roleMiddleware.js";
import authMiddleware from "../middleware/auth.js";
import {
  getSingleMerchant,
  getAllMerchants,
  setChapaSecret,
  updateMerchantStatus,
  disconnectChapa,
} from "../controllers/adminController.js";

const router = express.Router();

router.get(
  "/merchants/:merchantId",
  authMiddleware,
  requireRole([ROLES.ADMIN]),
  getSingleMerchant,
);
router.get(
  "/merchants",
  authMiddleware,
  requireRole([ROLES.ADMIN]),
  getAllMerchants,
);

router.post(
  "/merchants/:merchantId/chapa-secret",
  authMiddleware,
  requireRole([ROLES.ADMIN]),
  setChapaSecret,
);

router.patch(
  "/merchants/:merchantId",
  authMiddleware,
  requireRole([ROLES.ADMIN]),
  updateMerchantStatus,
);

router.post(
  "/merchants/:merchantId/disconnect-chapa",
  authMiddleware,
  requireRole([ROLES.ADMIN]),
  disconnectChapa,
);

export default router;
