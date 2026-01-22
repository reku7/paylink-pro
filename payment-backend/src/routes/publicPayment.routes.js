// routes/publicPayment.routes.js
import express from "express";
import { startPublicPaymentController } from "../controllers/publicPayment.controller.js";

const router = express.Router();

router.post("/payments/public/start/:linkId", startPublicPaymentController);

export default router;
