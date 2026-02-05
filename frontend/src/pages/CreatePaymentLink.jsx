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
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Create Payment Link</h1>
          <p style={styles.subtitle}>
            Accept payments instantly with SantimPay or Chapa
          </p>
        </div>

        {/* Main Card */}
        <div style={styles.card}>
          {/* Error/Success Alerts */}
          {error && (
            <div style={styles.alertError}>
              <svg
                style={styles.alertIcon}
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
              <p style={styles.errorMessage}>{error}</p>
            </div>
          )}

          {success && (
            <div style={styles.alertSuccess}>
              <svg
                style={styles.alertIcon}
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
              <p style={styles.successMessage}>{success}</p>
            </div>
          )}

          {/* Form */}
          <div style={styles.form}>
            {/* Title */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Monthly Subscription"
                style={styles.input}
              />
            </div>

            {/* Description */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this payment is for..."
                rows={3}
                style={styles.textarea}
              />
            </div>

            {/* Amount */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Amount (ETB) *</label>
              <div style={styles.amountWrapper}>
                <span style={styles.currencyPrefix}>ETB</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  style={styles.amountInput}
                />
              </div>
            </div>

            {/* Advanced Options Toggle */}
            <div>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                style={styles.advancedToggle}
              >
                <svg
                  style={{
                    ...styles.advancedToggleIcon,
                    transform: showAdvanced ? "rotate(90deg)" : "rotate(0deg)",
                  }}
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
              <div style={styles.advancedOptions}>
                <div style={styles.advancedGrid}>
                  <div>
                    <label style={styles.label}>Link Expiry (Hours)</label>
                    <select
                      value={expiryHours}
                      onChange={(e) => setExpiryHours(e.target.value)}
                      style={styles.select}
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
                    <label style={styles.label}>Max Payments</label>
                    <input
                      type="number"
                      value={maxPayments}
                      onChange={(e) => setMaxPayments(e.target.value)}
                      min="1"
                      placeholder="1"
                      style={styles.input}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Gateway Selection */}
            <div>
              <label style={styles.gatewayLabel}>Select Payment Gateway</label>
              <div style={styles.gatewayGrid}>
                {/* SantimPay Card */}
                <div
                  onClick={() => setGateway("santimpay")}
                  style={{
                    ...styles.gatewayCard,
                    ...(gateway === "santimpay"
                      ? styles.gatewayCardActive
                      : styles.gatewayCardInactive),
                  }}
                >
                  <div style={styles.gatewayCardHeader}>
                    <div>
                      <div style={styles.gatewayCardTitle}>
                        <div
                          style={{
                            ...styles.gatewayIndicator,
                            ...styles.gatewayIndicatorActive,
                          }}
                        ></div>
                        SantimPay
                      </div>
                      <p style={styles.gatewaySubtitle}>
                        Type A - Instant Settlement
                      </p>
                      <ul style={styles.gatewayFeatures}>
                        <li style={styles.gatewayFeature}>
                          <svg
                            style={{ ...styles.featureIcon, color: "#10b981" }}
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
                        <li style={styles.gatewayFeature}>
                          <svg
                            style={{ ...styles.featureIcon, color: "#10b981" }}
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
                      <div
                        style={{
                          padding: "4px",
                          backgroundColor: "#d1fae5",
                          borderRadius: "50%",
                        }}
                      >
                        <div
                          style={{
                            width: "16px",
                            height: "16px",
                            backgroundColor: "#10b981",
                            borderRadius: "50%",
                          }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chapa Card */}
                <div
                  onClick={() => connectedGateways.chapa && setGateway("chapa")}
                  style={{
                    ...styles.gatewayCard,
                    ...(!connectedGateways.chapa
                      ? styles.gatewayCardDisabled
                      : gateway === "chapa"
                        ? {
                            borderColor: "#3b82f6",
                            backgroundColor: "#eff6ff",
                          }
                        : styles.gatewayCardInactive),
                  }}
                >
                  <div style={styles.gatewayCardHeader}>
                    <div>
                      <div style={styles.gatewayCardTitle}>
                        <div
                          style={{
                            ...styles.gatewayIndicator,
                            ...styles.gatewayIndicatorInactive,
                          }}
                        ></div>
                        Chapa
                        {!connectedGateways.chapa && (
                          <span style={styles.gatewayBadge}>Not Connected</span>
                        )}
                      </div>
                      <p style={styles.gatewaySubtitle}>
                        Type B Lite - Card & Bank Payments
                      </p>
                      <ul style={styles.gatewayFeatures}>
                        <li style={styles.gatewayFeature}>
                          <svg
                            style={{ ...styles.featureIcon, color: "#3b82f6" }}
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
                        <li style={styles.gatewayFeature}>
                          <svg
                            style={{ ...styles.featureIcon, color: "#3b82f6" }}
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
                      <div
                        style={{
                          padding: "4px",
                          backgroundColor: "#dbeafe",
                          borderRadius: "50%",
                        }}
                      >
                        <div
                          style={{
                            width: "16px",
                            height: "16px",
                            backgroundColor: "#3b82f6",
                            borderRadius: "50%",
                          }}
                        ></div>
                      </div>
                    )}
                  </div>

                  {!connectedGateways.chapa && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnectChapa();
                      }}
                      style={styles.connectButton}
                    >
                      <svg
                        style={{ width: "16px", height: "16px" }}
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
              style={{
                ...styles.createButton,
                ...(loading || !amount || !title
                  ? styles.createButtonDisabled
                  : gateway === "santimpay"
                    ? styles.createButtonSantimPay
                    : styles.createButtonChapa),
              }}
            >
              {loading ? (
                <>
                  <svg
                    style={styles.spinner}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      style={styles.spinnerCircle}
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      style={styles.spinnerPath}
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating Payment Link...
                </>
              ) : (
                <>
                  <svg
                    style={styles.createIcon}
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
            <div style={styles.linkSection}>
              <div style={styles.linkHeader}>
                <h3 style={styles.linkTitle}>Your Payment Link</h3>
                <div style={styles.linkActions}>
                  <button onClick={copyLink} style={styles.linkActionButton}>
                    <svg
                      style={styles.linkIcon}
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
                  <button onClick={previewLink} style={styles.linkActionButton}>
                    <svg
                      style={styles.linkIcon}
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
                    style={styles.linkActionButtonPrimary}
                  >
                    <svg
                      style={styles.linkIcon}
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

              <div style={styles.linkBox}>
                <code style={styles.linkCode}>{link}</code>
              </div>

              <div style={styles.shareGrid}>
                <a
                  href={`whatsapp://send?text=${encodeURIComponent(`Payment Link: ${title}\n${link}`)}`}
                  style={styles.shareButtonWhatsApp}
                >
                  <span style={styles.shareIcon}>💬</span>
                  Share on WhatsApp
                </a>
                <a
                  href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Payment Link:\n${link}`)}`}
                  style={styles.shareButtonEmail}
                >
                  <span style={styles.shareIcon}>📧</span>
                  Send via Email
                </a>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(
                      `Payment Link: ${title}\n${link}`,
                    )
                  }
                  style={styles.shareButtonCopy}
                >
                  <span style={styles.shareIcon}>📋</span>
                  Copy with Title
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div style={styles.infoGrid}>
          <div style={styles.infoCard}>
            <div style={styles.infoHeader}>
              <div style={styles.infoIconGreen}>
                <svg
                  style={styles.infoIconSvg}
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
              <h4 style={styles.infoTitle}>Secure Payments</h4>
            </div>
            <p style={styles.infoText}>
              All transactions are encrypted and PCI compliant
            </p>
          </div>

          <div style={styles.infoCard}>
            <div style={styles.infoHeader}>
              <div style={styles.infoIconBlue}>
                <svg
                  style={styles.infoIconSvg}
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
              <h4 style={styles.infoTitle}>Instant Settlement</h4>
            </div>
            <p style={styles.infoText}>
              Receive funds directly to your account
            </p>
          </div>

          <div style={styles.infoCard}>
            <div style={styles.infoHeader}>
              <div style={styles.infoIconPurple}>
                <svg
                  style={styles.infoIconSvg}
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
              <h4 style={styles.infoTitle}>No Hidden Fees</h4>
            </div>
            <p style={styles.infoText}>
              Transparent pricing with no setup costs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Styles ---------- */
