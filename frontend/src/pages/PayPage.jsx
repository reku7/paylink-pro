// src/pages/PayPage.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { publicApi, privateApi } from "../api/api";
import { getAuthToken } from "../utils/auth";

export default function PayPage() {
  const { linkId } = useParams();
  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Determine if user is logged in
  const userIsLoggedIn = !!getAuthToken();

  // Fetch payment link details
  useEffect(() => {
    const fetchLink = async () => {
      try {
        setError("");
        const res = await publicApi.get(`/links/public/${linkId}`);
        setLink(res.data.data || res.data || null);
      } catch (err) {
        console.error("Fetch link error:", err);
        setError("Invalid or expired payment link");
      }
    };
    fetchLink();
  }, [linkId]);

  // Handle payment click
  const handlePay = async () => {
    if (!link) return;

    try {
      setLoading(true);
      setError("");

      let res;
      if (userIsLoggedIn) {
        res = await privateApi.post(`/payments/${linkId}/start`, {
          amount: link.amount,
          currency: link.currency,
        });
      } else {
        if (["paid", "expired", "failed"].includes(link.status)) {
          throw new Error("This payment link is not available");
        }
        res = await publicApi.post(`/payments/public/start/${linkId}`);
      }

      const checkoutUrl =
        res.data.checkoutUrl ||
        res.data.url ||
        res.data.gateway?.checkoutUrl ||
        res.data.data?.checkoutUrl;

      if (!checkoutUrl) {
        throw new Error("No checkout URL received");
      }

      window.location.href = checkoutUrl;
    } catch (err) {
      console.error("Payment initiation error:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Payment initiation failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (!link && !error) {
    return (
      <div style={styles.loading}>
        <h2>Loading payment details...</h2>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ ...styles.loading, color: "red" }}>
        <h2>{error}</h2>
      </div>
    );
  }

  // Main payment UI
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>{link.title || "Payment"}</h2>

        {link.description && (
          <p style={styles.description}>{link.description}</p>
        )}

        <h3 style={styles.amount}>
          {link.amount?.toLocaleString()} {link.currency}
        </h3>

        <button
          onClick={handlePay}
          disabled={loading}
          style={{
            ...styles.payButton,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Redirecting..." : "Pay Now"}
        </button>
      </div>
    </div>
  );
}

// Styles consistent with Dashboard/Home
const styles = {
  page: {
    fontFamily: "Inter, sans-serif",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px 20px",
    minHeight: "100vh",
    background: "#f9fafb",
  },
  card: {
    width: "auto", // change from 100% to auto
    maxWidth: "800px",
    padding: "30px",
    borderRadius: "16px",
    background: "#fff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    margin: "0 auto", // ensures horizontal centering
  },

  title: {
    fontSize: "2.5rem",
    fontWeight: 800,
    marginBottom: "0.5rem",
    color: "#111827",
  },
  description: {
    fontSize: "1.2rem",
    color: "#555",
    marginBottom: "1.5rem",
  },
  amount: {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#059669",
    marginBottom: "30px",
  },
  payButton: {
    padding: "12px 30px",
    borderRadius: "12px",
    border: "none",
    fontWeight: 600,
    backgroundColor: "#059669",
    color: "#fff",
    transition: "all 0.3s ease",
  },
  loading: {
    fontFamily: "Inter, sans-serif",
    textAlign: "center",
    marginTop: "50px",
  },
};
