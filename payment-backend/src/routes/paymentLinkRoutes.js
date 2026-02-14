//src\routes\paymentLinkRoutes.js
import express from "express";
import authMiddleware from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";
import requireRole from "../middleware/roleMiddleware.js";
import {
  createLinkController,
  getAllLinksController,
  getLinkDetailsController,
  archivePaymentLinkController,
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

router.patch(
  "/:linkId/archive",
  authMiddleware,
  requireRole([ROLES.MERCHANT_OWNER]),
  checkMerchantActive,
  archivePaymentLinkController,
);

router.patch(
  "/:linkId/unarchive",
  authMiddleware,
  requireRole([ROLES.MERCHANT_OWNER]),
  checkMerchantActive,
  async (req, res) => {
    const { linkId } = req.params;
    const merchantId = req.user.merchantId;
    const link = await PaymentLink.findOne({
      linkId,
      merchantId,
      isArchived: true,
    });
    if (!link) return res.status(404).json({ error: "Link not found" });

    link.isArchived = false;
    link.status =
      link.isPaid && link.type === "one_time" ? "disabled" : "active";
    await link.save();
    return res.json({ success: true, message: "Link unarchived" });
  },
);

export default router;
