import requireRole from "../middleware/roleMiddleware.js";
import authMiddleware from "../middleware/authMiddleware.js";

router.post(
  "/links/create",
  authMiddleware,
  requireRole([ROLES.MERCHANT_OWNER]),
  createLink
);
