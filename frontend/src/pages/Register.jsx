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

  // Optional business
  const [business, setBusiness] = useState({
    businessAddress: "",
    businessPhone: "",
    businessEmail: "",
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
      {/* LEFT */}
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

      {/* RIGHT */}
      <section style={styles.right}>
        <div style={styles.formWrapper}>
          <header style={styles.header}>
            <h2>Create your merchant account</h2>
            <p style={styles.subHeader}>SantimPay is enabled by default</p>
          </header>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleRegister} style={styles.formGrid}>
            <div>
              <Section title="Personal Information">
                <Input label="Full Name *" value={name} onChange={setName} />
                <Input
                  label="Email *"
                  type="email"
                  value={email}
                  onChange={setEmail}
                />
                <Input
                  label="Password *"
                  type="password"
                  value={password}
                  onChange={setPassword}
                />
              </Section>

              <Section title="Merchant Details">
                <Input
                  label="Merchant / Business Name *"
                  value={merchantName}
                  onChange={setMerchantName}
                />
              </Section>

              <Section title="Business Information (Optional)">
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
              </Section>
            </div>

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

/* ---------- Styles ---------- */

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
  formWrapper: { maxWidth: 720, margin: "0 auto" },
  header: { marginBottom: 32 },
  subHeader: { color: "#6b7280", marginTop: 4 },
  error: {
    background: "#fef2f2",
    color: "#991b1b",
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
  },

  formGrid: { display: "grid", gap: 32 },
  section: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: "1px solid #e5e7eb",
  },
  sectionTitle: { fontWeight: 700, marginBottom: 12 },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  field: { marginBottom: 12 },
  label: { display: "block", marginBottom: 6, fontSize: 14 },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: "1px solid #d1d5db",
  },

  button: {
    width: "100%",
    marginTop: 16,
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
    width: "100%",
    marginTop: 16,
    padding: 16,
    background: "#a7f3d0",
    borderRadius: 14,
    border: "none",
  },

  login: { marginTop: 24, textAlign: "center" },
};
