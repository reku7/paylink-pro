import { Link, Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { clearAuthToken, getAuthToken } from "../utils/auth";
import { privateApi } from "../api/api";

export default function Dashboard() {
  const navigate = useNavigate();
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

        {/* Profile section */}
        {user && (
          <div style={styles.profileContainer}>
            {user.avatar ? (
              <img src={user.avatar} alt="Profile" style={styles.avatar} />
            ) : (
              <div style={styles.avatarFallback}>
                {user.email.charAt(0).toUpperCase()}
              </div>
            )}

            <div style={styles.profileInfo}>
              <span style={styles.name}>
                {user.name || user.email.split("@")[0]}
              </span>
              <span style={styles.email}>{user.email}</span>
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
  },

  brand: {
    fontSize: 32,
    fontWeight: 800,
    marginBottom: "20px",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  link: {
    color: "#ecfdf5",
    textDecoration: "none",
    padding: "10px 12px",
    borderRadius: "8px",
    fontWeight: 500,
  },

  profileContainer: {
    marginTop: "auto",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "rgba(255,255,255,0.12)",
    padding: "12px",
    borderRadius: "14px",
  },

  avatar: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    objectFit: "cover",
  },

  avatarFallback: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    backgroundColor: "#10b981",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "18px",
  },

  profileInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  name: {
    fontWeight: 700,
    fontSize: "14px",
  },

  email: {
    fontSize: "12px",
    color: "#d1fae5",
    opacity: 0.85,
  },

  logoutButton: {
    marginTop: "6px",
    padding: "6px 10px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#059669",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "12px",
    width: "fit-content",
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
