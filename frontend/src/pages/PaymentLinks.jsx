// src/pages/PaymentLinks.jsx
import { useState, useEffect } from "react";
import { privateApi as api } from "../api/api";
import {
  Link2,
  Plus,
  Copy,
  Eye,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Repeat,
  DollarSign,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";

export default function PaymentLinks() {
  // State management
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedLink, setSelectedLink] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state for create modal
  const [newLink, setNewLink] = useState({
    title: "",
    description: "",
    amount: "",
    gateway: "santimpay",
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    totalCollected: 0,
    conversionRate: 0,
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Fetch links on mount, tab change, or page change
  useEffect(() => {
    fetchLinks();
  }, [activeTab, pagination.page]);

  // Fetch links from API
  const fetchLinks = async () => {
    setLoading(true);
    setError("");

    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      const res = await api.get("/links", { params });

      if (res.data.success) {
        const linksData = res.data.data || [];
        setLinks(linksData);

        setPagination((prev) => ({
          ...prev,
          total: res.data.pagination?.total || linksData.length,
          pages:
            res.data.pagination?.pages ||
            Math.ceil(linksData.length / prev.limit),
        }));

        calculateStats(linksData);
      }
    } catch (err) {
      console.error("Failed to fetch links:", err);
      setError("Failed to load payment links");
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (linksData) => {
    const now = new Date();
    const active = linksData.filter(
      (l) =>
        l.status === "active" && (!l.expiresAt || new Date(l.expiresAt) > now),
    ).length;

    const expired = linksData.filter(
      (l) =>
        l.status === "expired" || (l.expiresAt && new Date(l.expiresAt) < now),
    ).length;

    const totalCollected = linksData.reduce(
      (sum, link) => sum + (link.totalCollected || 0),
      0,
    );

    const totalTransactions = linksData.reduce(
      (sum, link) => sum + (link.transactions?.length || 0),
      0,
    );

    const successfulTransactions = linksData.reduce(
      (sum, link) =>
        sum +
        (link.transactions?.filter((tx) => tx.status === "success")?.length ||
          0),
      0,
    );

    setStats({
      total: linksData.length,
      active,
      expired,
      totalCollected,
      conversionRate:
        totalTransactions > 0
          ? Math.round((successfulTransactions / totalTransactions) * 100)
          : 0,
    });
  };

  // Handle create payment link
  const handleCreateLink = async (e) => {
    e.preventDefault();

    if (!newLink.title.trim()) {
      setError("Title is required");
      return;
    }

    if (
      !newLink.amount ||
      isNaN(newLink.amount) ||
      Number(newLink.amount) <= 0
    ) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/links", {
        title: newLink.title.trim(),
        description: newLink.description.trim(),
        amount: Number(newLink.amount),
        currency: "ETB",
        gateway: newLink.gateway,
      });

      if (res.data.success) {
        setShowCreateModal(false);
        setNewLink({
          title: "",
          description: "",
          amount: "",
          gateway: "santimpay",
        });
        fetchLinks();
      }
    } catch (err) {
      console.error("Failed to create link:", err);
      setError(err.response?.data?.error || "Failed to create payment link");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete link
  const handleDeleteLink = async (linkId, e) => {
    e.stopPropagation();

    if (
      !window.confirm(
        "Are you sure you want to delete this link? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const res = await api.delete(`/links/${linkId}`);
      if (res.data.success) {
        fetchLinks();
      }
    } catch (err) {
      console.error("Failed to delete link:", err);
      setError("Failed to delete link");
    }
  };

  // Copy link to clipboard
  const copyLink = (linkId, e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/pay/${linkId}`;
    navigator.clipboard.writeText(url);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date - now;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Expired";
    if (diffDays === 0) return "Expires today";
    if (diffDays === 1) return "Expires tomorrow";
    return `Expires in ${diffDays} days`;
  };

  // Format currency
  const formatCurrency = (amount, currency = "ETB") => {
    return `${Number(amount || 0).toLocaleString()} ${currency}`;
  };

  // Get status badge
  const getStatusBadge = (link) => {
    const now = new Date();
    const expiresAt = link.expiresAt ? new Date(link.expiresAt) : null;

    if (expiresAt && expiresAt < now) {
      return {
        label: "Expired",
        className: "bg-gray-100 text-gray-800",
        icon: Clock,
      };
    }

    switch (link.status) {
      case "active":
        return {
          label: "Active",
          className: "bg-green-100 text-green-800",
          icon: CheckCircle,
        };
      case "disabled":
        return {
          label: "Disabled",
          className: "bg-red-100 text-red-800",
          icon: XCircle,
        };
      case "expired":
        return {
          label: "Expired",
          className: "bg-gray-100 text-gray-800",
          icon: Clock,
        };
      default:
        return {
          label: link.status || "Unknown",
          className: "bg-gray-100 text-gray-800",
          icon: Clock,
        };
    }
  };

  // Filter links based on search and tab
  const filteredLinks = links.filter((link) => {
    // Tab filter
    if (activeTab === "one-time" && link.type !== "one_time") return false;
    if (activeTab === "reusable" && link.type !== "reusable") return false;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        link.title?.toLowerCase().includes(term) ||
        link.linkId?.toLowerCase().includes(term) ||
        link.amount?.toString().includes(term)
      );
    }

    return true;
  });

  const tabs = [
    { id: "all", label: "All Links", icon: Link2, count: stats.total },
    {
      id: "one-time",
      label: "One-Time",
      icon: Zap,
      count: links.filter((l) => l.type === "one_time").length,
    },
    {
      id: "reusable",
      label: "Reusable",
      icon: Repeat,
      count: links.filter((l) => l.type === "reusable").length,
    },
  ];

  return (
    <div className="payment-links-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Payment Links</h1>
          <p className="page-subtitle">
            Create and manage payment links for your customers
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <Plus size={18} />
          <span>Create New Link</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Link2 size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Links</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <CheckCircle size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Active</span>
            <span className="stat-value">{stats.active}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <DollarSign size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Collected</span>
            <span className="stat-value">
              {formatCurrency(stats.totalCollected)}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <BarChart2 size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Conversion</span>
            <span className="stat-value">{stats.conversionRate}%</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className={`tab ${isActive ? "active" : ""}`}
              >
                <Icon size={16} />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`tab-count ${isActive ? "active" : ""}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="search-container">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by title, link ID, or amount..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="search-input"
          />
        </div>
        <div className="action-buttons">
          <button className="btn-filter">
            <Filter size={16} />
            <span>Filter</span>
          </button>
          <button onClick={fetchLinks} className="btn-refresh">
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-box">
          <p>{error}</p>
        </div>
      )}

      {/* Links Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading payment links...</p>
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Link2 size={48} />
            </div>
            <h3>No payment links found</h3>
            <p>
              {searchTerm
                ? "No links match your search criteria"
                : "Get started by creating your first payment link"}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              <Plus size={16} />
              <span>Create Payment Link</span>
            </button>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Link Details</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Performance</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLinks.map((link) => {
                    const status = getStatusBadge(link);
                    const StatusIcon = status.icon;

                    return (
                      <tr
                        key={link._id || link.linkId}
                        className="table-row"
                        onClick={() => {
                          setSelectedLink(link);
                          setShowDetailsModal(true);
                        }}
                      >
                        <td className="link-details-cell">
                          <div className="link-details">
                            <div
                              className={`link-icon ${link.type === "reusable" ? "reusable" : "one-time"}`}
                            >
                              {link.type === "reusable" ? (
                                <Repeat size={20} />
                              ) : (
                                <Zap size={20} />
                              )}
                            </div>
                            <div>
                              <div className="link-title">
                                {link.title || "Untitled Link"}
                              </div>
                              <div className="link-meta">
                                <span className="link-id">{link.linkId}</span>
                                <span className="separator">•</span>
                                <span className="gateway-badge">
                                  {link.gateway || "santimpay"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="amount-cell">
                          <div className="amount">
                            {formatCurrency(link.amount)}
                          </div>
                          {link.totalCollected > 0 && (
                            <div className="collected">
                              Collected: {formatCurrency(link.totalCollected)}
                            </div>
                          )}
                        </td>
                        <td className="status-cell">
                          <span className={`status-badge ${status.className}`}>
                            <StatusIcon size={12} />
                            {status.label}
                          </span>
                          {link.expiresAt && (
                            <div className="expires-at">
                              {formatRelativeTime(link.expiresAt)}
                            </div>
                          )}
                        </td>
                        <td className="performance-cell">
                          <div className="payments-count">
                            {link.totalPayments || 0} payments
                          </div>
                          <div className="attempts-count">
                            {link.transactions?.length || 0} attempts
                          </div>
                        </td>
                        <td className="date-cell">
                          <div className="created-date">
                            {formatDate(link.createdAt)}
                          </div>
                          <div className="created-ago">
                            {link.createdAt &&
                              formatRelativeTime(link.createdAt).replace(
                                "Expires",
                                "Created",
                              )}
                          </div>
                        </td>
                        <td className="actions-cell">
                          <div className="action-buttons-group">
                            <button
                              onClick={(e) => copyLink(link.linkId, e)}
                              className="action-btn"
                              title="Copy link"
                            >
                              <Copy size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLink(link);
                                setShowDetailsModal(true);
                              }}
                              className="action-btn"
                              title="View details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteLink(link._id, e)}
                              className="action-btn delete"
                              title="Delete link"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="pagination">
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={pagination.page === 1}
                  className="pagination-btn"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <span className="pagination-info">
                  Page {pagination.page} of {pagination.pages}
                </span>

                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={pagination.page === pagination.pages}
                  className="pagination-btn"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Link Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Create Payment Link</h2>
              <button
                className="modal-close"
                onClick={() => {
                  setShowCreateModal(false);
                  setError("");
                  setNewLink({
                    title: "",
                    description: "",
                    amount: "",
                    gateway: "santimpay",
                  });
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateLink}>
              <div className="modal-body">
                {error && (
                  <div className="error-box">
                    <p>{error}</p>
                  </div>
                )}

                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    placeholder="Enter title"
                    value={newLink.title}
                    onChange={(e) =>
                      setNewLink({ ...newLink, title: e.target.value })
                    }
                    className="form-input"
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label>Description (Optional)</label>
                  <textarea
                    placeholder="Describe what this payment is for"
                    value={newLink.description}
                    onChange={(e) =>
                      setNewLink({ ...newLink, description: e.target.value })
                    }
                    rows="3"
                    className="form-textarea"
                  />
                </div>

                <div className="form-group">
                  <label>Amount (ETB) *</label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={newLink.amount}
                    onChange={(e) =>
                      setNewLink({ ...newLink, amount: e.target.value })
                    }
                    min="1"
                    step="0.01"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Payment Gateway</label>
                  <select
                    value={newLink.gateway}
                    onChange={(e) =>
                      setNewLink({ ...newLink, gateway: e.target.value })
                    }
                    className="form-select"
                  >
                    <option value="santimpay">SantimPay</option>
                    <option value="chapa">Chapa</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setError("");
                    setNewLink({
                      title: "",
                      description: "",
                      amount: "",
                      gateway: "santimpay",
                    });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? "Creating..." : "Create Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Details Modal */}
      {showDetailsModal && selectedLink && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2>Payment Link Details</h2>
              <button
                className="modal-close"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedLink(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="details-section">
                <h3>Link Information</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Link ID:</span>
                    <span className="detail-value link-id">
                      {selectedLink.linkId}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Title:</span>
                    <span className="detail-value">
                      {selectedLink.title || "Untitled"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Description:</span>
                    <span className="detail-value">
                      {selectedLink.description || "No description"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Amount:</span>
                    <span className="detail-value amount">
                      {formatCurrency(
                        selectedLink.amount,
                        selectedLink.currency,
                      )}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Gateway:</span>
                    <span className="detail-value gateway">
                      {selectedLink.gateway || "santimpay"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span
                      className={`status-badge ${getStatusBadge(selectedLink).className}`}
                    >
                      {getStatusBadge(selectedLink).label}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">
                      {formatDate(selectedLink.createdAt)}
                    </span>
                  </div>
                  {selectedLink.expiresAt && (
                    <div className="detail-item">
                      <span className="detail-label">Expires:</span>
                      <span className="detail-value">
                        {formatDate(selectedLink.expiresAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="details-section">
                <h3>Payment URL</h3>
                <div className="url-box">
                  <code className="url-text">
                    {window.location.origin}/pay/{selectedLink.linkId}
                  </code>
                  <button
                    onClick={() =>
                      copyLink(selectedLink.linkId, {
                        stopPropagation: () => {},
                      })
                    }
                    className="action-btn"
                    title="Copy link"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>

              {selectedLink.transactions &&
                selectedLink.transactions.length > 0 && (
                  <div className="details-section">
                    <h3>Recent Transactions</h3>
                    <div className="transactions-preview">
                      {selectedLink.transactions.slice(0, 5).map((tx, idx) => (
                        <div key={idx} className="transaction-row">
                          <span className="tx-ref">
                            {tx.internalRef?.slice(0, 12)}...
                          </span>
                          <span className="tx-amount">
                            {formatCurrency(tx.amount)}
                          </span>
                          <span className={`tx-status ${tx.status}`}>
                            {tx.status}
                          </span>
                          <span className="tx-date">
                            {formatDate(tx.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            <div className="modal-footer">
              <button
                onClick={() =>
                  copyLink(selectedLink.linkId, { stopPropagation: () => {} })
                }
                className="btn-secondary"
              >
                <Copy size={16} />
                Copy Link
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedLink(null);
                }}
                className="btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .payment-links-page {
          width: 100%;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .header-left {
          flex: 1;
        }

        .page-title {
          font-size: 28px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }

        .page-subtitle {
          font-size: 15px;
          color: #6b7280;
          margin: 0;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #059669;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
          background: #047857;
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          display: flex;
          align-items: center;
          padding: 20px;
          background: white;
          border-radius: 12px;
          border: 1px solid #f3f4f6;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
        }

        .stat-icon.blue {
          background: #eff6ff;
          color: #3b82f6;
        }

        .stat-icon.green {
          background: #ecfdf5;
          color: #10b981;
        }

        .stat-icon.purple {
          background: #f5f3ff;
          color: #8b5cf6;
        }

        .stat-icon.orange {
          background: #fff7ed;
          color: #f59e0b;
        }

        .stat-info {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
        }

        .tabs-container {
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 24px;
        }

        .tabs {
          display: flex;
          gap: 8px;
        }

        .tab {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab.active {
          color: #059669;
          border-bottom-color: #059669;
        }

        .tab-count {
          margin-left: 4px;
          padding: 2px 8px;
          background: #f3f4f6;
          border-radius: 12px;
          font-size: 12px;
          color: #6b7280;
        }

        .tab-count.active {
          background: #ecfdf5;
          color: #059669;
        }

        .search-container {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
        }

        .search-wrapper {
          flex: 1;
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .search-input {
          width: 100%;
          padding: 12px 16px 12px 44px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }

        .search-input:focus {
          border-color: #059669;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
        }

        .btn-filter,
        .btn-refresh {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-filter:hover,
        .btn-refresh:hover {
          background: #f9fafb;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .error-box {
          padding: 12px 16px;
          background: #fee2e2;
          border-left: 4px solid #dc2626;
          border-radius: 8px;
          color: #991b1b;
          margin-bottom: 20px;
        }

        .error-box p {
          margin: 0;
        }

        .table-container {
          background: white;
          border-radius: 12px;
          border: 1px solid #f3f4f6;
          overflow: hidden;
        }

        .table-responsive {
          overflow-x: auto;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
        }

        .table th {
          padding: 16px 20px;
          text-align: left;
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .table td {
          padding: 20px;
          border-bottom: 1px solid #f3f4f6;
        }

        .table-row {
          cursor: pointer;
          transition: background 0.2s;
        }

        .table-row:hover {
          background: #f9fafb;
        }

        .link-details {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .link-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .link-icon.one-time {
          background: #fff7ed;
          color: #f59e0b;
        }

        .link-icon.reusable {
          background: #f5f3ff;
          color: #8b5cf6;
        }

        .link-title {
          font-size: 15px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 4px;
        }

        .link-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #6b7280;
        }

        .link-id {
          font-family: monospace;
        }

        .separator {
          color: #d1d5db;
        }

        .gateway-badge {
          padding: 2px 8px;
          background: #f3f4f6;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          color: #4b5563;
          text-transform: capitalize;
        }

        .amount {
          font-size: 15px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 4px;
        }

        .collected {
          font-size: 12px;
          color: #6b7280;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .bg-green-100 {
          background: #ecfdf5;
        }
        .text-green-800 {
          color: #065f46;
        }
        .bg-red-100 {
          background: #fee2e2;
        }
        .text-red-800 {
          color: #991b1b;
        }
        .bg-gray-100 {
          background: #f3f4f6;
        }
        .text-gray-800 {
          color: #1f2937;
        }

        .expires-at {
          font-size: 11px;
          color: #9ca3af;
        }

        .payments-count {
          font-size: 14px;
          font-weight: 500;
          color: #111827;
          margin-bottom: 4px;
        }

        .attempts-count {
          font-size: 12px;
          color: #6b7280;
        }

        .created-date {
          font-size: 14px;
          color: #111827;
          margin-bottom: 4px;
        }

        .created-ago {
          font-size: 12px;
          color: #6b7280;
        }

        .action-buttons-group {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: #f9fafb;
          color: #059669;
          border-color: #059669;
        }

        .action-btn.delete:hover {
          color: #dc2626;
          border-color: #dc2626;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
          text-align: center;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f4f6;
          border-top-color: #059669;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
          text-align: center;
        }

        .empty-state-icon {
          width: 80px;
          height: 80px;
          background: #f9fafb;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 8px 0;
        }

        .empty-state p {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 24px 0;
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 20px;
          border-top: 1px solid #f3f4f6;
        }

        .pagination-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #059669;
          color: #059669;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-info {
          font-size: 14px;
          color: #6b7280;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal {
          background: white;
          border-radius: 16px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .modal.modal-lg {
          max-width: 800px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #111827;
        }

        .modal-close {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          background: white;
          font-size: 20px;
          line-height: 1;
          color: #6b7280;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close:hover {
          background: #f9fafb;
          color: #111827;
        }

        .modal-body {
          padding: 24px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px 24px;
          border-top: 1px solid #e5e7eb;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          border-color: #059669;
        }

        .form-textarea {
          resize: vertical;
          font-family: inherit;
        }

        .details-section {
          margin-bottom: 32px;
        }

        .details-section h3 {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 16px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-label {
          font-size: 12px;
          color: #6b7280;
        }

        .detail-value {
          font-size: 14px;
          color: #111827;
        }

        .detail-value.amount {
          font-weight: 600;
          color: #059669;
        }

        .url-box {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .url-text {
          flex: 1;
          font-size: 13px;
          color: #374151;
          word-break: break-all;
        }

        .transactions-preview {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .transaction-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .transaction-row:last-child {
          border-bottom: none;
        }

        .tx-ref {
          font-family: monospace;
          font-size: 12px;
          color: #6b7280;
        }

        .tx-amount {
          font-weight: 500;
          color: #111827;
        }

        .tx-status {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          text-transform: capitalize;
        }

        .tx-status.success {
          background: #ecfdf5;
          color: #065f46;
        }

        .tx-status.failed {
          background: #fee2e2;
          color: #991b1b;
        }

        .tx-status.processing {
          background: #fff7ed;
          color: #9a3412;
        }

        .tx-date {
          font-size: 11px;
          color: #6b7280;
        }

        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            gap: 16px;
          }

          .search-container {
            flex-direction: column;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .table td {
            padding: 16px;
          }

          .link-details {
            flex-direction: column;
            align-items: flex-start;
          }

          .details-grid {
            grid-template-columns: 1fr;
          }

          .modal {
            margin: 20px;
          }
        }
      `}</style>
    </div>
  );
}
