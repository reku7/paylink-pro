// src/services/gatewayContext.service.js
import Merchant from "../models/Merchant.js";
import { decryptSecret } from "../utils/crypto.js";

export async function buildGatewayContext(merchantId, gatewayName) {
  const context = {};

  if (gatewayName === "chapa") {
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) throw new Error("Merchant not found");

    if (!merchant.chapa?.secretEncrypted) {
      throw new Error("Chapa secret not configured for merchant");
    }

    context.chapaSecret = decryptSecret(merchant.chapa.secretEncrypted);
  }

  return context;
}
