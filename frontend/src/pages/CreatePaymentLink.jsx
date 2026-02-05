//src\pages\CreatePaymentLink.jsx
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

  // Function to create payment link
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

      if (res.data.success) {
        const newLink = `${origin}/pay/${res.data.data.linkId}`;
        setLink(newLink);
        setSuccess(
          `Payment link created successfully with ${
            gateway === "santimpay"
              ? "SantimPay (Type A)"
              : "Chapa (Type B Lite)"
          }!`,
        );

        // Clear form only if auto-create was NOT triggered
        if (!location.state?.fromCreateLink) {
          setAmount("");
          setTitle("");
          setDescription("");
        }
      } else {
        throw new Error(res.data.error || "Failed to create payment link");
      }
    } catch (err) {
      console.error("Failed to create payment link:", err);
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to create payment link.",
      );
    } finally {
      setLoading(false);
    }
  }, [amount, title, description, gateway, connectedGateways, location.state]);

  // Check Chapa connection and auto-fill/create if redirected from ConnectChapa
  useEffect(() => {
    const init = async () => {
      await refreshGateways();

      // Restore form values after redirect
      if (location.state?.fromCreateLink) {
        setAmount(location.state.amount || "");
        setTitle(location.state.title || "");
        setDescription(location.state.description || "");

        // Select Chapa ONLY if actually connected
        if (connectedGateways.chapa) {
          setGateway("chapa");
        } else {
          setGateway("santimpay");
        }

        // Clean navigation state
        navigate(location.pathname, { replace: true });
      }

      // Safety fallback
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
      state: {
        fromCreateLink: true,
        amount,
        title,
        description,
      },
    });
  };

  const copyLink = () => {
    if (link) {
      navigator.clipboard.writeText(link);
      alert("Link copied to clipboard!");
    }
  };

  const previewLink = () => {
    if (link) window.open(link, "_blank");
  };

  const shareLink = async () => {
    if (!link) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Payment Link",
          text: "Here's a payment link for you:",
          url: link,
        });
        alert("Link shared successfully!");
      } catch (err) {
        console.error("Share failed:", err);
        alert("Sharing failed. Try copying the link instead.");
      }
    } else {
      navigator.clipboard.writeText(link);
      alert("Link copied to clipboard (share not supported in this browser)");
    }
  };

  return (
    <div
      style={{
        minHeight: "100%",
        width: "100%",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          padding: "30px",
          width: "100%",
          maxWidth: "100%",
        }}
      >
        <h2
          style={{ marginBottom: "10px", textAlign: "center", color: "#333" }}
        >
          Create Payment Link
        </h2>
        <p style={{ textAlign: "center", color: "#666", marginBottom: "30px" }}>
          Create payment links with SantimPay (Type A) or Chapa (Type B Lite)
        </p>

        {error && (
          <div
            style={{
              background: "#ffebee",
              color: "#c62828",
              padding: "12px",
              borderRadius: "6px",
              marginBottom: "20px",
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
              padding: "12px",
              borderRadius: "6px",
              marginBottom: "20px",
              borderLeft: "4px solid #4caf50",
            }}
          >
            {success}
          </div>
        )}

        {/* Title */}
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 500,
              color: "#444",
            }}
          >
            Title
          </label>
          <input
            type="text"
            placeholder="Enter Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "6px",
              border: "1px solid #ddd",
              fontSize: "16px",
            }}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 500,
              color: "#444",
            }}
          >
            Description (Optional)
          </label>
          <textarea
            placeholder="Describe what this payment is for"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "6px",
              border: "1px solid #ddd",
              fontSize: "16px",
              resize: "vertical",
            }}
          />
        </div>

        {/* Amount */}
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 500,
              color: "#444",
            }}
          >
            Amount (ETB)
          </label>
          <input
            type="number"
            placeholder="Enter Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            step="0.01"
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "6px",
              border: "1px solid #ddd",
              fontSize: "16px",
            }}
          />
        </div>

        {/* Gateway Selection */}
        <div style={{ marginBottom: "30px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "12px",
              fontWeight: 500,
              color: "#444",
            }}
          >
            Select Payment Gateway
          </label>
          <div style={{ display: "flex", gap: "15px" }}>
            {/* SantimPay */}
            <div
              onClick={() => setGateway("santimpay")}
              style={{
                flex: 1,
                padding: "20px",
                borderRadius: "8px",
                border: `2px solid ${gateway === "santimpay" ? "#4caf50" : "#ddd"}`,
                background: gateway === "santimpay" ? "#e8f5e9" : "#f9f9f9",
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "10px" }}>🟢</div>
              <div style={{ fontWeight: 600, marginBottom: "5px" }}>
                SantimPay
              </div>
              <div style={{ fontSize: "14px", color: "#666" }}>Type A</div>
            </div>

            {/* Chapa */}
            <div
              onClick={() => connectedGateways.chapa && setGateway("chapa")}
              style={{
                flex: 1,
                padding: "20px",
                borderRadius: "8px",
                border: `2px solid ${gateway === "chapa" ? "#2196f3" : "#ddd"}`,
                background: gateway === "chapa" ? "#e3f2fd" : "#f9f9f9",
                cursor: connectedGateways.chapa ? "pointer" : "not-allowed",
                textAlign: "center",
                position: "relative",
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "10px" }}>🔵</div>
              <div style={{ fontWeight: 600, marginBottom: "5px" }}>Chapa</div>
              <div style={{ fontSize: "14px", color: "#666" }}>Type B Lite</div>
              {!connectedGateways.chapa && (
                <button
                  onClick={handleConnectChapa}
                  style={{
                    marginTop: "10px",
                    padding: "8px",
                    fontSize: "12px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "#2196f3",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  Connect Chapa First
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreate}
          disabled={loading || !amount || !title}
          style={{
            width: "100%",
            padding: "15px",
            backgroundColor: loading ? "#6c757d" : "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: loading || !amount || !title ? "not-allowed" : "pointer",
            fontSize: "16px",
            fontWeight: 600,
            opacity: loading || !amount || !title ? 0.7 : 1,
          }}
        >
          {loading
            ? "Creating Payment Link..."
            : `Create Payment Link with ${gateway === "santimpay" ? "SantimPay" : "Chapa"}`}
        </button>

        {/* Created Link */}
        {link && (
          <div
            style={{
              marginTop: "30px",
              padding: "20px",
              background: "#f8f9fa",
              borderRadius: "8px",
              border: "1px solid #dee2e6",
            }}
          >
            <h3 style={{ marginBottom: "15px", color: "#28a745" }}>
              Payment Link Created!
            </h3>
            <div
              style={{
                background: "white",
                padding: "15px",
                borderRadius: "6px",
                border: "1px solid #ced4da",
                marginBottom: "15px",
                wordBreak: "break-all",
              }}
            >
              <strong>Your payment link:</strong>
              <div
                style={{
                  marginTop: "8px",
                  padding: "10px",
                  background: "#f8f9fa",
                  borderRadius: "4px",
                  fontFamily: "monospace",
                  fontSize: "14px",
                }}
              >
                {link}
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={copyLink}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#28a745",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 500,
                  flex: 1,
                  minWidth: "120px",
                }}
              >
                Copy Link
              </button>
              <button
                onClick={previewLink}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#17a2b8",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 500,
                  flex: 1,
                  minWidth: "120px",
                }}
              >
                Open Link
              </button>
              <button
                onClick={shareLink}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#007bff",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 500,
                  flex: 1,
                  minWidth: "120px",
                }}
              >
                Share Link
              </button>
              <button
                onClick={() => setLink("")}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#6c757d",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 500,
                  flex: 1,
                  minWidth: "120px",
                }}
              >
                Create Another Link
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
