// pages/cancel.jsx
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Cancel() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const reason = searchParams.get("reason");

    console.log("⚠️ Payment Cancelled:", { reason });

    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate("/");
    }, 5000);

    return () => clearTimeout(timer);
  }, [location, navigate]);

  return (
    <div
      style={{
        textAlign: "center",
        padding: "50px",
        background: "linear-gradient(135deg, #fff3e0 0%, #ffcc80 100%)",
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
            background: "#ff9800",
            borderRadius: "50%",
            margin: "0 auto 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "40px",
            color: "white",
          }}
        >
          ⚠️
        </div>
        <h1 style={{ color: "#ef6c00", marginBottom: "10px" }}>
          ⚠️ Payment Cancelled
        </h1>
        <p style={{ color: "#666", marginBottom: "30px", fontSize: "18px" }}>
          You have cancelled the payment process. No charges were made.
        </p>
        <p style={{ color: "#888", fontSize: "14px" }}>
          You will be redirected to home page in 5 seconds...
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
              backgroundColor: "#ff9800",
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
            onClick={() => window.history.back()}
            style={{
              padding: "12px 30px",
              backgroundColor: "#2196f3",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "600",
            }}
          >
            Retry Payment
          </button>
        </div>
      </div>
    </div>
  );
}
