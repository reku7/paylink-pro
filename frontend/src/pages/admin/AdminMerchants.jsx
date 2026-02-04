import { useSearchParams } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { privateApi as api } from "../../api/api";

export default function AdminMerchants() {
  const [params] = useSearchParams();
  const merchantId = params.get("merchantId");

  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [status, setStatus] = useState("");
  const [transactions, setTransactions] = useState([]);

  /* ================= FETCH MERCHANT + TRANSACTIONS ================= */
  useEffect(() => {
    if (!merchantId) {
      setError("No merchant ID provided");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function fetchData() {
      try {
        setLoading(true);
        setError("");

        const res = await api.get(
          `/admin/merchants/${merchantId}?includeTransactions=true`,
          { signal: controller.signal },
        );

        const { merchant: fetchedMerchant, transactions: fetchedTx } =
          res.data.data;

        setMerchant(fetchedMerchant);
        setStatus(fetchedMerchant.status);
        setTransactions(fetchedTx || []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.response?.data?.error || "Failed to load merchant data");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    return () => controller.abort();
  }, [merchantId]);

  /* ================= UPDATE STATUS ================= */
  const updateStatus = async () => {
    if (!merchant || status === merchant.status) return;

    try {
      setUpdating(true);
      setError("");
      await api.patch(`/admin/merchants/${merchantId}`, { status });

      const refreshed = await api.get(`/admin/merchants/${merchantId}`);
      setMerchant(refreshed.data.data);
      setStatus(refreshed.data.data.status);
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
      setError("");
      await api.post(`/admin/merchants/${merchantId}/disconnect-chapa`);

      const refreshed = await api.get(`/admin/merchants/${merchantId}`);
      setMerchant(refreshed.data.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to disconnect Chapa");
    } finally {
      setUpdating(false);
    }
  };

  /* ================= HELPERS ================= */
  const getStatusColor = useCallback((status) => {
    switch (status) {
      case "active":
        return "#059669";
      case "inactive":
        return "#b45309";
      case "pending":
        return "#f59e0b";
      case "suspended":
        return "#dc2626";
      default:
        return "#6b7280";
    }
  }, []);

  const formatDate = useCallback((dateString) => {
    return dateString ? new Date(dateString).toLocaleString() : "N/A";
  }, []);

  /* ================= UI ================= */
  if (loading)
    return (
      <div style={styles.center}>
        <p>Loading merchant…</p>
      </div>
    );
  if (!merchant)
    return (
      <div style={styles.center}>
        <p>{error || "Merchant not found"}</p>
      </div>
    );

  return (
    <div style={styles.container}>
      <h1>{merchant.name}</h1>
      {error && <div style={styles.error}>{error}</div>}

      {/* Tabs */}
      <div style={styles.tabs}>
        {["overview", "gateway", "transactions"].map((tab) => (
          <button
            key={tab}
            style={activeTab === tab ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab(tab)}
            disabled={updating}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ========== OVERVIEW ========== */}
      {activeTab === "overview" && (
        <div style={styles.card}>
          <p>
            <strong>Owner:</strong> {merchant.ownerUserId?.email || "N/A"}
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

      {/* ========== GATEWAYS ========== */}
      {activeTab === "gateway" && (
        <div style={styles.card}>
          <div style={styles.gatewayRow}>
            <div>
              <strong>SantimPay</strong>
              <p style={{ color: "#059669" }}>Connected (System Default)</p>
            </div>
          </div>
          <hr />
          <div style={styles.gatewayRow}>
            <div>
              <strong>Chapa</strong>
              <p
                style={{
                  color: merchant.chapa?.connected ? "#059669" : "#b45309",
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

      {/* ========== TRANSACTIONS ========== */}
      {activeTab === "transactions" && (
        <div style={styles.card}>
          <h3>Transactions</h3>
          {transactions.length === 0 ? (
            <p>No transactions available</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Gateway</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx._id || tx.id}>
                      <td>{tx.internalRef?.slice(0, 15)}...</td>
                      <td>
                        {tx.amount?.toLocaleString()} {tx.currency || "ETB"}
                      </td>
                      <td
                        style={{
                          color: getStatusColor(tx.status),
                          fontWeight: 500,
                        }}
                      >
                        {tx.status}
                      </td>
                      <td>{tx.gateway}</td>
                      <td>{formatDate(tx.createdAt || tx.paidAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
    marginBottom: 20,
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
  table: { width: "100%", borderCollapse: "collapse" },
};
