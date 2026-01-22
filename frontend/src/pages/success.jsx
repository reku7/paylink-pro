// pages/success.jsx
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Success() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Extract payment details from URL
    const searchParams = new URLSearchParams(location.search);
    const transactionId = searchParams.get("transaction_id");
    const amount = searchParams.get("amount");
    const reference = searchParams.get("reference");

    console.log("✅ Payment Successful:", { transactionId, amount, reference });

    // You can fetch transaction details here if needed
    // Or show a confirmation message

    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate("/dashboard");
    }, 5000);

    return () => clearTimeout(timer);
  }, [location, navigate]);

  return (
    <div
      style={{
        textAlign: "center",
        padding: "50px",
        background: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",
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
            background: "#4caf50",
            borderRadius: "50%",
            margin: "0 auto 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "40px",
            color: "white",
          }}
        >
          ✓
        </div>
        <h1 style={{ color: "#2e7d32", marginBottom: "10px" }}>
          ✅ Payment Successful!
        </h1>
        <p style={{ color: "#666", marginBottom: "30px", fontSize: "18px" }}>
          Thank you for your payment. Your transaction has been completed
          successfully.
        </p>
        <p style={{ color: "#888", fontSize: "14px" }}>
          You will be redirected to dashboard in 5 seconds...
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            marginTop: "30px",
            padding: "12px 30px",
            backgroundColor: "#4caf50",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "600",
          }}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
