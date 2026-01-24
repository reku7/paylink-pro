import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";

// Database and jobs
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

// Middleware
import { errorHandler } from "./middleware/errorHandler.js";
import authMiddleware from "./middleware/auth.js";
import requireRole from "./middleware/roleMiddleware.js";
import { ROLES } from "./constants/roles.js";

const app = express();

// ========== MIDDLEWARE ==========
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like Postman)
      if (!origin) return callback(null, true);

      // allow localhost
      if (origin === "http://localhost:5173") {
        return callback(null, true);
      }

      // allow ANY Vercel preview + prod
      if (origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
s;

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString(); // For webhook verification
    },
  }),
);

app.use(morgan("dev"));
app.use(helmet());

// ========== ROUTES ==========

// Public routes
app.use("/api/auth", authRoutes);
app.use("/api", publicLinkRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api", publicPaymentRoutes);

// Debug routes
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

// Protected routes
app.use("/api/gateways", gatewayRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api/links", paymentLinkRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);

// User info endpoint
app.get("/api/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// Admin test endpoint
app.get(
  "/api/admin/test",
  authMiddleware,
  requireRole([ROLES.ADMIN]),
  (req, res) => {
    res.json({ message: "Admin access confirmed" });
  },
);

// Transaction status check
app.get(
  "/api/payments/status/:transactionRef",
  authMiddleware,
  async (req, res) => {
    try {
      const Transaction = (await import("./models/Transaction.js")).default;
      const { transactionRef } = req.params;

      const transaction = await Transaction.findOne({
        $or: [{ internalRef: transactionRef }, { linkId: transactionRef }],
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found",
        });
      }

      res.json({
        success: true,
        data: {
          id: transaction._id,
          amount: transaction.amount,
          currency: transaction.currency,
          status: transaction.status,
          gateway: transaction.gateway,
          paidAt: transaction.paidAt,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
);

// ========== ERROR HANDLING ==========
app.use(errorHandler);

// ========== VALIDATE ENVIRONMENT ==========
const requiredEnvVars = [
  "JWT_SECRET",
  "MERCHANT_SECRET_ENCRYPTION_KEY",
  "DEFAULT_NOTIFY_URL",
  "SANTIMPAY_MERCHANT_ID",
  "SANTIMPAY_PRIVATE_KEY",
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error("❌ Missing required environment variables:", missingVars);
  process.exit(1);
}

// ========== START SERVER ==========
connectDB();
startReconciliationJob();

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Backend is running");
});

// 2️⃣ Chapa webhook route (FIXES your error)
app.post("/api/webhooks/chapa", (req, res) => {
  console.log("✅ CHAPA WEBHOOK RECEIVED");
  console.log(req.body);
  res.status(200).json({ received: true });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? "✅" : "❌"}`);
  console.log(
    `💰 SantimPay: ${process.env.SANTIMPAY_MERCHANT_ID ? "✅" : "❌"}`,
  );
  console.log(`🌐 Frontend: http://localhost:5173`);
});
