import axios from "axios";
import BaseGateway from "./BaseGateway.js";

const CHAPA_BASE_URL = "https://api.chapa.co/v1";

export default class ChapaGateway extends BaseGateway {
  constructor(context) {
    super();
    if (!context?.chapaSecret) {
      throw new Error("Chapa secret missing in gateway context");
    }
    this.context = context;
  }

  async initializePayment({ transaction, urls }) {
    const { chapaSecret } = this.context;
    const customerName = (transaction.customerName || "Customer").trim();
    const parts = customerName.split(" ");

    const first_name = parts[0] || "Customer";
    const last_name = parts.slice(1).join(" ") || "Customer";
    const payload = {
      amount: String(transaction.amount),
      currency: (transaction.currency || "ETB").toUpperCase(),
      email:
        transaction.customerEmail?.trim() ||
        transaction.metadata?.customerEmail?.trim() ||
        this.getTestEmail(transaction),
      first_name,
      last_name,

      tx_ref: transaction.internalRef,
      callback_url: urls.notifyUrl,
      return_url: urls.successUrl,
      "customization[title]": "Payment",
      "customization[description]": `Payment for ${transaction.linkId}`,
    };

    try {
      const res = await axios.post(
        `${CHAPA_BASE_URL}/transaction/initialize`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${chapaSecret}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      );

      if (res.data?.status !== "success") {
        console.error("❌ FULL CHAPA ERROR:", res.data);
        throw new Error(JSON.stringify(res.data));
      }

      return { checkoutUrl: res.data.data.checkout_url };
    } catch (error) {
      console.error(
        "❌ CHAPA AXIOS ERROR:",
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  getTestEmail(transaction) {
    const cleanRef = transaction.internalRef
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    return `test${cleanRef}@gmail.com`;
  }

  async fetchTransaction(txRef) {
    const res = await axios.get(
      `${CHAPA_BASE_URL}/transaction/verify/${txRef}`,
      {
        headers: {
          Authorization: `Bearer ${this.context.chapaSecret}`,
        },
      },
    );

    return res.data;
  }
}