const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)",
    padding: "16px",
  },
  wrapper: {
    maxWidth: "768px",
    margin: "0 auto",
  },
  header: {
    textAlign: "center",
    marginBottom: "32px",
  },
  title: {
    fontSize: "30px",
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: "8px",
  },
  subtitle: {
    color: "#6b7280",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "16px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
    padding: "24px",
    marginBottom: "24px",
  },
  alertError: {
    marginBottom: "24px",
    padding: "16px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
  },
  alertSuccess: {
    marginBottom: "24px",
    padding: "16px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
  },
  alertIcon: {
    width: "20px",
    height: "20px",
    marginRight: "12px",
  },
  errorMessage: {
    margin: 0,
    color: "#dc2626",
  },
  successMessage: {
    margin: 0,
    color: "#16a34a",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  formGroup: {
    marginBottom: "24px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: 500,
    color: "#374151",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "16px",
    transition: "all 0.2s",
  },
  textarea: {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "16px",
    minHeight: "100px",
    resize: "vertical",
    transition: "all 0.2s",
  },
  amountWrapper: {
    position: "relative",
  },
  currencyPrefix: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#6b7280",
  },
  amountInput: {
    width: "100%",
    paddingLeft: "64px",
    paddingRight: "16px",
    paddingTop: "12px",
    paddingBottom: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "16px",
    transition: "all 0.2s",
  },
  advancedToggle: {
    display: "flex",
    alignItems: "center",
    color: "#2563eb",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    padding: 0,
    fontSize: "14px",
    marginBottom: "16px",
  },
  advancedToggleIcon: {
    width: "16px",
    height: "16px",
    marginRight: "8px",
    transition: "transform 0.2s",
  },
  advancedOptions: {
    backgroundColor: "#f9fafb",
    padding: "16px",
    borderRadius: "8px",
  },
  advancedGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "16px",
  },
  select: {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "16px",
    backgroundColor: "white",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  gatewayLabel: {
    display: "block",
    fontSize: "14px",
    fontWeight: 500,
    color: "#374151",
    marginBottom: "12px",
  },
  gatewayGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "16px",
  },
  gatewayCard: {
    padding: "20px",
    borderRadius: "12px",
    border: "2px solid #e5e7eb",
    backgroundColor: "#f9fafb",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  gatewayCardActive: {
    borderColor: "#10b981",
    backgroundColor: "#f0fdf4",
  },
  gatewayCardInactive: {
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  gatewayCardDisabled: {
    borderColor: "#e5e7eb",
    backgroundColor: "#f3f4f6",
    opacity: 0.75,
    cursor: "not-allowed",
  },
  gatewayCardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
  gatewayCardTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "16px",
    fontWeight: 600,
    color: "#1f2937",
  },
  gatewayIndicator: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
  },
  gatewayIndicatorActive: {
    backgroundColor: "#10b981",
  },
  gatewayIndicatorInactive: {
    backgroundColor: "#3b82f6",
  },
  gatewayBadge: {
    padding: "4px 8px",
    backgroundColor: "#fef3c7",
    color: "#92400e",
    fontSize: "12px",
    borderRadius: "12px",
    marginLeft: "8px",
  },
  gatewaySubtitle: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "12px",
  },
  gatewayFeatures: {
    fontSize: "12px",
    color: "#6b7280",
    padding: 0,
    margin: 0,
    listStyle: "none",
  },
  gatewayFeature: {
    display: "flex",
    alignItems: "center",
    marginBottom: "4px",
  },
  featureIcon: {
    width: "16px",
    height: "16px",
    marginRight: "8px",
  },
  connectButton: {
    width: "100%",
    padding: "8px 16px",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginTop: "16px",
    transition: "background-color 0.2s",
  },
  createButton: {
    width: "100%",
    padding: "16px",
    borderRadius: "12px",
    fontWeight: 500,
    fontSize: "16px",
    color: "white",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    transition: "all 0.2s",
  },
  createButtonDisabled: {
    backgroundColor: "#9ca3af",
    cursor: "not-allowed",
  },
  createButtonSantimPay: {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  },
  createButtonChapa: {
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
  },
  spinner: {
    animation: "spin 1s linear infinite",
    width: "20px",
    height: "20px",
  },
  spinnerCircle: {
    opacity: 0.25,
  },
  spinnerPath: {
    opacity: 0.75,
  },
  createIcon: {
    width: "20px",
    height: "20px",
  },
  linkSection: {
    marginTop: "32px",
    paddingTop: "32px",
    borderTop: "1px solid #e5e7eb",
  },
  linkHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
  },
  linkTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#1f2937",
  },
  linkActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  linkActionButton: {
    padding: "8px 16px",
    color: "#2563eb",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    transition: "color 0.2s",
  },
  linkActionButtonPrimary: {
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    padding: "8px 16px",
    transition: "background-color 0.2s",
  },
  linkIcon: {
    width: "16px",
    height: "16px",
  },
  linkBox: {
    backgroundColor: "#f9fafb",
    padding: "16px",
    borderRadius: "8px",
    marginBottom: "16px",
  },
  linkCode: {
    fontSize: "14px",
    color: "#374151",
    wordBreak: "break-all",
    fontFamily: "monospace",
  },
  shareGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "12px",
  },
  shareButtonWhatsApp: {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontSize: "14px",
    backgroundColor: "#f0fdf4",
    color: "#047857",
    textDecoration: "none",
    transition: "background-color 0.2s",
  },
  shareButtonEmail: {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontSize: "14px",
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    textDecoration: "none",
    transition: "background-color 0.2s",
  },
  shareButtonCopy: {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontSize: "14px",
    backgroundColor: "#faf5ff",
    color: "#7c3aed",
    transition: "background-color 0.2s",
  },
  shareIcon: {
    fontSize: "20px",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "16px",
  },
  infoCard: {
    backgroundColor: "white",
    padding: "16px",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
  },
  infoHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
  },
  infoIconGreen: {
    padding: "8px",
    borderRadius: "8px",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0fdf4",
  },
  infoIconBlue: {
    padding: "8px",
    borderRadius: "8px",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eff6ff",
  },
  infoIconPurple: {
    padding: "8px",
    borderRadius: "8px",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#faf5ff",
  },
  infoIconSvg: {
    width: "20px",
    height: "20px",
  },
  infoTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#1f2937",
  },
  infoText: {
    fontSize: "14px",
    color: "#6b7280",
    margin: 0,
  },
};

/* ---------- CSS Animations ---------- */
const styleTag = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .input:focus, .textarea:focus, .select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .advanced-toggle:hover {
    color: #1d4ed8;
  }
  
  .gateway-card:hover:not(.gateway-card-disabled) {
    transform: translateY(-2px);
  }
  
  .link-action-button:hover {
    color: #1d4ed8;
  }
  
  .link-action-button-primary:hover {
    background-color: #1d4ed8;
  }
  
  .connect-button:hover {
    background-color: #1d4ed8;
  }
  
  .create-button:hover:not(.create-button-disabled) {
    opacity: 0.9;
  }
  
  .share-button:hover {
    filter: brightness(0.95);
  }
  
  @media (min-width: 768px) {
    .container { padding: 32px; }
    .card { padding: 32px; }
    .advanced-grid { grid-template-columns: 1fr 1fr; }
    .gateway-grid { grid-template-columns: 1fr 1fr; }
    .share-grid { grid-template-columns: 1fr 1fr 1fr; }
    .info-grid { grid-template-columns: 1fr 1fr 1fr; }
  }
`;

// Add the CSS to the document
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = styleTag;
  document.head.appendChild(style);
}
