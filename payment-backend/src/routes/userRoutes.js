//payment-backend\src\routes\userRoutes.js
import express from "express";
import authMiddleware from "../middleware/auth.js";
import { getMe, updateMe } from "../controllers/userController.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

/* ================================
   Ensure upload folder exists
================================ */
const uploadPath = path.join(process.cwd(), "public/uploads/avatars");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

/* ================================
   Multer configuration
================================ */
const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user.id}-${Date.now()}${ext}`);
  },
});

/* 🔒 Security: image-only upload */
const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
});

/* ================================
   Routes
================================ */
router.get("/me", authMiddleware, getMe);
router.put(
  "/me",
  authMiddleware,
  upload.single("avatar"), // 👈 matches frontend FormData key
  updateMe,
);

export default router;
