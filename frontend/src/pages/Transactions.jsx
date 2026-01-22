import { useEffect, useState } from "react";
import { privateApi as api } from "../api/api";

export default function Transactions() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError("");

        // FIXED: Use correct endpoint from your backend
        // Option 1: If you have merchant transactions endpoint
        const res = await api.get("/dashboard/transactions", {
          params: {
            page: 1,
            limit: 50,
          },
        });

        // Adjust based on your backend response structure
        const transactions =
          res.data.data || res.data.transactions || res.data || [];
        setTxs(transactions);
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
        setError(
          err.response?.data?.message ||
            "Failed to load transactions. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Helper functions for styling
  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "#4caf50";
      case "failed":
        return "#f44336";
      case "processing":
        return "#ff9800";
      case "initialized":
        return "#2196f3";
      default:
        return "#757575";
    }
  };

  const getGatewayIcon = (gateway) => {
    switch (gateway) {
      case "santimpay":
        return "🟢";
      case "chapa":
        return "🔵";
      default:
        return "⚫";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2>Transactions</h2>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "8px 16px",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p>Loading transactions...</p>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "15px",
            background: "#ffebee",
            color: "#c62828",
            borderRadius: "4px",
            marginBottom: "20px",
          }}
        >
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Summary Stats */}
          <div
            style={{
              display: "flex",
              gap: "15px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                padding: "10px 15px",
                background: "#e8f5e9",
                borderRadius: "6px",
                minWidth: "120px",
              }}
            >
              <p style={{ fontSize: "12px", color: "#666" }}>
                Total Transactions
              </p>
              <p style={{ fontSize: "24px", fontWeight: "bold" }}>
                {txs.length}
              </p>
            </div>

            <div
              style={{
                padding: "10px 15px",
                background: "#e3f2fd",
                borderRadius: "6px",
                minWidth: "120px",
              }}
            >
              <p style={{ fontSize: "12px", color: "#666" }}>SantimPay</p>
              <p style={{ fontSize: "24px", fontWeight: "bold" }}>
                {txs.filter((tx) => tx.gateway === "santimpay").length}
              </p>
            </div>

            <div
              style={{
                padding: "10px 15px",
                background: "#fff3e0",
                borderRadius: "6px",
                minWidth: "120px",
              }}
            >
              <p style={{ fontSize: "12px", color: "#666" }}>Chapa</p>
              <p style={{ fontSize: "24px", fontWeight: "bold" }}>
                {txs.filter((tx) => tx.gateway === "chapa").length}
              </p>
            </div>
          </div>

          <div
            style={{
              overflowX: "auto",
              borderRadius: "8px",
              border: "1px solid #e0e0e0",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "800px",
              }}
            >
              <thead>
                <tr style={{ background: "#f5f5f5" }}>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      borderBottom: "1px solid #e0e0e0",
                      fontWeight: "600",
                    }}
                  >
                    Reference
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      borderBottom: "1px solid #e0e0e0",
                      fontWeight: "600",
                    }}
                  >
                    Amount
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      borderBottom: "1px solid #e0e0e0",
                      fontWeight: "600",
                    }}
                  >
                    Date
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      borderBottom: "1px solid #e0e0e0",
                      fontWeight: "600",
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: "12px",
                      textAlign: "left",
                      borderBottom: "1px solid #e0e0e0",
                      fontWeight: "600",
                    }}
                  >
                    Gateway
                  </th>
                </tr>
              </thead>

              <tbody>
                {txs.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      style={{
                        textAlign: "center",
                        padding: "40px",
                        color: "#666",
                      }}
                    >
                      <p>No transactions found</p>
                      <p style={{ marginTop: "10px", fontSize: "14px" }}>
                        Create your first payment link to see transactions here
                      </p>
                    </td>
                  </tr>
                ) : (
                  txs.map((tx) => (
                    <tr
                      key={tx._id || tx.internalRef}
                      style={{
                        borderBottom: "1px solid #f0f0f0",
                        transition: "background 0.2s",
                      }}
                    >
                      <td
                        style={{
                          padding: "12px",
                          fontFamily: "monospace",
                          fontSize: "13px",
                        }}
                      >
                        {tx.internalRef?.slice(0, 15)}...
                      </td>
                      <td style={{ padding: "12px", fontWeight: "500" }}>
                        {tx.amount?.toLocaleString()} {tx.currency || "ETB"}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          color: "#666",
                          fontSize: "14px",
                        }}
                      >
                        {formatDate(tx.createdAt || tx.paidAt)}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            background: getStatusColor(tx.status) + "20",
                            color: getStatusColor(tx.status),
                            fontWeight: "500",
                            fontSize: "13px",
                          }}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span style={{ fontSize: "18px" }}>
                            {getGatewayIcon(tx.gateway)}
                          </span>
                          <span
                            style={{
                              textTransform: "capitalize",
                              fontWeight: "500",
                            }}
                          >
                            {tx.gateway === "santimpay"
                              ? "SantimPay (Type A)"
                              : "Chapa (Type B Lite)"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination (if your backend supports it) */}
          {txs.length > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "20px",
                padding: "15px",
                background: "#f9f9f9",
                borderRadius: "6px",
              }}
            >
              <div>Showing {txs.length} transactions</div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  style={{
                    padding: "6px 12px",
                    background: "#e0e0e0",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Previous
                </button>
                <button
                  style={{
                    padding: "6px 12px",
                    background: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
