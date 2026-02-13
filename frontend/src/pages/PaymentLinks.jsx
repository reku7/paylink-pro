import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { format, formatDistanceToNow } from "date-fns";
import {
  Link2,
  Plus,
  Copy,
  Trash2,
  Zap,
  Repeat,
  CheckCircle,
  XCircle,
  Clock,
  BarChart2,
  DollarSign,
} from "lucide-react";
import CreateLinkModal from "../components/dashboard/CreateLinkModal";
import LinkDetailsModal from "../components/dashboard/LinkDetailsModal";

export default function PaymentLinks() {
  const navigate = useNavigate();

  // State
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    totalCollected: 0,
    conversionRate: 0,
  });

  // Fetch links
  useEffect(() => {
    fetchLinks();
  }, [activeTab, pagination.page, searchTerm]);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (activeTab === "one-time") params.type = "one_time";
      if (activeTab === "reusable") params.type = "reusable";
      if (searchTerm) params.search = searchTerm;

      const res = await axios.get("/api/links", { params });
      const data = res.data.data || [];

      setLinks(data);
      setPagination((prev) => ({
        ...prev,
        total: res.data.pagination?.total || data.length,
        pages:
          res.data.pagination?.pages || Math.ceil(data.length / prev.limit),
      }));

      calculateStats(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load links");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const totalCollected = data.reduce(
      (sum, l) => sum + (l.totalCollected || 0),
      0,
    );
    const totalTransactions = data.reduce(
      (sum, l) => sum + (l.transactions?.length || 0),
      0,
    );
    const successfulTransactions = data.reduce(
      (sum, l) =>
        sum +
        (l.transactions?.filter((tx) => tx.status === "success").length || 0),
      0,
    );
    const active = data.filter(
      (l) =>
        l.status === "active" &&
        (!l.expiresAt || new Date(l.expiresAt) > new Date()),
    ).length;
    const expired = data.filter(
      (l) =>
        l.status === "expired" ||
        (l.expiresAt && new Date(l.expiresAt) < new Date()),
    ).length;

    setStats({
      total: data.length,
      active,
      expired,
      totalCollected,
      conversionRate: totalTransactions
        ? Math.round((successfulTransactions / totalTransactions) * 100)
        : 0,
    });
  };

  const copyLink = (linkId, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/pay/${linkId}`);
    toast.success("Link copied!");
  };

  const deleteLink = async (linkId, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this link? This action cannot be undone."))
      return;

    try {
      const res = await axios.delete(`/api/links/${linkId}`);
      if (res.data.success) {
        toast.success("Deleted successfully");
        fetchLinks();
      }
    } catch {
      toast.error("Failed to delete link");
    }
  };

  const tabs = [
    { id: "all", label: "All Links", count: stats.total },
    {
      id: "one-time",
      label: "One-Time",
      count: links.filter((l) => l.type === "one_time").length,
    },
    {
      id: "reusable",
      label: "Reusable",
      count: links.filter((l) => l.type === "reusable").length,
    },
  ];

  const getStatusBadge = (link) => {
    if (
      link.status === "active" &&
      link.expiresAt &&
      new Date(link.expiresAt) < new Date()
    ) {
      return {
        label: "Expired",
        color: "bg-gray-100 text-gray-800",
        Icon: Clock,
      };
    }
    switch (link.status) {
      case "active":
        return {
          label: "Active",
          color: "bg-green-100 text-green-800",
          Icon: CheckCircle,
        };
      case "disabled":
        return {
          label: "Disabled",
          color: "bg-red-100 text-red-800",
          Icon: XCircle,
        };
      case "expired":
        return {
          label: "Expired",
          color: "bg-gray-100 text-gray-800",
          Icon: Clock,
        };
      default:
        return {
          label: link.status,
          color: "bg-gray-100 text-gray-800",
          Icon: Clock,
        };
    }
  };

  // Filter
  const filteredLinks = links.filter((l) => {
    if (activeTab === "one-time" && l.type !== "one_time") return false;
    if (activeTab === "reusable" && l.type !== "reusable") return false;
    if (searchTerm) {
      return [l.title, l.linkId, l.amount?.toString()].some((field) =>
        field?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    return true;
  });

  return (
    <div className="payment-links-page">
      {/* Header */}
      <div className="page-header">
        <h1>Payment Links</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <Plus size={16} /> Create Link
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className={activeTab === tab.id ? "active" : ""}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search title, ID, or amount..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Table */}
      {loading ? (
        <p>Loading...</p>
      ) : filteredLinks.length === 0 ? (
        <p>No links found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Link</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLinks.map((link) => {
              const { label, color, Icon } = getStatusBadge(link);
              return (
                <tr
                  key={link._id}
                  onClick={() => navigate(`/pay/${link.linkId}`)}
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    {link.title || "Untitled"} ({link.linkId})
                  </td>
                  <td>{link.amount}</td>
                  <td>
                    <span className={color}>
                      <Icon size={12} /> {label}
                    </span>
                  </td>
                  <td>{format(new Date(link.createdAt), "MMM d, yyyy")}</td>
                  <td>
                    <button onClick={(e) => copyLink(link.linkId, e)}>
                      Copy
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLink(link);
                        setShowDetailsModal(true);
                      }}
                    >
                      View
                    </button>
                    <button onClick={(e) => deleteLink(link._id, e)}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateLinkModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchLinks();
            toast.success("Created!");
          }}
        />
      )}
      {showDetailsModal && selectedLink && (
        <LinkDetailsModal
          link={selectedLink}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedLink(null);
          }}
          onUpdate={fetchLinks}
        />
      )}
    </div>
  );
}
