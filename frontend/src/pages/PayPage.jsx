import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { publicApi, privateApi } from "../api/api";
import { getAuthToken } from "../utils/auth";

export default function PayPage() {
  const { linkId } = useParams();
  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(10); // Auto-redirect countdown
  const [paymentMethod, setPaymentMethod] = useState("gateway"); // gateway, bank, mobile

  // Determine if user is logged in
  const userIsLoggedIn = !!getAuthToken();

  // Fetch payment link details
  useEffect(() => {
    const fetchLink = async () => {
      try {
        setError("");
        setFetching(true);
        const res = await publicApi.get(`/links/public/${linkId}`);
        setLink(res.data.data || res.data || null);

        // Check if link is already paid/expired
        if (["paid", "expired", "failed"].includes(res.data.data?.status)) {
          setError(`This payment link is ${res.data.data.status}`);
        }
      } catch (err) {
        console.error("Fetch link error:", err);
        setError("Invalid or expired payment link");
      } finally {
        setFetching(false);
      }
    };
    fetchLink();
  }, [linkId]);

  // Auto-redirect countdown
  useEffect(() => {
    if (countdown > 0 && !loading && link) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, loading, link]);

  // Handle payment click
  const handlePay = async () => {
    if (!link) return;

    try {
      setLoading(true);
      setError("");

      let res;
      if (userIsLoggedIn) {
        res = await privateApi.post(`/payments/${linkId}/start`, {
          amount: link.amount,
          currency: link.currency,
          paymentMethod,
        });
      } else {
        res = await publicApi.post(`/payments/public/start/${linkId}`, {
          paymentMethod,
        });
      }

      const checkoutUrl =
        res.data.checkoutUrl ||
        res.data.url ||
        res.data.gateway?.checkoutUrl ||
        res.data.data?.checkoutUrl;

      if (!checkoutUrl) {
        throw new Error("No checkout URL received");
      }

      // Add small delay for better UX
      setTimeout(() => {
        window.location.href = checkoutUrl;
      }, 500);
    } catch (err) {
      console.error("Payment initiation error:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Payment initiation failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount, currency = "ETB") => {
    return (
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount) + ` ${currency}`
    );
  };

  // Loading state
  if (fetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">
            Loading payment details...
          </h2>
          <p className="text-gray-500 mt-2">
            Please wait while we fetch your payment information
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Link Error
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">P</span>
            </div>
            <span className="text-xl font-bold text-gray-900">PayFlow</span>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <svg
                className="w-4 h-4 text-green-500 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center">
              <svg
                className="w-4 h-4 text-blue-500 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Instant Processing</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Left Column - Payment Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              {/* Merchant Info */}
              <div className="flex items-center mb-8 pb-8 border-b">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">M</span>
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {link.title || "Payment Request"}
                  </h2>
                  <p className="text-gray-600">
                    {link.merchantName || "From a trusted merchant"}
                  </p>
                </div>
              </div>

              {/* Amount Section */}
              <div className="mb-8">
                <div className="flex items-baseline mb-2">
                  <span className="text-gray-600 mr-2">Amount to pay</span>
                  {link.status === "paid" && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Paid
                    </span>
                  )}
                </div>
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  {formatCurrency(link.amount, link.currency)}
                </div>
                {link.description && (
                  <p className="text-gray-600 text-lg mt-4">
                    {link.description}
                  </p>
                )}
              </div>

              {/* Payment Method Selection */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Select Payment Method
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => setPaymentMethod("gateway")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === "gateway"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <div className="text-2xl mb-2">💳</div>
                      <span className="font-medium">Card/Bank</span>
                      <span className="text-xs text-gray-500 mt-1">
                        Recommended
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("mobile")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === "mobile"
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-green-300"
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <div className="text-2xl mb-2">📱</div>
                      <span className="font-medium">Mobile Money</span>
                      <span className="text-xs text-gray-500 mt-1">
                        CBE Birr, M-Birr
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("bank")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === "bank"
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-purple-300"
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <div className="text-2xl mb-2">🏦</div>
                      <span className="font-medium">Bank Transfer</span>
                      <span className="text-xs text-gray-500 mt-1">
                        Direct transfer
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Payment Button */}
              <div className="space-y-4">
                <button
                  onClick={handlePay}
                  disabled={loading || link.status === "paid"}
                  className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all flex items-center justify-center gap-3 ${
                    loading || link.status === "paid"
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  }`}
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </>
                  ) : link.status === "paid" ? (
                    "Already Paid"
                  ) : (
                    <>
                      <span>Pay Now</span>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </>
                  )}
                </button>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-red-500 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-red-700">{error}</p>
                    </div>
                  </div>
                )}

                {/* Auto-redirect notice */}
                {countdown > 0 && (
                  <p className="text-center text-gray-500 text-sm">
                    Redirecting to secure payment in {countdown} seconds...
                  </p>
                )}
              </div>

              {/* Security Badges */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="flex flex-wrap justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600">🔒</span>
                    </div>
                    <span className="text-sm text-gray-600">SSL Secured</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600">✓</span>
                    </div>
                    <span className="text-sm text-gray-600">PCI Compliant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600">🛡️</span>
                    </div>
                    <span className="text-sm text-gray-600">3D Secure</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Info & Support */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Payment Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    {formatCurrency(link.amount, link.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Processing Fee</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <div className="flex justify-between pt-3 border-t">
                  <span className="font-semibold">Total Amount</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(link.amount, link.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Payment Details
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Payment ID</span>
                  <p className="font-mono text-sm bg-gray-50 p-2 rounded mt-1">
                    {linkId}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Created</span>
                  <p className="text-gray-700">
                    {new Date(link.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                {link.expiresAt && (
                  <div>
                    <span className="text-sm text-gray-500">Expires</span>
                    <p className="text-gray-700">
                      {new Date(link.expiresAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Support Card */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl shadow-xl p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Need Help?
              </h3>
              <p className="text-gray-600 mb-4">
                Contact our support team if you encounter any issues during
                payment
              </p>
              <div className="space-y-3">
                <a
                  href="mailto:support@payflow.com"
                  className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600">📧</span>
                  </div>
                  <div>
                    <div className="font-medium">Email Support</div>
                    <div className="text-sm text-gray-500">
                      support@payflow.com
                    </div>
                  </div>
                </a>
                <div className="p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600">🕒</span>
                    </div>
                    <div>
                      <div className="font-medium">24/7 Support</div>
                      <div className="text-sm text-gray-500">
                        Always available
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-12 border-t border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center justify-center md:justify-start space-x-2 mb-2">
              <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">P</span>
              </div>
              <span className="font-bold text-gray-900">PayFlow</span>
            </div>
            <p className="text-sm text-gray-600">
              Secure payments for Ethiopian merchants
            </p>
          </div>
          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} PayFlow. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
