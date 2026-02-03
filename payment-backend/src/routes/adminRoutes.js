import express from "express";
import { ROLES } from "../constants/roles.js";
import requireRole from "../middleware/roleMiddleware.js";
import authMiddleware from "../middleware/auth.js";
import {
  getSingleMerchant,
  getAllMerchants,
  setChapaSecret,
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

export default router;
