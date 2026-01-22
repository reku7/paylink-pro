import express from "express";
import {
  handleSantimPayWebhook,
  handleChapaWebhook,
} from "../controllers/webhookController.js";

const router = express.Router();

router.post("/santimpay", handleSantimPayWebhook);
router
  .route("/chapa")
  .get(handleChapaWebhook) // for GET requests (success redirect)
  .post(handleChapaWebhook); // for POST requests (actual webhook)

export default router;
