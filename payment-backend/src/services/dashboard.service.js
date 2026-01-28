// services/dashboard.service.js

import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import PaymentLink from "../models/PaymentLink.js";
import Merchant from "../models/Merchant.js";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function toObjectId(id) {
  return typeof id === "string" ? new mongoose.Types.ObjectId(id) : id;
}

/* -------------------------------------------------------------------------- */
/* Dashboard Summary                                                           */
/* -------------------------------------------------------------------------- */

export async function getDashboardSummary(merchantId, { start, end } = {}) {
  const merchantObjectId = toObjectId(merchantId);

  const match = {
    merchantId: merchantObjectId,
    ...(start && end ? { createdAt: { $gte: start, $lte: end } } : {}),
  };

  const [txStats, linkStats] = await Promise.all([
    Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          amount: { $sum: "$amount" },
        },
      },
    ]),

    PaymentLink.aggregate([
      { $match: { merchantId: merchantObjectId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const summary = {
    totalRevenue: 0,
    successfulCount: 0,
    failedCount: 0,
    processingCount: 0,
    pendingCount: 0,

    totalLinks: 0,
    activeLinks: 0,
    paidLinks: 0,
    expiredLinks: 0,
    failedLinks: 0,
  };

  for (const row of txStats) {
    switch (row._id) {
      case "success":
        summary.successfulCount = row.count;
        summary.totalRevenue += row.amount || 0;
        break;
      case "failed":
        summary.failedCount = row.count;
        break;
      case "processing":
        summary.processingCount = row.count;
        break;
      case "initialized":
        summary.pendingCount = row.count;
        break;
    }
  }

  for (const row of linkStats) {
    summary.totalLinks += row.count;

    switch (row._id) {
      case "paid":
        summary.paidLinks = row.count;
        break;
      case "pending":
        summary.activeLinks = row.count;
        break;
      case "expired":
        summary.expiredLinks = row.count;
        break;
      case "failed":
        summary.failedLinks = row.count;
        break;
    }
  }

  return summary;
}

/* -------------------------------------------------------------------------- */
/* Revenue Stats                                                               */
/* -------------------------------------------------------------------------- */

export async function getRevenueStats(
  merchantId,
  { from, to, group = "day" } = {},
) {
  const merchantObjectId = toObjectId(merchantId);

  const groupBy =
    group === "month"
      ? { $dateToString: { format: "%Y-%m", date: "$paidAt" } }
      : { $dateToString: { format: "%Y-%m-%d", date: "$paidAt" } };

  return Transaction.aggregate([
    {
      $match: {
        merchantId: merchantObjectId,
        status: "success",
        ...(from || to
          ? {
              paidAt: {
                ...(from ? { $gte: from } : {}),
                ...(to ? { $lte: to } : {}),
              },
            }
          : {}),
      },
    },
    {
      $group: {
        _id: groupBy,
        revenue: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

/* -------------------------------------------------------------------------- */
/* Merchant Transactions                                                       */
/* -------------------------------------------------------------------------- */

export async function getMerchantTransactions(
  merchantId,
  { page = 1, limit = 20, status } = {},
) {
  const query = {
    merchantId: toObjectId(merchantId),
    ...(status ? { status } : {}),
  };

  const [transactions, total] = await Promise.all([
    Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Transaction.countDocuments(query),
  ]);

  return {
    data: transactions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Link Performance                                                            */
/* -------------------------------------------------------------------------- */

export async function getLinkPerformance(merchantId) {
  return PaymentLink.aggregate([
    { $match: { merchantId: toObjectId(merchantId) } },
    {
      $lookup: {
        from: "transactions",
        localField: "transactions", // ensure this matches your schema
        foreignField: "_id",
        as: "txs",
      },
    },
    {
      $project: {
        linkId: 1,
        title: 1,
        status: 1,
        totalRevenue: {
          $sum: {
            $map: {
              input: "$txs",
              as: "tx",
              in: {
                $cond: [{ $eq: ["$$tx.status", "success"] }, "$$tx.amount", 0],
              },
            },
          },
        },
      },
    },
  ]);
}

/* -------------------------------------------------------------------------- */
/* Gateway Status                                                              */
/* -------------------------------------------------------------------------- */

export async function getGatewayStatus(merchantId) {
  const merchant = await Merchant.findById(merchantId).lean();

  if (!merchant) {
    return {
      santimpay: { status: "down", message: "Merchant not found" },
      chapa: { status: "down", message: "Merchant not found" },
    };
  }

  return {
    santimpay: {
      status: merchant.santimpay?.connected ? "operational" : "degraded",
      message: merchant.santimpay?.connected
        ? "SantimPay is connected and ready"
        : "SantimPay not fully configured",
    },
    chapa: {
      status: merchant.chapa?.connected ? "operational" : "degraded",
      message: merchant.chapa?.connected
        ? "Chapa is connected and ready"
        : "Chapa not fully configured",
    },
  };
}
