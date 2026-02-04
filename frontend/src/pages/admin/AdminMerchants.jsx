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

    async function fetchMerchant() {
      try {
        setLoading(true);
        const res = await api.get(`/admin/merchants/${merchantId}`, {
          signal: controller.signal,
        });
        setMerchant(res.data.data);
        setStatus(res.data.data.status);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.response?.data?.error || "Failed to load merchant");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchMerchant();
    return () => controller.abort();
  }, [merchantId]);

  /* ================= UPDATE STATUS ================= */
  const updateStatus = async () => {
    if (!merchant || status === merchant.status) return;

    try {
      setUpdating(true);
      await api.patch(`/admin/merchants/${merchantId}`, { status });

      const refreshed = await api.get(`/admin/merchants/${merchantId}`);
      setMerchant(refreshed.data.data);
      setStatus(refreshed.data.data.status);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update status");
      setStatus(merchant.status);
    } finally {
      setUpdating(false);
    }
  };

  /* ================= FORCE DISCONNECT CHAPA ================= */
  const forceDisconnectChapa = async () => {
    if (
      !window.confirm(
        "Force disconnect Chapa? Merchant will not process Chapa payments.",
      )
    )
      return;

    try {
      setUpdating(true);
      await api.post(`/admin/merchants/${merchantId}/disconnect-chapa`);

      const refreshed = await api.get(`/admin/merchants/${merchantId}`);
      setMerchant(refreshed.data.data);
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

  /* ================= UI STATES ================= */
  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.spinner} />
        <p>Loading merchant…</p>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div style={styles.center}>
        <p>{error || "Merchant not found"}</p>
        <button onClick={() => navigate("/admin")} style={styles.primaryButton}>
          Back
        </button>
      </div>
    );
  }

  /* ================= MAIN UI ================= */
  return (
    <div style={styles.container}>
      <h1>{merchant.name}</h1>

      {error && <div style={styles.error}>{error}</div>}

      {/* Tabs */}
      <div style={styles.tabs}>
        {["overview", "gateway", "transactions"].map((t) => (
          <button
            key={t}
            style={activeTab === t ? styles.activeTab : styles.tab}
            onClick={() =>
              t === "transactions" ? viewTransactions() : setActiveTab(t)
            }
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ================= OVERVIEW ================= */}
      {activeTab === "overview" && (
        <div style={styles.card}>
          <p>
            <strong>Owner:</strong> {merchant.ownerUserId?.email}
          </p>
          <p>
            <strong>Status:</strong> {merchant.status}
          </p>

          <select
            value={status}
            disabled={updating}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>

          <button
            onClick={updateStatus}
            disabled={updating || status === merchant.status}
            style={styles.primaryButton}
          >
            {updating ? "Updating…" : "Update Status"}
          </button>
        </div>
      )}

      {/* ================= GATEWAYS ================= */}
      {activeTab === "gateway" && (
        <div style={styles.card}>
          {/* SantimPay – DEFAULT */}
          <div style={styles.gatewayRow}>
            <div>
              <strong>SantimPay</strong>
              <p style={{ color: "green" }}>Connected (Default)</p>
            </div>
          </div>

          <hr />

          {/* Chapa – OPTIONAL */}
          <div style={styles.gatewayRow}>
            <div>
              <strong>Chapa</strong>
              <p
                style={{
                  color: merchant.chapa?.connected ? "green" : "#b45309",
                }}
              >
                {merchant.chapa?.connected ? "Connected" : "Not Connected"}
              </p>
            </div>

            {merchant.chapa?.connected && (
              <button
                onClick={forceDisconnectChapa}
                disabled={updating}
                style={styles.dangerButton}
              >
                Disconnect
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  container: { padding: 24 },
  center: {
    minHeight: "60vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  spinner: {
    width: 40,
    height: 40,
    border: "4px solid #eee",
    borderTop: "4px solid #059669",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  error: {
    background: "#fee2e2",
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    color: "#991b1b",
  },
  tabs: { display: "flex", gap: 8, marginBottom: 20 },
  tab: { padding: 10, cursor: "pointer" },
  activeTab: {
    padding: 10,
    background: "#059669",
    color: "white",
    cursor: "pointer",
  },
  card: {
    background: "white",
    padding: 20,
    borderRadius: 8,
    boxShadow: "0 1px 3px rgba(0,0,0,.1)",
  },
  primaryButton: {
    marginTop: 10,
    padding: "8px 16px",
    background: "#059669",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  dangerButton: {
    padding: "6px 12px",
    border: "1px solid #dc2626",
    background: "white",
    color: "#dc2626",
    cursor: "pointer",
  },
  gatewayRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
};
