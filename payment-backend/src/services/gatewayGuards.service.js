//payment-backend\src\services\gatewayGuards.service.js
import Merchant from "../models/Merchant.js";
import { GATEWAYS } from "../constants/gateways.js";

export async function assertGatewayReady(merchantId, gateway) {
  const merchant = await Merchant.findById(merchantId).lean();
  if (!merchant) {
    throw new Error("Merchant not found");
  }

  if (gateway === GATEWAYS.CHAPA) {
    if (!merchant.chapa?.secretEncrypted) {
      throw new Error("Chapa is selected but not configured");
    }
  }
}
