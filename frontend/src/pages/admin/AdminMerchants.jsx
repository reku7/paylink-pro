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
  const [success, setSuccess] = useState("");
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalVolume: 0,
    successRate: 0,
    avgTransaction: 0,
  });

  // Transaction pagination and filtering
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsTotal, setTransactionsTotal] = useState(0);
  const [transactionFilter, setTransactionFilter] = useState({
    status: "",
    gateway: "",
    dateFrom: "",
    dateTo: "",
  });
  const transactionsPerPage = 10;

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

        // Fetch merchant with transactions included (as in your original code)
        const merchantRes = await api.get(
          `/admin/merchants/${merchantId}?includeTransactions=true`,
          { signal: controller.signal },
        );

        const { merchant: fetchedMerchant, transactions: fetchedTx = [] } =
          merchantRes.data.data;

        setMerchant(fetchedMerchant);
        setStatus(fetchedMerchant?.status || "");
        setTransactions(fetchedTx || []);

        // Calculate statistics
        if (fetchedTx && fetchedTx.length > 0) {
          const successful = fetchedTx.filter((tx) => tx.status === "success");
          const totalVolume = fetchedTx.reduce(
            (sum, tx) => sum + (tx.amount || 0),
            0,
          );

          setStats({
            totalTransactions: fetchedTx.length,
            totalVolume,
            successRate:
              fetchedTx.length > 0
                ? (successful.length / fetchedTx.length) * 100
                : 0,
            avgTransaction:
              fetchedTx.length > 0 ? totalVolume / fetchedTx.length : 0,
          });
          setTransactionsTotal(fetchedTx.length);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          const errorMsg =
            err.response?.data?.error || "Failed to load merchant data";
          setError(errorMsg);
          console.error("Fetch error:", err);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    return () => controller.abort();
  }, [merchantId]); // Removed transactionsPage and transactionFilter dependencies

  /* ================= UPDATE STATUS ================= */
  const updateStatus = async () => {
    if (!merchant || status === merchant.status) return;

    const confirmMessage = `Change merchant status from "${merchant.status}" to "${status}"?`;
    if (!window.confirm(confirmMessage)) {
      setStatus(merchant.status);
      return;
    }

    try {
      setUpdating(true);
      setError("");
      await api.patch(`/admin/merchants/${merchantId}`, { status });

      setSuccess("Status updated successfully");
      setTimeout(() => setSuccess(""), 3000);

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
        "Force disconnect Chapa? Merchant will not process Chapa payments. This action cannot be undone.",
      )
    )
      return;

    try {
      setUpdating(true);
      setError("");
      await api.post(`/admin/merchants/${merchantId}/disconnect-chapa`);

      setSuccess("Chapa disconnected successfully");
      setTimeout(() => setSuccess(""), 3000);

      const refreshed = await api.get(`/admin/merchants/${merchantId}`);
      setMerchant(refreshed.data.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to disconnect Chapa");
    } finally {
      setUpdating(false);
    }
  };

  /* ================= EXPORT TRANSACTIONS ================= */
  const exportTransactions = async () => {
    try {
      setUpdating(true);
      // Use the original endpoint that includes transactions
      const response = await api.get(
        `/admin/merchants/${merchantId}?includeTransactions=true`,
      );
      const transactions = response.data.data.transactions || [];

      if (transactions.length === 0) {
        setError("No transactions to export");
        return;
      }

      // Create CSV content
      const headers = [
        "Reference",
        "Amount",
        "Currency",
        "Status",
        "Gateway",
        "Date",
        "Customer",
      ];
      const csvRows = [
        headers.join(","),
        ...transactions.map((tx) =>
          [
            `"${tx.internalRef || ""}"`,
            tx.amount || 0,
            `"${tx.currency || "ETB"}"`,
            `"${tx.status || ""}"`,
            `"${tx.gateway || ""}"`,
            `"${formatDate(tx.createdAt || tx.paidAt)}"`,
            `"${tx.customerEmail || tx.customerPhone || ""}"`,
          ].join(","),
        ),
      ];

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `transactions-${merchant?.name?.replace(/\s+/g, "-") || merchantId}-${Date.now()}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      setSuccess("Transactions exported successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to export transactions");
    } finally {
      setUpdating(false);
    }
  };

  /* ================= HELPERS ================= */
  const getStatusColor = useCallback((status) => {
    if (!status) return "#6b7280";
    switch (status.toLowerCase()) {
      case "active":
      case "success":
        return "#059669";
      case "inactive":
        return "#b45309";
      case "pending":
        return "#f59e0b";
      case "suspended":
      case "failed":
        return "#dc2626";
      default:
        return "#6b7280";
    }
  }, []);

  const formatDate = useCallback((dateString) => {
    return dateString ? new Date(dateString).toLocaleString() : "N/A";
  }, []);

  const formatCurrency = useCallback((amount, currency = "ETB") => {
    return `${amount?.toLocaleString() || 0} ${currency}`;
  }, []);

  // Filter transactions based on filter criteria (client-side)
  const filteredTransactions = useCallback(() => {
    return transactions.filter((tx) => {
      if (transactionFilter.status && tx.status !== transactionFilter.status)
        return false;
      if (transactionFilter.gateway && tx.gateway !== transactionFilter.gateway)
        return false;
      if (transactionFilter.dateFrom || transactionFilter.dateTo) {
        const txDate = new Date(tx.createdAt || tx.paidAt);
        if (transactionFilter.dateFrom) {
          const fromDate = new Date(transactionFilter.dateFrom);
          if (txDate < fromDate) return false;
        }
        if (transactionFilter.dateTo) {
          const toDate = new Date(transactionFilter.dateTo);
          toDate.setHours(23, 59, 59, 999); // End of day
          if (txDate > toDate) return false;
        }
      }
      return true;
    });
  }, [transactions, transactionFilter]);

  // Calculate pagination for filtered transactions
  const displayedTransactions = filteredTransactions();
  const totalPages = Math.ceil(
    displayedTransactions.length / transactionsPerPage,
  );
  const paginatedTransactions = displayedTransactions.slice(
    (transactionsPage - 1) * transactionsPerPage,
    transactionsPage * transactionsPerPage,
  );

  /* ================= UI ================= */
  if (loading)
    return (
      <div style={styles.center}>
        <div style={styles.spinner}></div>
        <p>Loading merchant details...</p>
      </div>
    );

  if (error && !merchant)
    return (
      <div style={styles.center}>
        <p style={styles.errorText}>{error || "Merchant not found"}</p>
        <button
          style={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );

  if (!merchant) return null;

  return (
    <div style={styles.container} className="mobile-padding">
      <h1 style={styles.title}>{merchant.name}</h1>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {/* Tabs */}
      <div style={styles.tabs}>
        {["overview", "gateway", "transactions"].map((tab) => (
          <button
            key={tab}
            style={activeTab === tab ? styles.activeTab : styles.tab}
            onClick={() => {
              setActiveTab(tab);
              setTransactionsPage(1); // Reset to first page when switching tabs
            }}
            disabled={updating}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ========== OVERVIEW ========== */}
      {activeTab === "overview" && (
        <div>
          {/* Statistics Cards */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <h4>Total Transactions</h4>
              <p style={styles.statNumber}>{stats.totalTransactions}</p>
            </div>
            <div style={styles.statCard}>
              <h4>Total Volume</h4>
              <p style={styles.statNumber}>
                {formatCurrency(stats.totalVolume)}
              </p>
            </div>
            <div style={styles.statCard}>
              <h4>Success Rate</h4>
              <p style={styles.statNumber}>{stats.successRate.toFixed(1)}%</p>
            </div>
            <div style={styles.statCard}>
              <h4>Avg Transaction</h4>
              <p style={styles.statNumber}>
                {formatCurrency(stats.avgTransaction)}
              </p>
            </div>
          </div>

          {/* Merchant Details Card */}
          <div style={styles.card}>
            <div style={styles.detailRow}>
              <div style={styles.detailLabel}>Merchant ID:</div>
              <div style={styles.detailValue}>{merchantId}</div>
            </div>
            <div style={styles.detailRow}>
              <div style={styles.detailLabel}>Owner Email:</div>
              <div style={styles.detailValue}>
                {merchant.ownerUserId?.email || "N/A"}
              </div>
            </div>
            <div style={styles.detailRow}>
              <div style={styles.detailLabel}>Created:</div>
              <div style={styles.detailValue}>
                {formatDate(merchant.createdAt)}
              </div>
            </div>

            <hr style={styles.divider} />

            <div style={styles.statusSection}>
              <div>
                <strong>Current Status:</strong>
                <span
                  style={{
                    color: getStatusColor(merchant.status),
                    fontWeight: 600,
                    marginLeft: 8,
                  }}
                >
                  {(merchant.status || "").toUpperCase()}
                </span>
              </div>

              <div style={styles.statusControls}>
                <select
                  value={status}
                  disabled={updating}
                  onChange={(e) => setStatus(e.target.value)}
                  style={styles.statusSelect}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>

                <button
                  onClick={updateStatus}
                  disabled={updating || status === merchant.status}
                  style={{
                    ...styles.primaryButton,
                    opacity: updating || status === merchant.status ? 0.6 : 1,
                  }}
                >
                  {updating ? "Updating..." : "Update Status"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== GATEWAYS ========== */}
      {activeTab === "gateway" && (
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Payment Gateways</h3>

          <div style={styles.gatewayCard}>
            <div style={styles.gatewayRow}>
              <div>
                <strong>SantimPay</strong>
                <p style={{ color: "#059669", marginTop: 4 }}>Connected</p>
              </div>
              <div style={styles.gatewayBadgeConnected}>Always Active</div>
            </div>
          </div>

          <div style={styles.gatewayCard}>
            <div style={styles.gatewayRow}>
              <div>
                <strong>Chapa</strong>
                <p
                  style={{
                    color: merchant.chapa?.connected ? "#059669" : "#b45309",
                    marginTop: 4,
                  }}
                >
                  {merchant.chapa?.connected ? "Connected" : "Not Connected"}
                  {merchant.chapa?.connected &&
                    merchant.chapa?.accountName &&
                    ` - ${merchant.chapa.accountName}`}
                </p>
              </div>

              <div>
                {merchant.chapa?.connected ? (
                  <>
                    <div style={styles.gatewayBadgeConnected}>Connected</div>
                    <button
                      onClick={forceDisconnectChapa}
                      disabled={updating}
                      style={styles.dangerButton}
                    >
                      {updating ? "Disconnecting..." : "Disconnect"}
                    </button>
                  </>
                ) : (
                  <div style={styles.gatewayBadgeDisconnected}>
                    Not Connected
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== TRANSACTIONS ========== */}
      {activeTab === "transactions" && (
        <div style={styles.card}>
          <div style={styles.transactionHeader}>
            <h3 style={styles.sectionTitle}>Transactions</h3>
            <button
              onClick={exportTransactions}
              disabled={updating || transactions.length === 0}
              style={{
                ...styles.exportButton,
                opacity: updating || transactions.length === 0 ? 0.6 : 1,
              }}
            >
              {updating ? "Exporting..." : "Export CSV"}
            </button>
          </div>

          {/* Filters */}
          <div style={styles.filterContainer} className="mobile-stack">
            s{" "}
            <select
              value={transactionFilter.status}
              onChange={(e) => {
                setTransactionFilter((f) => ({ ...f, status: e.target.value }));
                setTransactionsPage(1);
              }}
              style={styles.filterSelect}
              disabled={updating}
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={transactionFilter.gateway}
              onChange={(e) => {
                setTransactionFilter((f) => ({
                  ...f,
                  gateway: e.target.value,
                }));
                setTransactionsPage(1);
              }}
              style={styles.filterSelect}
              disabled={updating}
            >
              <option value="">All Gateways</option>
              <option value="santimpay">SantimPay</option>
              <option value="chapa">Chapa</option>
            </select>
            <input
              type="date"
              value={transactionFilter.dateFrom}
              onChange={(e) => {
                setTransactionFilter((f) => ({
                  ...f,
                  dateFrom: e.target.value,
                }));
                setTransactionsPage(1);
              }}
              style={styles.filterDate}
              disabled={updating}
            />
            <input
              type="date"
              value={transactionFilter.dateTo}
              onChange={(e) => {
                setTransactionFilter((f) => ({ ...f, dateTo: e.target.value }));
                setTransactionsPage(1);
              }}
              style={styles.filterDate}
              disabled={updating}
            />
            <button
              onClick={() => {
                setTransactionFilter({
                  status: "",
                  gateway: "",
                  dateFrom: "",
                  dateTo: "",
                });
                setTransactionsPage(1);
              }}
              style={styles.secondaryButton}
              disabled={updating}
            >
              Clear Filters
            </button>
          </div>

          {displayedTransactions.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No transactions found</p>
              {transactions.length > 0 && (
                <p style={styles.emptyHint}>Try adjusting your filters</p>
              )}
            </div>
          ) : (
            <>
              <div className="table-scroll">
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.tableHeader}>Reference</th>
                      <th style={styles.tableHeader}>Amount</th>
                      <th style={styles.tableHeader}>Status</th>
                      <th style={styles.tableHeader}>Gateway</th>
                      <th style={styles.tableHeader}>Date</th>
                      <th style={styles.tableHeader}>Customer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTransactions.map((tx) => (
                      <tr key={tx._id || tx.id} style={styles.tableRow}>
                        <td style={styles.tableCell}>
                          <span style={styles.refCode}>
                            {tx.internalRef?.slice(0, 15)}...
                          </span>
                        </td>
                        <td style={styles.tableCell}>
                          {formatCurrency(tx.amount, tx.currency)}
                        </td>
                        <td style={styles.tableCell}>
                          <span
                            style={{
                              color: getStatusColor(tx.status),
                              fontWeight: 600,
                              padding: "4px 8px",
                              borderRadius: 4,
                              background: `${getStatusColor(tx.status)}10`,
                            }}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td style={styles.tableCell}>{tx.gateway || "N/A"}</td>
                        <td style={styles.tableCell}>
                          {formatDate(tx.createdAt || tx.paidAt)}
                        </td>
                        <td style={styles.tableCell}>
                          {tx.customerEmail || tx.customerPhone || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={styles.pagination}>
                  <button
                    disabled={transactionsPage === 1 || updating}
                    onClick={() => setTransactionsPage((p) => p - 1)}
                    style={{
                      ...styles.pageButton,
                      opacity: transactionsPage === 1 || updating ? 0.6 : 1,
                    }}
                  >
                    Previous
                  </button>
                  <span style={styles.pageInfo}>
                    Page {transactionsPage} of {totalPages} (
                    {displayedTransactions.length} transactions)
                  </span>
                  <button
                    disabled={transactionsPage >= totalPages || updating}
                    onClick={() => setTransactionsPage((p) => p + 1)}
                    style={{
                      ...styles.pageButton,
                      opacity:
                        transactionsPage >= totalPages || updating ? 0.6 : 1,
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  container: {
    padding: 24,
    maxWidth: 1200,
    margin: "0 auto",
  },
  center: {
    minHeight: "60vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  spinner: {
    border: "3px solid #f3f3f3",
    borderTop: "3px solid #059669",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    animation: "spin 1s linear infinite",
  },
  title: {
    fontSize: "28px",
    fontWeight: 700,
    color: "#1f2937",
    marginBottom: "24px",
  },
  error: {
    background: "#fee2e2",
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    color: "#991b1b",
    borderLeft: "4px solid #dc2626",
  },
  errorText: {
    color: "#dc2626",
    fontSize: "16px",
    textAlign: "center",
  },
  success: {
    background: "#d1fae5",
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    color: "#065f46",
    borderLeft: "4px solid #10b981",
  },
  retryButton: {
    padding: "8px 24px",
    background: "#059669",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: "14px",
  },
  tabs: {
    display: "flex",
    gap: 8,
    marginBottom: 24,
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: 4,
  },
  tab: {
    padding: "12px 20px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    color: "#6b7280",
    borderRadius: "6px 6px 0 0",
  },
  activeTab: {
    padding: "12px 20px",
    background: "#059669",
    color: "white",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
    border: "none",
    borderRadius: "6px 6px 0 0",
    boxShadow: "0 2px 4px rgba(5, 150, 105, 0.3)",
  },
  card: {
    background: "white",
    padding: 24,
    borderRadius: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,.1)",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: 600,
    color: "#1f2937",
    marginBottom: 20,
    marginTop: 0,
  },

  // Stats Styles
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  statCard: {
    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    padding: "20px",
    borderRadius: "12px",
    textAlign: "center",
    border: "1px solid #e2e8f0",
    transition: "transform 0.2s",
    cursor: "default",
  },
  statNumber: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#059669",
    margin: "12px 0 0",
    letterSpacing: "-0.5px",
  },

  // Detail Styles
  detailRow: {
    display: "flex",
    marginBottom: 12,
    alignItems: "center",
  },
  detailLabel: {
    width: 150,
    fontWeight: 500,
    color: "#4b5563",
    fontSize: "14px",
  },
  detailValue: {
    color: "#1f2937",
    fontSize: "14px",
  },
  divider: {
    border: "none",
    height: 1,
    background: "#e5e7eb",
    margin: "20px 0",
  },
  statusSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
  },
  statusControls: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  statusSelect: {
    padding: "8px 16px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    background: "white",
    fontSize: "14px",
    minWidth: 120,
  },

  // Gateway Styles
  gatewayCard: {
    background: "#f8fafc",
    padding: 20,
    borderRadius: 8,
    marginBottom: 16,
    border: "1px solid #e2e8f0",
  },
  gatewayRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
  },
  gatewayBadgeConnected: {
    padding: "6px 12px",
    background: "#d1fae5",
    color: "#059669",
    borderRadius: 20,
    fontSize: "12px",
    fontWeight: 600,
  },
  gatewayBadgeDisconnected: {
    padding: "6px 12px",
    background: "#fef3c7",
    color: "#b45309",
    borderRadius: 20,
    fontSize: "12px",
    fontWeight: 600,
  },

  // Transaction Styles
  transactionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 16,
  },
  filterContainer: {
    display: "flex",
    gap: "12px",
    marginBottom: "20px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  filterSelect: {
    padding: "8px 16px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    background: "white",
    fontSize: "14px",
    minWidth: 140,
  },
  filterDate: {
    padding: "8px 16px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    background: "white",
    fontSize: "14px",
  },
  filterButton: {
    padding: "8px 20px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
  },
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#6b7280",
  },
  emptyHint: {
    fontSize: "14px",
    color: "#9ca3af",
    marginTop: 8,
  },

  // Table Styles
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  tableHeader: {
    textAlign: "left",
    padding: "12px 16px",
    background: "#f8fafc",
    borderBottom: "2px solid #e5e7eb",
    color: "#4b5563",
    fontWeight: 600,
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  tableRow: {
    borderBottom: "1px solid #f3f4f6",
    transition: "background 0.2s",
  },
  tableCell: {
    padding: "16px",
    verticalAlign: "middle",
  },
  refCode: {
    fontFamily: "monospace",
    background: "#f3f4f6",
    padding: "2px 6px",
    borderRadius: 4,
    fontSize: "12px",
  },

  // Pagination Styles
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "20px",
    marginTop: "24px",
    paddingTop: "20px",
    borderTop: "1px solid #e5e7eb",
  },
  pageButton: {
    padding: "8px 20px",
    border: "1px solid #d1d5db",
    background: "white",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    transition: "all 0.2s",
  },
  pageInfo: {
    color: "#6b7280",
    fontSize: "14px",
    fontWeight: 500,
  },

  // Button Styles
  primaryButton: {
    padding: "10px 24px",
    background: "#059669",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
    transition: "background 0.2s",
  },
  secondaryButton: {
    padding: "8px 20px",
    background: "white",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    transition: "all 0.2s",
  },
  dangerButton: {
    padding: "8px 20px",
    border: "1px solid #dc2626",
    background: "white",
    color: "#dc2626",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    marginLeft: 12,
    transition: "all 0.2s",
  },
  exportButton: {
    padding: "10px 24px",
    background: "#10b981",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
    transition: "background 0.2s",
  },
};

// Add CSS animation for spinner
if (typeof document !== "undefined") {
  const styleSheet = document.styleSheets[0];
  if (styleSheet) {
    try {
      styleSheet.insertRule(
        `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `,
        styleSheet.cssRules.length,
      );
    } catch (e) {
      // Fallback if stylesheet is read-only
      const style = document.createElement("style");
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }
}
