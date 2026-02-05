import { useEffect, useState, useMemo } from "react";
import { privateApi as api } from "../api/api";

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
            limit: 100, // Fetch more for client-side filtering
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

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (tx) =>
          tx.internalRef?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.amount?.toString().includes(searchTerm),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((tx) => tx.status === statusFilter);
    }

    // Gateway filter
    if (gatewayFilter !== "all") {
      filtered = filtered.filter((tx) => tx.gateway === gatewayFilter);
    }

    // Sorting
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
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage your payment transactions
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Volume</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.totalAmount)}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600"
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
          <div className="mt-3 text-sm text-gray-600">
            {stats.totalCount} transactions
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Successful</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.successAmount)}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <svg
                className="w-6 h-6 text-green-600"
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
          <div className="mt-3 text-sm text-gray-600">
            {stats.successCount} transactions ({stats.successRate}% success
            rate)
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">SantimPay</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.santimpayCount}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <span className="text-xl">🟢</span>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600">Type A transactions</div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Chapa</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.chapaCount}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <span className="text-xl">🔵</span>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            Type B Lite transactions
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
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

          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading transactions...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-500 mr-2"
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
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      {!loading && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th
                    className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("amount")}
                  >
                    <div className="flex items-center gap-1">
                      Amount
                      {sortBy === "amount" && (
                        <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center gap-1">
                      Date & Time
                      {sortBy === "date" && (
                        <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gateway
                  </th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 px-6 text-center">
                      <div className="flex flex-col items-center">
                        <svg
                          className="w-16 h-16 text-gray-300 mb-4"
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
                        <p className="text-gray-500 text-lg mb-2">
                          No transactions found
                        </p>
                        <p className="text-gray-400 mb-4">
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
                      <tr
                        key={tx._id || tx.internalRef}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <code className="font-mono text-sm text-gray-900">
                              {tx.internalRef?.slice(0, 20)}...
                            </code>
                            <span className="text-xs text-gray-500 mt-1">
                              Click to copy
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(
                              tx.amount || 0,
                              tx.currency || "ETB",
                            )}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-900">
                            {formatDate(tx.createdAt || tx.paidAt)}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                            style={{
                              backgroundColor: statusConfig.bgColor,
                              color: statusConfig.color,
                            }}
                          >
                            <span className="mr-1.5">{statusConfig.icon}</span>
                            {tx.status}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {gatewayConfig.icon}
                            </span>
                            <span
                              className="font-medium"
                              style={{ color: gatewayConfig.color }}
                            >
                              {gatewayConfig.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
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
            <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-700">
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

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="px-2">...</span>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className={`w-8 h-8 rounded-lg ${
                          currentPage === totalPages
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 hover:bg-gray-100"
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
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
