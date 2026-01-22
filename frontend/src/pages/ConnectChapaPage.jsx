import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGateways } from "../context/GatewayContext";

export default function ConnectChapaPage() {
  const { connectChapa, refreshGateways } = useGateways();
  const navigate = useNavigate();
  const location = useLocation();

  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      setError("API Key is required");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const result = await connectChapa(apiKey.trim());
    if (result.success) {
      setSuccess("Chapa connected successfully!");
      await refreshGateways();

      // Redirect based on where user came from
      if (location.state?.fromPaymentSettings) {
        navigate("/dashboard/settings/payments", { replace: true });
      } else if (location.state?.fromCreateLink) {
        navigate("/dashboard/create-link", {
          state: { ...location.state, chapaConnected: true },
          replace: true,
        });
      }
    } else {
      setError(result.error || "Failed to connect Chapa");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 20, maxWidth: 500, margin: "0 auto" }}>
      <div
        style={{
          background: "white",
          borderRadius: 10,
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          padding: 30,
          textAlign: "center",
        }}
      >
        <h2 style={{ marginBottom: 20 }}>Connect Chapa</h2>

        {error && (
          <div
            style={{
              background: "#ffebee",
              color: "#c62828",
              padding: 12,
              borderRadius: 6,
              marginBottom: 20,
              borderLeft: "4px solid #c62828",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              background: "#e8f5e9",
              color: "#2e7d32",
              padding: 12,
              borderRadius: 6,
              marginBottom: 20,
              borderLeft: "4px solid #4caf50",
            }}
          >
            {success}
          </div>
        )}

        <input
          type="text"
          placeholder="Enter API Key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 6,
            border: "1px solid #ddd",
            fontSize: 16,
            marginBottom: 20,
          }}
        />

        <button
          onClick={handleConnect}
          disabled={loading}
          style={{
            width: "100%",
            padding: 15,
            backgroundColor: loading ? "#6c757d" : "#0b9243",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          {loading ? "Connecting..." : "Connect Chapa"}
        </button>
      </div>
    </div>
  );
}
