// DashboardHome.js
import { useState, useEffect } from "react";
import { privateApi as api } from "../api/api";
import { useNavigate } from "react-router-dom";

export default function DashboardHome() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    successfulCount: 0,
    failedCount: 0,
    processingCount: 0,
    totalLinks: 0,
    paidLinks: 0,
    activeLinks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/dashboard/summary");
      if (res.data.success) {
        setStats({
          totalRevenue: res.data.data?.totalRevenue || 0,
          successfulCount: res.data.data?.successfulCount || 0,
          failedCount: res.data.data?.failedCount || 0,
          processingCount: res.data.data?.processingCount || 0,
          totalLinks: res.data.data?.totalLinks || 0,
          paidLinks: res.data.data?.paidLinks || 0,
          activeLinks: res.data.data?.activeLinks || 0,
        });
      } else {
        throw new Error(res.data.message || "Failed to fetch dashboard data");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Failed to load dashboard. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = () => navigate("/dashboard/create-link");
  const handleViewTransactions = () => navigate("/dashboard/transactions");

  if (loading) {
    return (
      <div style={styles.loader}>
        <div style={styles.spinner}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <h1>Dashboard</h1>
        <div style={styles.errorBox}>
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          <button style={styles.primaryButton} onClick={fetchDashboardStats}>
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ marginBottom: "5px" }}>Dashboard Overview</h1>
      <p style={{ color: "#666" }}>
        Welcome back! Here's your payment performance summary.
      </p>

      {/* Primary Stats */}
      <div style={styles.cardGrid}>
        <StatCard
          title="Total Revenue"
          emoji="💰"
          value={`${stats.totalRevenue.toLocaleString()} ETB`}
          subtitle={`From ${stats.successfulCount} successful payments`}
          color="#059669"
          gradient={["#d1fae5", "#a7f3d0"]}
        />
        <StatCard
          title="Successful Payments"
          emoji="✅"
          value={stats.successfulCount}
          subtitle="Completed transactions"
          color="#0d6efd"
          gradient={["#dbeafe", "#bfdbfe"]}
        />
        <StatCard
          title="Active Links"
          emoji="🔗"
          value={stats.activeLinks}
          subtitle={`Out of ${stats.totalLinks} total links`}
          color="#f97316"
          gradient={["#fff7ed", "#ffedd5"]}
        />
      </div>

      {/* Secondary Stats */}
      <div style={styles.cardGrid}>
        <StatCard
          title="Failed Payments"
          emoji="❌"
          value={stats.failedCount}
          color="#dc2626"
          gradient={["#fee2e2", "#fecaca"]}
        />
        <StatCard
          title="Processing"
          emoji="⏳"
          value={stats.processingCount}
          color="#f97316"
          gradient={["#fff7ed", "#ffedd5"]}
        />
        <StatCard
          title="Paid Links"
          emoji="💰"
          value={stats.paidLinks}
          color="#059669"
          gradient={["#d1fae5", "#a7f3d0"]}
        />
        <StatCard
          title="Conversion"
          emoji="📊"
          value={
            stats.totalLinks > 0
              ? `${Math.round((stats.paidLinks / stats.totalLinks) * 100)}%`
              : "0%"
          }
          color="#7b1fa2"
          gradient={["#f3e5f5", "#e1bee7"]}
        />
      </div>

      {/* Quick Actions */}
      <Section title="Quick Actions">
        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
          <ActionButton
            label="Create Payment Link"
            onClick={handleCreateLink}
            color="#0d6efd"
          />
          <ActionButton
            label="View Transactions"
            onClick={handleViewTransactions}
            color="#198754"
          />
          <ActionButton
            label="Refresh Dashboard"
            onClick={fetchDashboardStats}
            color="#6c757d"
          />
        </div>
      </Section>

      {/* Gateway Status */}
      <Section title="Gateway Status">
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          <GatewayCard
            name="SantimPay (Type A)"
            color="#059669"
            status="Operational"
            description="Primary Ethiopian payment gateway for Type A transactions"
          />
          <GatewayCard
            name="Chapa (Type B Lite)"
            color="#0d6efd"
            status="Operational"
            description="Fallback multi-currency gateway for Type B Lite transactions"
          />
        </div>
      </Section>
    </div>
  );
}

/* ---------- Reusable Components ---------- */

function StatCard({ title, emoji, value, subtitle, color, gradient }) {
  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`,
        padding: "20px",
        borderRadius: "12px",
        flex: 1,
        minWidth: "180px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      }}
    >
      <h3 style={{ color, marginBottom: "10px" }}>
        {emoji} {title}
      </h3>
      <p style={{ fontSize: "28px", fontWeight: "bold", color }}>{value}</p>
      {subtitle && <p style={{ fontSize: "14px", color }}>{subtitle}</p>}
    </div>
  );
}

function ActionButton({ label, onClick, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "12px 24px",
        background: color,
        color: "white",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: 500,
        fontSize: "16px",
        transition: "all 0.3s",
      }}
      onMouseEnter={(e) => (e.target.style.background = shadeColor(color, -20))}
      onMouseLeave={(e) => (e.target.style.background = color)}
    >
      {label}
    </button>
  );
}

function GatewayCard({ name, color, status, description }) {
  return (
    <div
      style={{
        padding: "20px",
        border: `2px solid ${color}`,
        borderRadius: "12px",
        background: "#ffffff",
        flex: 1,
        minWidth: "250px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "12px",
            height: "12px",
            background: color,
            borderRadius: "50%",
          }}
        ></div>
        <strong style={{ fontSize: "18px" }}>{name}</strong>
      </div>
      <p
        style={{ color, marginTop: "10px", fontWeight: 500 }}
      >{`✅ ${status}`}</p>
      <p style={{ fontSize: "14px", color: "#666", marginTop: "5px" }}>
        {description}
      </p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: "40px" }}>
      <h2 style={{ marginBottom: "15px" }}>{title}</h2>
      {children}
    </div>
  );
}

/* ---------- Styles ---------- */

const styles = {
  loader: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "60vh",
    flexDirection: "column",
    gap: "20px",
    color: "#666",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "5px solid #f3f3f3",
    borderTop: "5px solid #0d6efd",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  errorBox: {
    padding: "20px",
    background: "#fee2e2",
    borderRadius: "8px",
    color: "#c62828",
    marginTop: "20px",
    borderLeft: "4px solid #c62828",
  },
  primaryButton: {
    marginTop: "15px",
    padding: "8px 16px",
    background: "#0d6efd",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  cardGrid: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
    marginTop: "20px",
  },
};

/* ---------- Helper Function ---------- */
function shadeColor(color, percent) {
  // darken/lighten hex color
  let f = parseInt(color.slice(1), 16),
    t = percent < 0 ? 0 : 255,
    p = percent < 0 ? percent * -1 : percent,
    R = f >> 16,
    G = (f >> 8) & 0x00ff,
    B = f & 0x0000ff;
  return (
    "#" +
    (
      0x1000000 +
      (Math.round((t - R) * p) + R) * 0x10000 +
      (Math.round((t - G) * p) + G) * 0x100 +
      (Math.round((t - B) * p) + B)
    )
      .toString(16)
      .slice(1)
  );
}
