import mongoose from "mongoose";
import crypto from "crypto";
import PaymentLink from "../models/PaymentLink.js";
import Merchant from "../models/Merchant.js";

/** Generate a secure linkId */
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
    ...(slug ? { slug } : {}),
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
    isArchived: false,
    archivedAt: null,
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
    { $addFields: { transactions: "$txs" } },
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

/** Archive a link (for one-time after payment or manual) */
export async function archivePaymentLink(linkId) {
  const link = await PaymentLink.findOne({ linkId });
  if (!link) throw new Error("Link not found");

  link.isArchived = true;
  link.status = "disabled";
  link.archivedAt = new Date();
  await link.save();

  return link;
}

/** Unarchive reusable links */
export async function unarchivePaymentLink(linkId, merchantId) {
  const link = await PaymentLink.findOne({
    linkId,
    merchantId,
    isArchived: true,
  });

  if (!link) throw new Error("Archived link not found");
  if (link.type !== "reusable")
    throw new Error("Only reusable links can be unarchived");

  link.isArchived = false;
  link.status = "active";
  link.archivedAt = null;
  await link.save();

  return link;
}

/** Mark one-time link as paid and archive it automatically */
export async function markOneTimeLinkPaid(linkId, transactionId) {
  const link = await PaymentLink.findOne({
    linkId,
    type: "one_time",
    isArchived: false,
  });
  if (!link) throw new Error("Link not found or already paid");

  // Attach transaction
  link.transactions.push(transactionId);

  // Auto-archive one-time link
  link.isArchived = true;
  link.status = "disabled";
  link.archivedAt = new Date();

  await link.save();
  return link;
}

/** List archived links */
export function listArchivedPaymentLinks(merchantId) {
  return PaymentLink.aggregate([
    {
      $match: {
        merchantId: new mongoose.Types.ObjectId(merchantId),
        isArchived: true,
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
    { $addFields: { transactions: "$txs" } },
    { $sort: { archivedAt: -1 } },
  ]);
}
