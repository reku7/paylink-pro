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
    <div style={styles.page} className="mobile-padding">
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1>Admin Dashboard</h1>
            <p>System-level overview and merchant management</p>
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
        <section style={styles.card}>
          <div style={styles.controls} className="mobile-stack">
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
              <span>Sort by:</span>
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

          <div style={styles.summary} className="mobile-stack">
            <div style={styles.summaryItem}>
              <span>Total Merchants:</span>
              <strong>{merchants.length}</strong>
            </div>
            <div style={styles.summaryItem}>
              <span>Active:</span>
              <strong>
                {merchants.filter((m) => m.status === "active").length}
              </strong>
            </div>
            <div style={styles.summaryItem}>
              <span>Showing:</span>
              <strong>
                {filteredMerchants.length} of {merchants.length}
              </strong>
            </div>
          </div>

          {filteredMerchants.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No merchants found.</p>
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
              <div className="table-scroll">
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentMerchants.map((m) => (
                      <tr key={m._id} style={styles.tableRow}>
                        <td style={styles.tableCell}>{m.name}</td>
                        <td style={styles.tableCell}>
                          {m.ownerUserId?.email || "—"}
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
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div style={styles.pagination}>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    style={styles.pageButton}
                  >
                    Previous
                  </button>
                  <span style={styles.pageInfo}>
                    Page {currentPage} of {totalPages}
                    <span style={styles.pageCount}>
                      ({filteredMerchants.length} merchants)
                    </span>
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) =>
                        prev < totalPages ? prev + 1 : prev,
                      )
                    }
                    disabled={currentPage >= totalPages}
                    style={styles.pageButton}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: "24px",
    background: "#f9fafb",
    minHeight: "100vh",
  },
  header: {
    marginBottom: "32px",
  },
  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "16px",
  },
  refreshButton: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    background: "white",
    color: "#374151",
    cursor: "pointer",
    fontWeight: 500,
    transition: "all 0.2s ease",
  },
  card: {
    background: "#fff",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  controls: {
    display: "flex",
    gap: "16px",
    marginBottom: "24px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  searchInput: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    flex: 1,
    minWidth: "200px",
    maxWidth: "400px",
    fontSize: "14px",
  },
  select: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    background: "white",
    fontSize: "14px",
    cursor: "pointer",
  },
  sortContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginLeft: "auto",
  },
  sortButton: {
    padding: "10px 16px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    background: "white",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
  },
  summary: {
    display: "flex",
    gap: "24px",
    marginBottom: "24px",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  summaryItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    fontSize: "14px",
    color: "#64748b",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  tableRow: {
    borderBottom: "1px solid #e5e7eb",
    "&:hover": {
      background: "#f9fafb",
    },
  },
  tableCell: {
    padding: "16px",
    textAlign: "left",
  },
  statusBadge: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 500,
    display: "inline-block",
  },
  activeBadge: {
    background: "#dcfce7",
    color: "#166534",
  },
  inactiveBadge: {
    background: "#fee2e2",
    color: "#991b1b",
  },
  manageButton: {
    background: "none",
    border: "none",
    color: "#059669",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px",
    padding: "6px 0",
    "&:hover": {
      textDecoration: "underline",
    },
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "24px",
    marginTop: "24px",
    paddingTop: "24px",
    borderTop: "1px solid #e5e7eb",
  },
  pageButton: {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    background: "white",
    cursor: "pointer",
    fontWeight: 500,
    fontSize: "14px",
    "&:disabled": {
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
  pageCount: {
    fontSize: "12px",
    color: "#6b7280",
  },
  loading: {
    textAlign: "center",
    padding: "40px",
    color: "#6b7280",
  },
  error: {
    padding: "16px",
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: "8px",
    marginBottom: "16px",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px",
    color: "#6b7280",
  },
  clearButton: {
    marginTop: "12px",
    padding: "8px 16px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    background: "white",
    cursor: "pointer",
    fontSize: "14px",
  },
};
