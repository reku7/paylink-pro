// src/gateways/santimPay.js
import BaseGateway from "./BaseGateway.js";
import SantimpaySdk from "./nodeSDK/lib/index.js";

const SANTIMPAY_PRIVATE_KEY = process.env.SANTIMPAY_PRIVATE_KEY.replace(
  /\\n/g,
  "\n"
);

const client = new SantimpaySdk(
  process.env.SANTIMPAY_MERCHANT_ID,
  SANTIMPAY_PRIVATE_KEY,
  process.env.SANTIMPAY_TESTBED === "false"
);

class SantimPayGateway extends BaseGateway {
  setContext() {
    // SantimPay is platform-owned
    // context intentionally ignored
  }
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
  // Create hosted checkout payment
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

    // 🔍 Log all URLs for debugging
    console.log("🔗 SantimPay Payment URLs:", {
      reference,
      successUrl,
      failureUrl,
      cancelUrl,
      notifyUrl,
    });

    try {
      const checkoutUrl = await client.generatePaymentUrl(
        reference,
        amount,
        paymentReason,
        successUrl,
        failureUrl,
        notifyUrl, // 6th param: notifyUrl
        customerPhone || "", // 7th param: phoneNumber
        cancelUrl // 8th param: cancelRedirectUrl
      );

      console.log(
        "✅ SantimPay Checkout URL:",
        checkoutUrl.substring(0, 100) + "..."
      );
      return { checkoutUrl };
    } catch (error) {
      console.error("❌ SantimPay SDK Error Details:", {
        message: error.message,
        stack: error.stack,
        parameters: {
          reference,
          amount,
          paymentReason,
          successUrl: successUrl?.substring(0, 50),
          failureUrl: failureUrl?.substring(0, 50),
          cancelUrl: cancelUrl?.substring(0, 50),
          notifyUrl: notifyUrl?.substring(0, 50),
        },
      });
      throw error;
    }
  }

  /**
   * B2C payout / refund
   */
  // In santimPay.js, enhance the fetchTransaction method:

  async fetchTransaction(reference) {
    if (!reference) throw new Error("reference is required");

    try {
      // SantimPay SDK might have issues, add retry logic
      let retries = 3;
      let lastError;

      while (retries > 0) {
        try {
          const result = await client.checkTransactionStatus(reference);

          // Log for debugging
          console.log("🔍 SantimPay fetchTransaction result:", {
            reference,
            status: result?.status,
            rawResult: result,
          });

          return result;
        } catch (error) {
          lastError = error;
          retries--;

          if (retries === 0) break;

          console.log(
            `🔄 Retrying SantimPay status check (${retries} left)...`
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      throw lastError || new Error("Failed to fetch transaction status");
    } catch (error) {
      console.error("❌ SantimPay fetchTransaction error:", error.message);

      // Return a default structure if API fails
      return {
        status: "unknown",
        reference,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async sendToCustomer(payload) {
    const { reference, amount, reason, phoneNumber, paymentMethod, notifyUrl } =
      payload;

    if (!reference) throw new Error("reference is required");
    if (!amount || amount <= 0) throw new Error("Invalid amount");
    if (!reason) throw new Error("reason is required");
    if (!phoneNumber) throw new Error("phoneNumber is required");
    if (!paymentMethod) throw new Error("paymentMethod is required");

    return client.sendToCustomer(
      reference,
      amount,
      reason,
      phoneNumber,
      paymentMethod,
      notifyUrl
    );
  }
}

export default new SantimPayGateway();
