import { ROLES } from "../constants/roles.js";
import requireRole from "../middleware/roleMiddleware.js";
import auth from "../middleware/auth.js";

router.get(
  "/admin/merchants",
  auth,
  requireRole([ROLES.ADMIN]),
  getAllMerchants
);
