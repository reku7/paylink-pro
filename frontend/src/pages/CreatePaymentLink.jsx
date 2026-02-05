import { useState, useEffect, useCallback } from "react";
import { privateApi as api } from "../api/api";
import { useNavigate, useLocation } from "react-router-dom";
import { useGateways } from "../context/GatewayContext";

export default function CreatePaymentLink() {
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [gateway, setGateway] = useState("santimpay");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expiryHours, setExpiryHours] = useState(24);
  const [maxPayments, setMaxPayments] = useState(1);

  const { connectedGateways, refreshGateways } = useGateways();
  const navigate = useNavigate();
  const location = useLocation();

  const handleCreate = useCallback(async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError("Please enter a valid amount (greater than 0).");
      return;
    }
    if (!title.trim()) {
      setError("Please enter a title for your payment link.");
      return;
    }
    if (gateway === "chapa" && !connectedGateways.chapa) {
      setError("You must connect Chapa before creating a Chapa payment link.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      setLink("");

      const origin = window.location.origin;
      const payload = {
        title: title.trim(),
        description: description.trim(),
        amount: Number(amount),
        currency: "ETB",
        gateway,
        successUrl: `${origin}/success`,
        cancelUrl: `${origin}/cancel`,
        failureUrl: `${origin}/failed`,
      };

      // Add advanced options if enabled
      if (showAdvanced) {
        payload.expiryHours = Number(expiryHours);
        payload.maxPayments = Number(maxPayments);
      }

      const res = await api.post("/links", payload);

      if (!res.data.success) {
        throw new Error(res.data.error || "Failed to create payment link");
      }

      const newLink = `${origin}/pay/${res.data.data.linkId}`;
      setLink(newLink);
      setSuccess(
        `Payment link created successfully with ${
          gateway === "santimpay" ? "SantimPay (Type A)" : "Chapa (Type B Lite)"
        }!`,
      );

      if (!location.state?.fromCreateLink) {
        setAmount("");
        setTitle("");
        setDescription("");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to create payment link.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    amount,
    title,
    description,
    gateway,
    connectedGateways,
    location.state,
    showAdvanced,
    expiryHours,
    maxPayments,
  ]);

  useEffect(() => {
    const init = async () => {
      await refreshGateways();

      if (location.state?.fromCreateLink) {
        setAmount(location.state.amount || "");
        setTitle(location.state.title || "");
        setDescription(location.state.description || "");
        setGateway(connectedGateways.chapa ? "chapa" : "santimpay");
        navigate(location.pathname, { replace: true });
      }

      if (gateway === "chapa" && !connectedGateways.chapa) {
        setGateway("santimpay");
      }
    };
    init();
  }, [
    connectedGateways.chapa,
    location.state,
    refreshGateways,
    navigate,
    gateway,
  ]);

  const handleConnectChapa = () => {
    navigate("/dashboard/connect-chapa", {
      state: { fromCreateLink: true, amount, title, description },
    });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    alert("Link copied to clipboard!");
  };

  const previewLink = () => window.open(link, "_blank");

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || "Payment Link",
          text: description || "Make a payment using this link",
          url: link,
        });
      } catch {
        navigator.clipboard.writeText(link);
      }
    } else {
      navigator.clipboard.writeText(link);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Payment Link
          </h1>
          <p className="text-gray-600">
            Accept payments instantly with SantimPay or Chapa
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {/* Error/Success Alerts */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
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

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-green-700">{success}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Monthly Subscription"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this payment is for..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (ETB) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">ETB</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full pl-16 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            {/* Advanced Options Toggle */}
            <div>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <svg
                  className={`w-4 h-4 mr-2 transition-transform ${showAdvanced ? "rotate-90" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                {showAdvanced
                  ? "Hide Advanced Options"
                  : "Show Advanced Options"}
              </button>
            </div>

            {/* Advanced Options */}
            {showAdvanced && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Link Expiry (Hours)
                    </label>
                    <select
                      value={expiryHours}
                      onChange={(e) => setExpiryHours(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={1}>1 hour</option>
                      <option value={6}>6 hours</option>
                      <option value={24}>24 hours</option>
                      <option value={72}>3 days</option>
                      <option value={168}>7 days</option>
                      <option value={0}>Never expires</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Payments
                    </label>
                    <input
                      type="number"
                      value={maxPayments}
                      onChange={(e) => setMaxPayments(e.target.value)}
                      min="1"
                      placeholder="1"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Gateway Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Payment Gateway
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SantimPay Card */}
                <div
                  onClick={() => setGateway("santimpay")}
                  className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                    gateway === "santimpay"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-green-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <h3 className="font-semibold text-gray-900">
                          SantimPay
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Type A - Instant Settlement
                      </p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-1 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          No setup required
                        </li>
                        <li className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-1 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          SMS payment notification
                        </li>
                      </ul>
                    </div>
                    {gateway === "santimpay" && (
                      <div className="p-1 bg-green-100 rounded-full">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chapa Card */}
                <div
                  onClick={() => connectedGateways.chapa && setGateway("chapa")}
                  className={`p-5 rounded-xl border-2 transition-all ${
                    !connectedGateways.chapa
                      ? "border-gray-200 bg-gray-50 opacity-75 cursor-not-allowed"
                      : gateway === "chapa"
                        ? "border-blue-500 bg-blue-50 cursor-pointer"
                        : "border-gray-200 hover:border-blue-300 cursor-pointer"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <h3 className="font-semibold text-gray-900">Chapa</h3>
                        {!connectedGateways.chapa && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Not Connected
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Type B Lite - Card & Bank Payments
                      </p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-1 text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Accepts credit/debit cards
                        </li>
                        <li className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-1 text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Bank transfer support
                        </li>
                      </ul>
                    </div>
                    {gateway === "chapa" && (
                      <div className="p-1 bg-blue-100 rounded-full">
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </div>

                  {!connectedGateways.chapa && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnectChapa();
                      }}
                      className="mt-4 w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      Connect Chapa Account
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreate}
              disabled={loading || !amount || !title}
              className={`w-full py-4 rounded-xl font-medium text-white transition-all ${
                loading || !amount || !title
                  ? "bg-gray-400 cursor-not-allowed"
                  : gateway === "santimpay"
                    ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              } flex items-center justify-center gap-2`}
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
                  Creating Payment Link...
                </>
              ) : (
                <>
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
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  Create with {gateway === "santimpay" ? "SantimPay" : "Chapa"}
                </>
              )}
            </button>
          </div>

          {/* Generated Link Section */}
          {link && (
            <div className="mt-8 pt-8 border-t border-gray-200 animate-fadeIn">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  Your Payment Link
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyLink}
                    className="px-4 py-2 text-blue-600 hover:text-blue-800 flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy
                  </button>
                  <button
                    onClick={previewLink}
                    className="px-4 py-2 text-blue-600 hover:text-blue-800 flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    Open
                  </button>
                  <button
                    onClick={shareLink}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                    Share
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <code className="text-sm text-gray-800 break-all">{link}</code>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <a
                  href={`whatsapp://send?text=${encodeURIComponent(`Payment Link: ${title}\n${link}`)}`}
                  className="p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-center flex items-center justify-center gap-2"
                >
                  <span className="text-lg">💬</span>
                  Share on WhatsApp
                </a>
                <a
                  href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Payment Link:\n${link}`)}`}
                  className="p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-center flex items-center justify-center gap-2"
                >
                  <span className="text-lg">📧</span>
                  Send via Email
                </a>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(
                      `Payment Link: ${title}\n${link}`,
                    )
                  }
                  className="p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-center flex items-center justify-center gap-2"
                >
                  <span className="text-lg">📋</span>
                  Copy with Title
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h4 className="font-semibold">Secure Payments</h4>
            </div>
            <p className="text-sm text-gray-600">
              All transactions are encrypted and PCI compliant
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h4 className="font-semibold">Instant Settlement</h4>
            </div>
            <p className="text-sm text-gray-600">
              Receive funds directly to your account
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h4 className="font-semibold">No Hidden Fees</h4>
            </div>
            <p className="text-sm text-gray-600">
              Transparent pricing with no setup costs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
