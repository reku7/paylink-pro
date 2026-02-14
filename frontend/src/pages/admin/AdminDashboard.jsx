import { useEffect, useState } from "react";
import { privateApi as api } from "../../api/api";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [merchants, setMerchants] = useState([]);
  const [filteredMerchants, setFilteredMerchants] = useState([]);
  const [currentMerchants, setCurrentMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    async function fetchMerchants() {
      try {
        const res = await api.get("/admin/merchants");
        setMerchants(res.data.data || []);
        setError("");
      } catch (err) {
        console.error(err);
        setError("Failed to load merchants");
      } finally {
        setLoading(false);
      }
    }

    fetchMerchants();
  }, []);

  // Filter and sort merchants
  useEffect(() => {
    let filtered = [...merchants];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.ownerUserId?.email.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((m) => m.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;

      if (sortBy === "name") {
        aVal = a.name || "";
        bVal = b.name || "";
      } else if (sortBy === "email") {
        aVal = a.ownerUserId?.email || "";
        bVal = b.ownerUserId?.email || "";
      } else {
        aVal = a.status || "";
        bVal = b.status || "";
      }

      if (sortOrder === "asc") {
        return aVal.localeCompare(bVal);
      } else {
        return bVal.localeCompare(aVal);
      }
    });

    setFilteredMerchants(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [merchants, searchTerm, statusFilter, sortBy, sortOrder]);

  // Paginate filtered merchants
  useEffect(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    setCurrentMerchants(
      filteredMerchants.slice(indexOfFirstItem, indexOfLastItem),
    );
  }, [filteredMerchants, currentPage, itemsPerPage]);

  async function refreshMerchants() {
    setLoading(true);
    try {
      const res = await api.get("/admin/merchants");
      setMerchants(res.data.data || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to refresh merchants");
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.ceil(filteredMerchants.length / itemsPerPage);

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>Admin Dashboard</h1>
            <p style={styles.subtitle}>
              System-level overview and merchant management
            </p>
          </div>
          <button
            onClick={refreshMerchants}
            style={styles.refreshButton}
            disabled={loading}
          >
            {loading ? "↻ Refreshing..." : "↻ Refresh"}
          </button>
        </div>
      </header>

      {loading && <div style={styles.loading}>Loading merchants...</div>}
      {error && <div style={styles.error}>{error}</div>}

      {!loading && !error && (
        <div style={styles.content}>
          {/* Filters Section */}
          <div style={styles.filtersCard}>
            <div style={styles.controls}>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={styles.select}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <div style={styles.sortContainer}>
                <span style={styles.sortLabel}>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={styles.select}
                >
                  <option value="name">Name</option>
                  <option value="email">Email</option>
                  <option value="status">Status</option>
                </select>
                <button
                  style={styles.sortButton}
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                >
                  {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
                </button>
              </div>
            </div>

            {/* Summary */}
            <div style={styles.summary}>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>Total Merchants</span>
                <strong style={styles.summaryValue}>{merchants.length}</strong>
              </div>
              <div style={styles.summaryDivider} />
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>Active</span>
                <strong style={{ ...styles.summaryValue, color: "#059669" }}>
                  {merchants.filter((m) => m.status === "active").length}
                </strong>
              </div>
              <div style={styles.summaryDivider} />
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>Showing</span>
                <strong style={styles.summaryValue}>
                  {filteredMerchants.length} of {merchants.length}
                </strong>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div style={styles.tableCard}>
            {filteredMerchants.length === 0 ? (
              <div style={styles.emptyState}>
                <p style={styles.emptyStateText}>No merchants found.</p>
                {searchTerm || statusFilter !== "all" ? (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                    }}
                    style={styles.clearButton}
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>
            ) : (
              <>
                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead style={styles.tableHead}>
                      <tr>
                        <th style={styles.tableHeader}>Name</th>
                        <th style={styles.tableHeader}>Email</th>
                        <th style={styles.tableHeader}>Status</th>
                        <th style={styles.tableHeader}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentMerchants.map((m, index) => (
                        <tr
                          key={m._id}
                          style={{
                            ...styles.tableRow,
                            ...(index % 2 === 0 ? styles.tableRowEven : {}),
                          }}
                        >
                          <td style={styles.tableCell}>
                            <span style={styles.merchantName}>{m.name}</span>
                          </td>
                          <td style={styles.tableCell}>
                            <span style={styles.merchantEmail}>
                              {m.ownerUserId?.email || "—"}
                            </span>
                          </td>
                          <td style={styles.tableCell}>
                            <span
                              style={{
                                ...styles.statusBadge,
                                ...(m.status === "active"
                                  ? styles.activeBadge
                                  : styles.inactiveBadge),
                              }}
                            >
                              {m.status === "active" ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td style={styles.tableCell}>
                            <button
                              style={styles.manageButton}
                              onClick={() =>
                                navigate(`/admin/merchants?merchantId=${m._id}`)
                              }
                            >
                              Manage →
                            </button>
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
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      style={styles.pageButton}
                    >
                      ← Previous
                    </button>

                    <div style={styles.pageInfo}>
                      <span style={styles.pageNumbers}>
                        Page {currentPage} of {totalPages}
                      </span>
                      <span style={styles.pageCount}>
                        ({filteredMerchants.length} merchants)
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        setCurrentPage((prev) =>
                          prev < totalPages ? prev + 1 : prev,
                        )
                      }
                      disabled={currentPage >= totalPages}
                      style={styles.pageButton}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  // Full screen layout
  page: {
    minHeight: "100vh",
    width: "100%",
    background: "#f3f4f6",
    display: "flex",
    flexDirection: "column",
  },

  // Header styles
  header: {
    background: "white",
    borderBottom: "1px solid #e5e7eb",
    padding: "24px 32px",
    position: "sticky",
    top: 0,
    zIndex: 10,
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    maxWidth: "1600px",
    margin: "0 auto",
    width: "100%",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 4px 0",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "15px",
    color: "#6b7280",
    margin: 0,
  },
  refreshButton: {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    background: "white",
    color: "#374151",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
    transition: "all 0.2s ease",
    ":hover": {
      background: "#f9fafb",
      borderColor: "#9ca3af",
    },
    ":disabled": {
      opacity: 0.6,
      cursor: "not-allowed",
    },
  },

  // Main content area
  content: {
    flex: 1,
    padding: "32px",
    maxWidth: "1600px",
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
  },

  // Cards
  filtersCard: {
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    marginBottom: "24px",
    overflow: "hidden",
  },
  tableCard: {
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    overflow: "hidden",
  },

  // Controls
  controls: {
    display: "flex",
    gap: "16px",
    padding: "24px",
    borderBottom: "1px solid #e5e7eb",
    flexWrap: "wrap",
    background: "#f9fafb",
  },
  searchInput: {
    flex: "1",
    minWidth: "280px",
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s ease",
    ":focus": {
      borderColor: "#059669",
    },
  },
  select: {
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    background: "white",
    fontSize: "14px",
    cursor: "pointer",
    minWidth: "140px",
    outline: "none",
    ":focus": {
      borderColor: "#059669",
    },
  },
  sortContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginLeft: "auto",
  },
  sortLabel: {
    fontSize: "14px",
    color: "#6b7280",
  },
  sortButton: {
    padding: "12px 20px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    background: "white",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
    transition: "all 0.2s ease",
    ":hover": {
      background: "#f3f4f6",
      borderColor: "#9ca3af",
    },
  },

  // Summary
  summary: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    padding: "20px 24px",
    background: "white",
  },
  summaryItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  summaryLabel: {
    fontSize: "13px",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  summaryValue: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#111827",
  },
  summaryDivider: {
    width: "1px",
    height: "40px",
    background: "#e5e7eb",
  },

  // Table
  tableContainer: {
    overflowX: "auto",
    maxHeight: "calc(100vh - 350px)",
    overflowY: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  tableHead: {
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    position: "sticky",
    top: 0,
    zIndex: 5,
  },
  tableHeader: {
    padding: "16px 24px",
    textAlign: "left",
    fontSize: "12px",
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  tableRow: {
    borderBottom: "1px solid #e5e7eb",
    transition: "background 0.15s ease",
    ":hover": {
      background: "#f9fafb",
    },
  },
  tableRowEven: {
    background: "#fafafa",
  },
  tableCell: {
    padding: "16px 24px",
    color: "#1f2937",
  },
  merchantName: {
    fontWeight: "500",
    color: "#111827",
  },
  merchantEmail: {
    color: "#6b7280",
    fontSize: "13px",
  },

  // Status badge
  statusBadge: {
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "500",
    display: "inline-block",
  },
  activeBadge: {
    background: "#ecfdf5",
    color: "#065f46",
  },
  inactiveBadge: {
    background: "#fee2e2",
    color: "#991b1b",
  },

  // Manage button
  manageButton: {
    background: "none",
    border: "none",
    color: "#059669",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
    padding: "8px 12px",
    borderRadius: "6px",
    transition: "all 0.2s ease",
    ":hover": {
      background: "#ecfdf5",
    },
  },

  // Pagination
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "32px",
    padding: "24px",
    borderTop: "1px solid #e5e7eb",
    background: "#f9fafb",
  },
  pageButton: {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    background: "white",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
    color: "#374151",
    transition: "all 0.2s ease",
    ":hover:not(:disabled)": {
      background: "#f3f4f6",
      borderColor: "#059669",
      color: "#059669",
    },
    ":disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  },
  pageInfo: {
    fontSize: "14px",
    color: "#374151",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },
  pageNumbers: {
    fontWeight: "500",
  },
  pageCount: {
    fontSize: "12px",
    color: "#6b7280",
  },

  // States
  loading: {
    textAlign: "center",
    padding: "60px",
    color: "#6b7280",
    fontSize: "15px",
  },
  error: {
    margin: "32px auto",
    padding: "16px 24px",
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: "8px",
    maxWidth: "600px",
    textAlign: "center",
    border: "1px solid #fecaca",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 24px",
    color: "#6b7280",
  },
  emptyStateText: {
    fontSize: "15px",
    marginBottom: "16px",
  },
  clearButton: {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    background: "white",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
    transition: "all 0.2s ease",
    ":hover": {
      background: "#f3f4f6",
    },
  },
};

// Add global styles to make it truly full screen
const globalStyles = `
  html, body {
    margin: 0;
    padding: 0;
    height: 100%;
    width: 100%;
    overflow-x: hidden;
  }
  
  #root {
    height: 100%;
    width: 100%;
  }
`;

// Inject global styles
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = globalStyles;
  document.head.appendChild(style);
}
