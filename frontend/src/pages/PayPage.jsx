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
  const [countdown, setCountdown] = useState(10);
  const [paymentMethod, setPaymentMethod] = useState("gateway");

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

  // Format date
  const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      ...(includeTime && { hour: "2-digit", minute: "2-digit" }),
    });
  };

  // Loading state
  if (fetching) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingContent}>
          <div style={styles.spinner}></div>
          <h2 style={styles.loadingTitle}>Loading payment details...</h2>
          <p style={styles.loadingSubtitle}>
            Please wait while we fetch your payment information
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={styles.errorPage}>
        <div style={styles.errorCard}>
          <div style={styles.errorIconContainer}>
            <svg
              style={styles.errorIcon}
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
          <h2 style={styles.errorTitle}>Payment Link Error</h2>
          <p style={styles.errorMessageText}>{error}</p>
          <button
            onClick={() => (window.location.href = "/")}
            style={styles.homeButton}
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Main Content */}
      <div style={styles.mainContent}>
        <div style={styles.grid}>
          {/* Left Column - Payment Details */}
          <div style={styles.leftColumn}>
            <div style={styles.paymentCard}>
              {/* Merchant Info */}
              <div style={styles.merchantInfo}>
                <div>
                  <h2 style={styles.merchantTitle}>
                    {link.title || "Payment Request"}
                  </h2>
                  <p style={styles.merchantSubtitle}>
                    {link.merchantName || "From a trusted merchant"}
                  </p>
                </div>
              </div>

              {/* Amount Section */}
              <div style={styles.amountSection}>
                <div style={styles.amountHeader}>
                  <span style={styles.amountLabel}>Amount to pay</span>
                  {link.status === "paid" && (
                    <span style={styles.paidBadge}>Paid</span>
                  )}
                </div>
                <div style={styles.amount}>
                  {formatCurrency(link.amount, link.currency)}
                </div>
                {link.description && (
                  <p style={styles.description}>{link.description}</p>
                )}
              </div>

              {/* Payment Method Selection */}
              <div style={styles.paymentMethodSection}>
                <h3 style={styles.sectionTitle}>Select Payment Method</h3>
                <div style={styles.paymentMethodGrid}>
                  <button
                    onClick={() => setPaymentMethod("gateway")}
                    style={{
                      ...styles.paymentMethodButton,
                      ...(paymentMethod === "gateway"
                        ? styles.paymentMethodActive
                        : {}),
                    }}
                  >
                    <div style={styles.paymentMethodContent}>
                      <div style={styles.paymentMethodIcon}>💳</div>
                      <span style={styles.paymentMethodName}>Card/Bank</span>
                      <span style={styles.paymentMethodHint}>Recommended</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("mobile")}
                    style={{
                      ...styles.paymentMethodButton,
                      ...(paymentMethod === "mobile"
                        ? styles.paymentMethodActiveMobile
                        : {}),
                    }}
                  >
                    <div style={styles.paymentMethodContent}>
                      <div style={styles.paymentMethodIcon}>📱</div>
                      <span style={styles.paymentMethodName}>Mobile Money</span>
                      <span style={styles.paymentMethodHint}>
                        CBE Birr, M-Birr
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("bank")}
                    style={{
                      ...styles.paymentMethodButton,
                      ...(paymentMethod === "bank"
                        ? styles.paymentMethodActiveBank
                        : {}),
                    }}
                  >
                    <div style={styles.paymentMethodContent}>
                      <div style={styles.paymentMethodIcon}>🏦</div>
                      <span style={styles.paymentMethodName}>
                        Bank Transfer
                      </span>
                      <span style={styles.paymentMethodHint}>
                        Direct transfer
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Payment Button */}
              <div style={styles.paymentButtonSection}>
                <button
                  onClick={handlePay}
                  disabled={loading || link.status === "paid"}
                  style={{
                    ...styles.payButton,
                    ...(loading || link.status === "paid"
                      ? styles.payButtonDisabled
                      : {}),
                  }}
                >
                  {loading ? (
                    <>
                      <svg
                        style={styles.spinnerSmall}
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
                      Processing...
                    </>
                  ) : link.status === "paid" ? (
                    "Already Paid"
                  ) : (
                    <>
                      <span>Pay Now</span>
                      <svg
                        style={styles.arrowIcon}
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
                  <div style={styles.errorAlert}>
                    <svg
                      style={styles.errorAlertIcon}
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
                    <p style={styles.errorAlertText}>{error}</p>
                  </div>
                )}

                {/* Auto-redirect notice */}
                {countdown > 0 && (
                  <p style={styles.countdownText}>
                    Redirecting to secure payment in {countdown} seconds...
                  </p>
                )}
              </div>

              {/* Security Badges */}
              <div style={styles.securitySection}>
                <div style={styles.securityBadges}>
                  <div style={styles.securityBadge}>
                    <div style={styles.securityIconContainer}>
                      <span style={styles.securityIcon}>🔒</span>
                    </div>
                    <span style={styles.securityText}>SSL Secured</span>
                  </div>
                  <div style={styles.securityBadge}>
                    <div style={styles.securityIconContainer}>
                      <span style={styles.securityIcon}>✓</span>
                    </div>
                    <span style={styles.securityText}>PCI Compliant</span>
                  </div>
                  <div style={styles.securityBadge}>
                    <div style={styles.securityIconContainer}>
                      <span style={styles.securityIcon}>🛡️</span>
                    </div>
                    <span style={styles.securityText}>3D Secure</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Info & Support */}
          <div style={styles.rightColumn}>
            {/* Payment Summary */}
            <div style={styles.summaryCard}>
              <h3 style={styles.summaryTitle}>Payment Summary</h3>
              <div style={styles.summaryContent}>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Subtotal</span>
                  <span style={styles.summaryValue}>
                    {formatCurrency(link.amount, link.currency)}
                  </span>
                </div>
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>Processing Fee</span>
                  <span style={styles.freeText}>Free</span>
                </div>
                <div style={styles.summaryTotal}>
                  <span style={styles.totalLabel}>Total Amount</span>
                  <span style={styles.totalValue}>
                    {formatCurrency(link.amount, link.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div style={styles.detailsCard}>
              <h3 style={styles.detailsTitle}>Payment Details</h3>
              <div style={styles.detailsContent}>
                <div>
                  <span style={styles.detailsLabel}>Payment ID</span>
                  <div style={styles.paymentId}>
                    <code>{linkId}</code>
                  </div>
                </div>
                <div>
                  <span style={styles.detailsLabel}>Created</span>
                  <p style={styles.detailsText}>{formatDate(link.createdAt)}</p>
                </div>
                {link.expiresAt && (
                  <div>
                    <span style={styles.detailsLabel}>Expires</span>
                    <p style={styles.detailsText}>
                      {formatDate(link.expiresAt, true)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Support Card */}
            <div style={styles.supportCard}>
              <h3 style={styles.supportTitle}>Need Help?</h3>
              <p style={styles.supportText}>
                Contact our support team if you encounter any issues during
                payment
              </p>
              <div style={styles.supportOptions}>
                {/* Web-friendly email link */}
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=rekiklegese@gmail.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.supportOption}
                >
                  <div style={styles.supportIconContainer}>
                    <span style={styles.supportIcon}>📧</span>
                  </div>
                  <div>
                    <div style={styles.supportOptionTitle}>Email Support</div>
                    <div style={styles.supportOptionSubtitle}>
                      rekiklegese@gmail.com
                    </div>
                  </div>
                </a>

                <div style={styles.supportOption}>
                  <div style={styles.supportIconContainer}>
                    <span style={styles.supportIcon}>🕒</span>
                  </div>
                  <div>
                    <div style={styles.supportOptionTitle}>24/7 Support</div>
                    <div style={styles.supportOptionSubtitle}>
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
  );
}

/* ---------- Styles ---------- */
const styles = {
  // Loading state
  loadingContainer: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
  },
  loadingContent: {
    textAlign: "center",
  },
  spinner: {
    animation: "spin 1s linear infinite",
    border: "4px solid rgba(0, 0, 0, 0.1)",
    borderTop: "4px solid #2563eb",
    borderRadius: "50%",
    width: "48px",
    height: "48px",
    margin: "0 auto 16px",
  },
  loadingTitle: {
    fontSize: "20px",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "8px",
  },
  loadingSubtitle: {
    color: "#6b7280",
  },

  // Error state
  errorPage: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f8fafc 0%, #fee2e2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
  },
  errorCard: {
    maxWidth: "400px",
    width: "100%",
    backgroundColor: "white",
    borderRadius: "16px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
    padding: "32px",
    textAlign: "center",
  },
  errorIconContainer: {
    width: "64px",
    height: "64px",
    backgroundColor: "#fee2e2",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
  },
  errorIcon: {
    width: "32px",
    height: "32px",
    color: "#dc2626",
  },
  errorTitle: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: "8px",
  },
  errorMessageText: {
    color: "#6b7280",
    marginBottom: "24px",
  },
  homeButton: {
    padding: "12px 24px",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },

  // Container
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },

  // Main content
  mainContent: {
    flex: 1,
    padding: "40px 64px",
    background: "linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "40px",
    maxWidth: "1200px",
    margin: "0 auto",
  },

  // Left column
  leftColumn: {},
  paymentCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
    padding: "32px",
  },
  merchantInfo: {
    display: "flex",
    alignItems: "center",
    marginBottom: "32px",
    paddingBottom: "32px",
    borderBottom: "1px solid #e5e7eb",
  },
  merchantLogo: {
    width: "48px",
    height: "48px",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "16px",
  },
  merchantLogoText: {
    color: "white",
    fontWeight: "bold",
    fontSize: "20px",
  },
  merchantTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#1f2937",
    marginBottom: "4px",
  },
  merchantSubtitle: {
    color: "#6b7280",
  },
  amountSection: {
    marginBottom: "32px",
  },
  amountHeader: {
    display: "flex",
    alignItems: "baseline",
    marginBottom: "8px",
  },
  amountLabel: {
    color: "#6b7280",
    marginRight: "8px",
  },
  paidBadge: {
    padding: "4px 8px",
    backgroundColor: "#d1fae5",
    color: "#059669",
    fontSize: "12px",
    borderRadius: "12px",
  },
  amount: {
    fontSize: "48px",
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: "16px",
  },
  description: {
    color: "#6b7280",
    fontSize: "18px",
    marginTop: "16px",
  },
  paymentMethodSection: {
    marginBottom: "32px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#1f2937",
    marginBottom: "16px",
  },
  paymentMethodGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
  },
  paymentMethodButton: {
    padding: "16px",
    borderRadius: "12px",
    border: "2px solid #e5e7eb",
    backgroundColor: "white",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  paymentMethodActive: {
    borderColor: "#3b82f6",
    backgroundColor: "#eff6ff",
  },
  paymentMethodActiveMobile: {
    borderColor: "#10b981",
    backgroundColor: "#f0fdf4",
  },
  paymentMethodActiveBank: {
    borderColor: "#8b5cf6",
    backgroundColor: "#faf5ff",
  },
  paymentMethodContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  paymentMethodIcon: {
    fontSize: "24px",
    marginBottom: "8px",
  },
  paymentMethodName: {
    fontWeight: 500,
    fontSize: "14px",
    marginBottom: "4px",
  },
  paymentMethodHint: {
    fontSize: "12px",
    color: "#6b7280",
  },
  paymentButtonSection: {
    marginBottom: "32px",
  },
  payButton: {
    width: "100%",
    padding: "16px",
    borderRadius: "12px",
    fontWeight: "bold",
    fontSize: "18px",
    color: "white",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    transition: "all 0.2s",
  },
  payButtonDisabled: {
    backgroundColor: "#9ca3af",
    cursor: "not-allowed",
  },
  spinnerSmall: {
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
  arrowIcon: {
    width: "20px",
    height: "20px",
  },
  errorAlert: {
    padding: "16px",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    marginTop: "16px",
    display: "flex",
    alignItems: "center",
  },
  errorAlertIcon: {
    width: "20px",
    height: "20px",
    color: "#dc2626",
    marginRight: "12px",
  },
  errorAlertText: {
    color: "#b91c1c",
    margin: 0,
  },
  countdownText: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: "14px",
    marginTop: "16px",
  },
  securitySection: {
    marginTop: "32px",
    paddingTop: "32px",
    borderTop: "1px solid #e5e7eb",
  },
  securityBadges: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "24px",
  },
  securityBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  securityIconContainer: {
    width: "32px",
    height: "32px",
    backgroundColor: "#f3f4f6",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  securityIcon: {
    fontSize: "16px",
  },
  securityText: {
    fontSize: "14px",
    color: "#6b7280",
  },

  // Right column
  rightColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  summaryCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
    padding: "24px",
  },
  summaryTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#1f2937",
    marginBottom: "16px",
  },
  summaryContent: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
  },
  summaryLabel: {
    color: "#6b7280",
  },
  summaryValue: {
    fontWeight: 500,
  },
  freeText: {
    fontWeight: 500,
    color: "#10b981",
  },
  summaryTotal: {
    display: "flex",
    justifyContent: "space-between",
    paddingTop: "12px",
    borderTop: "1px solid #e5e7eb",
    marginTop: "4px",
  },
  totalLabel: {
    fontWeight: 600,
  },
  totalValue: {
    fontWeight: "bold",
    fontSize: "18px",
  },
  detailsCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
    padding: "24px",
  },
  detailsTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#1f2937",
    marginBottom: "16px",
  },
  detailsContent: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  detailsLabel: {
    fontSize: "14px",
    color: "#6b7280",
    display: "block",
    marginBottom: "4px",
  },
  paymentId: {
    fontFamily: "monospace",
    fontSize: "14px",
    backgroundColor: "#f3f4f6",
    padding: "8px",
    borderRadius: "8px",
    marginTop: "4px",
  },
  detailsText: {
    color: "#374151",
    margin: 0,
  },
  supportCard: {
    background: "linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)",
    borderRadius: "16px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
    padding: "24px",
    border: "1px solid #dbeafe",
  },
  supportTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#1f2937",
    marginBottom: "12px",
  },
  supportText: {
    color: "#6b7280",
    marginBottom: "16px",
  },
  supportOptions: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  supportOption: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    backgroundColor: "white",
    borderRadius: "8px",
    textDecoration: "none",
    color: "inherit",
    transition: "background-color 0.2s",
  },
  supportIconContainer: {
    width: "40px",
    height: "40px",
    backgroundColor: "#eff6ff",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  supportIcon: {
    fontSize: "20px",
  },
  supportOptionTitle: {
    fontWeight: 500,
    fontSize: "14px",
  },
  supportOptionSubtitle: {
    fontSize: "12px",
    color: "#6b7280",
  },

  // Footer
  // footer: {
  //   padding: "32px 64px",
  //   borderTop: "1px solid #e5e7eb",
  //   background: "white",
  // },
  // footerContent: {
  //   display: "flex",
  //   justifyContent: "space-between",
  //   alignItems: "center",
  //   maxWidth: "1200px",
  //   margin: "0 auto",
  // },
  // footerLeft: {
  //   display: "flex",
  //   alignItems: "center",
  //   gap: "16px",
  // },
  // footerLogoContainer: {
  //   display: "flex",
  //   alignItems: "center",
  //   gap: "8px",
  // },
  // footerLogo: {
  //   width: "24px",
  //   height: "24px",
  //   background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  //   borderRadius: "6px",
  //   display: "flex",
  //   alignItems: "center",
  //   justifyContent: "center",
  // },
  // footerLogoText: {
  //   color: "white",
  //   fontWeight: "bold",
  //   fontSize: "12px",
  // },
  // footerLogoName: {
  //   fontWeight: "bold",
  //   color: "#1f2937",
  // },
  // footerTagline: {
  //   fontSize: "14px",
  //   color: "#6b7280",
  // },
  // footerRight: {
  //   fontSize: "14px",
  //   color: "#6b7280",
  // },
};

/* ---------- CSS Animations ---------- */
const styleTag = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .payment-method-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .pay-button:hover:not(:disabled) {
    opacity: 0.9;
  }
  
  .home-button:hover {
    background-color: #1d4ed8;
  }
  
  .support-option:hover {
    background-color: #f3f4f6;
  }
  
  @media (min-width: 1024px) {
    .grid {
      grid-template-columns: 2fr 1fr;
    }
  }
  
  @media (max-width: 768px) {
    .payment-method-grid {
      grid-template-columns: 1fr;
    }
    .amount {
      font-size: 36px;
    }
    .brand-section {
      padding: 40px 32px;
    }
    .main-content {
      padding: 24px 32px;
    }
    .grid {
      grid-template-columns: 1fr;
      gap: 24px;
    }
    .footer-content {
      flex-direction: column;
      text-align: center;
      gap: 16px;
    }
  }
`;

// Add the CSS to the document
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = styleTag;
  document.head.appendChild(style);
}
