import SantimPay from "./santimPay.js";
import Chapa from "./chapa.js";

const gateways = {
  santimpay: SantimPay,
  chapa: Chapa,
};

export function getGateway(name, context = {}) {
  const gateway = gateways[name];
  if (!gateway) {
    throw new Error(`Unsupported payment gateway: ${name}`);
  }

  if (typeof gateway.setContext === "function") {
    gateway.setContext(context);
  }

  return gateway;
}
