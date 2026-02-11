//payment-backend\src\services\link.service.js
import mongoose from "mongoose";
import crypto from "crypto";
import PaymentLink from "../models/PaymentLink.js";
import Merchant from "../models/Merchant.js";

/**
 * Generate secure payment link ID
 * Example: pay_a3f1c9d2e4
 */
function generateLinkId() {
  return "pay_" + crypto.randomBytes(5).toString("hex");
}

/**
 * Generate slug from title
 */
async function generateUniqueSlug(title, merchantId) {
  let slug;
  let exists = true;

  while (exists) {
    slug =
      title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      crypto.randomBytes(2).toString("hex");

    exists = await PaymentLink.findOne({ slug, merchantId });
  }

  return slug;
}

/**
 * Create a new payment link
 */
export async function createPaymentLink(merchantId, data) {
  if (!data.amount || data.amount <= 0)
    throw new Error("Invalid payment amount");

  const merchant = await Merchant.findById(merchantId);
  if (!merchant) throw new Error("Merchant not found");

  const type = data.type || "one_time";
  const gateway = data.gateway || merchant.preferredGateway || "santimpay";

  let slug = null;
  if (type === "reusable") {
    slug = data.slug
      ? data.slug.toLowerCase().trim()
      : await generateUniqueSlug(data.title || "payment", merchantId);

    // Reuse existing reusable link
    const existing = await PaymentLink.findOne({
      merchantId,
      slug,
      type: "reusable",
      status: "active",
    });
    if (existing) return existing;
  }

  return PaymentLink.create({
    merchantId,
    linkId: generateLinkId(),
    slug,
    title: data.title || "",
    description: data.description || "",
    amount: data.amount,
    currency: data.currency || "ETB",
    type,
    gateway,
    customerName: data.customerName || "",
    customerEmail: data.customerEmail || "",
    customerPhone: data.customerPhone || "",
    successUrl: data.successUrl || process.env.DEFAULT_SUCCESS_URL || "",
    cancelUrl: data.cancelUrl || process.env.DEFAULT_CANCEL_URL || "",
    failureUrl: data.failureUrl || process.env.DEFAULT_FAILURE_URL || "",
    metadata: data.metadata || {},
    status: "active",
    expiresAt:
      type === "one_time" ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
  });
}

/**
 * List active payment links for a merchant (with transaction count)
 */
export function listPaymentLinks(merchantId) {
  return PaymentLink.aggregate([
    {
      $match: {
        merchantId: mongoose.Types.ObjectId(merchantId),
        status: "active",
        $or: [{ type: "reusable" }, { expiresAt: { $gt: new Date() } }],
      },
    },
    {
      $addFields: { transactionCount: { $size: "$transactions" } },
    },
    { $sort: { createdAt: -1 } },
  ]);
}

/**
 * Get a single active payment link by linkId
 */
export function getPaymentLinkById(linkId) {
  return PaymentLink.findOne({
    linkId,
    status: "active",
    $or: [{ type: "reusable" }, { expiresAt: { $gt: new Date() } }],
  }).populate("transactions");
}
