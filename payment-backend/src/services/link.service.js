import mongoose from "mongoose";
import crypto from "crypto";
import PaymentLink from "../models/PaymentLink.js";
import Merchant from "../models/Merchant.js";

/** Generate secure linkId */
function generateLinkId() {
  return "pay_" + crypto.randomBytes(5).toString("hex");
}

/** Generate a unique slug for reusable links */
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

/** Create a new payment link */
export async function createPaymentLink(merchantId, data) {
  if (!data.amount || data.amount <= 0)
    throw new Error("Invalid payment amount");

  const merchant = await Merchant.findById(merchantId);
  if (!merchant) throw new Error("Merchant not found");

  const type = data.type || "one_time";
  const gateway = data.gateway || merchant.preferredGateway || "santimpay";

  let slug;
  if (type === "reusable") {
    slug = data.slug
      ? data.slug.toLowerCase().trim()
      : await generateUniqueSlug(data.title || "payment", merchantId);

    // Reuse existing active reusable link
    const existing = await PaymentLink.findOne({
      merchantId,
      slug,
      type: "reusable",
      status: "active",
      isArchived: false,
    });
    if (existing) return existing;
  }

  return PaymentLink.create({
    merchantId,
    linkId: generateLinkId(),
    ...(slug && { slug }), // only include slug if exists
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

/** List active payment links */
export function listPaymentLinks(merchantId) {
  return PaymentLink.aggregate([
    {
      $match: {
        merchantId: new mongoose.Types.ObjectId(merchantId),
        status: "active",
        isArchived: false,
        $or: [{ type: "reusable" }, { expiresAt: { $gt: new Date() } }],
      },
    },
    {
      $lookup: {
        from: "transactions",
        localField: "transactions",
        foreignField: "_id",
        as: "txs",
      },
    },
    {
      $addFields: {
        transactions: "$txs", // 🔥 THIS LINE FIXES EVERYTHING
      },
    },
    { $sort: { createdAt: -1 } },
  ]);
}

/** Get a single active link by linkId */
export function getPaymentLinkById(linkId) {
  return PaymentLink.findOne({
    linkId,
    status: "active",
    isArchived: false,
    $or: [{ type: "reusable" }, { expiresAt: { $gt: new Date() } }],
  }).populate("transactions");
}
