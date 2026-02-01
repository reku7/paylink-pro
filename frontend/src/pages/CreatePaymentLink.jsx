import { useState, useEffect, useCallback } from "react";
import { privateApi as api } from "../api/api";
import { useNavigate, useLocation } from "react-router-dom";
import { useGateways } from "../context/GatewayContext";

export default function CreatePaymentLink() {
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [gateway, setGateway] = useState("santimpay");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { connectedGateways, refreshGateways } = useGateways();
  const navigate = useNavigate();
  const location = useLocation();

  const handleCreate = useCallback(async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError("Please enter a valid amount (greater than 0).");
      return;
    }
    if (!title.trim()) {
      setError("Please enter a title for your payment link.");
      return;
    }
    if (gateway === "chapa" && !connectedGateways.chapa) {
      setError("You must connect Chapa before creating a Chapa payment link.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      setLink("");

      const origin = window.location.origin;
      const res = await api.post("/links", {
        title: title.trim(),
        description: description.trim(),
        amount: Number(amount),
        currency: "ETB",
        gateway,
        successUrl: `${origin}/success`,
        cancelUrl: `${origin}/cancel`,
        failureUrl: `${origin}/failed`,
      });

      if (!res.data.success) {
        throw new Error(res.data.error || "Failed to create payment link");
      }

      const newLink = `${origin}/pay/${res.data.data.linkId}`;
      setLink(newLink);
      setSuccess(
        `Payment link created successfully with ${
          gateway === "santimpay" ? "SantimPay (Type A)" : "Chapa (Type B Lite)"
        }!`,
      );

      if (!location.state?.fromCreateLink) {
        setAmount("");
        setTitle("");
        setDescription("");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to create payment link.",
      );
    } finally {
      setLoading(false);
    }
  }, [amount, title, description, gateway, connectedGateways, location.state]);

  useEffect(() => {
    const init = async () => {
      await refreshGateways();

      if (location.state?.fromCreateLink) {
        setAmount(location.state.amount || "");
        setTitle(location.state.title || "");
        setDescription(location.state.description || "");
        setGateway(connectedGateways.chapa ? "chapa" : "santimpay");
        navigate(location.pathname, { replace: true });
      }

      if (gateway === "chapa" && !connectedGateways.chapa) {
        setGateway("santimpay");
      }
    };
    init();
  }, [
    connectedGateways.chapa,
    location.state,
    refreshGateways,
    navigate,
    gateway,
  ]);

  const handleConnectChapa = () => {
    navigate("/dashboard/connect-chapa", {
      state: { fromCreateLink: true, amount, title, description },
    });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    alert("Link copied to clipboard!");
  };

  const previewLink = () => window.open(link, "_blank");

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Payment Link",
          text: "Here's a payment link for you:",
          url: link,
        });
      } catch {
        navigator.clipboard.writeText(link);
      }
    } else {
      navigator.clipboard.writeText(link);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 2px 10px rgba(0,0,0,.1)",
          padding: 30,
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: 10 }}>
          Create Payment Link
        </h2>
        <p style={{ textAlign: "center", color: "#666", marginBottom: 30 }}>
          SantimPay (Type A) or Chapa (Type B Lite)
        </p>

        {error && (
          <Alert bg="#ffebee" color="#c62828">
            {error}
          </Alert>
        )}
        {success && (
          <Alert bg="#e8f5e9" color="#2e7d32">
            {success}
          </Alert>
        )}

        <Input label="Title" value={title} onChange={setTitle} />
        <Textarea
          label="Description (Optional)"
          value={description}
          onChange={setDescription}
        />
        <Input
          label="Amount (ETB)"
          type="number"
          value={amount}
          onChange={setAmount}
        />

        <div style={{ marginBottom: 30 }}>
          <label style={labelStyle}>Select Payment Gateway</label>
          <div style={{ display: "flex", gap: 15 }}>
            <GatewayCard
              active={gateway === "santimpay"}
              onClick={() => setGateway("santimpay")}
              title="SantimPay"
              subtitle="Type A"
              color="#4caf50"
            />
            <GatewayCard
              active={gateway === "chapa"}
              disabled={!connectedGateways.chapa}
              onClick={() => connectedGateways.chapa && setGateway("chapa")}
              title="Chapa"
              subtitle="Type B Lite"
              color="#2196f3"
              extra={
                !connectedGateways.chapa && (
                  <button onClick={handleConnectChapa} style={smallBtn}>
                    Connect Chapa First
                  </button>
                )
              }
            />
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={loading || !amount || !title}
          style={mainBtn(loading || !amount || !title)}
        >
          {loading ? "Creating..." : `Create with ${gateway}`}
        </button>

        {link && (
          <div style={{ marginTop: 30 }}>
            <code style={codeBox}>{link}</code>
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <button onClick={copyLink}>Copy</button>
              <button onClick={previewLink}>Open</button>
              <button onClick={shareLink}>Share</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* Reusable UI helpers */
const labelStyle = { display: "block", marginBottom: 8, fontWeight: 500 };
const codeBox = {
  display: "block",
  padding: 10,
  background: "#f8f9fa",
  borderRadius: 6,
};

const mainBtn = (disabled) => ({
  width: "100%",
  padding: 15,
  background: disabled ? "#6c757d" : "#007bff",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: disabled ? "not-allowed" : "pointer",
});

const smallBtn = {
  marginTop: 10,
  padding: 8,
  fontSize: 12,
  borderRadius: 6,
  border: "none",
  background: "#2196f3",
  color: "#fff",
};

const Alert = ({ bg, color, children }) => (
  <div
    style={{
      background: bg,
      color,
      padding: 12,
      borderRadius: 6,
      marginBottom: 20,
    }}
  >
    {children}
  </div>
);

const Input = ({ label, value, onChange, type = "text" }) => (
  <div style={{ marginBottom: 20 }}>
    <label style={labelStyle}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: 12,
        borderRadius: 6,
        border: "1px solid #ddd",
      }}
    />
  </div>
);

const Textarea = ({ label, value, onChange }) => (
  <div style={{ marginBottom: 20 }}>
    <label style={labelStyle}>{label}</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      style={{
        width: "100%",
        padding: 12,
        borderRadius: 6,
        border: "1px solid #ddd",
      }}
    />
  </div>
);

const GatewayCard = ({
  active,
  disabled,
  onClick,
  title,
  subtitle,
  color,
  extra,
}) => (
  <div
    onClick={onClick}
    style={{
      flex: 1,
      padding: 20,
      borderRadius: 8,
      border: `2px solid ${active ? color : "#ddd"}`,
      background: active ? `${color}22` : "#f9f9f9",
      cursor: disabled ? "not-allowed" : "pointer",
      textAlign: "center",
    }}
  >
    <strong>{title}</strong>
    <div style={{ fontSize: 14, color: "#666" }}>{subtitle}</div>
    {extra}
  </div>
);
