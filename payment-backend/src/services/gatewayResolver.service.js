//payment-backend\src\services\gatewayResolver.service.js
import { GATEWAYS } from "../constants/gateways.js";
import Merchant from "../models/Merchant.js";

export async function resolveGatewayForMerchant(merchantId) {
  const merchant = await Merchant.findById(merchantId).lean();
  if (!merchant) {
    throw new Error("Merchant not found");
  }

  const gateway = merchant.preferredGateway || GATEWAYS.SANTIMPAY;

  if (!Object.values(GATEWAYS).includes(gateway)) {
    throw new Error(`Unsupported gateway: ${gateway}`);
  }

  return gateway;
}
