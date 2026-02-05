// src\pages\CreatePaymentLink.jsx
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
        minHeight: "100vh",
        width: "100%",
        padding: "40px",
        backgroundColor: "#f9fafb",
      }}
    >
      {/* Header Section */}
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ marginBottom: "10px", color: "#333", fontSize: "28px" }}>
          Create Payment Link
        </h2>
        <p style={{ color: "#666", fontSize: "16px" }}>
          Create payment links with SantimPay (Type A) or Chapa (Type B Lite)
        </p>
      </div>

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

      {/* Form Content - Transparent/Full Width */}
      <div style={{ maxWidth: "800px", width: "100%" }}>
        {/* Title */}
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 500,
              color: "#444",
              fontSize: "14px",
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
              padding: "14px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              fontSize: "16px",
              backgroundColor: "#fff",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 500,
              color: "#444",
              fontSize: "14px",
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
              padding: "14px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              fontSize: "16px",
              backgroundColor: "#fff",
              resize: "vertical",
              boxSizing: "border-box",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Amount */}
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 500,
              color: "#444",
              fontSize: "14px",
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
              padding: "14px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              fontSize: "16px",
              backgroundColor: "#fff",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Gateway Selection */}
        <div style={{ marginBottom: "32px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "12px",
              fontWeight: 500,
              color: "#444",
              fontSize: "14px",
            }}
          >
            Select Payment Gateway
          </label>
          <div style={{ display: "flex", gap: "20px" }}>
            {/* SantimPay */}
            <div
              onClick={() => setGateway("santimpay")}
              style={{
                flex: 1,
                padding: "24px",
                borderRadius: "10px",
                border: `2px solid ${gateway === "santimpay" ? "#4caf50" : "#e0e0e0"}`,
                background: gateway === "santimpay" ? "#f1f8e9" : "#fff",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>🟢</div>
              <div
                style={{
                  fontWeight: 600,
                  marginBottom: "6px",
                  fontSize: "16px",
                }}
              >
                SantimPay
              </div>
              <div style={{ fontSize: "14px", color: "#666" }}>Type A</div>
            </div>

            {/* Chapa */}
            <div
              onClick={() => connectedGateways.chapa && setGateway("chapa")}
              style={{
                flex: 1,
                padding: "24px",
                borderRadius: "10px",
                border: `2px solid ${gateway === "chapa" ? "#2196f3" : "#e0e0e0"}`,
                background: gateway === "chapa" ? "#e3f2fd" : "#fff",
                cursor: connectedGateways.chapa ? "pointer" : "not-allowed",
                textAlign: "center",
                transition: "all 0.2s ease",
                opacity: connectedGateways.chapa ? 1 : 0.7,
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔵</div>
              <div
                style={{
                  fontWeight: 600,
                  marginBottom: "6px",
                  fontSize: "16px",
                }}
              >
                Chapa
              </div>
              <div style={{ fontSize: "14px", color: "#666" }}>Type B Lite</div>
              {!connectedGateways.chapa && (
                <button
                  onClick={handleConnectChapa}
                  style={{
                    marginTop: "12px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "#2196f3",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: 500,
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
            padding: "16px",
            backgroundColor: loading ? "#6c757d" : "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: loading || !amount || !title ? "not-allowed" : "pointer",
            fontSize: "16px",
            fontWeight: 600,
            opacity: loading || !amount || !title ? 0.7 : 1,
            transition: "background-color 0.2s ease",
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
              marginTop: "40px",
              padding: "24px",
              background: "#fff",
              borderRadius: "10px",
              border: "1px solid #e0e0e0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <h3
              style={{
                marginBottom: "16px",
                color: "#28a745",
                fontSize: "20px",
              }}
            >
              Payment Link Created!
            </h3>
            <div
              style={{
                background: "#f8f9fa",
                padding: "16px",
                borderRadius: "8px",
                border: "1px solid #dee2e6",
                marginBottom: "20px",
                wordBreak: "break-all",
              }}
            >
              <strong style={{ display: "block", marginBottom: "8px" }}>
                Your payment link:
              </strong>
              <div
                style={{
                  padding: "12px",
                  background: "#fff",
                  borderRadius: "6px",
                  fontFamily: "monospace",
                  fontSize: "14px",
                  color: "#333",
                  border: "1px solid #ddd",
                }}
              >
                {link}
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button
                onClick={copyLink}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#28a745",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 500,
                  flex: 1,
                  minWidth: "120px",
                  fontSize: "14px",
                }}
              >
                Copy Link
              </button>
              <button
                onClick={previewLink}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#17a2b8",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 500,
                  flex: 1,
                  minWidth: "120px",
                  fontSize: "14px",
                }}
              >
                Open Link
              </button>
              <button
                onClick={shareLink}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#007bff",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 500,
                  flex: 1,
                  minWidth: "120px",
                  fontSize: "14px",
                }}
              >
                Share Link
              </button>
              <button
                onClick={() => setLink("")}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#6c757d",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 500,
                  flex: 1,
                  minWidth: "120px",
                  fontSize: "14px",
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
