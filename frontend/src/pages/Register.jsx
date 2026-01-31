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
      {/* LEFT — Branding */}
      <section style={styles.left}>
        <div>
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

      {/* RIGHT — Registration Form */}
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
                placeholder="Enter your password"
                value={password}
                onChange={setPassword}
              />
            </Section>

            <Section title="Merchant Details">
              <Input
                label="Merchant Name"
                placeholder="Enter merchant or business name"
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

/* ---------- Reusable Components ---------- */
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
          style={{ ...styles.input, paddingRight: isPassword ? 40 : 12 }}
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
            }}
          >
            {showPassword ? "👁" : "👁‍🗨"}
          </span>
        )}
      </div>
    </div>
  );
}

/* ---------- Styles ---------- */
const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    gridTemplateColumns: "1fr 1fr",
  },
  left: {
    width: "50%",
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    background: "linear-gradient(135deg, #064e3b 0%, #022c22 100%)",
    color: "#ecfdf5",
    padding: "60px 48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  brand: { fontSize: 36, fontWeight: 800, marginBottom: 8 },
  tagline: { fontSize: 16, marginBottom: 24, color: "#a7f3d0" },
  features: {
    listStyle: "none",
    padding: 0,
    marginBottom: 24,
    lineHeight: 1.6,
  },
  trust: { fontSize: 12, color: "#99f6e4" },

  right: {
    width: "50%",
    marginLeft: "50%",
    background: "#ffffff",
    padding: "40px 24px",
    height: "100vh",
    overflowY: "auto",
  },

  formWrapper: {
    width: "100%",
    maxWidth: 520,
    margin: "0 auto",
  },

  header: { marginBottom: 16 }, // reduce spacing
  subHeader: { color: "#6b7280", marginTop: 2 },

  error: {
    background: "#fef2f2",
    color: "#991b1b",
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },

  formGrid: { display: "grid", gap: 12 }, // less vertical gap
  section: {
    marginBottom: 12,
    paddingBottom: 4,
    borderBottom: "1px solid #e5e7eb",
  },
  sectionTitle: { fontWeight: 700, marginBottom: 6, fontSize: 14 },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }, // tighter row spacing
  field: { marginBottom: 8 }, // less vertical gap between inputs
  label: { display: "block", marginBottom: 2, fontWeight: 500, fontSize: 13 },
  input: {
    width: "100%",
    padding: 14,
    paddingRight: 40,
    borderRadius: 6,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    boxSizing: "border-box",
    fontSize: 14,
  },

  button: {
    width: "100%",
    padding: 16,
    background: "#059669",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 8,
  },
  buttonDisabled: {
    width: "100%",
    padding: 16,
    background: "#a7f3d0",
    borderRadius: 10,
    border: "none",
    marginTop: 8,
  },
  login: { marginTop: 8, textAlign: "center", fontSize: 13 },
};
