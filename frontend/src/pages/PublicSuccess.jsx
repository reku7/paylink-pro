import { useNavigate, useLocation } from "react-router-dom";

export default function PublicSuccess() {
  const navigate = useNavigate();
  const params = new URLSearchParams(useLocation().search);
  const transactionId = params.get("transactionId");
  const amount = params.get("amount");
  const customerEmail = params.get("customerEmail");
  const linkId = params.get("linkId");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        padding: 20,
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "3rem", marginBottom: 20 }}>
        🎉 Payment Successful!
      </h1>
      <p style={{ fontSize: "1.2rem", marginBottom: 10 }}>
        Thank you for your payment.
      </p>
      <p>
        <strong>Transaction ID:</strong> {transactionId || "N/A"}
      </p>
      <p>
        <strong>Amount:</strong> {amount ? `${amount} ETB` : "N/A"}
      </p>
      <p>
        <strong>Customer Email:</strong> {customerEmail || "N/A"}
      </p>
      <p>
        <strong>Payment Link ID:</strong> {linkId || "N/A"}
      </p>

      <div
        style={{ marginTop: 30, display: "flex", gap: 15, flexWrap: "wrap" }}
      >
        <button
          onClick={() => navigate("/")}
          style={{
            background: "#10b981",
            border: "none",
            color: "white",
            padding: "12px 25px",
            borderRadius: 8,
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          🏠 Go Back Home
        </button>

        <button
          onClick={() => navigate("/pay/demo_link_123")}
          style={{
            background: "#3b82f6",
            border: "none",
            color: "white",
            padding: "12px 25px",
            borderRadius: 8,
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          💳 Make Another Payment
        </button>
      </div>
    </div>
  );
}
