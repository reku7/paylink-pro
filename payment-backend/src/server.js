import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import morgan from "morgan";
import helmet from "helmet";
import connectDB from "./config/db.js";
// import merchantRoutes from "./routes/merchantRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authMiddleware from "./middleware/auth.js";
import requireRole from "./middleware/roleMiddleware.js";

console.log("ENV TEST => JWT_SECRET:", process.env.JWT_SECRET);

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(helmet());
// app.use("/api/merchant", merchantRoutes);
app.use("/api/auth", authRoutes);
app.get("/api/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});
app.get(
  "/api/admin/test",
  authMiddleware,
  requireRole(["merchant_owner"]),
  (req, res) => {
    res.json({ message: "Admin access confirmed" });
  }
);
app.use(errorHandler); // must be last

connectDB();

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log("server is running");
});
