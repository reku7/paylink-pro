import express from "express";
import authMiddleware from "../middleware/auth.js";
import { getMe } from "../controllers/userController.js";

const router = express.Router();

router.get("/me", authMiddleware, getMe);
router.put("/me", authMiddleware, updateMe);

export default router;
