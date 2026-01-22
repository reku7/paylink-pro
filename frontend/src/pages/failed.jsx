// src/pages/Failed.jsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Failed() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const linkId = searchParams.get("linkId"); // MUST be passed in query
  const error =
    searchParams.get("error") || "The payment could not be processed.";

  const retryPayment = async () => {
    if (!linkId) return alert("Payment link ID missing. Cannot retry.");

    try {
      setLoading(true);

      // Start a NEW transaction immediately
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/payments/${linkId}/start`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to start payment");
      }

      // Redirect to gateway checkout (Santimpay)
      if (data.gateway?.checkoutUrl) {
        window.location.href = data.gateway.checkoutUrl;
      } else if (data.gateway?.url) {
        window.location.href = data.gateway.url;
      } else {
        alert("No checkout URL returned by payment gateway");
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to retry payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        textAlign: "center",
        padding: "50px",
        background: "linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "20px",
          maxWidth: "500px",
          margin: "0 auto",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            background: "#f44336",
            borderRadius: "50%",
            margin: "0 auto 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "40px",
            color: "white",
          }}
        >
          ✗
        </div>
        <h1 style={{ color: "#c62828", marginBottom: "10px" }}>
          ❌ Payment Failed
        </h1>
        <p style={{ color: "#666", marginBottom: "30px", fontSize: "18px" }}>
          {error}
        </p>
        <p style={{ color: "#888", fontSize: "14px" }}>
          You can try again or go home.
        </p>

        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            marginTop: "30px",
          }}
        >
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "12px 30px",
              backgroundColor: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "600",
            }}
          >
            Go Home
          </button>

          <button
            onClick={retryPayment}
            disabled={loading || !linkId}
            style={{
              padding: "12px 30px",
              backgroundColor: "#757575",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "16px",
              fontWeight: "600",
            }}
          >
            {loading ? "Redirecting..." : "Try Again"}
          </button>
        </div>
      </div>
    </div>
  );
}
