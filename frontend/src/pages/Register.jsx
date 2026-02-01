import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { privateApi as api } from "../api/api";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [merchantName, setMerchantName] = useState("");

  const [business, setBusiness] = useState({
    businessName: "",
    businessAddress: "",
    businessPhone: "",
    businessEmail: "",
    businessType: "",
    tinNumber: "",
    fydaId: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !merchantName) {
      return setError("Please fill all required fields");
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        name,
        email,
        password,
        merchantName,
        preferredGateway: "santimpay",
      };

      if (Object.values(business).some(Boolean)) {
        payload.business = business;
      }

      await api.post("/auth/register", payload);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* LEFT */}
      <section style={styles.left}>
        <div style={styles.branding}>
          <h1 style={styles.brand}>PayFlow</h1>
          <p style={styles.tagline}>
            Accept payments securely with SantimPay & Chapa
          </p>

          <ul style={styles.features}>
            <li>✓ Built for Ethiopian merchants</li>
            <li>✓ Secure & compliant onboarding</li>
            <li>✓ SantimPay enabled instantly</li>
          </ul>

          <p style={styles.trust}>
            You can connect Chapa anytime from your dashboard
          </p>
        </div>
      </section>

      {/* RIGHT */}
      <section style={styles.right}>
        <div style={styles.formWrapper}>
          <header style={styles.header}>
            <h2 style={styles.mainTitle}>Create your merchant account</h2>
            <p style={styles.subHeader}>SantimPay is enabled by default</p>
          </header>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleRegister} style={styles.formGrid}>
            <Section title="Personal Information">
              <Input
                label="Full Name"
                placeholder="Enter full name"
                value={name}
                onChange={setName}
              />
              <Input
                label="Email"
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={setEmail}
              />
              <Input
                label="Password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={setPassword}
              />
            </Section>

            <Section title="Merchant Details">
              <Input
                label="Merchant Name"
                placeholder="Business name"
                value={merchantName}
                onChange={setMerchantName}
              />
            </Section>

            <Section title="Business Information (Optional)">
              <Input
                label="Business Name"
                placeholder="Enter registered business name"
                value={business.businessName}
                onChange={(v) => setBusiness({ ...business, businessName: v })}
              />

              <Input
                label="Business Type"
                placeholder="Retail, Service, Digital, etc"
                value={business.businessType}
                onChange={(v) => setBusiness({ ...business, businessType: v })}
              />

              <div style={styles.row}>
                <Input
                  label="Business Phone"
                  placeholder="+2519XXXXXXXX"
                  value={business.businessPhone}
                  onChange={(v) =>
                    setBusiness({ ...business, businessPhone: v })
                  }
                />
                <Input
                  label="Business Email"
                  placeholder="business@email.com"
                  value={business.businessEmail}
                  onChange={(v) =>
                    setBusiness({ ...business, businessEmail: v })
                  }
                />
              </div>

              <Input
                label="Business Address"
                placeholder="City, Subcity, Street"
                value={business.businessAddress}
                onChange={(v) =>
                  setBusiness({ ...business, businessAddress: v })
                }
              />

              <div style={styles.row}>
                <Input
                  label="TIN Number"
                  placeholder="Enter TIN number"
                  value={business.tinNumber}
                  onChange={(v) => setBusiness({ ...business, tinNumber: v })}
                />
                <Input
                  label="FYDA ID"
                  placeholder="Enter FYDA ID"
                  value={business.fydaId}
                  onChange={(v) => setBusiness({ ...business, fydaId: v })}
                />
              </div>
            </Section>

            <button
              type="submit"
              disabled={loading}
              style={loading ? styles.buttonDisabled : styles.button}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p style={styles.login}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </div>
  );
}

/* ---------- Small Components ---------- */

function Section({ title, children }) {
  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>{title}</h3>
      {children}
    </div>
  );
}

function Input({ label, placeholder, type = "text", value, onChange }) {
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
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={{
            ...styles.input,
            paddingRight: isPassword ? "40px" : "12px",
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={styles.passwordToggle}
          >
            {showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                style={styles.eyeIcon}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                style={styles.eyeIcon}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.056 10.056 0 012.018-3.36m3.7-2.7A9.959 9.959 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.05 10.05 0 01-1.46 2.73M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3l18 18"
                />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- CLEAN STYLES ---------- */

const styles = {
  page: {
    height: "100vh",
    width: "100%",
    display: "grid",
    gridTemplateColumns: "1fr 1.4fr",
    overflow: "hidden",
  },

  left: {
    position: "sticky",
    top: 0,
    height: "100vh",
    background: "linear-gradient(135deg,#064e3b,#022c22)",
    color: "#ecfdf5",
    padding: "80px 64px",
    display: "flex",
    alignItems: "center",
    boxSizing: "border-box",
  },

  branding: { maxWidth: 420 },

  brand: { fontSize: 40, fontWeight: 800, marginBottom: 12 },
  tagline: { fontSize: 18, marginBottom: 32, color: "#a7f3d0" },
  features: {
    listStyle: "none",
    padding: 0,
    marginBottom: 32,
    lineHeight: 1.8,
  },
  trust: { fontSize: 14, color: "#99f6e4" },

  // RIGHT SECTION - NO SCROLL BAR
  right: {
    height: "100vh",
    background: "#fff",
    padding: "64px",
    boxSizing: "border-box",
    overflowY: "auto", // Scroll bar only appears when needed
    scrollbarWidth: "none", // Hide scrollbar for Firefox
    msOverflowStyle: "none", // Hide scrollbar for IE/Edge
  },

  // Hide scrollbar for Chrome/Safari
  rightWithScroll: {
    height: "100vh",
    background: "#fff",
    padding: "64px",
    boxSizing: "border-box",
    overflowY: "auto",
    "&::-webkit-scrollbar": {
      display: "none",
    },
  },

  formWrapper: {
    width: "100%",
    maxWidth: 780,
  },

  header: { marginBottom: 32 },
  mainTitle: { fontSize: 28, fontWeight: 700, marginBottom: 8 },
  subHeader: { color: "#6b7280" },

  error: {
    background: "#fef2f2",
    color: "#991b1b",
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
  },

  formGrid: { display: "grid", gap: 24 },

  section: {
    paddingBottom: 16,
    borderBottom: "1px solid #e5e7eb",
  },

  sectionTitle: { fontWeight: 600, marginBottom: 16 },

  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },

  field: { marginBottom: 16 },

  label: { marginBottom: 6, display: "block", fontWeight: 500 },

  input: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    border: "1px solid #d1d5db",
    fontSize: 16,
    boxSizing: "border-box",
  },

  // Password toggle button
  passwordToggle: {
    position: "absolute",
    right: "8px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  eyeIcon: {
    width: "20px",
    height: "20px",
    color: "#6b7280",
  },

  button: {
    padding: 16,
    background: "#059669",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
  },

  buttonDisabled: {
    padding: 16,
    background: "#a7f3d0",
    borderRadius: 12,
    border: "none",
  },

  login: { marginTop: 24, textAlign: "center", color: "#6b7280" },
};
