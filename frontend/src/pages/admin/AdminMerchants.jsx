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

  /* ================= FETCH MERCHANT ================= */
  useEffect(() => {
    if (!merchantId) {
      setError("No merchant ID provided");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchMerchant = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get(`/admin/merchants/${merchantId}`, {
          signal: controller.signal,
        });

        setMerchant(res.data.data);
        setStatus(res.data.data.status);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err.response?.data?.error || "Failed to load merchant details",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchMerchant();
    return () => controller.abort();
  }, [merchantId]);

  /* ================= UPDATE STATUS ================= */
  const updateStatus = async () => {
    if (!merchant || status === merchant.status) return;

    try {
      setUpdating(true);
      await api.patch(`/admin/merchants/${merchantId}`, { status });

      const res = await api.get(`/admin/merchants/${merchantId}`);
      setMerchant(res.data.data);
      setStatus(res.data.data.status);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update status");
      setStatus(merchant.status);
    } finally {
      setUpdating(false);
    }
  };

  /* ================= DISCONNECT CHAPA ================= */
  const forceDisconnectChapa = async () => {
    if (
      !window.confirm(
        "Are you sure you want to disconnect Chapa? The merchant will no longer process payments.",
      )
    )
      return;

    try {
      setUpdating(true);
      await api.post(`/admin/merchants/${merchantId}/disconnect-chapa`);

      const res = await api.get(`/admin/merchants/${merchantId}`);
      setMerchant(res.data.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to disconnect Chapa");
    } finally {
      setUpdating(false);
    }
  };

  /* ================= NAVIGATION ================= */
  const viewTransactions = () => {
    navigate(`/admin/transactions?merchantId=${merchantId}`);
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.spinner} />
        <p>Loading merchant details...</p>
      </div>
    );
  }

  /* ================= NOT FOUND ================= */
  if (!merchant && !error) {
    return (
      <div style={styles.center}>
        <p>Merchant not found</p>
        <button onClick={() => navigate("/admin")} style={styles.primaryButton}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const statusBadge = {
    active: { background: "#dcfce7", color: "#166534" },
    inactive: { background: "#e5e7eb", color: "#374151" },
    pending: { background: "#fef3c7", color: "#92400e" },
    suspended: { background: "#fee2e2", color: "#991b1b" },
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <button onClick={() => navigate("/admin")} style={styles.backButton}>
          ← Back
        </button>
        <h1>{merchant?.name}</h1>
        <span style={{ ...styles.badge, ...statusBadge[merchant.status] }}>
          {merchant.status}
        </span>
      </div>

      {/* ERROR */}
      {error && (
        <div style={styles.error}>
          {error}
          <button onClick={() => setError("")} style={styles.closeError}>
            ×
          </button>
        </div>
      )}

      {/* TABS */}
      <div style={styles.tabs}>
        {["overview", "gateway", "security"].map((tab) => (
          <button
            key={tab}
            style={tab === activeTab ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab.toUpperCase()}
          </button>
        ))}
        <button style={styles.tab} onClick={viewTransactions}>
          TRANSACTIONS
        </button>
      </div>

      {/* OVERVIEW */}
      {activeTab === "overview" && (
        <div style={styles.card}>
          <p>
            <strong>Email:</strong> {merchant.ownerUserId?.email || "—"}
          </p>
          <p>
            <strong>Currency:</strong> {merchant.currency || "ETB"}
          </p>

          <select
            value={status}
            disabled={updating}
            onChange={(e) => setStatus(e.target.value)}
          >
            {["active", "inactive", "pending", "suspended"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <button
            disabled={updating || status === merchant.status}
            onClick={updateStatus}
            style={styles.primaryButton}
          >
            {updating ? "Updating..." : "Update Status"}
          </button>
        </div>
      )}

      {/* GATEWAY */}
      {activeTab === "gateway" && (
        <div style={styles.card}>
          {merchant.chapa?.connected ? (
            <>
              <p style={{ color: "green" }}>Chapa Connected</p>
              <p>
                <strong>Mode:</strong>{" "}
                {merchant.chapa?.testMode ? "Test" : "Live"}
              </p>
              <button
                onClick={forceDisconnectChapa}
                disabled={updating}
                style={styles.dangerButton}
              >
                {updating ? "Disconnecting..." : "Disconnect Chapa"}
              </button>
            </>
          ) : (
            <p style={{ color: "#b45309" }}>Chapa Not Connected</p>
          )}
        </div>
      )}

      {/* SECURITY */}
      {activeTab === "security" && (
        <div style={styles.card}>
          <p>
            <strong>Webhook URL:</strong> {merchant.webhookUrl || "Not set"}
          </p>
          <p>
            <strong>Webhook Secret:</strong>{" "}
            {merchant.webhookSecret ? "••••••••" : "Not set"}
          </p>
          <p>
            <strong>Allowed IPs:</strong>{" "}
            {merchant.allowedIPs?.join(", ") || "All allowed"}
          </p>
        </div>
      )}
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  container: { padding: 24, background: "#f9fafb", minHeight: "100vh" },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
  },
  spinner: {
    width: 36,
    height: 36,
    border: "4px solid #e5e7eb",
    borderTop: "4px solid #059669",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  header: { marginBottom: 16 },
  backButton: { background: "none", border: "none", cursor: "pointer" },
  badge: { padding: "4px 12px", borderRadius: 12, fontWeight: 500 },
  error: {
    background: "#fee2e2",
    padding: 12,
    borderRadius: 6,
    position: "relative",
  },
  closeError: {
    position: "absolute",
    right: 8,
    top: 4,
    background: "none",
    border: "none",
    cursor: "pointer",
  },
  tabs: { display: "flex", gap: 8, marginBottom: 16 },
  tab: { padding: 8, background: "#e5e7eb", border: "none", cursor: "pointer" },
  activeTab: {
    padding: 8,
    background: "#059669",
    color: "#fff",
    border: "none",
  },
  card: { background: "#fff", padding: 16, borderRadius: 8 },
  primaryButton: {
    background: "#059669",
    color: "#fff",
    padding: "8px 16px",
    border: "none",
    cursor: "pointer",
  },
  dangerButton: {
    background: "#dc2626",
    color: "#fff",
    padding: "8px 16px",
    border: "none",
    cursor: "pointer",
  },
};

/* Add spinner animation globally */
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(
  `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`,
  styleSheet.cssRules.length,
);
