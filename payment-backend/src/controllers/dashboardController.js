import {
  getDashboardSummary,
  getRevenueStats,
  getMerchantTransactions,
  getLinkPerformance,
  getGatewayStatus,
} from "../services/dashboard.service.js";

export async function dashboardSummary(req, res) {
  try {
    const merchantId = req.user.merchantId;
    const { startDate, endDate } = req.query;

    const summary = await getDashboardSummary(merchantId, {
      start: startDate ? new Date(startDate) : null,
      end: endDate ? new Date(endDate) : null,
    });

    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function revenueStats(req, res) {
  try {
    const merchantId = req.user.merchantId;
    const { from, to, group = "day" } = req.query;
    if (!from || !to) {
      return res.status(400).json({ error: "from and to dates required" });
    }

    const data = await getRevenueStats(merchantId, {
      from: new Date(from),
      to: new Date(to),
      group,
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function merchantTransactions(req, res) {
  try {
    const merchantId = req.user.merchantId;
    const { page, limit, status } = req.query;

    const result = await getMerchantTransactions(merchantId, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status,
    });

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function linkPerformance(req, res) {
  try {
    const merchantId = req.user.merchantId;

    const data = await getLinkPerformance(merchantId);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function gatewayStatus(req, res) {
  try {
    const data = await getGatewayStatus();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
