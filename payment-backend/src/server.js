import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import path from "path";

import connectDB from "./config/db.js";
import { startReconciliationJob } from "./jobs/reconciliation.job.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import publicLinkRoutes from "./routes/publicLink.routes.js";
import publicPaymentRoutes from "./routes/publicPayment.routes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import gatewayRoutes from "./routes/gatewayRoutes.js";
import paymentLinkRoutes from "./routes/paymentLinkRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// Middleware
import { errorHandler } from "./middleware/errorHandler.js";
import authMiddleware from "./middleware/auth.js";
import requireRole from "./middleware/roleMiddleware.js";
import { ROLES } from "./constants/roles.js";

const app = express();

app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));

/* =======================
   CORS
======================= */
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (
        origin === "http://localhost:5173" ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "cache-control",
      "pragma",
      "expires",
    ],
  }),
);

// Explicitly handle preflight
app.options(/.*/, cors());

/* =======================
   BODY PARSING
======================= */
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString(); // required for webhook verification
    },
  }),
);

app.use(morgan("dev"));
app.use(helmet());

/* =======================
   ROUTES
======================= */

// Public
app.use("/api/auth", authRoutes);
app.use("/api", publicLinkRoutes);
app.use("/api", publicPaymentRoutes);

// Webhooks (ONLY place webhooks live)
app.use("/api/webhooks", webhookRoutes);

// Health & debug
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

app.get("/api/config-check", (req, res) => {
  res.json({
    santimPay: !!process.env.SANTIMPAY_MERCHANT_ID,
    jwt: !!process.env.JWT_SECRET,
    webhook: !!process.env.WEBHOOK_BASE_URL,
  });
});

// Protected
app.use("/api/gateways", gatewayRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/links", paymentLinkRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);

// User info
app.use("/api", userRoutes);

// Admin test
app.get(
  "/api/admin/test",
  authMiddleware,
  requireRole([ROLES.ADMIN]),
  (req, res) => {
    res.json({ message: "Admin access confirmed" });
  },
);

/* =======================
   ERROR HANDLING
======================= */
app.use(errorHandler);

/* =======================
   ENV VALIDATION
======================= */
const requiredEnvVars = [
  "JWT_SECRET",
  "MERCHANT_SECRET_ENCRYPTION_KEY",
  "DEFAULT_NOTIFY_URL",
  "SANTIMPAY_MERCHANT_ID",
  "SANTIMPAY_PRIVATE_KEY",
];

const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

if (missingVars.length) {
  console.error("❌ Missing environment variables:", missingVars);
  process.exit(1);
}

/* =======================
   START SERVER
======================= */
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();
    startReconciliationJob();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? "✅" : "❌"}`);
      console.log(
        `💰 SantimPay: ${process.env.SANTIMPAY_MERCHANT_ID ? "✅" : "❌"}`,
      );
    });
  } catch (err) {
    console.error("❌ Server startup failed:", err);
    process.exit(1);
  }
})();
