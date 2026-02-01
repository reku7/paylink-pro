import { useEffect, useState } from "react";
import { privateApi as api } from "../api/api";

export default function Transactions() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await api.get("/dashboard/transactions", {
          params: { page: 1, limit: 50 },
        });

        setTxs(res.data.data || []);
      } catch (err) {
        setError("Failed to load transactions");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Transactions</h2>
          <button
            onClick={() => window.location.reload()}
            style={styles.refresh}
          >
            Refresh
          </button>
        </div>

        {/* States */}
        {loading && <p style={styles.center}>Loading transactions...</p>}
        {error && <div style={styles.error}>{error}</div>}

        {!loading && !error && (
          <>
            {/* Stats */}
            <div style={styles.stats}>
              <Stat label="Total" value={txs.length} />
              <Stat
                label="SantimPay"
                value={txs.filter((t) => t.gateway === "santimpay").length}
              />
              <Stat
                label="Chapa"
                value={txs.filter((t) => t.gateway === "chapa").length}
              />
            </div>

            {/* Table */}
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Gateway</th>
                  </tr>
                </thead>

                <tbody>
                  {txs.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={styles.empty}>
                        No transactions yet
                      </td>
                    </tr>
                  ) : (
                    txs.map((tx) => (
                      <tr key={tx._id}>
                        <td style={styles.mono}>
                          {tx.internalRef?.slice(0, 14)}…
                        </td>
                        <td>
                          {tx.amount?.toLocaleString()} {tx.currency || "ETB"}
                        </td>
                        <td>{formatDate(tx.createdAt)}</td>
                        <td>
                          <span style={badge(tx.status)}>{tx.status}</span>
                        </td>
                        <td style={{ textTransform: "capitalize" }}>
                          {tx.gateway}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */

const Stat = ({ label, value }) => (
  <div style={styles.stat}>
    <p style={styles.statLabel}>{label}</p>
    <p style={styles.statValue}>{value}</p>
  </div>
);

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const badge = (status) => ({
  padding: "4px 10px",
  borderRadius: "999px",
  fontSize: "13px",
  fontWeight: 500,
  background:
    status === "success"
      ? "#dcfce7"
      : status === "failed"
        ? "#fee2e2"
        : "#e5e7eb",
  color:
    status === "success"
      ? "#166534"
      : status === "failed"
        ? "#991b1b"
        : "#374151",
});

/* ---------- CLEAN STYLES ---------- */

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f9fafb",
    padding: "48px 24px",
  },

  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    background: "#fff",
    borderRadius: "14px",
    padding: "32px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  title: {
    fontSize: 24,
    fontWeight: 700,
  },

  refresh: {
    padding: "8px 14px",
    background: "#059669",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },

  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
    marginBottom: 28,
  },

  stat: {
    padding: 16,
    background: "#f3f4f6",
    borderRadius: 10,
  },

  statLabel: {
    fontSize: 13,
    color: "#6b7280",
  },

  statValue: {
    fontSize: 22,
    fontWeight: 700,
  },

  tableWrap: {
    overflowX: "auto",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  mono: {
    fontFamily: "monospace",
    fontSize: 13,
  },

  empty: {
    padding: 40,
    textAlign: "center",
    color: "#6b7280",
  },

  error: {
    padding: 14,
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: 8,
    marginBottom: 20,
  },

  center: {
    textAlign: "center",
    padding: 40,
  },
};
