import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { privateApi as api } from "../api/api";
import { setAuthToken } from "../utils/auth";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", { email, password });
      setAuthToken(res.data.token);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
      setError(
        err.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      {/* LEFT — BRANDING */}
      <section style={styles.left}>
        <div>
          <h1 style={styles.brand}>PayFlow</h1>
          <p style={styles.tagline}>
            Accept payments securely with Chapa & SantimPay
          </p>
          <ul style={styles.features}>
            <li>✓ Built for Ethiopian merchants</li>
            <li>✓ Secure & compliant login</li>
            <li>✓ Access your dashboard instantly</li>
          </ul>
          <p style={styles.trust}>
            Trusted payment infrastructure for modern businesses
          </p>
        </div>
      </section>

      {/* RIGHT — LOGIN FORM */}
      <section style={styles.right}>
        <div style={styles.formWrapper}>
          <header style={styles.header}>
            <h2>Merchant Login</h2>
            <p>Sign in to access your dashboard</p>
          </header>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleLogin} style={styles.formGrid}>
            <div>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={loading ? styles.buttonDisabled : styles.button}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <p style={styles.login}>
              Don't have an account? <Link to="/register">Sign Up</Link>
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}

/* ---------- Reusable Components ---------- */
function Input({ label, type = "text", value, onChange }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            ...styles.input,
            paddingRight: isPassword ? 40 : 12, // only extra padding for password
          }}
          required
        />
        {isPassword && (
          <span
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Eye icon */}
          </span>
        )}
      </div>
    </div>
  );
}

/* ---------- Styles (same as register page) ---------- */
const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "1fr 1.4fr",
  },
  left: {
    background: "linear-gradient(135deg, #064e3b 0%, #022c22 100%)",
    color: "#ecfdf5",
    padding: "80px 64px",
    display: "flex",
    alignItems: "center",
  },
  brand: { fontSize: 40, fontWeight: 800, marginBottom: 12 },
  tagline: { fontSize: 18, marginBottom: 32, color: "#a7f3d0" },
  features: {
    listStyle: "none",
    padding: 0,
    marginBottom: 32,
    lineHeight: 1.9,
  },
  trust: { fontSize: 14, color: "#99f6e4" },
  right: { background: "#ffffff", padding: "64px", overflowY: "auto" },
  formWrapper: { maxWidth: 500, margin: "0 auto" },
  header: { marginBottom: 32 },
  error: {
    background: "#fef2f2",
    color: "#991b1b",
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
  },
  formGrid: { display: "grid", gap: 24 },
  field: { marginBottom: 16 },
  label: { display: "block", marginBottom: 6, fontWeight: 500 },
  input: {
    width: "100%",
    padding: 12,
    paddingRight: 40, // only if password field
    borderRadius: 8,
    border: "1px solid #ccc",
    boxSizing: "border-box", // ensures padding is inside the width
  },

  button: {
    padding: 16,
    background: "#059669",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
  },
  buttonDisabled: {
    padding: 16,
    background: "#a7f3d0",
    borderRadius: 14,
    border: "none",
  },
  login: { marginTop: 16, textAlign: "center" },
};
