import { v4 as uuidv4 } from "uuid";
import paymentLink from "../models/PaymentLink.js";
import Merchant from "../models/Merchant.js";

function generateLinkId() {
  return "pay_" + uuidv4().slice(0, 6);
}

export async function createPaymentLink(merchantId, data) {
  console.log("🔍 DEBUG - Starting createPaymentLink");
  console.log("📦 Request data.gateway:", data.gateway);
  console.log("📦 Full request data:", data);

  const merchant = await Merchant.findById(merchantId);
  console.log("🏪 Merchant preferredGateway:", merchant?.preferredGateway);

  const selectedGateway =
    data.gateway || merchant?.preferredGateway || "santimpay";
  console.log("🎯 Selected gateway:", selectedGateway);

  const linkData = {
    merchantId: merchantId,
    linkId: generateLinkId(),
    amount: data.amount,
    currency: data.currency || "ETB",
    description: data.description || "",
    customerName: data.customerName || "",
    gateway: selectedGateway,
    successUrl: data.successUrl || process.env.DEFAULT_SUCCESS_URL,
    cancelUrl: data.cancelUrl || process.env.DEFAULT_CANCEL_URL,
    failureUrl: data.failureUrl || process.env.DEFAULT_FAILURE_URL,
    metadata: data.metadata || {},
  };

  console.log("📝 Link data being saved:", linkData);

  const link = await paymentLink.create(linkData);
  console.log("✅ Link saved with gateway:", link.gateway);

  return link;
}

export async function listPaymentLinks(merchantId) {
  return paymentLink.find({ merchantId }).sort({ createdAt: -1 });
}

export async function getPaymentLinkById(linkId) {
  return paymentLink.findOne({ linkId });
}
