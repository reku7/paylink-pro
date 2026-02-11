//payment-backend\src\routes\webhookRoutes.js
import express from "express";
import {
  handleSantimPayWebhook,
  handleChapaWebhook,
} from "../controllers/webhookController.js";

const router = express.Router();

router.post("/santimpay", handleSantimPayWebhook);
router.post("/chapa", handleChapaWebhook); // for POST requests (actual webhook)

export default router;
