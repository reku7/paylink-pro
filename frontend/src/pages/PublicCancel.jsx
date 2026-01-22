import { useNavigate, useLocation } from "react-router-dom";

export default function PublicCancel() {
  const navigate = useNavigate();
  const params = new URLSearchParams(useLocation().search);
  const linkId = params.get("linkId") || "demo_link_123"; // fallback for demo

  return (
    <div
      style={{
        maxWidth: "500px",
        margin: "80px auto",
        padding: "40px",
        borderRadius: "15px",
        backgroundColor: "#fef3c7",
        color: "#78350f",
        textAlign: "center",
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "20px" }}>
        ⚠️ Payment Cancelled
      </h1>
      <p style={{ marginBottom: "30px" }}>You cancelled the payment process.</p>

      <button
        onClick={() => navigate(`/pay/${linkId}`)}
        style={{
          backgroundColor: "#78350f",
          color: "white",
          border: "none",
          padding: "12px 25px",
          borderRadius: "8px",
          fontSize: "16px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Try Again
      </button>
    </div>
  );
}
