import { Link, Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { clearAuthToken } from "../utils/auth";
import { useUser } from "../context/UserContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const profileRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

        {/* Profile Section */}
        {user && (
          <div ref={profileRef} style={styles.profileWrapper}>
            <div
              style={styles.profileButton}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {/* Avatar */}
              {user.avatar ? (
                <img
                  src={
                    user.avatar.startsWith("http")
                      ? user.avatar
                      : `${import.meta.env.VITE_API_URL}${user.avatar}`
                  }
                  alt="Profile"
                  style={styles.avatar}
                />
              ) : (
                <div style={styles.avatarFallback}>
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
              )}

              {/* Name and Email */}
              <div style={styles.profileInfo}>
                <span style={styles.name}>
                  {user.name || user.email.split("@")[0]}
                </span>
                <span style={styles.email}>{user.email}</span>
              </div>
            </div>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div style={styles.dropdown}>
                <button
                  style={styles.dropdownItem}
                  onClick={() => navigate("/dashboard/profile")}
                >
                  ✏️ Edit Profile
                </button>
                <button style={styles.dropdownItem} onClick={handleLogout}>
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Main Panel */}
      <main style={styles.main}>
        <div style={styles.panel}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

// Styles
const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Inter', sans-serif",
    background: "#f9fafb",
  },
  sidebar: {
    width: 240,
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
  brand: { fontSize: 32, fontWeight: 800, marginBottom: 20 },
  nav: { display: "flex", flexDirection: "column", gap: 12 },
  link: {
    color: "#ecfdf5",
    textDecoration: "none",
    padding: "10px 12px",
    borderRadius: 8,
    fontWeight: 500,
    transition: "background 0.2s",
  },
  profileWrapper: { marginTop: "auto", position: "relative" },
  profileButton: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "rgba(255,255,255,0.12)",
    padding: 12,
    borderRadius: 12,
    cursor: "pointer",
    transition: "background 0.2s",
  },
  avatar: { width: 50, height: 50, borderRadius: "50%" },
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: "50%",
    backgroundColor: "#10b981",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
  },
  profileInfo: { display: "flex", flexDirection: "column" },
  name: { fontWeight: 600, fontSize: 14 },
  email: { fontSize: 12, opacity: 0.8 },
  dropdown: {
    position: "absolute",
    bottom: 70,
    left: 0,
    width: "100%",
    background: "#059669",
    color: "#ffffff",
    borderRadius: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
    overflow: "hidden",
    zIndex: 10,
  },
  dropdownItem: {
    width: "100%",
    padding: 12,
    border: "none",
    background: "none",
    textAlign: "left",
    cursor: "pointer",
    fontWeight: 500,
    color: "#fff",
    transition: "background 0.2s",
  },
  main: { flex: 1, padding: 40 },
  panel: {
    background: "#fff",
    borderRadius: 16,
    padding: 30,
    minHeight: "calc(100vh - 80px)",
  },
};
