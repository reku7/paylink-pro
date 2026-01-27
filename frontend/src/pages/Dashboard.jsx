import { Link, Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { clearAuthToken, getAuthToken } from "../utils/auth";
import { privateApi } from "../api/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const profileRef = useRef(null);

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

        {user && (
          <div ref={profileRef} style={styles.profileWrapper}>
            <div
              style={styles.profileButton}
              onClick={() => setMenuOpen(!menuOpen)}
            >
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
              </div>
            </div>

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
    transition: "background 0.2s",
  },

  linkHover: {
    background: "rgba(255,255,255,0.1)",
  },

  profileWrapper: {
    marginTop: "auto",
    position: "relative",
  },

  profileButton: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "rgba(255,255,255,0.12)",
    padding: "12px",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "background 0.2s",
  },

  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
  },

  avatarFallback: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#10b981",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
  },

  profileInfo: {
    display: "flex",
    flexDirection: "column",
  },

  name: {
    fontWeight: 600,
    fontSize: "14px",
  },

  email: {
    fontSize: "12px",
    opacity: 0.8,
  },

  dropdown: {
    position: "absolute",
    bottom: "70px",
    left: 0,
    width: "100%",
    background: "#059669", // Emerald green (matches sidebar feel)
    color: "#ffffff", // white text for contrast
    borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
    overflow: "hidden",
    zIndex: 10,
  },

  dropdownItem: {
    width: "100%",
    padding: "12px",
    border: "none",
    background: "none",
    textAlign: "left",
    cursor: "pointer",
    fontWeight: 500,
    color: "#fff",
    transition: "background 0.2s",
  },

  dropdownItemHover: {
    background: "rgba(255,255,255,0.1)",
  },

  main: {
    flex: 1,
    padding: "40px",
  },

  panel: {
    background: "#fff",
    borderRadius: "16px",
    padding: "30px",
    minHeight: "calc(100vh - 80px)",
  },
};
