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

  // Fetch merchant safely
  useEffect(() => {
    if (!merchantId) {
      setError("No merchant ID provided");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function fetchMerchant() {
      try {
        setLoading(true);
        const res = await api.get(`/admin/merchants/${merchantId}`, {
          signal: controller.signal,
        });
        setMerchant(res.data.data);
        setStatus(res.data.data.status);
        setError("");
      } catch (err) {
        if (err.name !== "CanceledError") {
          setError(
            err.response?.data?.error || "Failed to load merchant details",
          );
        }
      } finally {
        setLoading(false);
      }
    }

    fetchMerchant();
    return () => controller.abort();
  }, [merchantId]);

  // Update merchant status
  const updateStatus = async () => {
    if (!merchant || status === merchant.status) return;

    try {
      setUpdating(true);
      await api.patch(`/admin/merchants/${merchantId}`, { status });

      // Refetch to keep state consistent
      const res = await api.get(`/admin/merchants/${merchantId}`);
      setMerchant(res.data.data);
      setStatus(res.data.data.status);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update status");
      setStatus(merchant.status);
    } finally {
      setUpdating(false);
    }
  };

  // Force disconnect Chapa
  const forceDisconnectChapa = async () => {
    const confirmed = window.confirm(
      "Force disconnect Chapa gateway for this merchant?",
    );
    if (!confirmed) return;

    try {
      setUpdating(true);
      await api.post(`/admin/merchants/${merchantId}/disconnect-chapa`);

      const res = await api.get(`/admin/merchants/${merchantId}`);
      setMerchant(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to disconnect Chapa");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.spinner} />
        <p>Loading merchant…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.center}>
        <p style={{ color: "red" }}>{error}</p>
        <button onClick={() => navigate("/admin")}>Back to Admin</button>
      </div>
    );
  }

  if (!merchant) {
    return <p style={styles.center}>Merchant not found</p>;
  }

  return (
    <div style={styles.container}>
      <button onClick={() => navigate("/admin")} style={styles.backButton}>
        ← Back
      </button>

      <h1>{merchant.name}</h1>
      <p style={styles.sub}>Merchant ID: {merchant._id}</p>

      {/* Tabs */}
      <div style={styles.tabs}>
        {["overview", "gateway", "security"].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              ...styles.tab,
              ...(activeTab === t ? styles.activeTab : {}),
            }}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === "overview" && (
        <div style={styles.card}>
          <p>
            <b>Email:</b> {merchant.ownerUserId?.email}
          </p>
          <p>
            <b>Created:</b> {new Date(merchant.createdAt).toDateString()}
          </p>

          <div style={styles.row}>
            <select
              value={status}
              disabled={updating}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>

            <button
              onClick={updateStatus}
              disabled={updating || status === merchant.status}
              style={styles.updateButton}
            >
              {updating ? "Updating…" : "Update Status"}
            </button>
          </div>
        </div>
      )}

      {/* GATEWAY */}
      {activeTab === "gateway" && (
        <div style={styles.card}>
          <h3>Chapa Gateway</h3>

          {merchant.chapa?.connected ? (
            <>
              <p style={{ color: "green" }}>Connected ✅</p>
              <button
                onClick={forceDisconnectChapa}
                disabled={updating}
                style={styles.dangerButton}
              >
                Force Disconnect
              </button>
            </>
          ) : (
            <div style={styles.warning}>
              <p>Not connected</p>
              <p>Merchant must connect Chapa from their own dashboard.</p>
            </div>
          )}
        </div>
      )}

      {/* SECURITY */}
      {activeTab === "security" && (
        <div style={styles.card}>
          <p>
            <b>Webhook URL:</b> {merchant.webhookUrl || "Not set"}
          </p>
          <p>
            <b>Allowed IPs:</b> {merchant.allowedIPs?.join(", ") || "None"}
          </p>
        </div>
      )}
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  container: {
    padding: "24px",
    background: "#f9fafb",
    minHeight: "100vh",
  },
  center: {
    minHeight: "60vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "3px solid #f3f3f3",
    borderTop: "3px solid #059669",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  backButton: {
    background: "none",
    border: "none",
    color: "#6b7280",
    cursor: "pointer",
    marginBottom: "16px",
  },
  tabs: {
    display: "flex",
    gap: "8px",
    marginBottom: "16px",
  },
  tab: {
    padding: "8px 14px",
    border: "1px solid #e5e7eb",
    background: "white",
    cursor: "pointer",
    borderRadius: "6px",
  },
  activeTab: {
    background: "#059669",
    color: "white",
  },
  card: {
    background: "white",
    padding: "20px",
    borderRadius: "10px",
    marginBottom: "16px",
  },
  row: {
    display: "flex",
    gap: "12px",
    marginTop: "12px",
  },
  updateButton: {
    background: "#059669",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "8px 14px",
    cursor: "pointer",
  },
  dangerButton: {
    background: "white",
    color: "#dc2626",
    border: "1px solid #dc2626",
    borderRadius: "6px",
    padding: "8px 14px",
    cursor: "pointer",
  },
  warning: {
    background: "#fef3c7",
    padding: "12px",
    borderRadius: "6px",
  },
};
