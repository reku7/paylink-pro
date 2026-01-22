import { useGateways } from "../context/GatewayContext";
import { useNavigate } from "react-router-dom";

export default function PaymentGatewaysPage() {
  const { connectedGateways, loading, disconnectChapa } = useGateways();
  const navigate = useNavigate();

  const handleConnectChapa = () => {
    // Navigate to ConnectChapaPage and pass state
    navigate("/dashboard/connect-chapa", {
      state: { fromPaymentSettings: true },
    });
  };

  const handleDisconnectChapa = async () => {
    try {
      const result = await disconnectChapa();
      if (result.success) alert("Chapa disconnected successfully!");
      else alert(result.error || "Failed to disconnect Chapa");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to disconnect Chapa");
    }
  };

  if (loading)
    return (
      <p style={{ textAlign: "center", marginTop: 50 }}>Loading gateways...</p>
    );

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: 30 }}>
        Payment Gateways
      </h1>

      {/* SantimPay */}
      <GatewayBox name="SantimPay" status="Connected" color="#28a745" />

      {/* Chapa */}
      <GatewayBox
        name="Chapa"
        status={connectedGateways.chapa ? "Connected" : "Not Connected"}
        color={connectedGateways.chapa ? "#28a745" : "#c62828"}
        onConnect={!connectedGateways.chapa ? handleConnectChapa : null}
        onDisconnect={connectedGateways.chapa ? handleDisconnectChapa : null}
      />
    </div>
  );
}

function GatewayBox({ name, status, color, onConnect, onDisconnect }) {
  return (
    <div
      style={{
        margin: "20px 0",
        padding: 20,
        borderRadius: 10,
        border: "1px solid #ddd",
        background: "#f9f9f9",
        position: "relative",
      }}
    >
      <h3>{name}</h3>
      <p style={{ color, fontWeight: 600 }}>{status}</p>

      {onConnect && (
        <button
          onClick={onConnect}
          style={{
            position: "absolute",
            right: 20,
            top: 20,
            padding: "8px 12px",
            backgroundColor: "#2196f3",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Connect
        </button>
      )}

      {onDisconnect && (
        <button
          onClick={onDisconnect}
          style={{
            position: "absolute",
            right: onConnect ? 120 : 20,
            top: 20,
            padding: "8px 12px",
            backgroundColor: "#f44336",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Disconnect
        </button>
      )}
    </div>
  );
}
