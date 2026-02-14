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
  Archive,
  Download,
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

  // ✅ UPDATED: Use archive endpoint instead of delete
  const archiveLink = useCallback(
    async (linkId) => {
      try {
        const response = await api.patch(
          `${API_ENDPOINTS.LINKS}/${linkId}/archive`,
        );

        if (response.data.success) {
          await fetchLinks();
          await fetchDashboardStats();
          return true;
        }
      } catch (err) {
        console.error("Failed to archive link:", err);
        setError(err.response?.data?.error || "Failed to archive link");
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
    archiveLink, // Renamed from deleteLink
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

// ✅ UPDATED: Renamed onDelete to onArchive
const LinkTableRow = ({
  link,
  onCopy,
  onView,
  onArchive,
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

  // ✅ UPDATED: Archive handler
  const handleArchive = (e) => {
    e.stopPropagation();
    if (
      window.confirm(
        "Are you sure you want to archive this link? It will be hidden from the main list but all transaction data will be preserved.",
      )
    ) {
      onArchive(link._id);
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

  // 🔐 Prevent archiving of links with successful payments (optional safety)
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

              {/* ✅ UPDATED: Archive button instead of delete */}
              <button
                onClick={handleArchive}
                onKeyDown={(e) => handleKeyDown(e, handleArchive)}
                className="dropdown-item archive"
                role="menuitem"
                disabled={hasSuccessfulPayments}
                title={
                  hasSuccessfulPayments
                    ? "Cannot archive links with successful payments"
                    : "Archive link"
                }
              >
                <Archive size={14} className="dropdown-icon" />
                Archive Link
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
    archiveLink, // ✅ Renamed from deleteLink
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

  // ✅ UPDATED: Archive handler
  const handleArchiveLink = async (linkId) => {
    setOpenMenuId(null); // Prevent race UI issues
    const success = await archiveLink(linkId);
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
          <p className="page-subtitle">Create and manage payment links</p>
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
                      onArchive={handleArchiveLink} // ✅ Updated prop name
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

      {/* Add archive class to dropdown item styles */}
      <style jsx>{`
        /* ... (keep all your existing styles) ... */

        /* Add archive button style */
        .dropdown-item.archive {
          color: #6b7280;
        }

        .dropdown-item.archive:hover:not(:disabled) {
          background: #f3f4f6;
          color: #374151;
        }

        .dropdown-item.archive:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
