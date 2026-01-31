import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { privateApi as api } from "../api/api";

export default function Register() {
  const navigate = useNavigate();

  // Personal
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Merchant
  const [merchantName, setMerchantName] = useState("");

  // Full business info
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

      const hasBusinessInfo = Object.values(business).some(Boolean);
      if (hasBusinessInfo) payload.business = business;

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
      {/* LEFT — Fixed Branding Section */}
      <section style={styles.left}>
        <div style={styles.leftContent}>
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

      {/* RIGHT — Scrollable Registration Form */}
      <section style={styles.right}>
        <div style={styles.formWrapper}>
          <header style={styles.header}>
            <h2>Create your merchant account</h2>
            <p style={styles.subHeader}>SantimPay is enabled by default</p>
          </header>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleRegister} style={styles.formGrid}>
            <Section title="Personal Information">
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={name}
                onChange={setName}
              />
              <Input
                label="Email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={setEmail}
              />
              <Input
                label="Password"
                type="password"
                placeholder="Create a secure password"
                value={password}
                onChange={setPassword}
              />
            </Section>

            <Section title="Merchant Details">
              <Input
                label="Merchant Name"
                placeholder="Enter your merchant name"
                value={merchantName}
                onChange={setMerchantName}
              />
            </Section>

            <Section title="Business Information (Optional)">
              <Input
                label="Business Name"
                placeholder="Legal business name"
                value={business.businessName}
                onChange={(v) => setBusiness({ ...business, businessName: v })}
              />
              <Input
                label="Business Type"
                placeholder="e.g., Retail, Restaurant, Service"
                value={business.businessType}
                onChange={(v) => setBusiness({ ...business, businessType: v })}
              />
              <div style={styles.row}>
                <Input
                  label="Business Phone"
                  placeholder="+251 ..."
                  value={business.businessPhone}
                  onChange={(v) =>
                    setBusiness({ ...business, businessPhone: v })
                  }
                />
                <Input
                  label="Business Email"
                  placeholder="business@example.com"
                  value={business.businessEmail}
                  onChange={(v) =>
                    setBusiness({ ...business, businessEmail: v })
                  }
                />
              </div>
              <Input
                label="Business Address"
                placeholder="Full business address"
                value={business.businessAddress}
                onChange={(v) =>
                  setBusiness({ ...business, businessAddress: v })
                }
              />
              <div style={styles.row}>
                <Input
                  label="TIN Number"
                  placeholder="Tax Identification Number"
                  value={business.tinNumber}
                  onChange={(v) => setBusiness({ ...business, tinNumber: v })}
                />
                <Input
                  label="FYDA ID"
                  placeholder="Enter Your FIN"
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

/* ---------- Reusable Components ---------- */
function Section({ title, children }) {
  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>{title}</h3>
      {children}
    </div>
  );
}

function Input({ label, type = "text", placeholder, value, onChange }) {
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
            paddingRight: isPassword ? 40 : 12,
            outline: "none",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#059669")}
          onBlur={(e) => (e.target.style.borderColor = "#D1D5DB")}
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
            {showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                style={{ width: 20, height: 20, color: "#555" }}
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
                style={{ width: 20, height: 20, color: "#555" }}
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
          </span>
        )}
      </div>
    </div>
  );
}

/* ---------- Updated Styles with Fixed Left Section ---------- */
const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Inter', sans-serif",
    margin: 0,
  },

  left: {
    width: "40%",
    minWidth: "400px",
    background: "linear-gradient(135deg, #064e3b 0%, #022c22 100%)",
    color: "#ecfdf5",
    padding: "40px 48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    overflowY: "auto",
  },

  leftContent: {
    maxWidth: "500px",
    width: "100%",
  },

  brand: {
    fontSize: 40,
    fontWeight: 800,
    marginBottom: 12,
    lineHeight: 1,
  },
  tagline: {
    fontSize: 18,
    marginBottom: 32,
    color: "#a7f3d0",
    lineHeight: 1.4,
  },
  features: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 32px 0",
    lineHeight: 1.8,
  },
  trust: {
    fontSize: 14,
    color: "#99f6e4",
    lineHeight: 1.4,
  },

  right: {
    flex: 1,
    background: "#ffffff",
    padding: "60px 48px",
    marginLeft: "40%", // still offset for left
    minWidth: "60%",
    overflowY: "auto",
    display: "block", // remove flex
    minHeight: "100vh",
  },

  formWrapper: {
    width: "100%",
    maxWidth: "500px",
    margin: "0 auto",
  },
  header: {
    marginBottom: 32,
    lineHeight: 1.2,
  },
  subHeader: {
    color: "#6b7280",
    marginTop: 8,
    fontSize: 14,
  },

  error: {
    background: "#fef2f2",
    color: "#991b1b",
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
  },

  formGrid: { display: "grid", gap: 24 },
  section: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: "1px solid #e5e7eb",
  },
  sectionTitle: {
    fontWeight: 700,
    marginBottom: 16,
    fontSize: 16,
    color: "#374151",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  field: { marginBottom: 16 },
  label: {
    display: "block",
    marginBottom: 8,
    fontWeight: 500,
    fontSize: 14,
    color: "#374151",
  },
  input: {
    width: "100%",
    padding: 14,
    borderRadius: 8,
    border: "1px solid #D1D5DB",
    backgroundColor: "#FFFFFF",
    boxSizing: "border-box",
    fontSize: 16,
    color: "#111827",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },

  button: {
    width: "100%",
    padding: 16,
    background: "#059669",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 16,
    transition: "background-color 0.2s",
  },
  buttonDisabled: {
    width: "100%",
    padding: 16,
    background: "#a7f3d0",
    borderRadius: 14,
    border: "none",
    marginTop: 16,
    cursor: "not-allowed",
  },
  login: {
    marginTop: 24,
    textAlign: "center",
    fontSize: 14,
    color: "#6B7280",
  },
};
