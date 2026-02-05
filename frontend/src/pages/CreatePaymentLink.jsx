// src\pages\CreatePaymentLink.jsx
import { useState, useEffect, useCallback } from "react";
import { privateApi as api } from "../api/api";
import { useNavigate, useLocation } from "react-router-dom";
import { useGateways } from "../context/GatewayContext";
import "./responsive.css";

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
    <div className="mobile-padding" style={{ padding: "20px" }}>
      {/* Header Section - Match DashboardHome style */}
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ marginBottom: "5px" }}>Create Payment Link</h1>
        <p style={{ color: "#666" }}>
          Create payment links with SantimPay (Type A) or Chapa (Type B Lite)
        </p>
      </div>

      {error && (
        <div style={styles.errorBox}>
          <h3>Error Creating Link</h3>
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div style={styles.successBox}>
          <h3>Success!</h3>
          <p>{success}</p>
        </div>
      )}

      {/* Form Content - Transparent/Full Width */}
      <div style={{ maxWidth: "800px", width: "100%" }}>
        {/* Title */}
        <div style={{ marginBottom: "24px" }}>
          <label style={styles.label}>Title</label>
          <input
            type="text"
            placeholder="Enter Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={styles.input}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: "24px" }}>
          <label style={styles.label}>Description (Optional)</label>
          <textarea
            placeholder="Describe what this payment is for"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
            style={styles.textarea}
          />
        </div>

        {/* Amount */}
        <div style={{ marginBottom: "24px" }}>
          <label style={styles.label}>Amount (ETB)</label>
          <input
            type="number"
            placeholder="Enter Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            step="0.01"
            style={styles.input}
          />
        </div>

        {/* Gateway Selection */}
        <div style={{ marginBottom: "32px" }}>
          <label style={styles.label}>Select Payment Gateway</label>
          <div
            className="mobile-stack"
            style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}
          >
            {/* SantimPay */}
            <div
              onClick={() => setGateway("santimpay")}
              style={{
                ...styles.gatewayCard,
                borderColor: gateway === "santimpay" ? "#4caf50" : "#e0e0e0",
                background: gateway === "santimpay" ? "#f1f8e9" : "#ffffff",
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>🟢</div>
              <div style={styles.gatewayName}>SantimPay</div>
              <div style={styles.gatewayType}>Type A</div>
            </div>

            {/* Chapa */}
            <div
              onClick={() => connectedGateways.chapa && setGateway("chapa")}
              style={{
                ...styles.gatewayCard,
                borderColor: gateway === "chapa" ? "#2196f3" : "#e0e0e0",
                background: gateway === "chapa" ? "#e3f2fd" : "#ffffff",
                cursor: connectedGateways.chapa ? "pointer" : "not-allowed",
                opacity: connectedGateways.chapa ? 1 : 0.7,
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔵</div>
              <div style={styles.gatewayName}>Chapa</div>
              <div style={styles.gatewayType}>Type B Lite</div>
              {!connectedGateways.chapa && (
                <button
                  onClick={handleConnectChapa}
                  style={styles.connectButton}
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
          style={styles.createButton(loading, !amount || !title)}
        >
          {loading
            ? "Creating Payment Link..."
            : `Create Payment Link with ${gateway === "santimpay" ? "SantimPay" : "Chapa"}`}
        </button>

        {/* Created Link */}
        {link && (
          <div style={styles.linkContainer}>
            <h3 style={styles.linkHeader}>Payment Link Created!</h3>
            <div style={styles.linkBox}>
              <strong style={{ display: "block", marginBottom: "8px" }}>
                Your payment link:
              </strong>
              <div style={styles.linkText}>{link}</div>
            </div>
            <div
              className="mobile-stack"
              style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}
            >
              <button
                className="action-button"
                style={{ backgroundColor: "#28a745" }}
                onClick={copyLink}
              >
                Copy Link
              </button>
              <button
                className="action-button"
                style={{ backgroundColor: "#17a2b8" }}
                onClick={previewLink}
              >
                Open Link
              </button>
              <button
                className="action-button"
                style={{ backgroundColor: "#007bff" }}
                onClick={shareLink}
              >
                Share Link
              </button>
              <button
                className="action-button"
                style={{ backgroundColor: "#6c757d" }}
                onClick={() => setLink("")}
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

/* ---------- Styles ---------- */
const styles = {
  errorBox: {
    padding: "20px",
    background: "#fee2e2",
    borderRadius: "8px",
    color: "#c62828",
    marginBottom: "20px",
    borderLeft: "4px solid #c62828",
  },
  successBox: {
    padding: "20px",
    background: "#e8f5e9",
    borderRadius: "8px",
    color: "#2e7d32",
    marginBottom: "20px",
    borderLeft: "4px solid #4caf50",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: 500,
    color: "#444",
    fontSize: "14px",
  },
  input: {
    width: "100%",
    padding: "14px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "16px",
    backgroundColor: "#fff",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "14px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "16px",
    backgroundColor: "#fff",
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  gatewayCard: {
    flex: 1,
    minWidth: "250px",
    padding: "24px",
    borderRadius: "12px",
    border: "2px solid #e0e0e0",
    cursor: "pointer",
    textAlign: "center",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  },
  gatewayName: {
    fontWeight: 600,
    marginBottom: "6px",
    fontSize: "16px",
  },
  gatewayType: {
    fontSize: "14px",
    color: "#666",
  },
  connectButton: {
    marginTop: "12px",
    padding: "8px 16px",
    fontSize: "13px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#2196f3",
    color: "white",
    cursor: "pointer",
    fontWeight: 500,
  },
  createButton: (loading, disabled) => ({
    width: "100%",
    padding: "16px",
    backgroundColor: loading ? "#6c757d" : "#0d6efd",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: "16px",
    fontWeight: 600,
    opacity: disabled ? 0.7 : 1,
    transition: "background-color 0.2s ease",
  }),
  linkContainer: {
    marginTop: "40px",
    padding: "24px",
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #e0e0e0",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  },
  linkHeader: {
    marginBottom: "16px",
    color: "#28a745",
    fontSize: "20px",
  },
  linkBox: {
    background: "#f8f9fa",
    padding: "16px",
    borderRadius: "8px",
    border: "1px solid #dee2e6",
    marginBottom: "20px",
  },
  linkText: {
    padding: "12px",
    background: "#fff",
    borderRadius: "6px",
    fontFamily: "monospace",
    fontSize: "14px",
    color: "#333",
    border: "1px solid #ddd",
    wordBreak: "break-all",
  },
  buttonGroup: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  actionButton: (color) => ({
    padding: "12px 24px",
    backgroundColor: color,
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 500,
    flex: 1,
    minWidth: "120px",
    fontSize: "14px",
    transition: "opacity 0.2s ease",
    "&:hover": {
      opacity: 0.9,
    },
  }),
};
