import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Link2,
  Plus,
  Copy,
  Trash2,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Activity,
  Search,
} from "lucide-react";
import { privateApi as api } from "../api/api";

export default function PaymentLinks() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  useEffect(() => {
    fetchLinks();
  }, [pagination.page]);

  const fetchLinks = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/links", {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm || undefined,
        },
      });

      if (res.data?.success) {
        setLinks(res.data.data || []);
        setPagination((p) => ({
          ...p,
          total: res.data.pagination?.total ?? 0,
          pages: res.data.pagination?.pages ?? 1,
        }));
      }
    } catch {
      setError("Failed to load payment links");
    } finally {
      setLoading(false);
    }
  };

  const filteredLinks = useMemo(() => {
    return links.filter((l) => {
      if (activeTab === "one-time" && l.type !== "one_time") return false;
      if (activeTab === "reusable" && l.type !== "reusable") return false;
      if (!searchTerm) return true;

      const t = searchTerm.toLowerCase();
      return (
        l.title?.toLowerCase().includes(t) ||
        l.linkId?.toLowerCase().includes(t)
      );
    });
  }, [links, activeTab, searchTerm]);

  return (
    <div className="payment-links-page">
      {/* HEADER */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Payment Links</h1>
          <p className="page-subtitle">
            Create, manage and track your payment links
          </p>
        </div>

        <Link to="/dashboard/create-link" className="btn-primary">
          <Plus size={18} /> Create Link
        </Link>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Link2 />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Links</span>
            <span className="stat-value">{links.length}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <Activity />
          </div>
          <div className="stat-info">
            <span className="stat-label">Active</span>
            <span className="stat-value">
              {links.filter((l) => l.status === "active").length}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <DollarSign />
          </div>
          <div className="stat-info">
            <span className="stat-label">Collected</span>
            <span className="stat-value">$0</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <TrendingUp />
          </div>
          <div className="stat-info">
            <span className="stat-label">Conversion</span>
            <span className="stat-value">0%</span>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="tabs-container">
        <div className="tabs">
          {["all", "one-time", "reusable"].map((t) => (
            <button
              key={t}
              className={`tab ${activeTab === t ? "active" : ""}`}
              onClick={() => setActiveTab(t)}
            >
              {t === "all" ? "All" : t === "one-time" ? "One-Time" : "Reusable"}
            </button>
          ))}
        </div>
      </div>

      {/* SEARCH */}
      <div className="search-container">
        <div className="search-wrapper">
          <Search className="search-icon" size={18} />
          <input
            className="search-input"
            placeholder="Search payment links..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="action-buttons">
          <button className="btn-refresh" onClick={fetchLinks}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            Loading...
          </div>
        ) : error ? (
          <div className="error-box">{error}</div>
        ) : filteredLinks.length === 0 ? (
          <div className="empty-state">
            <h3>No payment links</h3>
            <p>Create your first payment link</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLinks.map((l) => (
                  <tr key={l._id} className="table-row">
                    <td>{l.title}</td>
                    <td>{l.type}</td>
                    <td>{l.status}</td>
                    <td>
                      <div className="action-buttons-group">
                        <button className="action-btn">
                          <Copy size={14} />
                        </button>
                        <button className="action-btn delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        <div className="pagination">
          <button className="pagination-btn">Prev</button>
          <span className="pagination-info">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button className="pagination-btn">Next</button>
        </div>
      </div>

      {/* YOUR STYLE JSX GOES HERE */}
      {/* ✅ Paste your <style jsx> block exactly as you sent */}

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
