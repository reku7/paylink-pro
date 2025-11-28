import express from "express";
import {
  registerMerchant,
  loginMerchant,
} from "../controllers/merchantController.js";

const router = express.Router();

router.post("/register", registerMerchant);
router.post("/login", loginMerchant);

export default router;
