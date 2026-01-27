import { Link, Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { clearAuthToken, getAuthToken } from "../utils/auth";
import { privateApi } from "../api/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Fetch logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await privateApi.get("/me");
        setUser(res.data.user);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };

    if (getAuthToken()) fetchUser();
  }, []);

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

        {/* Profile at bottom */}
        {user && (
          <div style={styles.profileContainer}>
            <img
              src={user.avatar || "https://i.pravatar.cc/40"} // fallback avatar
              alt="Profile"
              style={styles.avatar}
            />
            <div style={styles.profileInfo}>
              <span style={styles.name}>{user.name || user.email}</span>
              <button onClick={handleLogout} style={styles.logoutButton}>
                Logout
              </button>
            </div>
          </div>
        )}
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
    position: "sticky",
    top: 0,
    height: "100vh",
    overflowY: "auto",
  },

  brand: {
    fontSize: 32,
    fontWeight: 800,
    marginBottom: "20px",
    flexShrink: 0,
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
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

  profileContainer: {
    marginTop: "auto", // push it to bottom
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "rgba(255,255,255,0.1)",
    padding: "12px",
    borderRadius: "12px",
  },

  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
  },

  profileInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  name: {
    fontWeight: 600,
    fontSize: "14px",
  },

  logoutButton: {
    padding: "6px 12px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#059669",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "12px",
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
