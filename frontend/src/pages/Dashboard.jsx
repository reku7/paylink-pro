// Dashboard.js
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { clearAuthToken } from "../utils/auth";

export default function Dashboard() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    clearAuthToken();
    navigate("/login");
  };

  return (
    <div style={styles.page}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <h2 style={styles.brand}>PayFlow</h2>

        <nav style={styles.nav}>
          <Link to="/dashboard" style={styles.link}>
            Dashboard Home
          </Link>
          <Link to="/dashboard/transactions" style={styles.link}>
            Transactions
          </Link>
          <Link to="/dashboard/create-link" style={styles.link}>
            Create Payment Link
          </Link>
          <Link to="/dashboard/settings/payments" style={styles.link}>
            Payment Gateways
          </Link>
        </nav>

        <button onClick={handleLogout} style={styles.logoutButton}>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
        <div style={styles.panel}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Inter', sans-serif",
    background: "#f9fafb",
  },

  sidebar: {
    width: "240px",
    background: "linear-gradient(135deg, #117c60 0%, #022c22 100%)",
    color: "#ecfdf5",
    padding: "40px 20px",
    display: "flex",
    flexDirection: "column",
    position: "sticky", // make it stick in viewport
    top: 0,
    height: "100vh",
    overflowY: "auto", // scroll if content exceeds viewport
  },

  brand: {
    fontSize: 32,
    fontWeight: 800,
    marginBottom: "20px", // reduce gap here
    flexShrink: 0,
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "12px", // slightly tighter between links
    flexShrink: 0,
  },
  link: {
    color: "#ecfdf5",
    textDecoration: "none",
    padding: "10px 12px",
    borderRadius: "8px",
    fontWeight: 500,
    transition: "background 0.3s",
  },
  logoutButton: {
    marginTop: "auto",
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    backgroundColor: "#059669",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.3s",
    position: "sticky", // stick it at bottom
    bottom: "40px", // spacing from bottom
  },

  main: {
    flex: 1,
    padding: "40px",
  },
  panel: {
    background: "#fff",
    borderRadius: "16px",
    padding: "30px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    minHeight: "calc(100vh - 80px)",
  },
};
