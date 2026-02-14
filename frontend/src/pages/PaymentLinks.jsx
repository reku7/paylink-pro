// src/pages/PaymentLinks.jsx
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { privateApi as api } from "../api/api";
import {
  Link2,
  Plus,
  Copy,
  Eye,
  Search,
  Filter,
  MoreVertical,
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

// Constants
const API_ENDPOINTS = {
  LINKS: "/links",
  DASHBOARD_SUMMARY: "/dashboard/summary",
};

const LINK_TYPES = {
  ONE_TIME: "one_time",
  REUSABLE: "reusable",
};

const PAYMENT_STATUS = {
  SUCCESS: "success",
  FAILED: "failed",
  PROCESSING: "processing",
  INITIALIZED: "initialized",
};

const TAB_CONFIG = [
  { id: "all", label: "All Links", icon: Link2 },
  { id: LINK_TYPES.ONE_TIME, label: "One-Time", icon: Zap },
  { id: LINK_TYPES.REUSABLE, label: "Reusable", icon: Repeat },
];

// Utility functions
const formatDate = (dateString, options = {}) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

const formatCurrency = (amount, currency = "ETB") => {
  return `${Number(amount || 0).toLocaleString()} ${currency}`;
};

const getPaymentUrl = (linkId) => {
  return `${window.location.origin}/pay/${linkId}`;
};

// Custom Hooks
const usePaymentLinks = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboardStats, setDashboardStats] = useState({
    totalRevenue: 0,
    successfulCount: 0,
    failedCount: 0,
    processingCount: 0,
    pendingCount: 0,
    totalLinks: 0,
    activeLinks: 0,
    paidLinks: 0,
    expiredLinks: 0,
    failedLinks: 0,
    conversionRate: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const fetchLinks = useCallback(async (params = {}) => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(API_ENDPOINTS.LINKS, { params });

      if (response.data.success) {
        const linksData = response.data.data || [];
        setLinks(linksData);

        setPagination((prev) => ({
          ...prev,
          total: response.data.pagination?.total || linksData.length,
          pages:
            response.data.pagination?.pages ||
            Math.ceil(linksData.length / prev.limit),
        }));

        return linksData;
      }
    } catch (err) {
      console.error("Failed to fetch links:", err);
      setError("Failed to load payment links");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDashboardStats = useCallback(async () => {
    try {
      const response = await api.get(API_ENDPOINTS.DASHBOARD_SUMMARY);
      if (response.data.success) {
        setDashboardStats(response.data.data || {});
      }
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
    }
  }, []);

  const deleteLink = useCallback(
    async (linkId) => {
      try {
        const response = await api.delete(`${API_ENDPOINTS.LINKS}/${linkId}`);
        if (response.data.success) {
          await fetchLinks();
          await fetchDashboardStats();
          return true;
        }
      } catch (err) {
        console.error("Failed to delete link:", err);
        setError("Failed to delete link");
        return false;
      }
    },
    [fetchLinks, fetchDashboardStats],
  );

  // Fetch dashboard stats on mount
  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  return {
    links,
    loading,
    error,
    dashboardStats,
    pagination,
    setPagination,
    fetchLinks,
    deleteLink,
    setError,
  };
};

// Components
const StatCard = ({ icon: Icon, label, value, color, subValue }) => (
  <div className="stat-card">
    <div className={`stat-icon ${color}`}>
      <Icon size={20} />
    </div>
    <div className="stat-info">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {subValue && <span className="stat-subvalue">{subValue}</span>}
    </div>
  </div>
);

const Tabs = ({ activeTab, onTabChange, counts }) => (
  <div className="tabs-container">
    <div className="tabs">
      {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={`tab ${activeTab === id ? "active" : ""}`}
        >
          <Icon size={16} />
          {label}
          {counts[id] > 0 && (
            <span className={`tab-count ${activeTab === id ? "active" : ""}`}>
              {counts[id]}
            </span>
          )}
        </button>
      ))}
    </div>
  </div>
);

