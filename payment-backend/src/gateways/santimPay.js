// src/gateways/santimPay.js
import BaseGateway from "./BaseGateway.js";
import SantimpaySdk from "./nodeSDK/lib/index.js";

function requiredEnv(name) {
  if (!process.env[name]) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return process.env[name];
}

export default class SantimPayGateway extends BaseGateway {
  constructor() {
    super();

    const privateKey = requiredEnv("SANTIMPAY_PRIVATE_KEY").replace(
      /\\n/g,
      "\n",
    );

    this.client = new SantimpaySdk(
      requiredEnv("SANTIMPAY_MERCHANT_ID"),
      privateKey,
      process.env.SANTIMPAY_TESTBED !== "false",
    );
  }

  /**
   * SantimPay is platform-owned
   * Context is intentionally ignored
   */
  setContext() {}

  async initializePayment({ transaction, urls }) {
    return this.createPayment({
      reference: transaction.internalRef,
      amount: transaction.amount,
      paymentReason: `Payment for link ${transaction.linkId}`,
      customerPhone: transaction.customerPhone,
      successUrl: urls.successUrl,
      cancelUrl: urls.cancelUrl,
      failureUrl: urls.failureUrl,
      notifyUrl: urls.notifyUrl,
    });
  }

  async createPayment(payload) {
    const {
      reference,
      amount,
      paymentReason,
      successUrl,
      failureUrl,
      cancelUrl,
      notifyUrl,
      customerPhone,
    } = payload;

    if (!reference) throw new Error("reference is required");
    if (!amount || amount <= 0) throw new Error("invalid amount");

    try {
      const checkoutUrl = await this.client.generatePaymentUrl(
        reference,
        amount,
        paymentReason,
        successUrl,
        failureUrl,
        notifyUrl,
        customerPhone || "",
        cancelUrl,
      );

      return { checkoutUrl };
    } catch (error) {
      // Log minimal safe info
      console.error("SantimPay createPayment failed:", {
        reference,
        message: error.message,
      });

      throw error;
    }
  }

  async fetchTransaction(reference) {
    if (!reference) throw new Error("reference is required");

    let retries = 3;
    let lastError;

    while (retries > 0) {
      try {
        return await this.client.checkTransactionStatus(reference);
      } catch (err) {
        lastError = err;
        retries--;

        if (retries > 0) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }

    console.error("SantimPay fetchTransaction failed:", {
      reference,
      message: lastError?.message,
    });

    return {
      status: "unknown",
      reference,
      error: lastError?.message || "unknown error",
      timestamp: new Date().toISOString(),
    };
  }

  async sendToCustomer(payload) {
    const { reference, amount, reason, phoneNumber, paymentMethod, notifyUrl } =
      payload;

    if (!reference) throw new Error("reference is required");
    if (!amount || amount <= 0) throw new Error("Invalid amount");
    if (!reason) throw new Error("reason is required");
    if (!phoneNumber) throw new Error("phoneNumber is required");
    if (!paymentMethod) throw new Error("paymentMethod is required");

    return this.client.sendToCustomer(
      reference,
      amount,
      reason,
      phoneNumber,
      paymentMethod,
      notifyUrl,
    );
  }
}
