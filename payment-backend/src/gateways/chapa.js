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

    const payload = {
      amount: String(transaction.amount),
      currency: (transaction.currency || "ETB").toUpperCase(),
      email:
        transaction.customerEmail ||
        transaction.metadata?.customerEmail ||
        this.getTestEmail(transaction),
      first_name: transaction.customerName || "Customer",
      last_name: "PayFlow",
      tx_ref: transaction.internalRef,
      callback_url: urls.notifyUrl,
      return_url: urls.successUrl,
      "customization[title]": "Payment",
      "customization[description]": `Payment for ${transaction.linkId}`,
    };

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
      throw new Error("Chapa initialization failed");
    }

    return { checkoutUrl: res.data.data.checkout_url };
  }

  getTestEmail(transaction) {
    return `test_${transaction.internalRef}@chapa.test`;
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