const SearchBar = ({ searchTerm, onSearchChange, onRefresh, loading }) => (
  <div className="search-container">
    <div className="search-wrapper">
      <Search size={18} className="search-icon" />
      <input
        type="text"
        placeholder="Search by title, link ID, or amount..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="search-input"
      />
    </div>
    <div className="action-buttons">
      <button className="btn-filter">
        <Filter size={16} />
        <span>Filter</span>
      </button>
      <button onClick={onRefresh} className="btn-refresh">
        <RefreshCw size={16} className={loading ? "spin" : ""} />
        <span>Refresh</span>
      </button>
    </div>
  </div>
);

const StatusBadge = ({ status, expiresAt }) => {
  const now = new Date();
  const expiresAtDate = expiresAt ? new Date(expiresAt) : null;

  const getStatusConfig = () => {
    if (expiresAtDate && expiresAtDate < now) {
      return {
        label: "Expired",
        className: "bg-gray-100 text-gray-800",
        icon: Clock,
      };
    }

    switch (status) {
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
      default:
        return {
          label: status || "Unknown",
          className: "bg-gray-100 text-gray-800",
          icon: Clock,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div>
      <span className={`status-badge ${config.className}`}>
        <Icon size={12} />
        {config.label}
      </span>
      {expiresAt && (
        <div className="expires-at">{formatRelativeTime(expiresAt)}</div>
      )}
    </div>
  );
};

const LinkTableRow = ({
  link,
  onCopy,
  onView,
  onDelete,
  openMenuId,
  setOpenMenuId,
}) => {
  const dropdownRef = useRef(null);
  const menuButtonRef = useRef(null);

  const handleCopy = (e) => {
    e.stopPropagation();
    onCopy(link.linkId);
    setOpenMenuId(null);
  };

  const handleView = (e) => {
    e.stopPropagation();
    onView(link);
    setOpenMenuId(null);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (
      window.confirm(
        "Are you sure you want to delete this link? This action cannot be undone.",
      )
    ) {
      onDelete(link._id);
    }
    setOpenMenuId(null);
  };

  const toggleMenu = (e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === link._id ? null : link._id);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e, action) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action(e);
    }
    if (e.key === "Escape" && openMenuId === link._id) {
      setOpenMenuId(null);
      menuButtonRef.current?.focus();
    }
  };

  // Safely access transactions
  const transactions = Array.isArray(link.transactions)
    ? link.transactions
    : [];
  const successfulTransactions = transactions.filter(
    (tx) => tx && tx.status === "success",
  );

  // 🔐 Prevent deletion of links with successful payments
  const hasSuccessfulPayments = successfulTransactions.length > 0;

  const totalCollected = successfulTransactions.reduce(
    (sum, tx) => sum + (Number(tx.amount) || 0),
    0,
  );

  // ✅ Prevent array mutation when sorting
  const lastSuccessfulTx =
    successfulTransactions.length > 0
      ? [...successfulTransactions].sort((a, b) => {
          const dateA = a.createdAt || a.paidAt || a.updatedAt;
          const dateB = b.createdAt || b.paidAt || b.updatedAt;
          return new Date(dateB) - new Date(dateA);
        })[0]
      : null;

  const getLastPaymentDate = () => {
    if (!lastSuccessfulTx) return null;
    const dateStr =
      lastSuccessfulTx.paidAt ||
      lastSuccessfulTx.createdAt ||
      lastSuccessfulTx.updatedAt;
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return null;
    }
  };

  const lastPaymentDate = getLastPaymentDate();

  return (
    <tr className="table-row" onClick={handleView}>
      <td className="link-details-cell">
        <div className="link-details">
          <div
            className={`link-icon ${link.type === LINK_TYPES.REUSABLE ? "reusable" : "one-time"}`}
          >
            {link.type === LINK_TYPES.REUSABLE ? (
              <Repeat size={20} />
            ) : (
              <Zap size={20} />
            )}
          </div>
          <div>
            <div className="link-title">{link.title || "Untitled Link"}</div>
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
        <div className="amount">{formatCurrency(link.amount)}</div>
        {totalCollected > 0 && (
          <div className="collected">
            Collected: {formatCurrency(totalCollected)}
          </div>
        )}
      </td>

      <td className="status-cell">
        <StatusBadge status={link.status} expiresAt={link.expiresAt} />
      </td>

      <td className="performance-cell">
        <div className="payments-count">
          {successfulTransactions.length > 0 ? (
            <>
              <span className="success-badge">
                {successfulTransactions.length}{" "}
                {successfulTransactions.length === 1 ? "payment" : "payments"}
              </span>
              {lastPaymentDate && (
                <div className="last-paid">Last: {lastPaymentDate}</div>
              )}
            </>
          ) : (
            <span className="no-payments">No payments yet</span>
          )}
        </div>
        <div className="attempts-count">
          {transactions.length}{" "}
          {transactions.length === 1 ? "attempt" : "attempts"}
        </div>
      </td>

      <td className="date-cell">
        <div className="created-date">{formatDate(link.createdAt)}</div>
        {link.expiresAt && (
          <div className="expires-at-text">
            {formatRelativeTime(link.expiresAt)}
          </div>
        )}
      </td>

      <td className="actions-cell">
        <div className="dropdown-wrapper" ref={dropdownRef}>
          <button
            ref={menuButtonRef}
            onClick={toggleMenu}
            onKeyDown={(e) => handleKeyDown(e, toggleMenu)}
            className="action-menu-btn"
            aria-label="More actions"
            aria-expanded={openMenuId === link._id}
            aria-haspopup="true"
            title="More actions"
          >
            <MoreVertical size={18} />
          </button>

          {openMenuId === link._id && (
            <div
              className="dropdown-menu"
              role="menu"
              aria-label="Link actions"
            >
              <button
                onClick={handleCopy}
                onKeyDown={(e) => handleKeyDown(e, handleCopy)}
                className="dropdown-item"
                role="menuitem"
              >
                <Copy size={14} className="dropdown-icon" />
                Copy Link
              </button>

              <button
                onClick={handleView}
                onKeyDown={(e) => handleKeyDown(e, handleView)}
                className="dropdown-item"
                role="menuitem"
              >
                <Eye size={14} className="dropdown-icon" />
                View Details
              </button>

              <div className="dropdown-divider" />

              <button
                onClick={handleDelete}
                onKeyDown={(e) => handleKeyDown(e, handleDelete)}
                className="dropdown-item delete"
                role="menuitem"
                disabled={hasSuccessfulPayments}
                title={
                  hasSuccessfulPayments
                    ? "Cannot delete links with successful payments"
                    : "Delete link"
                }
              >
                <Trash2 size={14} className="dropdown-icon" />
                Delete Link
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="pagination-btn"
      >
        <ChevronLeft size={16} />
        Previous
      </button>

      <span className="pagination-info">
        Page {currentPage} of {totalPages}
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="pagination-btn"
      >
        Next
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

const LinkDetailsModal = ({ link, onClose, onCopy }) => {
  if (!link) return null;

  const statusConfig = {
    active: { className: "bg-green-100 text-green-800" },
    disabled: { className: "bg-red-100 text-red-800" },
    expired: { className: "bg-gray-100 text-gray-800" },
  };

  const transactions = Array.isArray(link.transactions)
    ? link.transactions
    : [];
  const successfulTransactions = transactions.filter(
    (tx) => tx && tx.status === "success",
  );

  const totalCollected = successfulTransactions.reduce(
    (sum, tx) => sum + (Number(tx.amount) || 0),
    0,
  );

  const statusCounts = transactions.reduce((acc, tx) => {
    if (tx && tx.status) {
      acc[tx.status] = (acc[tx.status] || 0) + 1;
    }
    return acc;
  }, {});

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Payment Link Details</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          <section className="details-section">
            <h3>Link Information</h3>
            <div className="details-grid">
              <DetailItem label="Link ID" value={link.linkId} />
              <DetailItem label="Title" value={link.title || "Untitled"} />
              <DetailItem
                label="Description"
                value={link.description || "No description"}
              />
              <DetailItem
                label="Amount"
                value={formatCurrency(link.amount, link.currency)}
                className="amount"
              />
              <DetailItem label="Gateway" value={link.gateway || "santimpay"} />
              <DetailItem
                label="Status"
                value={link.status}
                isStatus
                statusClassName={statusConfig[link.status]?.className}
              />
              <DetailItem
                label="Created"
                value={formatDateTime(link.createdAt)}
              />
              {link.expiresAt && (
                <DetailItem
                  label="Expires"
                  value={formatDateTime(link.expiresAt)}
                />
              )}
            </div>
          </section>

          {transactions.length > 0 && (
            <section className="details-section">
              <h3>Transaction Summary</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Total Collected</span>
                  <span className="summary-value success">
                    {formatCurrency(totalCollected)}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Successful</span>
                  <span className="summary-value success">
                    {successfulTransactions.length}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Failed</span>
                  <span className="summary-value failed">
                    {statusCounts.failed || 0}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Processing</span>
                  <span className="summary-value processing">
                    {statusCounts.processing || 0}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Initialized</span>
                  <span className="summary-value initialized">
                    {statusCounts.initialized || 0}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Total Attempts</span>
                  <span className="summary-value">{transactions.length}</span>
                </div>
              </div>
            </section>
          )}

          <section className="details-section">
            <h3>Payment URL</h3>
            <div className="url-box">
              <code className="url-text">{getPaymentUrl(link.linkId)}</code>
              <button
                onClick={() => onCopy(link.linkId)}
                className="icon-button"
                title="Copy link"
                aria-label="Copy link"
              >
                <Copy size={16} />
              </button>
            </div>
          </section>

          {transactions.length > 0 ? (
            <section className="details-section">
              <h3>All Transactions ({transactions.length})</h3>
              <div className="transactions-preview">
                <div className="transactions-header">
                  <span>Reference</span>
                  <span>Amount</span>
                  <span>Status</span>
                  <span>Date</span>
                </div>
                {transactions.map((tx, idx) => (
                  <TransactionRow key={tx._id || idx} transaction={tx} />
                ))}
              </div>
            </section>
          ) : (
            <section className="details-section">
              <div className="no-transactions">
                <p>No transactions yet for this payment link.</p>
              </div>
            </section>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={() => onCopy(link.linkId)} className="btn-secondary">
            <Copy size={16} />
            Copy Link
          </button>
          <button onClick={onClose} className="btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value, className, isStatus, statusClassName }) => (
  <div className="detail-item">
    <span className="detail-label">{label}:</span>
    {isStatus ? (
      <span className={`status-badge ${statusClassName}`}>{value}</span>
    ) : (
      <span className={`detail-value ${className || ""}`}>{value}</span>
    )}
  </div>
);

const TransactionRow = ({ transaction }) => {
  if (!transaction) return null;

  const status = transaction.status || "unknown";
  const amount = transaction.amount || 0;
  const ref = transaction.internalRef || transaction.reference || "N/A";
  const date =
    transaction.paidAt || transaction.createdAt || transaction.updatedAt;

  return (
    <div className="transaction-row">
      <span className="tx-ref" title={ref}>
        {ref}
      </span>
      <span className="tx-amount">{formatCurrency(amount)}</span>
      <span className={`tx-status ${status}`}>{status}</span>
      <span className="tx-date">{formatDateTime(date)}</span>
    </div>
  );
};

const EmptyState = ({ searchTerm, onCreate }) => (
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
    <button onClick={onCreate} className="btn-primary">
      <Plus size={16} />
      <span>Create Payment Link</span>
    </button>
  </div>
);

const LoadingState = () => (
  <div className="loading-state">
    <div className="spinner"></div>
    <p>Loading payment links...</p>
  </div>
);

// Main Component
export default function PaymentLinks() {
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLink, setSelectedLink] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".dropdown-wrapper")) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Custom hooks
  const {
    links,
    loading,
    error,
    dashboardStats,
    pagination,
    setPagination,
    fetchLinks,
    deleteLink,
    setError,
  } = usePaymentLinks();

  // Computed values
  const filteredLinks = useMemo(() => {
    return links.filter((link) => {
      if (activeTab !== "all" && link.type !== activeTab) return false;
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
  }, [links, activeTab, searchTerm]);

  const tabCounts = useMemo(
    () => ({
      all: links.length,
      [LINK_TYPES.ONE_TIME]: links.filter((l) => l.type === LINK_TYPES.ONE_TIME)
        .length,
      [LINK_TYPES.REUSABLE]: links.filter((l) => l.type === LINK_TYPES.REUSABLE)
        .length,
    }),
    [links],
  );

  // Handlers
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCopyLink = async (linkId) => {
    try {
      await navigator.clipboard.writeText(getPaymentUrl(linkId));
      // You could add a toast notification here
    } catch (err) {
      setError("Failed to copy link");
    }
  };

  const handleViewLink = (link) => {
    setOpenMenuId(null); // Close dropdown when opening modal
    setSelectedLink(link);
    setShowDetailsModal(true);
  };

  const handleDeleteLink = async (linkId) => {
    setOpenMenuId(null); // Prevent race UI issues
    const success = await deleteLink(linkId);
    if (success && selectedLink?._id === linkId) {
      setShowDetailsModal(false);
      setSelectedLink(null);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleRefresh = () => {
    fetchLinks({
      page: pagination.page,
      limit: pagination.limit,
      ...(searchTerm && { search: searchTerm }),
    });
  };

  const handleCreateLink = () => {
    navigate("/dashboard/create-link");
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedLink(null);
  };

  // Effects
  useEffect(() => {
    fetchLinks({
      page: pagination.page,
      limit: pagination.limit,
      ...(searchTerm && { search: searchTerm }),
    });
  }, [fetchLinks, activeTab, pagination.page, pagination.limit, searchTerm]);

  return (
    <div className="payment-links-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <h1 className="page-title">Payment Links</h1>
          <p className="page-subtitle">
            Create and manage payment links for your customers
          </p>
        </div>
        <button onClick={handleCreateLink} className="btn-primary">
          <Plus size={18} />
          <span>Create New Link</span>
        </button>
      </header>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          icon={Link2}
          label="Total Links"
          value={dashboardStats.totalLinks || 0}
          color="blue"
        />
        <StatCard
          icon={CheckCircle}
          label="Active"
          value={dashboardStats.activeLinks || 0}
          color="green"
          subValue={`${dashboardStats.paidLinks || 0} paid`}
        />
        <StatCard
          icon={DollarSign}
          label="Total Collected"
          value={formatCurrency(dashboardStats.totalRevenue || 0)}
          color="purple"
          subValue={`${dashboardStats.successfulCount || 0} payments`}
        />
        <StatCard
          icon={BarChart2}
          label="Conversion"
          value={`${dashboardStats.conversionRate || 0}%`}
          color="orange"
          subValue={`${dashboardStats.successfulCount || 0}/${(dashboardStats.successfulCount || 0) + (dashboardStats.failedCount || 0) + (dashboardStats.processingCount || 0) + (dashboardStats.pendingCount || 0)} successful`}
        />
      </div>

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        counts={tabCounts}
      />

      {/* Search */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onRefresh={handleRefresh}
        loading={loading}
      />

      {/* Error Message */}
      {error && (
        <div className="error-box">
          <p>{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <LoadingState />
        ) : filteredLinks.length === 0 ? (
          <EmptyState searchTerm={searchTerm} onCreate={handleCreateLink} />
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
                  {filteredLinks.map((link) => (
                    <LinkTableRow
                      key={link._id || link.linkId}
                      link={link}
                      onCopy={handleCopyLink}
                      onView={handleViewLink}
                      onDelete={handleDeleteLink}
                      openMenuId={openMenuId}
                      setOpenMenuId={setOpenMenuId}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      {/* Modal */}
      {showDetailsModal && (
        <LinkDetailsModal
          link={selectedLink}
          onClose={handleCloseModal}
          onCopy={handleCopyLink}
        />
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

        .stat-subvalue {
          font-size: 12px;
          color: #6b7280;
          margin-top: 2px;
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

        .success-badge {
          display: inline-block;
          padding: 4px 8px;
          background: #ecfdf5;
          color: #065f46;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .no-payments {
          color: #6b7280;
          font-size: 12px;
        }

        .attempts-count {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 2px;
        }

        .last-paid {
          font-size: 10px;
          color: #9ca3af;
        }

        .created-date {
          font-size: 14px;
          color: #111827;
          margin-bottom: 4px;
        }

        .expires-at-text {
          font-size: 11px;
          color: #9ca3af;
        }

        /* Dropdown Styles */
        .dropdown-wrapper {
          position: relative;
          display: inline-block;
        }

        .action-menu-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background: white;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-menu-btn:hover {
          background: #f9fafb;
          border-color: #d1d5db;
          color: #374151;
        }

        .action-menu-btn:focus-visible {
          outline: 2px solid #059669;
          outline-offset: 2px;
        }

        .dropdown-menu {
          position: absolute;
          right: 0;
          top: 42px;
          width: 200px;
          background: white;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          box-shadow:
            0 10px 25px -5px rgba(0, 0, 0, 0.1),
            0 8px 10px -6px rgba(0, 0, 0, 0.02);
          padding: 6px;
          z-index: 50;
          opacity: 0;
          transform: translateY(-5px);
          animation: dropdownFade 0.15s ease forwards;
        }

        @keyframes dropdownFade {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-item {
          width: 100%;
          padding: 10px 12px;
          border: none;
          background: none;
          text-align: left;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.15s;
        }

        .dropdown-item:hover:not(:disabled) {
          background: #f3f4f6;
        }

        .dropdown-item:focus-visible {
          outline: 2px solid #059669;
          outline-offset: -2px;
        }

        .dropdown-item:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .dropdown-item.delete {
          color: #dc2626;
        }

        .dropdown-item.delete:hover:not(:disabled) {
          background: #fee2e2;
        }

        .dropdown-icon {
          opacity: 0.7;
        }

        .dropdown-divider {
          height: 1px;
          background: #e5e7eb;
          margin: 6px 0;
        }

        .icon-button {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          background: white;
          color: #6b7280;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .icon-button:hover {
          background: #f9fafb;
          color: #059669;
          border-color: #059669;
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
          backdrop-filter: blur(4px);
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
          position: sticky;
          top: 0;
          background: white;
          z-index: 10;
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
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: #f9fafb;
          color: #111827;
          border-color: #9ca3af;
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
          position: sticky;
          bottom: 0;
          background: white;
          z-index: 10;
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
          font-weight: 500;
        }

        .detail-value.amount {
          font-weight: 600;
          color: #059669;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 16px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 12px;
        }

        .summary-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .summary-label {
          font-size: 11px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .summary-value {
          font-size: 18px;
          font-weight: 600;
        }

        .summary-value.success {
          color: #059669;
        }

        .summary-value.failed {
          color: #dc2626;
        }

        .summary-value.processing {
          color: #f59e0b;
        }

        .summary-value.initialized {
          color: #3b82f6;
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
          font-family: monospace;
        }

        .transactions-preview {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .transactions-header {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1.5fr;
          padding: 12px 16px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .transaction-row {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1.5fr;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 13px;
          transition: background 0.15s;
        }

        .transaction-row:hover {
          background: #f9fafb;
        }

        .transaction-row:last-child {
          border-bottom: none;
        }

        .tx-ref {
          font-family: monospace;
          font-size: 12px;
          color: #374151;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .tx-amount {
          font-weight: 600;
          color: #111827;
        }

        .tx-status {
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          text-transform: capitalize;
          width: fit-content;
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

        .tx-status.initialized {
          background: #e0f2fe;
          color: #0369a1;
        }

        .tx-status.unknown {
          background: #f3f4f6;
          color: #6b7280;
        }

        .tx-date {
          font-size: 11px;
          color: #6b7280;
        }

        .no-transactions {
          text-align: center;
          padding: 48px;
          background: #f9fafb;
          border-radius: 8px;
          color: #6b7280;
          font-size: 14px;
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

          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .modal {
            margin: 20px;
          }

          .transactions-header,
          .transaction-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .transactions-header {
            display: none;
          }

          .transaction-row {
            grid-template-columns: 1fr;
            gap: 8px;
            padding: 16px;
            border-bottom: 1px solid #e5e7eb;
          }

          .tx-ref,
          .tx-amount,
          .tx-status,
          .tx-date {
            padding: 4px 0;
          }

          .tx-ref::before {
            content: "Ref: ";
            font-weight: 600;
            color: #6b7280;
            margin-right: 4px;
          }

          .tx-amount::before {
            content: "Amount: ";
            font-weight: 600;
            color: #6b7280;
            margin-right: 4px;
          }

          .tx-status::before {
            content: "Status: ";
            font-weight: 600;
            color: #6b7280;
            margin-right: 4px;
          }

          .tx-date::before {
            content: "Date: ";
            font-weight: 600;
            color: #6b7280;
            margin-right: 4px;
          }
        }
      `}</style>
    </div>
  );
}
