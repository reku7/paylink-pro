import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { privateApi as api } from "../../api/api";

export default function AdminMerchants() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const merchantId = params.get("merchantId");

  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [status, setStatus] = useState("");

  useEffect(() => {
    async function fetchMerchant() {
      if (!merchantId) {
        setError("No merchant ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        // Use the correct endpoint for single merchant
        const res = await api.get(`/admin/merchants/${merchantId}`);
        const merchantData = res.data.data;
        setMerchant(merchantData);
        setStatus(merchantData.status);
      } catch (err) {
        console.error("Failed to fetch merchant:", err);
        setError(
          err.response?.data?.message || "Failed to load merchant details",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchMerchant();
  }, [merchantId]);

  const handleStatusUpdate = async () => {
    if (!merchantId || status === merchant.status) return;

    try {
      setUpdating(true);
      await api.patch(`/admin/merchants/${merchantId}`, {
        status: status,
      });

      // Update local merchant state
      setMerchant((prev) => ({ ...prev, status }));
      alert("Merchant status updated successfully!");
    } catch (err) {
      console.error("Failed to update status:", err);
      alert(err.response?.data?.message || "Failed to update merchant status");
      setStatus(merchant.status); // Revert on error
    } finally {
      setUpdating(false);
    }
  };

  const handleRegenerateApiKey = async () => {
    if (
      !window.confirm(
        "Are you sure you want to regenerate the API key? This will invalidate the current key.",
      )
    ) {
      return;
    }

    try {
      const res = await api.post(
        `/admin/merchants/${merchantId}/regenerate-key`,
      );
      setMerchant((prev) => ({
        ...prev,
        apiKey: res.data.data.apiKey,
      }));
      alert("API key regenerated successfully! New key will be shown below.");
    } catch (err) {
      console.error("Failed to regenerate API key:", err);
      alert(err.response?.data?.message || "Failed to regenerate API key");
    }
  };

  const handleViewTransactions = () => {
    navigate(`/admin/transactions?merchantId=${merchantId}`);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading merchant details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorHeader}>
          {/* Fixed: Use "/admin" instead of "/admin/dashboard" */}
          <button onClick={() => navigate("/admin")} style={styles.backButton}>
            ← Back to Dashboard
          </button>
          <h2>Error</h2>
        </div>
        <div style={styles.errorCard}>
          <p>{error}</p>
          {merchantId && (
            <p style={styles.errorDetail}>Merchant ID: {merchantId}</p>
          )}
          <button
            onClick={() => navigate("/admin")}
            style={styles.primaryButton}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div style={styles.notFoundContainer}>
        <h2>Merchant Not Found</h2>
        <p>The merchant with ID "{merchantId}" could not be found.</p>
        <button onClick={() => navigate("/admin")} style={styles.primaryButton}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        {/* Fixed: Use "/admin" instead of "/admin/dashboard" */}
        <button onClick={() => navigate("/admin")} style={styles.backButton}>
          ← Back to Dashboard
        </button>
        <h1 style={styles.title}>{merchant.name}</h1>
        <div style={styles.headerActions}>
          <span
            style={{
              ...styles.statusBadge,
              ...(merchant.status === "active"
                ? styles.activeBadge
                : styles.inactiveBadge),
            }}
          >
            {merchant.status === "active" ? "Active" : "Inactive"}
          </span>
          <span style={styles.merchantId}>ID: {merchant._id}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {["overview", "settings", "gateway", "api"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.activeTab : {}),
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={styles.content}>
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div style={styles.tabContent}>
            <div style={styles.infoGrid}>
              <div style={styles.infoCard}>
                <h3>Basic Information</h3>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Business Name:</span>
                  <span style={styles.value}>{merchant.name}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Owner Email:</span>
                  <span style={styles.value}>
                    {merchant.ownerUserId?.email || "—"}
                  </span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Owner ID:</span>
                  <span style={styles.value}>
                    {merchant.ownerUserId?._id || "—"}
                  </span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Currency:</span>
                  <span style={styles.value}>{merchant.currency || "ETB"}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Created:</span>
                  <span style={styles.value}>
                    {new Date(merchant.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div style={styles.infoCard}>
                <h3>Status Management</h3>
                <div style={styles.statusControl}>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={styles.statusSelect}
                    disabled={updating}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                  </select>
                  <button
                    onClick={handleStatusUpdate}
                    style={styles.updateButton}
                    disabled={updating || status === merchant.status}
                  >
                    {updating ? "Updating..." : "Update Status"}
                  </button>
                </div>
                <p style={styles.helperText}>
                  Changing status will affect the merchant's ability to process
                  payments.
                </p>
              </div>
            </div>

            <div style={styles.actionButtons}>
              <button
                onClick={handleViewTransactions}
                style={styles.secondaryButton}
              >
                View Transactions
              </button>
              <button
                onClick={() => {
                  /* TODO: Implement edit merchant */
                }}
                style={styles.secondaryButton}
              >
                Edit Merchant
              </button>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div style={styles.tabContent}>
            <div style={styles.infoCard}>
              <h3>Merchant Settings</h3>
              <div style={styles.infoGrid}>
                <div>
                  <h4>Webhook Settings</h4>
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Webhook URL:</span>
                    <span style={styles.value}>
                      {merchant.webhookUrl || "Not configured"}
                    </span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Webhook Secret:</span>
                    <span style={styles.value}>
                      {merchant.webhookSecret ? "••••••••" : "Not set"}
                    </span>
                  </div>
                </div>
                <div>
                  <h4>Security</h4>
                  <div style={styles.infoRow}>
                    <span style={styles.label}>IP Whitelist:</span>
                    <span style={styles.value}>
                      {merchant.allowedIPs?.length
                        ? merchant.allowedIPs.join(", ")
                        : "None"}
                    </span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Rate Limit:</span>
                    <span style={styles.value}>
                      {merchant.rateLimit || "Default"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gateway Tab */}
        {activeTab === "gateway" && (
          <div style={styles.tabContent}>
            <div style={styles.infoCard}>
              <h3>Payment Gateway Configuration</h3>
              <div style={styles.infoGrid}>
                <div>
                  <h4>Chapa Gateway</h4>
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Preferred Gateway:</span>
                    <span style={styles.value}>
                      {merchant.chapa?.preferredGateway || "Not set"}
                    </span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Test Mode:</span>
                    <span style={styles.value}>
                      {merchant.chapa?.testMode ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
                <div>
                  <h4>Gateway Limits</h4>
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Minimum Amount:</span>
                    <span style={styles.value}>
                      {merchant.minAmount || "Not set"}
                    </span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Maximum Amount:</span>
                    <span style={styles.value}>
                      {merchant.maxAmount || "Not set"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* API Tab */}
        {activeTab === "api" && (
          <div style={styles.tabContent}>
            <div style={styles.infoCard}>
              <h3>API Credentials</h3>
              <div style={styles.warningBox}>
                <strong>⚠️ Security Warning</strong>
                <p>
                  API keys provide full access to the merchant account. Keep
                  them secure and never expose them in client-side code.
                </p>
              </div>

              <div style={styles.apiKeySection}>
                <div style={styles.infoRow}>
                  <span style={styles.label}>API Key:</span>
                  <div style={styles.apiKeyContainer}>
                    <code style={styles.apiKey}>
                      {merchant.apiKey || "No API key generated"}
                    </code>
                    <button
                      onClick={() => {
                        if (merchant.apiKey) {
                          navigator.clipboard.writeText(merchant.apiKey);
                          alert("API key copied to clipboard!");
                        }
                      }}
                      style={styles.copyButton}
                      disabled={!merchant.apiKey}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div style={styles.apiActions}>
                  <button
                    onClick={handleRegenerateApiKey}
                    style={styles.dangerButton}
                  >
                    Regenerate API Key
                  </button>
                  <p style={styles.helperText}>
                    This will invalidate the current API key and generate a new
                    one.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "24px",
    background: "#f9fafb",
    minHeight: "100vh",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    gap: "16px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #f3f3f3",
    borderTop: "3px solid #059669",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  header: {
    marginBottom: "32px",
    background: "white",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  backButton: {
    background: "none",
    border: "none",
    color: "#6b7280",
    cursor: "pointer",
    fontSize: "14px",
    padding: "8px 0",
    marginBottom: "16px",
    "&:hover": {
      color: "#374151",
    },
  },
  title: {
    margin: "0 0 8px 0",
    color: "#111827",
  },
  headerActions: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
  },
  statusBadge: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 500,
  },
  activeBadge: {
    background: "#dcfce7",
    color: "#166534",
  },
  inactiveBadge: {
    background: "#fee2e2",
    color: "#991b1b",
  },
  merchantId: {
    fontSize: "12px",
    color: "#6b7280",
    fontFamily: "monospace",
  },
  tabs: {
    display: "flex",
    gap: "4px",
    marginBottom: "24px",
    background: "white",
    padding: "4px",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
  },
  tab: {
    flex: 1,
    padding: "12px 16px",
    border: "none",
    background: "none",
    cursor: "pointer",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 500,
    color: "#6b7280",
  },
  activeTab: {
    background: "#059669",
    color: "white",
  },
  content: {
    background: "white",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  tabContent: {
    minHeight: "400px",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
    marginBottom: "24px",
  },
  infoCard: {
    padding: "24px",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #e5e7eb",
    "&:last-child": {
      borderBottom: "none",
    },
  },
  label: {
    color: "#6b7280",
    fontSize: "14px",
  },
  value: {
    color: "#111827",
    fontWeight: 500,
    fontSize: "14px",
  },
  statusControl: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    marginBottom: "12px",
  },
  statusSelect: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    background: "white",
    flex: 1,
  },
  updateButton: {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    background: "#059669",
    color: "white",
    cursor: "pointer",
    fontWeight: 500,
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  },
  helperText: {
    fontSize: "12px",
    color: "#6b7280",
    marginTop: "8px",
  },
  actionButtons: {
    display: "flex",
    gap: "12px",
    marginTop: "24px",
  },
  primaryButton: {
    padding: "12px 24px",
    borderRadius: "8px",
    border: "none",
    background: "#059669",
    color: "white",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px",
  },
  secondaryButton: {
    padding: "12px 24px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    background: "white",
    color: "#374151",
    cursor: "pointer",
    fontWeight: 500,
    fontSize: "14px",
  },
  dangerButton: {
    padding: "12px 24px",
    borderRadius: "8px",
    border: "1px solid #dc2626",
    background: "white",
    color: "#dc2626",
    cursor: "pointer",
    fontWeight: 500,
    fontSize: "14px",
  },
  errorContainer: {
    padding: "24px",
  },
  errorHeader: {
    marginBottom: "24px",
  },
  errorCard: {
    background: "#fee2e2",
    padding: "24px",
    borderRadius: "12px",
    color: "#991b1b",
  },
  errorDetail: {
    fontSize: "12px",
    fontFamily: "monospace",
    marginTop: "8px",
  },
  notFoundContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    gap: "16px",
  },
  warningBox: {
    background: "#fef3c7",
    border: "1px solid #f59e0b",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "24px",
    color: "#92400e",
  },
  apiKeySection: {
    marginTop: "24px",
  },
  apiKeyContainer: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  apiKey: {
    background: "#f3f4f6",
    padding: "8px 12px",
    borderRadius: "6px",
    fontFamily: "monospace",
    fontSize: "13px",
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  copyButton: {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    background: "white",
    cursor: "pointer",
    fontSize: "14px",
  },
  apiActions: {
    marginTop: "24px",
  },
};

// Add CSS animation for spinner
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(
  `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`,
  styleSheet.cssRules.length,
);
