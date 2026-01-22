/**
 * Payment Gateway Contract
 * All gateways MUST implement these methods
 */
export default class BaseGateway {
  /**
   * Initialize a payment (hosted checkout)
   */
  async initializePayment({ transaction, urls }) {
    throw new Error("initializePayment() not implemented");
  }

  /**
   * Fetch transaction status from provider
   */
  async fetchTransaction(reference) {
    throw new Error("fetchTransaction() not implemented");
  }

  /**
   * Optional: payouts / refunds
   */
  async sendToCustomer(payload) {
    throw new Error("sendToCustomer() not implemented");
  }
}
