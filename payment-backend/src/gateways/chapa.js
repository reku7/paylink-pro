// src/gateways/chapa.js
import axios from "axios";
import BaseGateway from "./BaseGateway.js";

const CHAPA_BASE_URL = "https://api.chapa.co/v1";

class ChapaGateway extends BaseGateway {
  constructor() {
    super();
    this.context = null;
  }

  setContext(context) {
    if (!context?.chapaSecret) {
      throw new Error("Chapa secret missing in gateway context");
    }
    this.context = context;
  }

  async initializePayment({ transaction, urls }) {
    const { chapaSecret } = this.context;
    if (!chapaSecret?.trim()) throw new Error("Chapa secret missing");

    // Customer info
    const customerEmail =
      transaction.customerEmail ||
      transaction.metadata?.customerEmail ||
      this.getTestEmail(transaction);

    const customerName = (transaction.customerName || "Customer").trim();

    const names = customerName.trim().split(" ");
    const first_name = names[0] || "Customer";
    const last_name = names.slice(1).join(" ") || "Customer";

    const currency = (transaction.currency || "ETB").toUpperCase();

    const payload = {
      amount: String(transaction.amount), // string
      currency,
      email: customerEmail,
      first_name,
      last_name,
      tx_ref: transaction.internalRef,
      callback_url: urls.notifyUrl,
      return_url: urls.successUrl,
      "customization[title]": "Payment",
      "customization[description]": `Payment for link ${transaction.linkId}`,
    };

    console.log("📤 Chapa Request Payload:", payload);

    try {
      const headers = {
        Authorization: `Bearer ${chapaSecret}`,
        "Content-Type": "application/json",
      };

      const res = await axios.post(
        `${CHAPA_BASE_URL}/transaction/initialize`,
        payload,
        { headers, timeout: 30000 },
      );

      console.log("✅ Chapa Response:", res.data);

      if (!res.data || res.data.status !== "success") {
        throw new Error(
          `Chapa payment initialization failed: ${JSON.stringify(res.data)}`,
        );
      }

      return {
        checkoutUrl: res.data.data.checkout_url,
        raw: res.data,
      };
    } catch (error) {
      console.error(
        "❌ Chapa API Error:",
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  // Helper method to generate valid test emails
  getTestEmail(transaction) {
    // Use transaction ID to create a unique but valid-looking email
    const domain = "test.chapa.co"; // Using chapa's own test domain
    const prefix = transaction.internalRef
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    return `test_${prefix}@${domain}`;
  }

  async fetchTransaction(txRef) {
    try {
      const response = await axios.get(
        `https://api.chapa.co/v1/transaction/verify/${txRef}`,
        {
          headers: {
            Authorization: `Bearer ${this.context.chapaSecret}`,
          },
          timeout: 30000,
        },
      );
      return response.data;
    } catch (error) {
      console.error(
        "❌ Chapa verification error:",
        error.response?.data || error.message,
      );
      throw error;
    }
  }
}

export default new ChapaGateway();
