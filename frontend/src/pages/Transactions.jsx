import { useEffect, useState, useMemo } from "react";
import { privateApi as api } from "../api/api";
import "./Transactions.css"; // Add this import

export default function Transactions() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gatewayFilter, setGatewayFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get("/dashboard/transactions", {
          params: {
            page: 1,
            limit: 100,
          },
        });

        const transactions =
          res.data.data || res.data.transactions || res.data || [];
        setTxs(transactions);
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
        setError(
          err.response?.data?.message ||
            "Failed to load transactions. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...txs];

    if (searchTerm) {
      filtered = filtered.filter(
        (tx) =>
          tx.internalRef?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.amount?.toString().includes(searchTerm),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((tx) => tx.status === statusFilter);
    }

    if (gatewayFilter !== "all") {
      filtered = filtered.filter((tx) => tx.gateway === gatewayFilter);
    }

    filtered.sort((a, b) => {
      const aDate = new Date(a.createdAt || a.paidAt || 0);
      const bDate = new Date(b.createdAt || b.paidAt || 0);

      switch (sortBy) {
        case "date":
          return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
        case "amount":
          return sortOrder === "asc"
            ? (a.amount || 0) - (b.amount || 0)
            : (b.amount || 0) - (a.amount || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [txs, searchTerm, statusFilter, gatewayFilter, sortBy, sortOrder]);

  // Pagination
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  // Calculate stats
  const stats = useMemo(() => {
    const totalAmount = txs.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const successfulTxs = txs.filter((tx) => tx.status === "success");
    const successAmount = successfulTxs.reduce(
      (sum, tx) => sum + (tx.amount || 0),
      0,
    );
    const successRate =
      txs.length > 0
        ? ((successfulTxs.length / txs.length) * 100).toFixed(1)
        : 0;

    return {
      totalAmount,
      successAmount,
      successRate,
      totalCount: txs.length,
      successCount: successfulTxs.length,
      santimpayCount: txs.filter((tx) => tx.gateway === "santimpay").length,
      chapaCount: txs.filter((tx) => tx.gateway === "chapa").length,
    };
  }, [txs]);

  // Helper functions
  const getStatusConfig = (status) => {
    const configs = {
      success: { color: "#10b981", bgColor: "#d1fae5", icon: "✓" },
      failed: { color: "#ef4444", bgColor: "#fee2e2", icon: "✗" },
      processing: { color: "#f59e0b", bgColor: "#fef3c7", icon: "⟳" },
      initialized: { color: "#3b82f6", bgColor: "#dbeafe", icon: "⏳" },
    };
    return (
      configs[status] || { color: "#6b7280", bgColor: "#f3f4f6", icon: "○" }
    );
  };

  const getGatewayConfig = (gateway) => {
    const configs = {
      santimpay: { name: "SantimPay", icon: "🟢", color: "#059669" },
      chapa: { name: "Chapa", icon: "🔵", color: "#2563eb" },
    };
    return configs[gateway] || { name: gateway, icon: "⚫", color: "#6b7280" };
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

  const formatCurrency = (amount, currency = "ETB") => {
    return (
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount) + ` ${currency}`
    );
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="transactions-container">
      {/* Header */}
      <div className="transactions-header">
        <div>
          <h1 className="transactions-title">Transactions</h1>
          <p className="transactions-subtitle">
            Monitor and manage your payment transactions
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="refresh-button"
        >
          <svg
            className="refresh-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <p className="stat-label">Total Volume</p>
              <p className="stat-value">{formatCurrency(stats.totalAmount)}</p>
            </div>
            <div className="stat-icon-container">
              <svg
                className="stat-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <div className="stat-subtext">{stats.totalCount} transactions</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <p className="stat-label">Successful</p>
              <p className="stat-value">
                {formatCurrency(stats.successAmount)}
              </p>
            </div>
            <div className="stat-icon-container">
              <svg
                className="success-stat-icon"
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
          </div>
          <div className="stat-subtext">
            {stats.successCount} transactions ({stats.successRate}% success
            rate)
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <p className="stat-label">SantimPay</p>
              <p className="stat-value">{stats.santimpayCount}</p>
            </div>
            <div className="stat-icon-container">
              <span className="text-xl">🟢</span>
            </div>
          </div>
          <div className="stat-subtext">Type A transactions</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <p className="stat-label">Chapa</p>
              <p className="stat-value">{stats.chapaCount}</p>
            </div>
            <div className="stat-icon-container">
              <span className="text-xl">🔵</span>
            </div>
          </div>
          <div className="stat-subtext">Type B Lite transactions</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-container">
        <div className="search-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <svg
              className="search-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        <div className="filters-row">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="processing">Processing</option>
            <option value="initialized">Initialized</option>
          </select>

          <select
            value={gatewayFilter}
            onChange={(e) => setGatewayFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Gateways</option>
            <option value="santimpay">SantimPay</option>
            <option value="chapa">Chapa</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setGatewayFilter("all");
            }}
            className="clear-filters-button"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading transactions...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-container">
          <div className="error-content">
            <svg
              className="error-icon"
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
            <p className="error-message">{error}</p>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      {!loading && !error && (
        <div className="table-container">
          <div className="table-wrapper">
            <table className="transactions-table">
              <thead className="table-header">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort("amount")}
                  >
                    <div className="sort-header-content">
                      Amount
                      {sortBy === "amount" && (
                        <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="sortable-header"
                    onClick={() => handleSort("date")}
                  >
                    <div className="sort-header-content">
                      Date & Time
                      {sortBy === "date" && (
                        <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                  <th>Status</th>
                  <th>Gateway</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-state">
                      <div className="flex flex-col items-center">
                        <svg
                          className="empty-icon"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        <p className="empty-title">No transactions found</p>
                        <p className="empty-subtitle">
                          {searchTerm ||
                          statusFilter !== "all" ||
                          gatewayFilter !== "all"
                            ? "Try adjusting your filters"
                            : "Create your first payment link to see transactions here"}
                        </p>
                        <button
                          onClick={() => {
                            setSearchTerm("");
                            setStatusFilter("all");
                            setGatewayFilter("all");
                          }}
                          className="px-4 py-2 text-blue-600 hover:text-blue-800"
                        >
                          Clear all filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((tx) => {
                    const statusConfig = getStatusConfig(tx.status);
                    const gatewayConfig = getGatewayConfig(tx.gateway);

                    return (
                      <tr key={tx._id || tx.internalRef}>
                        <td className="reference-cell">
                          <div className="flex flex-col">
                            <code>{tx.internalRef?.slice(0, 20)}...</code>
                            <span className="reference-hint">
                              Click to copy
                            </span>
                          </div>
                        </td>
                        <td className="amount-cell">
                          {formatCurrency(tx.amount || 0, tx.currency || "ETB")}
                        </td>
                        <td className="date-cell">
                          {formatDate(tx.createdAt || tx.paidAt)}
                        </td>
                        <td>
                          <div
                            className={`status-badge ${
                              tx.status === "success"
                                ? "status-success"
                                : tx.status === "failed"
                                  ? "status-failed"
                                  : tx.status === "processing"
                                    ? "status-processing"
                                    : tx.status === "initialized"
                                      ? "status-initialized"
                                      : "status-default"
                            }`}
                          >
                            <span className="status-icon">
                              {statusConfig.icon}
                            </span>
                            {tx.status}
                          </div>
                        </td>
                        <td className="gateway-cell">
                          <span className="gateway-icon">
                            {gatewayConfig.icon}
                          </span>
                          <span
                            className={`gateway-name ${
                              tx.gateway === "santimpay"
                                ? "gateway-santimpay"
                                : tx.gateway === "chapa"
                                  ? "gateway-chapa"
                                  : "gateway-default"
                            }`}
                          >
                            {gatewayConfig.name}
                          </span>
                        </td>
                        <td>
                          <button className="view-details-button">
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {paginatedTransactions.length > 0 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing{" "}
                <span className="font-medium">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredTransactions.length,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium">
                  {filteredTransactions.length}
                </span>{" "}
                results
              </div>

              <div className="pagination-controls">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  Previous
                </button>

                <div className="page-numbers">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`page-button ${
                          currentPage === pageNum ? "active" : ""
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="page-ellipsis">...</span>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className={`page-button ${
                          currentPage === totalPages ? "active" : ""
                        }`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
