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
                value={business.businessName}
                onChange={(v) => setBusiness({ ...business, businessName: v })}
              />

              <Input
                label="Business Type"
                value={business.businessType}
                onChange={(v) => setBusiness({ ...business, businessType: v })}
              />

              <div style={styles.row}>
                <Input
                  label="Business Phone"
                  value={business.businessPhone}
                  onChange={(v) =>
                    setBusiness({ ...business, businessPhone: v })
                  }
                />
                <Input
                  label="Business Email"
                  value={business.businessEmail}
                  onChange={(v) =>
                    setBusiness({ ...business, businessEmail: v })
                  }
                />
              </div>

              <Input
                label="Business Address"
                value={business.businessAddress}
                onChange={(v) =>
                  setBusiness({ ...business, businessAddress: v })
                }
              />

              <div style={styles.row}>
                <Input
                  label="TIN Number"
                  value={business.tinNumber}
                  onChange={(v) => setBusiness({ ...business, tinNumber: v })}
                />
                <Input
                  label="FYDA ID"
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
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={styles.input}
      />
    </div>
  );
}

/* ---------- CLEAN STYLES ---------- */

const styles = {
  /* ---------- PAGE ---------- */
  page: {
    minHeight: "100vh",
    width: "100%",
    display: "grid",
    gridTemplateColumns: "1fr 1.4fr",
    overflow: "hidden",
  },

  /* ---------- LEFT (FIXED BRAND) ---------- */
  left: {
    background: "linear-gradient(135deg, #064e3b 0%, #022c22 100%)",
    color: "#ecfdf5",
    padding: "80px 64px",
    display: "flex",
    alignItems: "center",
    position: "sticky",
    top: 0,
    height: "100vh",
    boxSizing: "border-box",
  },

  branding: {
    maxWidth: 420,
  },

  brand: {
    fontSize: 40,
    fontWeight: 800,
    marginBottom: 12,
  },

  tagline: {
    fontSize: 18,
    marginBottom: 32,
    color: "#a7f3d0",
  },

  features: {
    listStyle: "none",
    padding: 0,
    marginBottom: 32,
    lineHeight: 1.8,
  },

  trust: {
    fontSize: 14,
    color: "#99f6e4",
  },

  /* ---------- RIGHT (NO EMPTY SPACE) ---------- */
  right: {
    background: "#ffffff",
    padding: "64px",
    overflowY: "auto",
    boxSizing: "border-box",
  },

  /* ⭐ THIS IS THE FIX */
  formWrapper: {
    width: "100%",
    maxWidth: "100%", // ❌ no narrow container
  },

  header: {
    marginBottom: 32,
  },

  mainTitle: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 8,
    color: "#111827",
  },

  subHeader: {
    color: "#6b7280",
    fontSize: 16,
  },

  error: {
    background: "#fef2f2",
    color: "#991b1b",
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
  },

  formGrid: {
    display: "grid",
    gap: 24,
  },

  section: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: "1px solid #e5e7eb",
  },

  sectionTitle: {
    fontWeight: 600,
    marginBottom: 16,
    fontSize: 16,
    color: "#111827",
  },

  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },

  field: {
    marginBottom: 16,
  },

  label: {
    display: "block",
    marginBottom: 6,
    fontWeight: 500,
    color: "#374151",
  },

  input: {
    width: "100%",
    padding: "12px",
    borderRadius: 8,
    border: "1px solid #D1D5DB",
    fontSize: 16,
    boxSizing: "border-box",
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
    marginTop: 8,
  },

  buttonDisabled: {
    padding: 16,
    background: "#a7f3d0",
    borderRadius: 14,
    border: "none",
    cursor: "not-allowed",
    marginTop: 8,
  },

  login: {
    marginTop: 24,
    textAlign: "center",
    color: "#6B7280",
  },
};
