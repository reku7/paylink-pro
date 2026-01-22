import express from "express";
import authMiddleware from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";
import requireRole from "../middleware/roleMiddleware.js";
import {
  createLinkController,
  getAllLinksController,
  getLinkDetailsController,
} from "../controllers/paymentLinkController.js";

const router = express.Router();
// routes/paymentLinkRoutes.js

router.get("/public/:linkId", getLinkDetailsController);

router.post(
  "/",
  authMiddleware,
  requireRole([ROLES.MERCHANT_OWNER]),
  createLinkController
);

router.get(
  "/",
  authMiddleware,
  requireRole([ROLES.MERCHANT_OWNER]),
  getAllLinksController
);

router.get(
  "/:linkId",
  authMiddleware,
  requireRole([ROLES.MERCHANT_OWNER]),
  getLinkDetailsController
);

export default router;
