// src/gateways/index.js
import SantimPayGateway from "./santimPay.js";
import ChapaGateway from "./chapa.js";

export function getGateway(name, context = {}) {
  switch (name) {
    case "santimpay":
      return new SantimPayGateway();

    case "chapa":
      return new ChapaGateway(context);

    default:
      throw new Error(`Unsupported gateway: ${name}`);
  }
}
