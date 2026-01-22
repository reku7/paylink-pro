// routes/publicLink.routes.js
import express from "express";
import { getPublicPaymentLink } from "../controllers/publicLink.controller.js";

const router = express.Router();

router.get("/links/public/:linkId", getPublicPaymentLink);

export default router;
